// app/insights/new/page.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import remarkGfm from "remark-gfm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Meta = {
    title: string;
    author: string;
    date: string; // ISO yyyy-mm-dd
    tags?: string[];
    summary?: string;
    status?: "draft" | "published";
};

export default function NewInsightPage() {
    const router = useRouter();
    const [slug, setSlug] = useState("");
    const [meta, setMeta] = useState<Meta>({
        title: "",
        author: "",
        date: new Date().toISOString().slice(0, 10),
        tags: [],
        summary: "",
        status: "draft",
    });
    const [content, setContent] = useState<string | undefined>("# New insight\n");
    const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
    const [error, setError] = useState<string | null>(null);

    const onTitle = (v: string) => {
        setMeta((m) => ({ ...m, title: v }));
        setSlug(
            v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80)
        );
    };

    const onImageUpload = useCallback(async (file: File, draft: boolean) => {
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
        const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!put.ok) throw new Error("Failed to upload image");

        const host =
            process.env.NEXT_PUBLIC_S3_PUBLIC_HOST ??
            `${process.env.NEXT_PUBLIC_S3_BUCKET ?? ""}.s3.${process.env.NEXT_PUBLIC_AWS_REGION ?? ""}.amazonaws.com`;
        return `https://${host}/${key}`;
    }, [slug]);

    const insertImage = async (draft: boolean) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const url = await onImageUpload(file, draft);
                setContent((prev) => (prev ?? "") + `\n\n![](${url})\n`);
            } catch (e: any) {
                setError(e.message || "Image upload failed");
            }
        };
        input.click();
    };

    async function uploadPost({ draft }: { draft: boolean }) {
        if (!slug || !meta.title || !meta.author) {
            throw new Error("Title, author, and slug are required.");
        }
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

        const metaBody = JSON.stringify({ ...meta, slug, status: draft ? "draft" : "published" }, null, 2);
        const putMeta = await fetch(m.url, {
            method: "PUT",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: metaBody,
        });
        if (!putMeta.ok) throw new Error("Failed to upload metadata");
    }

    const saveDraft = async () => {
        setError(null);
        try {
            setSaving("draft");
            await uploadPost({ draft: true });
            // Continue editing on the edit page
            router.push(`/insights/edit/${slug}`);
        } catch (e: any) {
            setError(e.message || "Save draft failed");
            setSaving("idle");
        }
    };

    const publish = async () => {
        setError(null);
        try {
            setSaving("publish");
            // save a draft copy too (optional), then publish to /insights/<slug>
            await uploadPost({ draft: true });
            await uploadPost({ draft: false });
            router.push(`/insights/${slug}`);
        } catch (e: any) {
            setError(e.message || "Publish failed");
            setSaving("idle");
        }
    };

    return (
        <main className="wrap">
            <header className="hero">
                <div className="symbol" aria-hidden><span className="mark">✍️</span></div>
                <div className="titleBlock">
                    <h1>New Insight</h1>
                    <p className="tagline">WYSIWYG Markdown with media uploads to S3 — now with drafts.</p>
                </div>
            </header>

            <section className="metaGrid">
                <label className="field"><span>Title</span>
                    <input value={meta.title} onChange={(e) => onTitle(e.target.value)} placeholder="Post title" />
                </label>
                <label className="field"><span>Slug</span>
                    <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-from-title" />
                </label>
                <label className="field"><span>Author</span>
                    <input value={meta.author} onChange={(e) => setMeta((m) => ({ ...m, author: e.target.value }))} placeholder="Your name" />
                </label>
                <label className="field"><span>Date</span>
                    <input type="date" value={meta.date} onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))} />
                </label>
                <label className="field" style={{ gridColumn: "span 2" as any }}>
                    <span>Tags (comma separated)</span>
                    <input value={(meta.tags ?? []).join(", ")}
                        onChange={(e) => setMeta((m) => ({ ...m, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} />
                </label>
                <label className="field" style={{ gridColumn: "span 2" as any }}>
                    <span>Summary</span>
                    <input value={meta.summary ?? ""} onChange={(e) => setMeta((m) => ({ ...m, summary: e.target.value }))} />
                </label>
            </section>

            <section className="editorSection" data-color-mode="light">
                <div className="toolbar">
                    <button type="button" className="btn" onClick={() => insertImage(true)}>Insert image</button>
                    <div className="spacer" />
                    <Link href="/insights" className="pill">Cancel</Link>
                    <button type="button" className="pill" onClick={saveDraft} disabled={saving !== "idle"}>
                        {saving === "draft" ? "Saving…" : "Save draft"}
                    </button>
                    <button type="button" className="pill primary" onClick={publish} disabled={saving !== "idle"}>
                        {saving === "publish" ? "Publishing…" : "Publish"}
                    </button>
                </div>

                <MDEditor value={content} onChange={setContent} previewOptions={{ remarkPlugins: [remarkGfm] }} height={560} />
            </section>

            {error ? <p className="error">{error}</p> : null}

            <style>{styles}</style>
        </main>
    );
}

const styles = `
/* same styles as before (omitted for brevity) */
`;