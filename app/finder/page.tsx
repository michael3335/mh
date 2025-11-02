"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    Fragment,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ---------------- Types ---------------- */

type FileItem = {
    kind: "file";
    name: string;
    key: string;
    size: number;
    lastModified?: string;
    url: string;
};
type FolderItem = { kind: "folder"; name: string; key: string };
type Item = FileItem | FolderItem;

type SortKey = "name" | "size" | "date";
type ViewMode = "list" | "grid";

/* ---------------- Component ---------------- */

export default function Finder() {
    const { status } = useSession();
    const router = useRouter();

    // path / data / ui state
    const [path, setPath] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>("grid");
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortAsc, setSortAsc] = useState<boolean>(true);
    const [progress, setProgress] = useState<number | null>(null);

    // selection (keys)
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const lastClickedRef = useRef<string | null>(null);

    // refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const dragRectRef = useRef<HTMLDivElement | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);

    // race-safe fetch
    const currentLoadAbortRef = useRef<AbortController | null>(null);

    // context menu
    const [menu, setMenu] = useState<{
        open: boolean;
        x: number;
        y: number;
        item: Item | null;
    }>({ open: false, x: 0, y: 0, item: null });

    // toast
    const toast = (t: string, ms = 3000) => {
        setMsg(t);
        window.clearTimeout((toast as any).__t);
        (toast as any).__t = window.setTimeout(() => setMsg(null), ms);
    };

    /* ---------------- Data loading ---------------- */

    // Load ALL pages for a path (auto-pagination), abortable & race-safe
    const loadAll = useCallback(
        async (currentPath: string, signal?: AbortSignal) => {
            setLoading(true);
            try {
                const accFolders: FolderItem[] = [];
                const accFiles: FileItem[] = [];
                let cursor: string | null = null;

                do {
                    const qs = new URLSearchParams({ prefix: currentPath });
                    if (cursor) qs.set("cursor", cursor);
                    const res = await fetch(`/api/files?${qs}`, {
                        credentials: "same-origin",
                        signal,
                    });
                    if (!res.ok) {
                        const text = await res.text().catch(() => "");
                        console.error("[files] list failed", res.status, text);
                        toast(`List failed (${res.status})`);
                        break;
                    }
                    const data: {
                        folders: FolderItem[];
                        files: FileItem[];
                        nextCursor: string | null;
                    } = await res.json();
                    accFolders.push(...data.folders);
                    accFiles.push(...data.files);
                    cursor = data.nextCursor;
                } while (cursor && !signal?.aborted);

                if (signal?.aborted) return;
                setItems([...accFolders, ...accFiles]);
                setSelected(new Set());
            } catch (e) {
                if ((e as any).name === "AbortError") return;
                console.error(e);
                toast("Network error while listing", 5000);
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (status !== "authenticated") return;
        currentLoadAbortRef.current?.abort();
        const ctrl = new AbortController();
        currentLoadAbortRef.current = ctrl;
        loadAll(path, ctrl.signal);
        return () => ctrl.abort();
    }, [status, path, loadAll]);

    /* ---------------- Navigation ---------------- */

    const goInto = useCallback((folder: string) => {
        setPath((p) => [p, folder].filter(Boolean).join("/"));
    }, []);
    const crumbs = useMemo(
        () => (path ? path.split("/").filter(Boolean) : []),
        [path]
    );
    const goToIndex = useCallback(
        (idx: number) => setPath(crumbs.slice(0, idx + 1).join("/")),
        [crumbs]
    );

    /* ---------------- Uploads ---------------- */

    const pickFiles = () => fileInputRef.current?.click();
    const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        await uploadFiles(files);
        e.target.value = "";
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (!files.length) return;
        await uploadFiles(files);
    };

    async function uploadFiles(files: File[]) {
        for (const f of files) {
            try {
                // 1) presign
                const r = await fetch("/api/files/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        filename: f.name,
                        contentType: f.type || "application/octet-stream",
                        path,
                    }),
                });
                if (!r.ok) {
                    const text = await r.text().catch(() => "");
                    console.error("[presign] failed", r.status, text);
                    toast(`Upload presign failed (${r.status})`);
                    continue;
                }
                const { url } = (await r.json()) as { url: string };

                // 2) PUT to S3 with progress
                setProgress(0);
                await putWithProgress(url, f, setProgress);
                setProgress(null);
            } catch (err) {
                console.error(err);
                setProgress(null);
                toast("Upload error", 5000);
            }
        }
        await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
    }

    /* ---------------- Actions ---------------- */

    const createFolder = useCallback(async () => {
        const name = prompt("New folder name");
        if (!name) return;
        const res = await fetch("/api/files/folder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ name, path }),
        });
        if (!res.ok) return toast("Couldn't create folder");
        toast("Folder created");
        await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
    }, [path, loadAll]);

    const deleteKey = useCallback(async (key: string, recursive = false) => {
        const res = await fetch("/api/files/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ key, recursive }),
        });
        return res.ok;
    }, []);

    const remove = useCallback(
        async (key: string) => {
            const isFolder = key.endsWith("/");
            if (
                !confirm(
                    `Permanently delete ${isFolder ? "folder" : "file"}?\n${key}\nThis action cannot be undone.`
                )
            )
                return;
            const ok = await deleteKey(key, isFolder);
            if (!ok) toast("Delete failed", 5000);
            else toast("Deleted");
            await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
        },
        [deleteKey, loadAll, path]
    );

    // Bulk delete for selected items
    const removeSelected = useCallback(async () => {
        if (!selected.size) return;
        if (
            !confirm(
                `Permanently delete ${selected.size} selected item(s)?\nThis action cannot be undone.`
            )
        )
            return;
        await Promise.all(
            Array.from(selected).map((key) => deleteKey(key, key.endsWith("/")))
        );
        toast("Deleted");
        await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
    }, [selected, deleteKey, loadAll, path]);

    // File rename (single) via /api/files/rename
    const renameFile = useCallback(
        async (file: FileItem) => {
            const base = file.name;
            const next = prompt("Rename file to:", base);
            if (!next || next === base) return;
            const parent = file.key.split("/").slice(0, -1).join("/") + "/";
            const toKey = parent + next;
            const res = await fetch("/api/files/rename", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ fromKey: file.key, toKey }),
            });
            if (!res.ok) return toast("Rename failed", 5000);
            toast("Renamed");
            await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
        },
        [loadAll, path]
    );

    // Folder rename (client-side pragmatic approach)
    const renameFolder = useCallback(
        async (folder: FolderItem) => {
            const base = folder.name;
            const next = prompt("Rename folder to:", base);
            if (!next || next === base) return;

            const oldPrefix = folder.key; // "user/<uid>/.../Old/"
            const parentPrefix = oldPrefix.replace(/[^/]+\/$/, ""); // up to parent with trailing slash
            const newPrefix = parentPrefix + next + "/";

            // Create new folder marker
            const markerRes = await fetch("/api/files/folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                    name: next,
                    path: parentPrefix.replace(/^user\/[^/]+\//, ""),
                }),
            });
            if (!markerRes.ok) return toast("Couldn't create new folder", 5000);

            // Move visible files (when viewing the parent)
            const visibleInFolder = items.filter(
                (it) => it.kind === "file" && it.key.startsWith(oldPrefix)
            ) as FileItem[];

            await Promise.all(
                visibleInFolder.map((f) => {
                    const relName = f.key.slice(oldPrefix.length);
                    const toKey = newPrefix + relName;
                    return fetch("/api/files/rename", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify({ fromKey: f.key, toKey }),
                    });
                })
            );

            // Delete old folder recursively
            await deleteKey(oldPrefix, true);

            toast("Folder renamed");
            await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
        },
        [items, deleteKey, loadAll, path]
    );

    const onRename = useCallback(
        (it: Item) => (it.kind === "folder" ? renameFolder(it) : renameFile(it as FileItem)),
        [renameFolder, renameFile]
    );

    /* ---------------- Filtering & Sorting ---------------- */

    const debouncedQuery = useDebouncedValue(query, 120);

    const visibleItems = useMemo(() => {
        if (!debouncedQuery) return items;
        const q = debouncedQuery.toLowerCase();
        return items.filter((i) => i.name.toLowerCase().includes(q));
    }, [items, debouncedQuery]);

    const sorted = useMemo(() => {
        const arr = [...visibleItems];
        arr.sort((a, b) => {
            // group folders first (toggle-able later if desired)
            if ((a.kind === "folder") !== (b.kind === "folder"))
                return a.kind === "folder" ? -1 : 1;

            if (sortKey === "name") {
                const cmp = a.name.localeCompare(b.name);
                return sortAsc ? cmp : -cmp;
            }
            if (sortKey === "size") {
                const sa = a.kind === "file" ? a.size : 0;
                const sb = b.kind === "file" ? b.size : 0;
                const diff = sa - sb || a.name.localeCompare(b.name);
                return sortAsc ? diff : -diff;
            }
            // date
            const da =
                a.kind === "file" && a.lastModified ? +new Date(a.lastModified) : 0;
            const db =
                b.kind === "file" && b.lastModified ? +new Date(b.lastModified) : 0;
            const diff = da - db || a.name.localeCompare(b.name);
            return sortAsc ? diff : -diff;
        });
        return arr;
    }, [visibleItems, sortKey, sortAsc]);

    const sortBy = (k: SortKey) => {
        if (k === sortKey) setSortAsc((a) => !a);
        else {
            setSortKey(k);
            setSortAsc(true);
        }
    };

    /* ---------------- Selection (click / shift / meta / drag) ---------------- */

    const toggleSelect = (key: string, e: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean }) => {
        const meta = !!(e.metaKey || e.ctrlKey);
        const shift = !!e.shiftKey;

        setSelected((prev) => {
            const next = new Set(prev);
            const order = sorted.map((it) => it.key);
            const last = lastClickedRef.current;

            if (shift && last && order.includes(last) && order.includes(key)) {
                const a = order.indexOf(last);
                const b = order.indexOf(key);
                const [start, end] = a < b ? [a, b] : [b, a];
                for (let i = start; i <= end; i++) next.add(order[i]);
            } else if (meta) {
                if (next.has(key)) next.delete(key);
                else next.add(key);
                lastClickedRef.current = key;
            } else {
                // single select
                next.clear();
                next.add(key);
                lastClickedRef.current = key;
            }
            return next;
        });
    };

    // Grid drag-select (rubber band)
    const onGridMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        if (!gridContainerRef.current) return;

        const container = gridContainerRef.current;
        const rect = container.getBoundingClientRect();
        const start = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        dragStartRef.current = start;

        const sel = document.createElement("div");
        sel.style.position = "absolute";
        sel.style.border = "1px solid #3a3a3f";
        sel.style.background = "rgba(10,132,255,0.2)";
        sel.style.pointerEvents = "none";
        sel.style.left = `${start.x}px`;
        sel.style.top = `${start.y}px`;
        sel.style.width = "0px";
        sel.style.height = "0px";
        container.appendChild(sel);
        dragRectRef.current = sel;

        if (!(e.metaKey || e.ctrlKey || e.shiftKey)) {
            // preserve selection if starting on a card; clear only if empty area
            const target = e.target as HTMLElement;
            if (!target.closest("[data-key]")) setSelected(new Set());
        }

        // ensure cleanup even if mouseup occurs outside
        window.addEventListener("mouseup", onGridMouseUpWindow, { once: true });
    };

    const onGridMouseMove = (e: React.MouseEvent) => {
        if (!dragStartRef.current || !dragRectRef.current || !gridContainerRef.current) return;

        const container = gridContainerRef.current;
        const rect = container.getBoundingClientRect();
        const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const x1 = Math.min(dragStartRef.current.x, cur.x);
        const y1 = Math.min(dragStartRef.current.y, cur.y);
        const x2 = Math.max(dragStartRef.current.x, cur.x);
        const y2 = Math.max(dragStartRef.current.y, cur.y);

        const sel = dragRectRef.current;
        sel.style.left = `${x1}px`;
        sel.style.top = `${y1}px`;
        sel.style.width = `${x2 - x1}px`;
        sel.style.height = `${y2 - y1}px`;

        const hits = new Set<string>();
        container.querySelectorAll<HTMLElement>("[data-key]").forEach((el) => {
            const b = el.getBoundingClientRect();
            const bx1 = b.left - rect.left,
                by1 = b.top - rect.top,
                bx2 = bx1 + b.width,
                by2 = by1 + b.height;
            const overlap = !(bx2 < x1 || bx1 > x2 || by2 < y1 || by1 > y2);
            if (overlap) hits.add(el.dataset.key!);
        });

        setSelected((prev) => {
            if (e.metaKey || e.ctrlKey) {
                const merged = new Set(prev);
                hits.forEach((k) => merged.add(k));
                return merged;
            } else {
                return hits;
            }
        });
    };

    const onGridMouseUp = () => {
        dragStartRef.current = null;
        if (dragRectRef.current) {
            dragRectRef.current.remove();
            dragRectRef.current = null;
        }
    };
    const onGridMouseUpWindow = () => onGridMouseUp();

    /* ---------------- Keyboard shortcuts ---------------- */

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey && e.key.toLowerCase() === "n") {
                e.preventDefault();
                createFolder();
            }
            if ((e.key === "Delete" || e.key === "Backspace") && selected.size) {
                // allow backspace as delete too
                e.preventDefault();
                void removeSelected();
            }
            if (e.key === "Escape") {
                setSelected(new Set());
                setMenu({ open: false, x: 0, y: 0, item: null });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [createFolder, removeSelected, selected.size]);

    /* ---------------- Render ---------------- */

    if (status === "loading") return <div style={{ padding: 24 }}>Loading…</div>;
    if (status !== "authenticated")
        return <div style={{ padding: 24 }}>Sign in to view files.</div>;

    const count = sorted.length;

    return (
        <main
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            style={{
                height: "100svh",
                width: "100vw",
                display: "grid",
                placeItems: "center",
                background:
                    "radial-gradient(1200px 800px at 20% -10%, #232325 0%, #1a1a1c 30%, #121214 100%)",
                color: "#f2f2f7",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
            }}
        >
            <div
                style={{
                    width: "min(1200px,95vw)",
                    height: "min(760px,92vh)",
                    background: "linear-gradient(180deg, #2b2b2e, #1d1d20)",
                    border: "1px solid #3a3a3f",
                    borderRadius: 14,
                    display: "grid",
                    gridTemplateRows: "auto auto auto 1fr auto",
                    boxShadow: "0 12px 34px rgba(0,0,0,.5)",
                    overflow: "hidden",
                    position: "relative",
                }}
                aria-label="File manager"
                role="application"
                onContextMenu={(e) => {
                    // prevent default global context menu only if we're inside the app
                    e.preventDefault();
                }}
            >
                {/* toast */}
                {msg && (
                    <div
                        role="status"
                        aria-live="polite"
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
                            zIndex: 20,
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
                        {/* Red closes to '/' */}
                        <Dot c="#ff5f57" onClick={() => router.push("/")} title="Close" />
                        <Dot c="#febc2e" title="Minimize (inactive)" />
                        <Dot c="#28c840" title="Zoom (inactive)" />
                    </div>
                    <strong style={{ marginLeft: 8 }}>Files</strong>
                </div>

                {/* toolbar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderBottom: "1px solid #3a3a3f",
                        background: "#232326",
                    }}
                >
                    <button style={btn} onClick={createFolder}>
                        New Folder
                    </button>
                    <button style={btn} onClick={pickFiles}>
                        Upload
                    </button>
                    <button
                        style={{ ...btn, opacity: selected.size ? 1 : 0.6 }}
                        onClick={removeSelected}
                        disabled={!selected.size}
                        aria-disabled={!selected.size}
                        title={selected.size ? "Delete selected" : "No selection"}
                    >
                        Delete Selected
                    </button>
                    <input ref={fileInputRef} type="file" multiple hidden onChange={onPick} />
                    <div style={{ flex: 1 }} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        aria-label="Search files"
                        style={{
                            width: 240,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid #3a3a3f",
                            background: "#1f1f21",
                            color: "#fff",
                            outline: "none",
                        }}
                    />
                    <button
                        style={btn}
                        onClick={() => setView((v) => (v === "list" ? "grid" : "list"))}
                        aria-label={`Switch to ${view === "list" ? "grid" : "list"} view`}
                    >
                        {view === "list" ? "Grid" : "List"}
                    </button>
                </div>

                {/* breadcrumbs */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        borderBottom: "1px solid #3a3a3f",
                        background: "linear-gradient(180deg,#222224,#1b1b1d)",
                        flexWrap: "wrap",
                    }}
                    aria-label="Path bar"
                >
                    <button
                        onClick={() => setPath("")}
                        style={crumb}
                        aria-label="Go to root"
                        aria-current={crumbs.length === 0 ? "page" : undefined}
                    >
                        Home
                    </button>
                    {crumbs.map((c, i) => (
                        <Fragment key={`${c}-${i}`}>
                            <span style={{ color: "#8e8e93" }} aria-hidden="true">
                                ›
                            </span>
                            <button
                                onClick={() => goToIndex(i)}
                                style={crumb}
                                aria-label={`Go to ${c}`}
                                aria-current={i === crumbs.length - 1 ? "page" : undefined}
                            >
                                {c}
                            </button>
                        </Fragment>
                    ))}
                </div>

                {/* main content */}
                <section style={{ background: "#1b1b1d", display: "grid", gridTemplateRows: "1fr" }}>
                    <div style={{ overflow: "auto" }}>
                        {view === "list" ? (
                            <>
                                <div role="grid" aria-rowcount={count + 1} aria-colcount={4}>
                                    <RowHeader sortKey={sortKey} sortAsc={sortAsc} sortBy={sortBy} />
                                    {loading ? (
                                        <SkeletonList />
                                    ) : sorted.length ? (
                                        sorted.map((it, i) => (
                                            <Row
                                                key={`${it.kind}-${it.key}-${i}`}
                                                item={it}
                                                selected={selected.has(it.key)}
                                                onSelect={(e) => toggleSelect(it.key, e)}
                                                onOpenFolder={() => goInto((it as FolderItem).name)}
                                                onDelete={() =>
                                                    remove(it.kind === "folder" ? (it as FolderItem).key : (it as FileItem).key)
                                                }
                                                onRename={() => onRename(it)}
                                                onContextMenu={(x, y) =>
                                                    setMenu({ open: true, x, y, item: it })
                                                }
                                            />
                                        ))
                                    ) : (
                                        <Empty />
                                    )}
                                </div>
                            </>
                        ) : loading ? (
                            <SkeletonGrid />
                        ) : sorted.length ? (
                            <div
                                ref={gridContainerRef}
                                onMouseDown={onGridMouseDown}
                                onMouseMove={onGridMouseMove}
                                style={{
                                    position: "relative",
                                    userSelect: dragStartRef.current ? "none" : "auto",
                                }}
                                role="grid"
                                aria-rowcount={Math.ceil(sorted.length)}
                            >
                                <Grid
                                    items={sorted}
                                    selected={selected}
                                    onSelect={(key, e) => toggleSelect(key, e)}
                                    open={(name) => goInto(name)}
                                    del={(k) => remove(k)}
                                    rename={(it) => onRename(it)}
                                    onContextMenu={(it, x, y) => setMenu({ open: true, x, y, item: it })}
                                />
                            </div>
                        ) : (
                            <Empty />
                        )}
                    </div>
                </section>

                {/* bottom bar */}
                <div
                    style={{
                        padding: "6px 12px",
                        borderTop: "1px solid #3a3a3f",
                        color: "#8e8e93",
                        background: "#1a1a1c",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                    aria-live="polite"
                >
                    <span>
                        {sorted.length} item{sorted.length === 1 ? "" : "s"}
                    </span>
                    <span>
                        {selected.size
                            ? `${selected.size} selected${selected.size > 1
                                ? ` • ${formatBytes(
                                    Array.from(selected)
                                        .map((k) => {
                                            const it = sorted.find((i) => i.key === k);
                                            return it?.kind === "file" ? (it as FileItem).size : 0;
                                        })
                                        .reduce((a, b) => a + b, 0)
                                )}`
                                : ""
                            }`
                            : ""}
                    </span>
                </div>

                {/* upload progress */}
                {typeof progress === "number" && (
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-label="Upload progress"
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            height: 3,
                            width: `${progress}%`,
                            background: "#0a84ff",
                            transition: "width .2s linear",
                        }}
                    />
                )}

                {/* context menu */}
                {menu.open && menu.item && (
                    <ContextMenu
                        x={menu.x}
                        y={menu.y}
                        onClose={() => setMenu({ open: false, x: 0, y: 0, item: null })}
                        onOpen={() => {
                            const it = menu.item!;
                            if (it.kind === "folder") goInto((it as FolderItem).name);
                            else window.open((it as FileItem).url, "_blank");
                        }}
                        onRename={() => onRename(menu.item!)}
                        onDelete={() =>
                            remove(
                                menu.item!.kind === "folder"
                                    ? (menu.item as FolderItem).key
                                    : (menu.item as FileItem).key
                            )
                        }
                    />
                )}
            </div>
        </main>
    );
}

/* ---------------- Helpers & Subcomponents ---------------- */

async function putWithProgress(
    url: string,
    file: File,
    onProgress: (p: number) => void
): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`PUT ${xhr.status}`));
        xhr.onerror = () => reject(new Error("PUT network error"));
        xhr.send(file);
    });
}

function Dot({ c, onClick, title }: { c: string; onClick?: () => void; title?: string }) {
    return (
        <span
            onClick={onClick}
            title={title}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : -1}
            onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && onClick()}
            style={{
                width: 12,
                height: 12,
                background: c,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,.25)",
                display: "inline-block",
                cursor: onClick ? "pointer" : "default",
            }}
        />
    );
}

function RowHeader({
    sortKey,
    sortAsc,
    sortBy,
}: {
    sortKey: SortKey;
    sortAsc: boolean;
    sortBy: (k: SortKey) => void;
}) {
    const caret = (k: SortKey) => (sortKey === k ? (sortAsc ? " ▲" : " ▼") : "");
    return (
        <div
            role="row"
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
            <div
                role="columnheader"
                onClick={() => sortBy("name")}
                style={{ cursor: "pointer", userSelect: "none" }}
            >
                Name{caret("name")}
            </div>
            <div
                role="columnheader"
                onClick={() => sortBy("size")}
                style={{ cursor: "pointer", userSelect: "none" }}
            >
                Size{caret("size")}
            </div>
            <div role="columnheader">Kind</div>
            <div
                role="columnheader"
                onClick={() => sortBy("date")}
                style={{ cursor: "pointer", userSelect: "none" }}
            >
                Date Added{caret("date")}
            </div>
        </div>
    );
}

function Row({
    item,
    selected,
    onSelect,
    onOpenFolder,
    onDelete,
    onRename,
    onContextMenu,
}: {
    item: Item;
    selected: boolean;
    onSelect: (e: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean }) => void;
    onOpenFolder: () => void;
    onDelete: () => void;
    onRename: () => void;
    onContextMenu: (x: number, y: number) => void;
}) {
    const isFolder = item.kind === "folder";

    const displayDate = (() => {
        if (isFolder) return "";
        const raw = (item as FileItem).lastModified;
        if (!raw) return "";
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString();
    })();

    const openItem = () =>
        isFolder ? onOpenFolder() : window.open((item as FileItem).url, "_blank");

    return (
        <div
            role="row"
            tabIndex={0}
            aria-selected={selected}
            onDoubleClick={openItem}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e.clientX, e.clientY);
            }}
            onMouseDown={(e) => {
                if (e.shiftKey) e.preventDefault();
            }}
            onClick={() => onSelect({})}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    openItem();
                } else if (e.key === " ") {
                    e.preventDefault();
                    onSelect({ metaKey: true }); // toggle-like
                } else if (e.key === "F2") {
                    e.preventDefault();
                    onRename();
                } else if (e.key === "Delete" || e.key === "Backspace") {
                    e.preventDefault();
                    onDelete();
                }
            }}
            style={{
                display: "grid",
                gridTemplateColumns: "minmax(280px,1.4fr) 120px 1fr 220px",
                gap: 10,
                padding: "10px 14px",
                borderBottom: "1px solid #2a2a2d",
                cursor: "default",
                background: selected ? "#2c2c30" : undefined,
                outline: "none",
            }}
        >
            <div role="cell" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span aria-hidden="true">{isFolder ? "📁" : iconFor(item.name)}</span>
                <span
                    title={item.name}
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {item.name}
                </span>
            </div>
            <div role="cell">{isFolder ? "—" : formatBytes((item as FileItem).size)}</div>
            <div role="cell">{isFolder ? "Folder" : kindFor(item.name)}</div>
            <div role="cell">{displayDate}</div>
        </div>
    );
}

function Grid({
    items,
    selected,
    onSelect,
    open,
    del,
    rename,
    onContextMenu,
}: {
    items: Item[];
    selected: Set<string>;
    onSelect: (key: string, e: React.MouseEvent) => void;
    open: (name: string) => void;
    del: (key: string) => void;
    rename: (it: Item) => void;
    onContextMenu: (it: Item, x: number, y: number) => void;
}) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px,1fr))",
                gap: 12,
                padding: 12,
                position: "relative",
            }}
        >
            {items.map((it) => {
                const isFolder = it.kind === "folder";
                const file = it as FileItem;
                const isSel = selected.has(it.key);

                const openItem = () =>
                    isFolder ? open((it as FolderItem).name) : window.open(file.url, "_blank");

                return (
                    <div
                        key={it.key}
                        data-key={it.key}
                        role="row"
                        aria-selected={isSel}
                        tabIndex={0}
                        onDoubleClick={openItem}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onContextMenu(it, e.clientX, e.clientY);
                        }}
                        onClick={(e) => onSelect(it.key, e)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                openItem();
                            } else if (e.key === " ") {
                                e.preventDefault();
                                // toggle select
                                onSelect(it.key, Object.assign({}, e, { metaKey: true }) as any);
                            } else if (e.key === "F2") {
                                e.preventDefault();
                                rename(it);
                            } else if (e.key === "Delete" || e.key === "Backspace") {
                                e.preventDefault();
                                del(isFolder ? (it as FolderItem).key : file.key);
                            }
                        }}
                        style={{
                            border: "1px solid #3a3a3f",
                            borderRadius: 12,
                            padding: 12,
                            background: isSel ? "#2c2c30" : "#232326",
                            textAlign: "center",
                            userSelect: "none",
                            outline: "none",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 8 }} aria-hidden="true">
                            {isFolder ? "📁" : iconFor(it.name)}
                        </div>
                        <div
                            title={it.name}
                            style={{
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {it.name}
                        </div>
                        {it.kind === "file" && (
                            <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 4 }}>
                                {formatBytes(file.size)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* --- visuals & utilities --- */

const btn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #3a3a3f",
    background: "#2a2a2d",
    color: "#fff",
    cursor: "pointer",
};

const crumb: React.CSSProperties = {
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #3a3a3f",
    background: "#2a2a2e",
    color: "#fff",
};

function Empty() {
    return (
        <div style={{ padding: "28px 14px", color: "#8e8e93" }}>
            Empty folder. Drag files here or click <b>Upload</b>.
        </div>
    );
}

function SkeletonList() {
    return (
        <div style={{ padding: 14 }}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: 18,
                        background: "#2a2a2d",
                        marginBottom: 10,
                        borderRadius: 6,
                        width: `${60 + (i % 3) * 10}%`,
                    }}
                />
            ))}
        </div>
    );
}

function SkeletonGrid() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px,1fr))",
                gap: 12,
                padding: 12,
            }}
        >
            {Array.from({ length: 10 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        border: "1px solid #3a3a3f",
                        borderRadius: 12,
                        padding: 12,
                        background: "#232326",
                    }}
                >
                    <div
                        style={{ height: 48, background: "#2a2a2d", borderRadius: 8, marginBottom: 8 }}
                    />
                    <div style={{ height: 12, background: "#2a2a2d", borderRadius: 6 }} />
                </div>
            ))}
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

function iconFor(name: string) {
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "heic"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📕";
    if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
    if (["mov", "mp4", "m4v", "webm"].includes(ext)) return "🎬";
    if (["mp3", "wav", "flac"].includes(ext)) return "🎵";
    if (["doc", "docx", "rtf"].includes(ext)) return "📝";
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
    if (["ppt", "pptx", "key"].includes(ext)) return "📈";
    if (["txt", "md", "json", "log"].includes(ext)) return "📄";
    return "📄";
}

function kindFor(name: string) {
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (!ext || !name.includes(".")) return "File";
    const map: Record<string, string> = {
        png: "PNG Image",
        jpg: "JPEG Image",
        jpeg: "JPEG Image",
        webp: "WEBP Image",
        pdf: "PDF Document",
        zip: "ZIP Archive",
        mp4: "MPEG-4 Video",
        mov: "QuickTime Movie",
        mp3: "MP3 Audio",
        wav: "WAV Audio",
        doc: "Word Document",
        docx: "Word Document",
        xls: "Excel Spreadsheet",
        xlsx: "Excel Spreadsheet",
        csv: "CSV",
        ppt: "PowerPoint",
        pptx: "PowerPoint",
        md: "Markdown",
        json: "JSON",
        txt: "Plain Text",
        log: "Log File",
    };
    return map[ext] || `${ext.toUpperCase()} file`;
}

/* ---------- Context Menu ---------- */

function ContextMenu({
    x,
    y,
    onClose,
    onOpen,
    onRename,
    onDelete,
}: {
    x: number;
    y: number;
    onClose: () => void;
    onOpen: () => void;
    onRename: () => void;
    onDelete: () => void;
}) {
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            if (!t.closest?.("#ctxmenu")) onClose();
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [onClose]);

    return (
        <div
            id="ctxmenu"
            role="menu"
            style={{
                position: "absolute",
                top: y,
                left: x,
                background: "#2a2a2d",
                color: "#fff",
                border: "1px solid #3a3a3f",
                borderRadius: 8,
                minWidth: 160,
                zIndex: 30,
                boxShadow: "0 10px 24px rgba(0,0,0,.35)",
                overflow: "hidden",
            }}
        >
            <MenuItem onClick={onOpen} label="Open" />
            <MenuItem onClick={onRename} label="Rename (F2)" />
            <MenuItem onClick={onDelete} label="Delete (Del)" danger />
        </div>
    );
}

function MenuItem({
    label,
    onClick,
    danger,
}: {
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            role="menuitem"
            onClick={onClick}
            style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                color: danger ? "#ff6b6b" : "#fff",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

/* ---------- Hooks ---------- */

function useDebouncedValue<T>(value: T, delay = 120) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}