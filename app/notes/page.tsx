"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ASCIIText from "@/components/ASCIIText";
import Link from "next/link";

type VersionItem = { key: string; size: number; lastModified: string | null };

export default function NotesPage() {
    const { status } = useSession();
    const editorRef = useRef<HTMLDivElement | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [versions, setVersions] = useState<VersionItem[] | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [previewKey, setPreviewKey] = useState<string | null>(null);

    // Load latest
    useEffect(() => {
        if (status !== "authenticated") return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/note", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const html = await res.text();
                if (!cancelled && editorRef.current) {
                    editorRef.current.innerHTML = html || "";
                    setDirty(false);
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load note");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [status]);

    // Autosave every 10s
    useEffect(() => {
        if (status !== "authenticated") return;
        const id = setInterval(() => { if (dirty) save(); }, 10_000);
        return () => clearInterval(id);
    }, [dirty, status]);

    function sanitize(html: string) {
        return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    }

    async function save() {
        if (!editorRef.current) return;
        setSaving(true);
        setError(null);
        try {
            const html = sanitize(editorRef.current.innerHTML);
            const res = await fetch("/api/note", { method: "PUT", body: html });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setDirty(false);
            setLastSaved(Date.now());
        } catch (e: any) {
            setError(e?.message ?? "Failed to save note");
        } finally {
            setSaving(false);
        }
    }

    // History handlers
    async function loadHistory() {
        setHistoryOpen(true);
        setVersions(null);
        const res = await fetch("/api/note/history?limit=25", { cache: "no-store" });
        if (!res.ok) {
            setError(`History error: HTTP ${res.status}`);
            return;
        }
        const json = await res.json();
        setVersions(json.items as VersionItem[]);
    }

    async function openPreview(key: string) {
        setPreviewKey(key);
        const res = await fetch(`/api/note/version?key=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (!res.ok) {
            setError(`Preview error: HTTP ${res.status}`);
            return;
        }
        const html = await res.text();
        setPreviewHtml(html);
    }

    async function restore(key: string) {
        if (!confirm("Restore this version? Current content will be replaced.")) return;
        setError(null);
        const res = await fetch("/api/note/revert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
        });
        if (!res.ok) {
            setError(`Revert error: HTTP ${res.status}`);
            return;
        }
        // Reload the latest content after revert
        const latest = await fetch("/api/note", { cache: "no-store" });
        const html = await latest.text();
        if (editorRef.current) editorRef.current.innerHTML = html || "";
        setDirty(false);
        setLastSaved(Date.now());
        setPreviewHtml(null);
        setPreviewKey(null);
    }

    if (status === "loading") {
        return (
            <main style={{ minHeight: "100svh", display: "grid", placeItems: "center" }}>
                <p>Checking access…</p>
            </main>
        );
    }

    if (status === "unauthenticated") {
        return (
            <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center", gap: 16 }}>
                <div style={{ width: "min(92vw, 900px)", height: "clamp(80px, 18vw, 200px)", position: "relative" }}>
                    <ASCIIText text="Notes" enableWaves interactive={false} />
                </div>
                <p>You must sign in to edit your note.</p>
                <Link
                    href="/api/auth/signin"
                    style={{
                        padding: "0.6rem 1.2rem",
                        borderRadius: 8,
                        fontWeight: 600,
                        border: "2px solid currentColor",
                        textDecoration: "none",
                    }}
                >
                    Sign In
                </Link>
                <Link href="/" style={{ opacity: 0.7, textDecoration: "none" }}>
                    ← Back to Home
                </Link>
            </main>
        );
    }

    return (
        <main
            style={{
                minHeight: "100svh",
                display: "grid",
                gridTemplateRows: "auto auto auto 1fr auto",
                gap: 12,
                padding: "clamp(16px, 4vw, 32px)",
            }}
        >
            {/* Title */}
            <div style={{ width: "min(92vw, 900px)", height: "clamp(80px, 18vw, 200px)", position: "relative", justifySelf: "center" }}>
                <ASCIIText text="Notes" enableWaves interactive={false} />
            </div>

            {/* Actions */}
            <div
                aria-label="Editor toolbar"
                style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: 8,
                    alignItems: "center",
                }}
            >
                <button onClick={() => document.execCommand("bold")} title="Bold (Ctrl/Cmd+B)">B</button>
                <button onClick={() => document.execCommand("italic")} title="Italic (Ctrl/Cmd+I)"><em>I</em></button>
                <button onClick={() => document.execCommand("underline")} title="Underline (Ctrl/Cmd+U)"><u>U</u></button>
                <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
                <button onClick={() => document.execCommand("formatBlock", false, "<h2>")} title="Heading">H2</button>
                <button onClick={() => document.execCommand("insertUnorderedList")} title="Bullet list">• List</button>
                <button
                    onClick={() => {
                        const url = prompt("Link URL:");
                        if (url) document.execCommand("createLink", false, url);
                    }}
                    title="Insert link"
                >
                    Link
                </button>
                <span style={{ flex: 1 }} />
                <button onClick={() => document.execCommand("undo")} title="Undo">Undo</button>
                <button onClick={() => document.execCommand("redo")} title="Redo">Redo</button>
                <button onClick={save} disabled={saving} title="Save (Ctrl/Cmd+S)">{saving ? "Saving…" : "Save"}</button>
                <button onClick={loadHistory} title="History">History</button>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                    {loading ? "Loading…" : dirty ? "Unsaved changes" : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : "—"}
                </span>
            </div>

            {/* History Drawer */}
            {historyOpen && (
                <div
                    style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        padding: 10,
                        display: "grid",
                        gap: 8,
                        maxWidth: 900,
                        justifySelf: "center",
                        width: "100%",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong style={{ fontSize: 14 }}>Version History</strong>
                        <span style={{ opacity: 0.6, fontSize: 12 }}>
                            {versions ? `${versions.length} versions` : "Loading…"}
                        </span>
                        <span style={{ flex: 1 }} />
                        <button onClick={() => setHistoryOpen(false)}>Close</button>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                        {(versions ?? []).map(v => (
                            <div
                                key={v.key}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr auto auto",
                                    gap: 8,
                                    alignItems: "center",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.key}</div>
                                    <div style={{ fontSize: 12, opacity: 0.65 }}>
                                        {v.lastModified ? new Date(v.lastModified).toLocaleString() : "—"} · {(v.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                                <button onClick={() => openPreview(v.key)}>Preview</button>
                                <button onClick={() => restore(v.key)}>Restore</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewHtml != null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "grid",
                        placeItems: "center",
                        zIndex: 1000,
                        padding: 16,
                    }}
                    onClick={() => { setPreviewHtml(null); setPreviewKey(null); }}
                >
                    <div
                        style={{
                            background: "color-mix(in oklab, white 5%, black 95%)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            width: "min(900px, 92vw)",
                            maxHeight: "80vh",
                            overflow: "auto",
                            padding: 16,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <strong>Preview</strong>
                            <span style={{ opacity: 0.6, fontSize: 12 }}>{previewKey}</span>
                            <span style={{ flex: 1 }} />
                            <button onClick={() => { setPreviewHtml(null); setPreviewKey(null); }}>Close</button>
                            {previewKey && <button onClick={() => restore(previewKey)}>Restore this</button>}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                </div>
            )}

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                spellCheck
                onInput={() => setDirty(true)}
                onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                        e.preventDefault();
                        save();
                    }
                }}
                style={{
                    minHeight: "40vh",
                    outline: "none",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "16px",
                    lineHeight: 1.6,
                    overflow: "auto",
                    background: "rgba(255,255,255,0.02)",
                    maxWidth: 900,
                    justifySelf: "center",
                    width: "100%",
                }}
            />

            {/* Footer */}
            <div style={{ justifySelf: "center", display: "flex", gap: 12, alignItems: "center" }}>
                {error && <span style={{ color: "rgb(255 120 120)" }}>Error: {error}</span>}
                <Link href="/" style={{ opacity: 0.7, textDecoration: "none" }}>
                    ← Back to Home
                </Link>
            </div>

            <style jsx>{`
        button {
          all: unset;
          padding: 6px 10px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }
        button:hover { background: rgba(255,255,255,0.06); }
        button:active { transform: translateY(1px); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
        </main>
    );
}