// app/insights/edit/[slug]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import remarkGfm from "remark-gfm";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Meta = {
    slug: string;
    title: string;
    author: string;
    date: string;
    tags?: string[];
    summary?: string;
    status?: "draft" | "published";
};

export default function EditDraftPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const { slug } = params;
    const [meta, setMeta] = useState<Meta | null>(null);
    const [content, setContent] = useState<string | undefined>("");
    const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/insights/draft/${slug}`);
            if (!res.ok) { setError("Draft not found"); return; }
            const { meta, content } = await res.json();
            setMeta(meta); setContent(content);
        })();
    }, [slug]);

    const onImageUpload = useCallback(async (file: File) => {
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
        const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!put.ok) throw new Error("Failed to upload image");

        const host =
            process.env.NEXT_PUBLIC_S3_PUBLIC_HOST ??
            `${process.env.NEXT_PUBLIC_S3_BUCKET ?? ""}.s3.${process.env.NEXT_PUBLIC_AWS_REGION ?? ""}.amazonaws.com`;
        return `https://${host}/${key}`;
    }, [slug]);

    const insertImage = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const url = await onImageUpload(file);
                setContent((prev) => (prev ?? "") + `\n\n![](${url})\n`);
            } catch (e: any) { setError(e.message || "Image upload failed"); }
        };
        input.click();
    };

    async function upload({ draft }: { draft: boolean }) {
        if (!meta?.title || !meta?.author) throw new Error("Title and author are required.");
        const presign = await fetch("/api/insights/presign/post", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, draft }),
        });
        if (!presign.ok) throw new Error("Failed to presign");
        const { content: c, meta: m } = await presign.json();

        const putContent = await fetch(c.url, {
            method: "PUT", headers: { "Content-Type": "text/markdown; charset=utf-8" },
            body: content ?? "",
        });
        if (!putContent.ok) throw new Error("Failed to upload content");

        const metaBody = JSON.stringify({ ...meta, slug, status: draft ? "draft" : "published" }, null, 2);
        const putMeta = await fetch(m.url, {
            method: "PUT", headers: { "Content-Type": "application/json; charset=utf-8" },
            body: metaBody,
        });
        if (!putMeta.ok) throw new Error("Failed to upload metadata");
    }

    const saveDraft = async () => {
        setError(null);
        try {
            setSaving("draft");
            await upload({ draft: true });
            setSaving("idle");
        } catch (e: any) { setError(e.message || "Save draft failed"); setSaving("idle"); }
    };

    const publish = async () => {
        setError(null);
        try {
            setSaving("publish");
            // keep a draft copy, then publish
            await upload({ draft: true });
            await upload({ draft: false });
            router.push(`/insights/${slug}`);
        } catch (e: any) { setError(e.message || "Publish failed"); setSaving("idle"); }
    };

    if (!meta) return <main className="wrap"><p>Loading…</p></main>;

    return (
        <main className="wrap">
            <header className="hero">
                <div className="symbol"><span className="mark">✍️</span></div>
                <div className="titleBlock">
                    <h1>Edit draft: {meta.title}</h1>
                    <p className="tagline">Continue editing, then publish when ready.</p>
                </div>
            </header>

            <section className="metaGrid">
                <label className="field"><span>Title</span>
                    <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
                </label>
                <label className="field"><span>Author</span>
                    <input value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} />
                </label>
                <label className="field"><span>Date</span>
                    <input type="date" value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
                </label>
                <label className="field" style={{ gridColumn: "span 2" as any }}>
                    <span>Tags</span>
                    <input
                        value={(meta.tags ?? []).join(", ")}
                        onChange={(e) => setMeta({ ...meta, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                    />
                </label>
                <label className="field" style={{ gridColumn: "span 2" as any }}>
                    <span>Summary</span>
                    <input value={meta.summary ?? ""} onChange={(e) => setMeta({ ...meta, summary: e.target.value })} />
                </label>
            </section>

            <section className="editorSection" data-color-mode="light">
                <div className="toolbar">
                    <button className="btn" type="button" onClick={insertImage}>Insert image</button>
                    <div className="spacer" />
                    <Link href="/insights/drafts" className="pill">Drafts</Link>
                    <button className="pill" type="button" onClick={saveDraft} disabled={saving !== "idle"}>
                        {saving === "draft" ? "Saving…" : "Save draft"}
                    </button>
                    <button className="pill primary" type="button" onClick={publish} disabled={saving !== "idle"}>
                        {saving === "publish" ? "Publishing…" : "Publish"}
                    </button>
                </div>
                <MDEditor value={content} onChange={setContent} previewOptions={{ remarkPlugins: [remarkGfm] }} height={560} />
            </section>

            {error ? <p className="error">{error}</p> : null}
        </main>
    );
}