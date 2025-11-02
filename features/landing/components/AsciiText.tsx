'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { IBM_Plex_Mono } from 'next/font/google';

const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'] });

/* ─────────────── Shaders ─────────────── */
const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uEnableWaves;

void main() {
  vUv = uv;
  float time = uTime * 5.0;
  float wave = uEnableWaves;

  vec3 p = position;
  p.x += sin(time + position.y) * 0.5 * wave;
  p.y += cos(time + position.z) * 0.15 * wave;
  p.z += sin(time + position.x) * 0.25 * wave;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
  float t = uTime;
  vec2 pos = vUv;

  float r = texture2D(uTexture, pos + vec2(cos(t*2.0 + pos.x)*0.01, 0.0)).r;
  float g = texture2D(uTexture, pos + vec2(tan(t*0.5 + pos.x)*0.01, 0.0)).g;
  float b = texture2D(uTexture, pos - vec2(cos(t*2.0 + pos.y)*0.01, 0.0)).b;
  float a = texture2D(uTexture, pos).a;

  gl_FragColor = vec4(r, g, b, a);
}
`;

/* ─────────────── Utils ─────────────── */
function map(n: number, start: number, stop: number, start2: number, stop2: number) {
    return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
}

const PX_RATIO = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

type Disposable = { dispose: () => void };

function isDisposable(x: unknown): x is Disposable {
    return typeof (x as Disposable)?.dispose === 'function';
}

function isTextureArray(x: unknown): x is THREE.Texture[] {
    return Array.isArray(x) && x.every((v) => v instanceof THREE.Texture);
}

/* ─────────────── ASCII post-filter ─────────────── */
interface AsciiFilterOptions {
    fontSize?: number;
    fontFamily?: string;
    charset?: string;
    invert?: boolean;
    interactive?: boolean;
}

class AsciiFilter {
    renderer: THREE.WebGLRenderer;
    domElement: HTMLDivElement;
    pre: HTMLPreElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    invert: boolean;
    fontSize: number;
    fontFamily: string;
    charset: string;
    width = 0;
    height = 0;
    center = { x: 0, y: 0 };
    mouse = { x: 0, y: 0 };
    cols = 0;
    rows = 0;
    deg = 0;
    interactive = false;

    constructor(renderer: THREE.WebGLRenderer, opts: AsciiFilterOptions = {}) {
        this.renderer = renderer;

        this.domElement = document.createElement('div');
        Object.assign(this.domElement.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
        } as CSSStyleDeclaration);

        this.pre = document.createElement('pre');
        this.domElement.appendChild(this.pre);

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.domElement.appendChild(this.canvas);

        this.invert = opts.invert ?? true;
        this.fontSize = opts.fontSize ?? 12;
        this.fontFamily = opts.fontFamily ?? "'IBM Plex Mono', monospace";
        this.charset =
            opts.charset ??
            ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
        this.interactive = !!opts.interactive;

        if (this.ctx) this.ctx.imageSmoothingEnabled = false;

        this.onMouseMove = this.onMouseMove.bind(this);
        if (this.interactive) {
            document.addEventListener('mousemove', this.onMouseMove);
        }
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.renderer.setSize(width, height, false);
        this.reset();
        this.center = { x: width / 2, y: height / 2 };
        this.mouse = { x: this.center.x, y: this.center.y };
    }

    /** allow external control of ascii font size */
    setAsciiFontSize(px: number) {
        this.fontSize = px;
        this.reset();
    }

    reset() {
        if (!this.ctx) return;
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        const charWidth = Math.max(1, this.ctx.measureText('A').width);

        this.cols = Math.floor(this.width / charWidth);
        this.rows = Math.floor(this.height / Math.max(1, this.fontSize));

        this.canvas.width = this.cols;
        this.canvas.height = this.rows;

        Object.assign(this.pre.style, {
            fontFamily: this.fontFamily,
            fontSize: `${this.fontSize}px`,
            margin: '0',
            padding: '0',
            lineHeight: '1em',
            position: 'absolute',
            inset: '0',
            zIndex: '9',
            backgroundAttachment: 'fixed',
            mixBlendMode: 'difference',
            pointerEvents: 'none',
            userSelect: 'none',
        } as CSSStyleDeclaration);
    }

    onMouseMove(e: MouseEvent) {
        this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
    }

    get dx() { return this.mouse.x - this.center.x; }
    get dy() { return this.mouse.y - this.center.y; }

    hue() {
        if (!this.interactive) return;
        const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI;
        this.deg += (deg - this.deg) * 0.075;
        this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`;
    }

    asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const data = ctx.getImageData(0, 0, w, h).data;
        let out = '';
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = x * 4 + y * 4 * w;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                if (a === 0) {
                    out += ' ';
                    continue;
                }
                const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
                let idx = Math.floor((1 - gray) * (this.charset.length - 1));
                if (this.invert) idx = this.charset.length - idx - 1;
                out += this.charset[idx];
            }
            out += '\n';
        }
        this.pre.textContent = out;
    }

    render(scene: THREE.Scene, camera: THREE.Camera) {
        this.renderer.render(scene, camera);
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (!this.ctx || !w || !h) return;

        this.ctx.clearRect(0, 0, w, h);
        this.ctx.drawImage(this.renderer.domElement, 0, 0, w, h);
        this.asciify(this.ctx, w, h);
        this.hue();
    }

    dispose() {
        if (this.interactive) {
            document.removeEventListener('mousemove', this.onMouseMove);
        }
    }
}

/* ─────────────── Canvas text helper ─────────────── */
interface CanvasTxtOptions {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
}
class CanvasTxt {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    txt: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    font: string;

    constructor(txt: string, { fontSize = 200, fontFamily = 'IBM Plex Mono', color = '#fdf9f3' }: CanvasTxtOptions = {}) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.txt = txt;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.color = color;
        this.font = `600 ${this.fontSize}px ${this.fontFamily}`;
    }

    setFontSize(px: number) {
        this.fontSize = px;
        this.font = `600 ${this.fontSize}px ${this.fontFamily}`;
        this.resize();
    }

    resize() {
        if (!this.ctx) return;
        this.ctx.font = this.font;
        const m = this.ctx.measureText(this.txt);
        const w = Math.ceil(m.width) + 20;
        const h = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 20;
        this.canvas.width = w;
        this.canvas.height = h;
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.color;
        this.ctx.font = this.font;
        const m = this.ctx.measureText(this.txt);
        const y = 10 + m.actualBoundingBoxAscent;
        this.ctx.fillText(this.txt, 10, y);
    }

    get width() { return this.canvas.width; }
    get height() { return this.canvas.height; }
    get texture() { return this.canvas; }
}

/* ─────────────── Main renderer ─────────────── */
interface CanvAsciiOptions {
    text: string;
    asciiFontSize: number;
    textFontSize: number;
    textColor: string;
    planeBaseHeight: number;
    enableWaves: boolean;
    interactive: boolean;
}

class CanvAscii {
    textString: string;
    asciiFontSize: number;
    textFontSize: number;
    textColor: string;
    planeBaseHeight: number;
    enableWaves: boolean;
    interactive: boolean;

    container: HTMLElement;
    width: number;
    height: number;

    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    mouse = { x: 0, y: 0 };

    textCanvas!: CanvasTxt;
    texture!: THREE.CanvasTexture;
    geometry!: THREE.PlaneGeometry;
    material!: THREE.ShaderMaterial;
    mesh!: THREE.Mesh;

    renderer!: THREE.WebGLRenderer;
    filter!: AsciiFilter;
    center = { x: 0, y: 0 };
    raf = 0;

    constructor(
        { text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves, interactive }: CanvAsciiOptions,
        container: HTMLElement,
        width: number,
        height: number
    ) {
        this.textString = text;
        this.asciiFontSize = asciiFontSize;
        this.textFontSize = textFontSize;
        this.textColor = textColor;
        this.planeBaseHeight = planeBaseHeight;
        this.enableWaves = enableWaves;
        this.interactive = interactive;

        this.container = container;
        this.width = width;
        this.height = height;

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
        this.camera.position.z = 30;

        this.scene = new THREE.Scene();

        this.setMesh();
        this.setRenderer();

        this.onMouseMove = this.onMouseMove.bind(this);
        if (this.interactive) {
            this.container.addEventListener('mousemove', this.onMouseMove);
            this.container.addEventListener('touchmove', this.onMouseMove as unknown as EventListener);
        }
    }

    setMesh() {
        this.textCanvas = new CanvasTxt(this.textString, {
            fontSize: this.textFontSize,
            fontFamily: 'IBM Plex Mono',
            color: this.textColor,
        });
        this.textCanvas.resize();
        this.textCanvas.render();

        this.texture = new THREE.CanvasTexture(this.textCanvas.texture);
        this.texture.minFilter = THREE.NearestFilter;

        const aspect = this.textCanvas.width / this.textCanvas.height;
        const baseH = this.planeBaseHeight;
        const w = baseH * aspect;
        const h = baseH;

        this.geometry = new THREE.PlaneGeometry(w, h, 36, 36);
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: this.texture },
                uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
            },
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }

    setRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setPixelRatio(1);
        this.renderer.setClearColor(0x000000, 0);

        this.filter = new AsciiFilter(this.renderer, {
            fontFamily: 'IBM Plex Mono',
            fontSize: this.asciiFontSize,
            invert: true,
            interactive: this.interactive,
        });

        this.container.appendChild(this.filter.domElement);
        this.filter.domElement.style.pointerEvents = 'none';
        this.setSize(this.width, this.height);

        this.center = { x: this.width / 2, y: this.height / 2 };
    }

    /** update both ASCII char size and text canvas font size responsively */
    setFontSizes(asciiPx: number, textPx: number) {
        this.asciiFontSize = asciiPx;
        this.textFontSize = textPx;
        this.filter.setAsciiFontSize(asciiPx);
        this.textCanvas.setFontSize(textPx);
        this.textCanvas.render();
        this.texture.needsUpdate = true;

        // update plane size to text aspect (in case text canvas size changed)
        const aspect = this.textCanvas.width / this.textCanvas.height;
        const baseH = this.planeBaseHeight;
        const w = baseH * aspect;
        const h = baseH;
        this.geometry.dispose();
        this.geometry = new THREE.PlaneGeometry(w, h, 36, 36);
        this.mesh.geometry = this.geometry;
    }

    setSize(w: number, h: number) {
        this.width = w;
        this.height = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.filter.setSize(w, h);
        this.center = { x: w / 2, y: h / 2 };
    }

    load() {
        this.animate();
    }

    onMouseMove(evt: MouseEvent | TouchEvent) {
        const t = (evt as TouchEvent).touches?.[0];
        const e = t ?? (evt as MouseEvent);
        const bounds = this.container.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        this.mouse = { x, y };
    }

    animate() {
        const loop = () => {
            this.raf = window.requestAnimationFrame(loop);
            this.render();
        };
        loop();
    }

    render() {
        const time = performance.now() * 0.001;

        this.textCanvas.render();
        this.texture.needsUpdate = true;

        (this.material.uniforms.uTime as THREE.IUniform).value = Math.sin(time);

        if (this.interactive) {
            const rx = map(this.mouse.y, 0, this.height, 0.5, -0.5);
            const ry = map(this.mouse.x, 0, this.width, -0.5, 0.5);
            this.mesh.rotation.x += (rx - this.mesh.rotation.x) * 0.05;
            this.mesh.rotation.y += (ry - this.mesh.rotation.y) * 0.05;
        } else {
            this.mesh.rotation.x *= 0.9;
            this.mesh.rotation.y *= 0.9;
        }

        this.filter.render(this.scene, this.camera);
    }

    clear() {
        this.scene.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (!(mesh as unknown as { isMesh: boolean }).isMesh) return;

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            materials.forEach((mat) => {
                if (isDisposable(mat)) mat.dispose();
                Object.values(mat).forEach((v) => {
                    if (v instanceof THREE.Texture) v.dispose();
                    else if (isTextureArray(v)) v.forEach((tex) => tex.dispose());
                    else if (isDisposable(v)) v.dispose();
                });
            });

            if (isDisposable(mesh.geometry)) mesh.geometry.dispose();
        });

        this.scene.clear();
    }

    dispose() {
        window.cancelAnimationFrame(this.raf);
        this.filter.dispose();

        if (this.interactive) {
            this.container.removeEventListener('mousemove', this.onMouseMove);
            this.container.removeEventListener('touchmove', this.onMouseMove as unknown as EventListener);
        }

        if (this.container.contains(this.filter.domElement)) {
            this.container.removeChild(this.filter.domElement);
        }
        this.clear();
        this.renderer.dispose();
    }
}

/* ─────────────── React component ─────────────── */
interface ASCIITextProps {
    text?: string;
    asciiFontSize?: number;
    textFontSize?: number;
    textColor?: string;
    planeBaseHeight?: number;
    enableWaves?: boolean;
    interactive?: boolean;
}

export default function ASCIIText({
    text = 'Michael Harrison',
    asciiFontSize = 8,
    textFontSize = 220,
    textColor = '#fdf9f3',
    planeBaseHeight = 8,
    enableWaves = true,
    interactive = false,
}: ASCIITextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const asciiRef = useRef<CanvAscii | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const computeSizes = (w: number) => {
            const scaledText = Math.max(60, Math.min(240, w * 0.15));
            const scaledAscii = Math.max(6, Math.min(14, w * 0.015));
            return { scaledText, scaledAscii };
        };

        const boot = (w: number, h: number) => {
            const { scaledText, scaledAscii } = computeSizes(w);
            asciiRef.current = new CanvAscii(
                {
                    text,
                    asciiFontSize: scaledAscii,
                    textFontSize: scaledText,
                    textColor,
                    planeBaseHeight,
                    enableWaves,
                    interactive,
                },
                el,
                w,
                h
            );
            asciiRef.current.load();
        };

        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            boot(rect.width, rect.height);
        } else {
            const io = new IntersectionObserver(([entry]) => {
                const r = entry.boundingClientRect;
                if (entry.isIntersecting && r.width > 0 && r.height > 0) {
                    boot(r.width, r.height);
                    io.disconnect();
                }
            });
            io.observe(el);
        }

        const ro = new ResizeObserver((entries) => {
            const first = entries[0];
            if (!first || !asciiRef.current) return;
            const { width: w, height: h } = first.contentRect;
            if (w > 0 && h > 0) {
                asciiRef.current.setSize(w, h);
                const { scaledText, scaledAscii } = computeSizes(w);
                asciiRef.current.setFontSizes(scaledAscii, scaledText);
            }
        });
        ro.observe(el);

        return () => {
            ro.disconnect();
            if (asciiRef.current) {
                asciiRef.current.dispose();
                asciiRef.current = null;
            }
        };
    }, [text, asciiFontSize, textFontSize, textColor, planeBaseHeight, enableWaves, interactive]);

    return (
        <div
            ref={containerRef}
            className={`ascii-text-container ${plexMono.className}`}
            style={{ position: 'absolute', inset: 0 }}
        >
            <style>{`
        .ascii-text-container canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }
        .ascii-text-container pre {
          margin: 0;
          padding: 0;
          line-height: 1em;
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #ff6188 0%, #fc9867 50%, #ffd866 100%);
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          mix-blend-mode: difference;
          pointer-events: none;
          user-select: none;
        }
      `}</style>
        </div>
    );
}