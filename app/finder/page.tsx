"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    Fragment,
} from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useDashboard } from "@/components/dashboard/DashboardProvider";
import { useRouter } from "next/navigation";

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
type SelectGesture = {
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
};

type MenuState = { x: number; y: number; item: Item };

const theme = {
    pageBg: "var(--background)",
    panelBg: "var(--card)",
    toolbarBg: "var(--muted)",
    surface: "var(--background)",
    border: "var(--border)",
    muted: "var(--muted-foreground)",
    text: "var(--foreground)",
    accent: "var(--accent)",
    highlight: "var(--accent-soft)",
    button: "var(--secondary)",
};

const controlButton: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.button,
    color: theme.text,
    cursor: "pointer",
    transition: "transform 120ms ease, border-color 120ms ease",
};

const crumbButton: React.CSSProperties = {
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: "var(--secondary)",
    color: theme.text,
};

const textInput: React.CSSProperties = {
    width: "min(260px, 50vw)",
    minWidth: 160,
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: "var(--card)",
    color: theme.text,
    outline: "none",
};

const panelStyle: React.CSSProperties = {
    width: "min(1200px,95vw)",
    height: "min(760px,92vh)",
    background: theme.panelBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
    display: "grid",
    gridTemplateRows: "auto auto auto 1fr auto",
    boxShadow: "0 12px 34px rgba(0,0,0,.5)",
    overflow: "hidden",
    position: "relative",
};

async function post(path: string, body: unknown) {
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${path} failed (${res.status}${text ? `: ${text}` : ""})`);
    }
    return res;
}

async function postJson<T>(path: string, body: unknown) {
    const res = await post(path, body);
    return (await res.json()) as T;
}

/* ---------------- Component ---------------- */

export default function Finder() {
    return (
        <DashboardShell
            title="Files"
            hero={null}
            unauthenticatedMessage="Sign in to view files."
            footerLinks={[]}
            mainStyle={{
                minHeight: "100svh",
                width: "100vw",
                display: "grid",
                placeItems: "center",
                background: theme.pageBg,
                color: theme.text,
                fontFamily: '-apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", Arial, sans-serif',
                padding: 0,
            }}
            sectionStyle={{ display: "contents" }}
        >
            <FinderContent />
        </DashboardShell>
    );
}

function FinderContent() {
    const { notify } = useDashboard();
    const router = useRouter();

    const [path, setPath] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>("grid");
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortAsc, setSortAsc] = useState<boolean>(true);
    const [progress, setProgress] = useState<number | null>(null);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const lastClickedRef = useRef<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const dragRectRef = useRef<HTMLDivElement | null>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const toastTimeoutRef = useRef<number | null>(null);

    const currentLoadAbortRef = useRef<AbortController | null>(null);

    const [menu, setMenu] = useState<MenuState | null>(null);

    const toast = useCallback((t: string, ms = 3000, tone: "info" | "error" = "info") => {
        setMsg(t);
        if (toastTimeoutRef.current) {
            window.clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = window.setTimeout(() => setMsg(null), ms);
        if (tone === "error") {
            notify({ tone: "error", message: t });
        }
    }, [notify]);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                window.clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

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
                        toast(`List failed (${res.status})`, 3000, "error");
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
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
                console.error(error);
                toast("Network error while listing", 5000, "error");
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
        },
        [toast]
    );

    useEffect(() => {
        currentLoadAbortRef.current?.abort();
        const ctrl = new AbortController();
        currentLoadAbortRef.current = ctrl;
        loadAll(path, ctrl.signal);
        return () => ctrl.abort();
    }, [path, loadAll]);

    useEffect(() => {
        setMenu(null);
    }, [path, view]);

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
                const { url } = await postJson<{ url: string }>("/api/files/upload", {
                    filename: f.name,
                    contentType: f.type || "application/octet-stream",
                    path,
                });

                // 2) PUT to S3 with progress
                setProgress(0);
                await putWithProgress(url, f, setProgress);
                setProgress(null);
            } catch (err) {
                console.error(err);
                setProgress(null);
                const reason = err instanceof Error ? err.message : "Upload error";
                toast(reason, 5000, "error");
            }
        }
        await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
    }

    /* ---------------- Actions ---------------- */

    const createFolder = useCallback(async () => {
        const name = prompt("New folder name");
        if (!name) return;
        try {
            await post("/api/files/folder", { name, path });
            toast("Folder created");
            await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
        } catch (error) {
            console.error(error);
            toast("Couldn't create folder", 3000, "error");
        }
    }, [path, loadAll, toast]);

    const deleteKey = useCallback(async (key: string, recursive = false) => {
        try {
            await post("/api/files/delete", { key, recursive });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
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
            if (!ok) toast("Delete failed", 5000, "error");
            else toast("Deleted");
            await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
        },
        [deleteKey, loadAll, path, toast]
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
        const results = await Promise.all(
            Array.from(selected).map((key) => deleteKey(key, key.endsWith("/")))
        );
        const failed = results.filter((ok) => !ok).length;
        if (failed) {
            toast(`Failed to delete ${failed} item(s)`, 5000, "error");
        } else {
            toast("Deleted");
        }
        await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
    }, [selected, deleteKey, loadAll, path, toast]);

    // File rename (single) via /api/files/rename
    const renameFile = useCallback(
        async (file: FileItem) => {
            const base = file.name;
            const next = prompt("Rename file to:", base);
            if (!next || next === base) return;
            const parent = file.key.split("/").slice(0, -1).join("/") + "/";
            const toKey = parent + next;
            try {
                await post("/api/files/rename", { fromKey: file.key, toKey });
                toast("Renamed");
                await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
            } catch (error) {
                console.error(error);
                toast("Rename failed", 5000, "error");
            }
        },
        [loadAll, path, toast]
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
            try {
                await post("/api/files/folder", {
                    name: next,
                    path: parentPrefix.replace(/^user\/[^/]+\//, ""),
                });
            } catch (error) {
                console.error(error);
                return toast("Couldn't create new folder", 5000, "error");
            }

            // Move visible files (when viewing the parent)
            const visibleInFolder = items.filter(
                (it) => it.kind === "file" && it.key.startsWith(oldPrefix)
            ) as FileItem[];

            try {
                await Promise.all(
                    visibleInFolder.map((f) => {
                        const relName = f.key.slice(oldPrefix.length);
                        const toKey = newPrefix + relName;
                        return post("/api/files/rename", { fromKey: f.key, toKey });
                    })
                );

                await deleteKey(oldPrefix, true);

                toast("Folder renamed");
                await loadAll(path, currentLoadAbortRef.current?.signal ?? undefined);
            } catch (error) {
                console.error(error);
                toast("Rename failed", 5000, "error");
            }
        },
        [items, deleteKey, loadAll, path, toast]
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

    const toggleSelect = (key: string, e: SelectGesture) => {
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
        sel.style.border = `1px solid ${theme.border}`;
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
                setMenu(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [createFolder, removeSelected, selected.size]);

    /* ---------------- Render ---------------- */

    const selectedBytes = useMemo(
        () =>
            Array.from(selected).reduce((total, key) => {
                const it = items.find((i) => i.key === key);
                return it && it.kind === "file" ? total + (it as FileItem).size : total;
            }, 0),
        [items, selected]
    );
    const count = sorted.length;

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            style={{
                height: "100svh",
                width: "100vw",
                display: "grid",
                placeItems: "center",
                background: theme.pageBg,
                color: theme.text,
            }}
        >
            <div
                style={panelStyle}
                aria-label="File manager"
                role="application"
                onContextMenu={(e) => {
                    e.preventDefault();
                }}
            >
                <ToastBanner message={msg} />

                <TitleBar onClose={() => router.push("/")} />

                <Toolbar
                    onCreateFolder={createFolder}
                    onUpload={pickFiles}
                    onDeleteSelected={removeSelected}
                    hasSelection={!!selected.size}
                    query={query}
                    onQueryChange={setQuery}
                    view={view}
                    onToggleView={() => setView((v) => (v === "list" ? "grid" : "list"))}
                />

                <input ref={fileInputRef} type="file" multiple hidden onChange={onPick} />

                <BreadcrumbsBar crumbs={crumbs} onHome={() => setPath("")} onSelect={goToIndex} />

                {/* main content */}
                <section style={{ background: theme.surface, display: "grid", gridTemplateRows: "1fr" }}>
                    <div style={{ overflow: "auto" }}>
                        {view === "list" ? (
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
                                                remove(
                                                    it.kind === "folder"
                                                        ? (it as FolderItem).key
                                                        : (it as FileItem).key
                                                )
                                            }
                                            onRename={() => onRename(it)}
                                            onContextMenu={(x, y) => setMenu({ x, y, item: it })}
                                        />
                                    ))
                                ) : (
                                    <Empty onUpload={pickFiles} />
                                )}
                            </div>
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
                                aria-rowcount={sorted.length}
                            >
                                <Grid
                                    items={sorted}
                                    selected={selected}
                                    onSelect={(key, e) => toggleSelect(key, e)}
                                    open={(name) => goInto(name)}
                                    del={(k) => remove(k)}
                                    rename={(it) => onRename(it)}
                                    onContextMenu={(it, x, y) => setMenu({ x, y, item: it })}
                                />
                            </div>
                        ) : (
                            <Empty onUpload={pickFiles} />
                        )}
                    </div>
                </section>

                {/* bottom bar */}
                <StatusBar
                    total={sorted.length}
                    selectedCount={selected.size}
                    selectedBytes={selectedBytes}
                />

                {/* upload progress */}
                <UploadProgress progress={progress} />

                {/* context menu */}
                {menu && (
                    <ContextMenu
                        x={menu.x}
                        y={menu.y}
                        onClose={() => setMenu(null)}
                        onOpen={() => {
                            if (menu.item.kind === "folder") goInto((menu.item as FolderItem).name);
                            else window.open((menu.item as FileItem).url, "_blank");
                        }}
                        onRename={() => onRename(menu.item)}
                        onDelete={() =>
                            remove(
                                menu.item.kind === "folder"
                                    ? (menu.item as FolderItem).key
                                    : (menu.item as FileItem).key
                            )
                        }
                    />
                )}
            </div>
        </div>
    );
}

/* ---------------- Helpers & Subcomponents ---------------- */

function ToastBanner({ message }: { message: string | null }) {
    if (!message) return null;
    return (
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
                border: `1px solid ${theme.border}`,
                background: theme.toolbarBg,
                color: theme.text,
                zIndex: 20,
                boxShadow: "0 10px 24px rgba(0,0,0,.35)",
            }}
        >
            {message}
        </div>
    );
}

function TitleBar({ onClose }: { onClose: () => void }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                gap: 10,
                background: theme.panelBg,
                borderBottom: `1px solid ${theme.border}`,
            }}
        >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Dot c="#ff5f57" onClick={onClose} title="Close" />
                <Dot c="#febc2e" title="Minimize (inactive)" />
                <Dot c="#28c840" title="Zoom (inactive)" />
                <strong style={{ marginLeft: 8 }}>Files</strong>
            </div>
            <span style={{ color: theme.muted, fontSize: 13 }}>Drag & drop anywhere to upload</span>
        </div>
    );
}

function Toolbar({
    onCreateFolder,
    onUpload,
    onDeleteSelected,
    hasSelection,
    query,
    onQueryChange,
    view,
    onToggleView,
}: {
    onCreateFolder: () => void;
    onUpload: () => void;
    onDeleteSelected: () => void;
    hasSelection: boolean;
    query: string;
    onQueryChange: (v: string) => void;
    view: ViewMode;
    onToggleView: () => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderBottom: `1px solid ${theme.border}`,
                background: theme.toolbarBg,
            }}
        >
            <button type="button" style={controlButton} onClick={onCreateFolder}>
                New Folder
            </button>
            <button type="button" style={controlButton} onClick={onUpload}>
                Upload
            </button>
            <button
                type="button"
                style={{
                    ...controlButton,
                    opacity: hasSelection ? 1 : 0.55,
                    cursor: hasSelection ? "pointer" : "not-allowed",
                }}
                onClick={onDeleteSelected}
                disabled={!hasSelection}
                aria-disabled={!hasSelection}
                title={hasSelection ? "Delete selected" : "No selection"}
            >
                Delete Selected
            </button>
            <div style={{ flex: 1 }} />
            <input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search"
                aria-label="Search files"
                style={textInput}
            />
            <button
                type="button"
                style={controlButton}
                onClick={onToggleView}
                aria-label={`Switch to ${view === "list" ? "grid" : "list"} view`}
            >
                {view === "list" ? "Grid View" : "List View"}
            </button>
        </div>
    );
}

function BreadcrumbsBar({
    crumbs,
    onHome,
    onSelect,
}: {
    crumbs: string[];
    onHome: () => void;
    onSelect: (index: number) => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderBottom: `1px solid ${theme.border}`,
                background: theme.panelBg,
                flexWrap: "wrap",
            }}
            aria-label="Path bar"
        >
            <button
                type="button"
                onClick={onHome}
                style={crumbButton}
                aria-label="Go to root"
                aria-current={crumbs.length === 0 ? "page" : undefined}
            >
                Home
            </button>
            {crumbs.map((c, i) => (
                <Fragment key={`${c}-${i}`}>
                    <span style={{ color: theme.muted }} aria-hidden="true">
                        ›
                    </span>
                    <button
                        type="button"
                        onClick={() => onSelect(i)}
                        style={crumbButton}
                        aria-label={`Go to ${c}`}
                        aria-current={i === crumbs.length - 1 ? "page" : undefined}
                    >
                        {c}
                    </button>
                </Fragment>
            ))}
        </div>
    );
}

function StatusBar({
    total,
    selectedCount,
    selectedBytes,
}: {
    total: number;
    selectedCount: number;
    selectedBytes: number;
}) {
    return (
        <div
            style={{
                padding: "6px 12px",
                borderTop: `1px solid ${theme.border}`,
                color: theme.muted,
                background: theme.surface,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
            aria-live="polite"
        >
            <span>
                {total} item{total === 1 ? "" : "s"}
            </span>
            <span>
                {selectedCount
                    ? `${selectedCount} selected${selectedBytes ? ` • ${formatBytes(selectedBytes)}` : ""}`
                    : "No selection"}
            </span>
        </div>
    );
}

function UploadProgress({ progress }: { progress: number | null }) {
    if (typeof progress !== "number") return null;
    return (
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
                background: theme.accent,
                transition: "width .2s linear",
            }}
        />
    );
}

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
                color: theme.muted,
                position: "sticky",
                top: 0,
                background: theme.panelBg,
                borderBottom: `1px solid ${theme.border}`,
                textTransform: "uppercase",
                fontSize: 12,
                letterSpacing: ".4px",
                zIndex: 1,
            }}
        >
            <div
                role="columnheader"
                onClick={() => sortBy("name")}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        sortBy("name");
                    }
                }}
                style={{ cursor: "pointer", userSelect: "none" }}
            >
                Name{caret("name")}
            </div>
            <div
                role="columnheader"
                onClick={() => sortBy("size")}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        sortBy("size");
                    }
                }}
                style={{ cursor: "pointer", userSelect: "none" }}
            >
                Size{caret("size")}
            </div>
            <div role="columnheader">Kind</div>
            <div
                role="columnheader"
                onClick={() => sortBy("date")}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        sortBy("date");
                    }
                }}
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
    onSelect: (e: SelectGesture) => void;
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
            onClick={(e) =>
                onSelect({
                    metaKey: e.metaKey,
                    ctrlKey: e.ctrlKey,
                    shiftKey: e.shiftKey,
                })
            }
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    openItem();
                } else if (e.key === " ") {
                    e.preventDefault();
                    onSelect({ metaKey: true, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey }); // toggle-like
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
                borderBottom: `1px solid ${theme.border}`,
                cursor: "default",
                background: selected ? theme.highlight : undefined,
                outline: "none",
                borderLeft: selected ? `2px solid ${theme.accent}` : "2px solid transparent",
                transition: "background-color 120ms ease, border-color 120ms ease",
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
    onSelect: (key: string, e: SelectGesture) => void;
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
                        onClick={(e) =>
                            onSelect(it.key, {
                                metaKey: e.metaKey,
                                ctrlKey: e.ctrlKey,
                                shiftKey: e.shiftKey,
                            })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                openItem();
                            } else if (e.key === " ") {
                                e.preventDefault();
                                onSelect(it.key, {
                                    metaKey: true,
                                    ctrlKey: e.ctrlKey,
                                    shiftKey: e.shiftKey,
                                });
                            } else if (e.key === "F2") {
                                e.preventDefault();
                                rename(it);
                            } else if (e.key === "Delete" || e.key === "Backspace") {
                                e.preventDefault();
                                del(isFolder ? (it as FolderItem).key : file.key);
                            }
                        }}
                        style={{
                            border: `1px solid ${theme.border}`,
                            borderRadius: 12,
                            padding: 12,
                            background: isSel ? theme.highlight : theme.toolbarBg,
                            textAlign: "center",
                            userSelect: "none",
                            outline: "none",
                            boxShadow: isSel ? "0 0 0 1px rgba(5,150,105,0.35)" : "0 8px 18px rgba(0,0,0,.12)",
                            transition: "background-color 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
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
                            <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
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

function Empty({ onUpload }: { onUpload?: () => void }) {
    return (
        <div
            style={{
                padding: "28px 14px",
                color: theme.muted,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
            }}
        >
            <span>Empty folder. Drag files here.</span>
            {onUpload && (
                <button
                    type="button"
                    style={{ ...controlButton, padding: "6px 12px" }}
                    onClick={onUpload}
                >
                    Upload
                </button>
            )}
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
                        background: theme.toolbarBg,
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
                        border: `1px solid ${theme.border}`,
                        borderRadius: 12,
                        padding: 12,
                        background: theme.toolbarBg,
                    }}
                >
                    <div
                        style={{ height: 48, background: theme.surface, borderRadius: 8, marginBottom: 8 }}
                    />
                    <div style={{ height: 12, background: theme.surface, borderRadius: 6 }} />
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

    const withClose = (fn: () => void) => () => {
        fn();
        onClose();
    };

    return (
        <div
            id="ctxmenu"
            role="menu"
            style={{
                position: "absolute",
                top: y,
                left: x,
                background: theme.panelBg,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                minWidth: 160,
                zIndex: 30,
                boxShadow: "0 10px 24px rgba(0,0,0,.35)",
                overflow: "hidden",
            }}
        >
            <MenuItem onClick={withClose(onOpen)} label="Open" />
            <MenuItem onClick={withClose(onRename)} label="Rename (F2)" />
            <MenuItem onClick={withClose(onDelete)} label="Delete (Del)" danger />
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
            type="button"
            onClick={onClick}
            style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                color: danger ? "#b91c1c" : theme.text,
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
