// app/insights/new/page.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import remarkGfm from "remark-gfm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Meta = {
    title: string;
    author: string;
    date: string; // "YYYY-MM-DD HH:mm z"
    tags?: string[];
    summary?: string;
    status?: "draft" | "published";
};

function nowMelbourne(): { isoDate: string; display: string } {
    const tz = "Australia/Melbourne";
    const d = new Date();
    const datePart = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(d); // YYYY-MM-DD
    const timePart = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    }).format(d); // HH:mm
    const tzName =
        new Intl.DateTimeFormat("en-AU", { timeZone: tz, timeZoneName: "short" })
            .formatToParts(d)
            .find((p) => p.type === "timeZoneName")?.value ?? "AET";
    return { isoDate: d.toISOString(), display: `${datePart} ${timePart} ${tzName}` };
}

function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function countWords(s: string) {
    return (s.trim().match(/\b\w+\b/g) || []).length;
}

function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
}

export default function NewInsightPage() {
    const router = useRouter();
    const initialNow = useMemo(() => nowMelbourne(), []);
    const [slug, setSlug] = useState("");
    const [meta, setMeta] = useState<Meta>({
        title: "",
        author: "Michael Harrison",
        date: initialNow.display,
        tags: [],
        summary: "",
        status: "draft",
    });
    const [content, setContent] = useState<string>(""); // <- string (not string | undefined)
    const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const draftTimer = useRef<number | null>(null);
    const editorWrapRef = useRef<HTMLDivElement>(null);

    const validTitle = meta.title.trim().length > 0;
    const canSave = slug.length > 0 && meta.author.trim().length > 0;
    const canPublish = canSave && validTitle;

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 2000);
    }, []);

    const uploadImage = useCallback(
        async (file: File, draft: boolean) => {
            const presign = await fetch("/api/insights/presign/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: slug || "untitled",
                    filename: `${Date.now()}-${file.name}`,
                    contentType: file.type,
                    draft,
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

    const insertImage = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const url = await uploadImage(file, true);
                setContent((prev) => prev + `\n\n![](${url})\n`);
                showToast("Image inserted");
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Image upload failed"));
            }
        };
        input.click();
    }, [uploadImage, showToast]);

    const uploadPost = useCallback(
        async ({ draft }: { draft: boolean }) => {
            if (!slug) throw new Error("Slug is required.");
            if (!meta.author.trim()) throw new Error("Author is required.");
            const presign = await fetch("/api/insights/presign/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, draft }),
            });
            if (!presign.ok) throw new Error("Failed to presign post");
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

    const saveDraft = useCallback(
        async (silent = false) => {
            if (!canSave) return;
            try {
                if (!silent) setSaving("draft");
                await uploadPost({ draft: true });
                if (!silent) {
                    setSaving("idle");
                    showToast("Draft saved");
                }
            } catch (err: unknown) {
                setError(getErrorMessage(err, "Save draft failed"));
                setSaving("idle");
            }
        },
        [canSave, showToast, uploadPost]
    );

    const publish = useCallback(async () => {
        setError(null);
        if (!validTitle) {
            setError("Please add a title before publishing.");
            return;
        }
        try {
            setSaving("publish");
            await uploadPost({ draft: true });
            await uploadPost({ draft: false });
            router.push(`/insights/${slug}`);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Publish failed"));
            setSaving("idle");
        }
    }, [router, slug, validTitle, uploadPost]);

    const onTitle = (v: string) => {
        setMeta((m) => ({ ...m, title: v }));
        setSlug((old) => (old ? old : slugify(v)));
    };

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
        if (!canSave) return;
        draftTimer.current = window.setInterval(() => {
            void saveDraft(true);
        }, 15000);
        return () => {
            if (draftTimer.current) window.clearInterval(draftTimer.current);
        };
    }, [canSave, saveDraft]);

    useEffect(() => {
        const el = editorWrapRef.current;
        if (!el) return;
        const onDrop = async (e: DragEvent) => {
            if (!e.dataTransfer) return;
            const file = Array.from(e.dataTransfer.files)[0];
            if (!file || !file.type.startsWith("image/")) return;
            e.preventDefault();
            try {
                const url = await uploadImage(file, true);
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
                const url = await uploadImage(file, true);
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

    return (
        <main className="wrap">
            <header className="hero" aria-labelledby="new-title">
                <div className="symbol" aria-hidden>
                    <span className="mark">✍️</span>
                </div>
                <div className="titleBlock">
                    <h1 id="new-title">New Insight</h1>
                    <p className="tagline">
                        WYSIWYG Markdown with media uploads to S3 — now with drafts, autosave, and keyboard shortcuts.
                    </p>
                </div>
            </header>

            <section className="metaGrid" aria-label="Post metadata">
                <label className="field">
                    <span>
                        Title <b className="req">(required)</b>
                    </span>
                    <input
                        value={meta.title}
                        onChange={(e) => onTitle(e.target.value)}
                        placeholder="Post title"
                        aria-invalid={!validTitle}
                    />
                    {!validTitle && <small className="hint">Add a clear, descriptive title.</small>}
                </label>

                <label className="field">
                    <span>Slug</span>
                    <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="auto-from-title"
                        inputMode="url"
                    />
                </label>

                <label className="field">
                    <span>Author</span>
                    <input
                        value={meta.author}
                        onChange={(e) => setMeta((m) => ({ ...m, author: e.target.value }))}
                        placeholder="Michael Harrison"
                    />
                </label>

                <label className="field">
                    <span>Date & time (AUS)</span>
                    <input
                        value={meta.date}
                        onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))}
                        placeholder={initialNow.display}
                    />
                    <small className="hint">
                        Format: YYYY-MM-DD HH:mm TZ (24-hour, e.g., {initialNow.display}).
                    </small>
                </label>

                <label className="field" style={{ gridColumn: "span 2" }}>
                    <span>Tags (comma separated)</span>
                    <input
                        value={(meta.tags ?? []).join(", ")}
                        onChange={(e) =>
                            setMeta((m) => ({
                                ...m,
                                tags: e.target.value
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean),
                            }))
                        }
                        placeholder="Energy, Markets, Finance"
                    />
                </label>

                <label className="field" style={{ gridColumn: "span 2" }}>
                    <span>Summary (optional)</span>
                    <input
                        value={meta.summary ?? ""}
                        onChange={(e) => setMeta((m) => ({ ...m, summary: e.target.value }))}
                        placeholder="One line on why it matters"
                    />
                </label>
            </section>

            <section className="editorSection" data-color-mode="light" ref={editorWrapRef}>
                <div className="toolbar" role="toolbar" aria-label="Editor actions">
                    <div className="left">
                        <button type="button" className="btn" onClick={insertImage} aria-label="Insert image">
                            Insert image
                        </button>
                    </div>
                    <div className="middle">
                        <span className="meter" aria-live="polite">
                            {words} words • {chars} chars
                        </span>
                    </div>
                    <div className="right">
                        <Link href="/insights/drafts" className="pill" aria-label="View drafts">
                            Drafts
                        </Link>
                        <Link href="/insights" className="pill" aria-label="Cancel and return">
                            Cancel
                        </Link>
                        <button
                            type="button"
                            className="pill"
                            onClick={() => saveDraft()}
                            disabled={!canSave || saving !== "idle"}
                        >
                            {saving === "draft" ? "Saving…" : "Save draft"}
                        </button>
                        <button
                            type="button"
                            className="pill primary"
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
