// app/insights/edit/[slug]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import remarkGfm from "remark-gfm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Meta = {
    slug: string;
    title: string;
    author: string;
    date: string; // "YYYY-MM-DD HH:mm z"
    tags?: string[];
    summary?: string;
    status?: "draft" | "published";
};

function countWords(s: string) {
    return (s.trim().match(/\b\w+\b/g) || []).length;
}

function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
}

export default function EditDraftPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const { slug } = params;
    const [meta, setMeta] = useState<Meta | null>(null);
    const [content, setContent] = useState<string>(""); // <- string (not string | undefined)
    const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const editorWrapRef = useRef<HTMLDivElement>(null);

    const validTitle = (meta?.title || "").trim().length > 0;
    const canSave = !!meta?.author?.trim();
    const canPublish = canSave && validTitle;

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/insights/draft/${slug}`);
            if (!res.ok) {
                setError("Draft not found");
                return;
            }
            const { meta, content } = await res.json();
            // defaults if missing
            if (!meta.author) meta.author = "Michael Harrison";
            if (!meta.date) {
                const tz = "Australia/Melbourne";
                const d = new Date();
                const datePart = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
                const timePart = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit" }).format(d);
                const tzName = new Intl.DateTimeFormat("en-AU", { timeZone: tz, timeZoneName: "short" })
                    .formatToParts(d).find(p => p.type === "timeZoneName")?.value ?? "AET";
                meta.date = `${datePart} ${timePart} ${tzName}`;
            }
            setMeta(meta);
            setContent(content ?? "");
        })();
    }, [slug]);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2000);
    }, []);

    const uploadImage = useCallback(
        async (file: File) => {
            const presign = await fetch("/api/insights/presign/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug,
                    filename: `${Date.now()}-${file.name}`,
                    contentType: file.type,
                    draft: true,
                }),
            });
            if (!presign.ok) throw new Error("Failed to presign image");
            const { url, key } = await presign.json();
            const put = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!put.ok) throw new Error("Failed to upload image");
            const host =
                process.env.NEXT_PUBLIC_S3_PUBLIC_HOST ??
                `${process.env.NEXT_PUBLIC_S3_BUCKET ?? ""}.s3.${process.env.NEXT_PUBLIC_AWS_REGION ?? ""}.amazonaws.com`;
            return `https://${host}/${key}`;
        },
        [slug]
    );

    const upload = useCallback(
        async ({ draft }: { draft: boolean }) => {
            if (!meta?.author?.trim()) throw new Error("Author is required.");
            const presign = await fetch("/api/insights/presign/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, draft }),
            });
            if (!presign.ok) throw new Error("Failed to presign");
            const { content: c, meta: m } = await presign.json();

            const putContent = await fetch(c.url, {
                method: "PUT",
                headers: { "Content-Type": "text/markdown; charset=utf-8" },
                body: content ?? "",
            });
            if (!putContent.ok) throw new Error("Failed to upload content");

            const metaBody = JSON.stringify(
                { ...meta, slug, status: draft ? "draft" : "published" },
                null,
                2
            );
            const putMeta = await fetch(m.url, {
                method: "PUT",
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: metaBody,
            });
            if (!putMeta.ok) throw new Error("Failed to upload metadata");
        },
        [content, meta, slug]
    );

    const saveDraft = useCallback(async () => {
        setError(null);
        try {
            setSaving("draft");
            await upload({ draft: true });
            setSaving("idle");
            showToast("Draft saved");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Save draft failed"));
            setSaving("idle");
        }
    }, [upload, showToast]);

    const publish = useCallback(async () => {
        setError(null);
        if (!validTitle) {
            setError("Please add a title before publishing.");
            return;
        }
        try {
            setSaving("publish");
            await upload({ draft: true });
            await upload({ draft: false });
            router.push(`/insights/${slug}`);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Publish failed"));
            setSaving("idle");
        }
    }, [upload, router, slug, validTitle]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toLowerCase().includes("mac");
            const mod = isMac ? e.metaKey : e.ctrlKey;
            if (mod && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (saving === "idle" && canSave) void saveDraft();
            }
            if (mod && e.key === "Enter") {
                e.preventDefault();
                if (saving === "idle" && canPublish) void publish();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [saving, canSave, canPublish, saveDraft, publish]);

    useEffect(() => {
        const el = editorWrapRef.current;
        if (!el) return;
        const onDrop = async (e: DragEvent) => {
            if (!e.dataTransfer) return;
            const file = Array.from(e.dataTransfer.files)[0];
            if (!file || !file.type.startsWith("image/")) return;
            e.preventDefault();
            try {
                const url = await uploadImage(file);
                setContent((prev) => prev + `\n\n![](${url})\n`);
                showToast("Image inserted");
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Image upload failed"));
            }
        };
        const onPaste = async (event: ClipboardEvent) => {
            const item = event.clipboardData?.items?.[0];
            if (!item || item.kind !== "file") return;
            const file = item.getAsFile();
            if (!file || !file.type.startsWith("image/")) return;
            try {
                const url = await uploadImage(file);
                setContent((prev) => prev + `\n\n![](${url})\n`);
                showToast("Image pasted");
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Image upload failed"));
            }
        };
        const onDragOver = (event: DragEvent) => event.preventDefault();
        el.addEventListener("drop", onDrop);
        el.addEventListener("paste", onPaste);
        el.addEventListener("dragover", onDragOver);
        return () => {
            el.removeEventListener("drop", onDrop);
            el.removeEventListener("paste", onPaste);
            el.removeEventListener("dragover", onDragOver);
        };
    }, [uploadImage, showToast]);

    const words = countWords(content || "");
    const chars = (content || "").length;

    if (!meta) return <main className="wrap"><p>Loading…</p></main>;

    return (
        <main className="wrap">
            <header className="hero" aria-labelledby="edit-title">
                <div className="symbol">
                    <span className="mark">✍️</span>
                </div>
                <div className="titleBlock">
                    <h1 id="edit-title">Edit draft: {meta.title || "Untitled"}</h1>
                    <p className="tagline">Iterate quickly — autosave, paste images, and publish when ready.</p>
                </div>
            </header>

            <section className="metaGrid" aria-label="Post metadata">
                <label className="field">
                    <span>
                        Title <b className="req">(required)</b>
                    </span>
                    <input
                        value={meta.title}
                        onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                        aria-invalid={!validTitle}
                        placeholder="Post title"
                    />
                    {!validTitle && <small className="hint">Add a clear, descriptive title.</small>}
                </label>

                <label className="field">
                    <span>Author</span>
                    <input
                        value={meta.author}
                        onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                        placeholder="Michael Harrison"
                    />
                </label>

                <label className="field">
                    <span>Date & time (AUS)</span>
                    <input
                        value={meta.date}
                        onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                    />
                    <small className="hint">Format: YYYY-MM-DD HH:mm TZ (24-hour).</small>
                </label>

                <label className="field" style={{ gridColumn: "span 2" }}>
                    <span>Tags (comma separated)</span>
                    <input
                        value={(meta.tags ?? []).join(", ")}
                        onChange={(e) =>
                            setMeta({
                                ...meta,
                                tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                            })
                        }
                    />
                </label>

                <label className="field" style={{ gridColumn: "span 2" }}>
                    <span>Summary</span>
                    <input
                        value={meta.summary ?? ""}
                        onChange={(e) => setMeta({ ...meta, summary: e.target.value })}
                        placeholder="One line on why it matters"
                    />
                </label>
            </section>

            <section className="editorSection" data-color-mode="light" ref={editorWrapRef}>
                <div className="toolbar" role="toolbar" aria-label="Editor actions">
                    <div className="left">
                        <button
                            className="btn"
                            type="button"
                            onClick={() => {
                                const el = document.activeElement as HTMLElement | null;
                                el?.blur();
                            }}
                            aria-label="Editor menu"
                        >
                            •••
                        </button>
                    </div>
                    <div className="middle">
                        <span className="meter" aria-live="polite">
                            {words} words • {chars} chars
                        </span>
                    </div>
                    <div className="right">
                        <Link href="/insights/drafts" className="pill">
                            Drafts
                        </Link>
                        <Link href="/insights" className="pill">
                            Published
                        </Link>
                        <button
                            className="pill"
                            type="button"
                            onClick={saveDraft}
                            disabled={!canSave || saving !== "idle"}
                        >
                            {saving === "draft" ? "Saving…" : "Save draft"}
                        </button>
                        <button
                            className="pill primary"
                            type="button"
                            onClick={publish}
                            disabled={!canPublish || saving !== "idle"}
                        >
                            {saving === "publish" ? "Publishing…" : "Publish"}
                        </button>
                    </div>
                </div>

                <MDEditor
                    value={content}
                    onChange={(v) => setContent(v ?? "")} // <- wrap undefined
                    previewOptions={{ remarkPlugins: [remarkGfm] }}
                    height={560}
                />
            </section>

            {error ? (
                <p className="error" role="alert">
                    {error}
                </p>
            ) : null}
            {toast ? (
                <p className="toast" role="status">
                    {toast}
                </p>
            ) : null}

            <style>{styles}</style>
        </main>
    );
}

const styles = `
.wrap { max-width: 1040px; margin: 0 auto; padding: clamp(16px, 4vw, 32px); }
.hero { display: grid; grid-template-columns: auto 1fr; gap: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; }
.symbol { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 16px; background: #f6f6f9; }
.mark { font-size: 40px; }
.titleBlock h1 { margin: 0; font-size: clamp(24px, 4vw, 40px); }
.tagline { margin: 6px 0 0; color: #666; }

.metaGrid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin: 16px 0; }
.field { display: grid; gap: 6px; }
.field input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; }
.req { color: #b00020; font-weight: 600; }
.hint { color: #666; }

.editorSection { margin-top: 12px; }
.toolbar {
  position: sticky; top: 12px; z-index: 5;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  gap: 8px; padding: 8px; border: 1px solid #e5e5e5; border-radius: 12px; background: #fff;
  box-shadow: 0 2px 18px rgba(0,0,0,0.04);
}
.left, .middle, .right { display: flex; align-items: center; gap: 8px; }
.middle { justify-content: center; color: #666; font-size: 12px; }
.right { justify-content: flex-end; }
.btn { border: 1px solid #ddd; background: #fff; padding: 8px 10px; border-radius: 10px; }
.pill { display: inline-block; padding: 8px 12px; border-radius: 999px; border: 1px solid #ddd; text-decoration: none; }
.primary { background: #111; color: #fff; border-color: #111; }
.error { color: #b00020; margin-top: 8px; }
.toast { position: fixed; bottom: 16px; right: 16px; background: #111; color: #fff; padding: 8px 12px; border-radius: 10px; }

@media (max-width: 720px) {
  .metaGrid { grid-template-columns: 1fr; }
  .toolbar { grid-template-columns: 1fr; gap: 6px; }
  .middle { justify-content: flex-start; }
  .right { justify-content: flex-start; flex-wrap: wrap; }
}
`;
