"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type FileItem = { kind: "file"; name: string; key: string; size: number; lastModified?: string; url: string };
type FolderItem = { kind: "folder"; name: string; key: string };
type Item = FileItem | FolderItem;

export default function Finder() {
    const { status } = useSession();
    const [path, setPath] = useState<string>(""); // e.g. "Projects/2025"
    const [items, setItems] = useState<Item[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const toast = (t: string) => {
        setMsg(t);
        setTimeout(() => setMsg(null), 3000);
    };

    const load = useCallback(
        async (reset = true) => {
            try {
                setLoading(true);
                const qs = new URLSearchParams({ prefix: path });
                if (!reset && cursor) qs.set("cursor", cursor);

                const res = await fetch(`/api/files?${qs}`, { credentials: "same-origin" });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    console.error("List failed", res.status, text);
                    toast(`List failed (${res.status})`);
                    return;
                }
                const data: { folders: FolderItem[]; files: FileItem[]; nextCursor: string | null } = await res.json();

                setItems(prev => (reset ? [...data.folders, ...data.files] : [...prev, ...data.folders, ...data.files]));
                setCursor(data.nextCursor);
            } catch (e) {
                console.error(e);
                toast("Network error while listing");
            } finally {
                setLoading(false);
            }
        },
        [path, cursor]
    );

    useEffect(() => {
        if (status === "authenticated") load(true);
    }, [status, path, load]);

    const goInto = (folder: string) => setPath(p => [p, folder].filter(Boolean).join("/"));
    const goUp = () => setPath(p => p.split("/").slice(0, -1).join("/"));

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (!files.length) return;

        for (const f of files) {
            try {
                // 1) Presign
                const r = await fetch("/api/files/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({ filename: f.name, contentType: f.type || "application/octet-stream", path }),
                });
                if (!r.ok) {
                    const text = await r.text().catch(() => "");
                    console.error("Presign failed", r.status, text);
                    toast(`Upload presign failed (${r.status})`);
                    continue;
                }
                const { url } = (await r.json()) as { url: string };

                // 2) PUT to S3
                const put = await fetch(url, {
                    method: "PUT",
                    body: f,
                    headers: { "Content-Type": f.type || "application/octet-stream" },
                });
                if (!put.ok) {
                    const text = await put.text().catch(() => "");
                    console.error("S3 PUT failed", put.status, text);
                    toast(`Upload failed (${put.status})`);
                }
            } catch (err) {
                console.error(err);
                toast("Network error while uploading");
            }
        }
        await load(true);
    };

    const remove = async (key: string) => {
        try {
            const res = await fetch("/api/files/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ key }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error("Delete failed", res.status, text);
                toast(`Delete failed (${res.status})`);
            } else {
                await load(true);
            }
        } catch (e) {
            console.error(e);
            toast("Network error while deleting");
        }
    };

    if (status === "loading") return <div style={{ padding: 24 }}>Loading…</div>;
    if (status !== "authenticated") return <div style={{ padding: 24 }}>Sign in to view files.</div>;

    return (
        <main
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            style={{
                height: "100svh",
                width: "100vw",
                display: "grid",
                placeItems: "center",
                background: "radial-gradient(1200px 800px at 20% -10%, #232325 0%, #1a1a1c 30%, #121214 100%)",
                color: "#f2f2f7",
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            }}
        >
            <div
                style={{
                    width: "min(1100px,95vw)",
                    height: "min(650px,90vh)",
                    background: "linear-gradient(180deg, #2b2b2e, #1d1d20)",
                    border: "1px solid #3a3a3f",
                    borderRadius: 14,
                    display: "grid",
                    gridTemplateRows: "auto 1fr",
                    boxShadow: "0 12px 34px rgba(0,0,0,.5)",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* toast */}
                {msg && (
                    <div
                        style={{
                            position: "absolute",
                            top: 10,
                            left: "50%",
                            transform: "translateX(-50%)",
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid #3a3a3f",
                            background: "#3a2f12",
                            color: "#ffe9a6",
                            zIndex: 10,
                        }}
                    >
                        {msg}
                    </div>
                )}

                {/* titlebar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 12px",
                        gap: 10,
                        background: "linear-gradient(180deg,#2f2f32,#232326)",
                        borderBottom: "1px solid #3a3a3f",
                    }}
                >
                    <div style={{ display: "flex", gap: 8 }}>
                        <Dot c="#ff5f57" />
                        <Dot c="#febc2e" />
                        <Dot c="#28c840" />
                    </div>
                    <strong style={{ marginLeft: 8 }}>Finder</strong>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                        <button onClick={goUp} style={btn}>
                            ◀︎ Up
                        </button>
                        <button
                            onClick={() => (cursor ? load(false) : toast("No more items"))}
                            disabled={!cursor || loading}
                            style={btn}
                        >
                            {loading ? "Loading…" : "Load more"}
                        </button>
                    </div>
                </div>

                {/* content */}
                <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "100%" }}>
                    {/* sidebar */}
                    <aside style={{ background: "linear-gradient(180deg,#202022,#1a1a1c)", borderRight: "1px solid #3a3a3f", padding: 12 }}>
                        <p style={sideTitle}>Favourites</p>
                        <div style={sideItem(true)}>📥 Downloads</div>
                        <div style={sideItem(false)}>📄 Documents</div>

                        <p style={{ ...sideTitle, marginTop: 12 }}>Path</p>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>{path || "(root)"}</div>
                    </aside>

                    {/* files */}
                    <section style={{ background: "#1b1b1d", display: "grid", gridTemplateRows: "auto 1fr" }}>
                        <div style={{ padding: "10px 14px", borderBottom: "1px solid #3a3a3f", color: "#8e8e93" }}>
                            Drop files to upload • Double-click to open • Right-click a file to delete
                        </div>

                        <div style={{ overflow: "auto" }}>
                            <RowHeader />
                            {items.map((it, i) => (
                                <Row
                                    key={`${it.kind}-${it.key}-${i}`}
                                    item={it}
                                    onOpenFolder={() => goInto((it as FolderItem).name)}
                                    onDelete={() => remove((it as FileItem).key)}
                                />
                            ))}
                            {!items.length && !loading && (
                                <div style={{ padding: "18px 14px", color: "#8e8e93" }}>No items</div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

const btn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #3a3a3f",
    background: "#2a2a2d",
    color: "#fff",
    cursor: "pointer",
};

function Dot({ c }: { c: string }) {
    return (
        <span
            style={{
                width: 12,
                height: 12,
                background: c,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,.25)",
                display: "inline-block",
            }}
        />
    );
}

function RowHeader() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px,1.4fr) 120px 1fr 220px",
                gap: 10,
                padding: "10px 14px",
                color: "#8e8e93",
                position: "sticky",
                top: 0,
                background: "linear-gradient(180deg,#222224,#1b1b1d)",
                borderBottom: "1px solid #3a3a3f",
                textTransform: "uppercase",
                fontSize: 12,
                letterSpacing: ".4px",
                zIndex: 1,
            }}
        >
            <div>Name</div>
            <div>Size</div>
            <div>Kind</div>
            <div>Date Added</div>
        </div>
    );
}

function Row({ item, onOpenFolder, onDelete }: { item: Item; onOpenFolder: () => void; onDelete: () => void }) {
    const isFolder = item.kind === "folder";

    // Last modified comes from the API as an ISO string (JSON-serialized Date).
    // Compute a stable display string; no Date.now() fallback in render.
    const displayDate = (() => {
        if (isFolder) return "";
        const raw = (item as FileItem).lastModified;
        if (!raw) return ""; // or return "—" if you prefer a placeholder
        const d = new Date(raw); // handles ISO string
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString();
    })();

    const onContext = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isFolder && confirm(`Delete ${item.name}?`)) onDelete();
    };

    return (
        <div
            onDoubleClick={() => (isFolder ? onOpenFolder() : window.open((item as FileItem).url, "_blank"))}
            onContextMenu={onContext}
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px,1.4fr) 120px 1fr 220px",
                gap: 10,
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2d",
                cursor: "default",
            }}
        >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span>{isFolder ? "📁" : "📄"}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
            </div>
            <div>{isFolder ? "—" : formatBytes((item as FileItem).size)}</div>
            <div>{isFolder ? "Folder" : "File"}</div>
            <div>{displayDate}</div>
        </div>
    );
}

function formatBytes(n: number) {
    if (!n) return "0 B";
    const k = 1024,
        u = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

const sideTitle: React.CSSProperties = {
    fontSize: 12,
    color: "#8e8e93",
    textTransform: "uppercase",
    letterSpacing: ".4px",
    marginBottom: 6,
};
const sideItem = (active: boolean): React.CSSProperties => ({
    padding: "8px 10px",
    borderRadius: 8,
    background: active ? "#38383c" : "transparent",
});