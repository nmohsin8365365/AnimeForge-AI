import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Check, ChevronDown, CloudUpload, Download, Heart, Image as ImageIcon,
  Layers3, LockKeyhole, Menu, Play, RefreshCw, Sparkles, Wand2, X, Zap,
} from 'lucide-react';
import {
  getGetGalleryQueryKey, getGetHistoryQueryKey, useConvertSketch, useGenerateScene, useGetGallery,
  useGetHistory, useLikeGalleryPost, useUploadAsset,
} from '@workspace/api-client-react';
import type { GalleryPost, GenerationResult, HistoryItem } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const artColors = [
  ['#6C5CE7', '#70A1FF', '#FF4757'],
  ['#f15bb5', '#70A1FF', '#6C5CE7'],
  ['#00c2a8', '#6C5CE7', '#70A1FF'],
  ['#ff9f43', '#FF4757', '#6C5CE7'],
];

function artworkUrl(seed: string, ratio = 'square') {
  const index = Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % artColors.length;
  const [a, b, c] = artColors[index];
  const height = ratio === 'portrait' ? 520 : 360;
  const shapes = seed.length % 2
    ? `<path d="M0 280 Q180 160 340 245 T760 150 V${height}H0Z" fill="${c}" opacity=".34"/><circle cx="590" cy="90" r="68" fill="${b}" opacity=".72"/>`
    : `<path d="M0 110 Q140 210 300 120 T760 210 V${height}H0Z" fill="${b}" opacity=".42"/><circle cx="175" cy="230" r="104" fill="${c}" opacity=".62"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="#1c1634"/><stop offset="1" stop-color="#0a101d"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="26"/></filter></defs><rect width="760" height="${height}" fill="url(#g)"/>${shapes}<path d="M420 ${height} Q430 220 480 150 Q530 220 570 ${height}" fill="#090b13" opacity=".92"/><path d="M463 180 Q505 135 548 180 L535 238 Q505 270 475 238Z" fill="#121426" stroke="${b}" stroke-width="3"/><path d="M475 190 L432 168 M535 190 L580 164" stroke="${c}" stroke-width="7" stroke-linecap="round"/><circle cx="486" cy="208" r="5" fill="${b}"/><circle cx="526" cy="208" r="5" fill="${c}"/><path d="M478 237 Q505 253 532 237" stroke="${a}" stroke-width="3" fill="none"/><g opacity=".45" fill="white"><circle cx="80" cy="62" r="2"/><circle cx="140" cy="116" r="1.5"/><circle cx="690" cy="56" r="2"/><circle cx="648" cy="170" r="1.5"/></g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const fallbackGallery: GalleryPost[] = [
  { id: 901, imageUrl: artworkUrl('midnight train'), title: 'Last train to Neon Ward', creatorName: 'Mina K.', prompt: 'A lone student on a midnight train, rain and city reflections', likes: 148, style: 'Neo Tokyo' },
  { id: 902, imageUrl: artworkUrl('violet garden', 'portrait'), title: 'Violet afterglow', creatorName: 'Theo R.', prompt: 'A quiet rooftop garden above a sleeping city', likes: 96, style: 'Soft cel' },
  { id: 903, imageUrl: artworkUrl('mecha study'), title: 'Field notes: Unit 07', creatorName: 'Juno L.', prompt: 'Mecha character study, annotated workshop lights', likes: 72, style: 'Mecha ink' },
];
const fallbackHistory: HistoryItem[] = [
  { id: 801, kind: 'scene', prompt: 'Rooftop observatory above the cloud line', imageUrl: artworkUrl('observatory'), createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(), status: 'complete' },
  { id: 802, kind: 'sketch', prompt: 'Bring my character sheet to life', imageUrl: artworkUrl('character sheet', 'portrait'), createdAt: new Date(Date.now() - 1000 * 60 * 61).toISOString(), status: 'complete' },
];

function IconButton({ label, children, onClick, className = '' }: { label: string; children: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button type="button" aria-label={label} title={label} data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={onClick} className={`af-button grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-[#b8b8c5] hover:border-[#6C5CE7]/60 hover:bg-[#6C5CE7]/15 hover:text-white ${className}`}>{children}</button>;
}

function Nav() {
  const [mobile, setMobile] = useState(false);
  return (
    <header className="relative z-20 border-b border-white/[.07] bg-[#0B0C10]/75 backdrop-blur-xl">
      <div className="af-shell flex h-[72px] items-center justify-between">
        <Link href="/" data-testid="link-logo" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#6C5CE7] shadow-[0_0_28px_rgba(108,92,231,.48)]"><Sparkles size={18} /></span>
          <span className="text-[15px] font-extrabold tracking-[-.03em] text-white">ANIME<span className="text-[#70A1FF]">FORGE</span><span className="ml-1 text-[#ff6070]">AI</span></span>
        </Link>
        <nav className={`${mobile ? 'absolute left-0 top-[72px] flex w-full flex-col border-b border-white/10 bg-[#101118] p-5' : 'hidden'} gap-5 text-sm text-[#9293a3] md:static md:flex md:w-auto md:flex-row md:border-0 md:bg-transparent md:p-0`}>
          <a href="/" data-testid="link-home" className="transition-colors hover:text-white">Home</a>
          <a href="#studio" data-testid="link-scene-generator" className="transition-colors hover:text-white">Scene Generator</a>
          <a href="#sketch-to-anime" data-testid="link-sketch-to-anime" className="transition-colors hover:text-white">Sketch-to-Anime</a>
          <a href="#gallery" data-testid="link-gallery" className="transition-colors hover:text-white">Student Gallery</a>
          <a href="#pricing" data-testid="link-pricing" className="transition-colors hover:text-white">Pricing</a>
          <Link href="/login" data-testid="link-login-mobile" className="md:hidden transition-colors hover:text-white">Log In</Link>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" data-testid="link-login" className="text-sm font-semibold text-[#b7b7c4] transition-colors hover:text-white">Log In</Link>
          <Link href="/signup" data-testid="link-signup" className="af-button af-primary rounded-xl px-4 py-2.5 text-sm font-bold text-white">Get Started Free <ArrowRight className="ml-1 inline" size={15} /></Link>
        </div>
        <button type="button" aria-label="Toggle navigation" data-testid="button-toggle-navigation" onClick={() => setMobile(!mobile)} className="grid h-10 w-10 place-items-center text-[#b8b8c5] md:hidden">{mobile ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="af-shell relative grid min-h-[590px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <div className="af-orb pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-[#6C5CE7]/10 blur-3xl" />
      <div className="af-reveal relative z-10">
        <div className="af-kicker mb-6 flex items-center gap-2"><span className="h-px w-8 bg-[#70A1FF]" /> Creative co-pilot / v1.4</div>
        <h1 className="af-heading max-w-[720px] text-[clamp(3.2rem,8vw,6.6rem)] font-extrabold text-white">Turn Your Rough Sketches &amp; Ideas<br /><span className="text-[#70A1FF]">into Studio-Quality Anime Scenes</span></h1>
        <p className="mt-7 max-w-[560px] text-base leading-7 text-[#9d9eab] sm:text-lg">Designed for students and creators. Generate backgrounds, characters, keyframes, and anime scenes from your ideas.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#sketch-to-anime" data-testid="button-try-sketch-converter" className="af-button af-pink inline-flex items-center rounded-xl px-5 py-3.5 text-sm font-extrabold text-white">Try Sketch Converter <ArrowRight className="ml-2" size={16} /></a>
          <a href="#scene-generator" data-testid="button-generate-scene-now" className="af-button inline-flex items-center rounded-xl border border-white/15 bg-white/[.04] px-5 py-3.5 text-sm font-bold text-[#dddce5] hover:border-white/30 hover:bg-white/[.08]"><Play className="mr-2 fill-current" size={14} /> Generate Scene Now</a>
        </div>
        <div className="mt-10 flex items-center gap-5 text-xs text-[#737582]"><span className="flex items-center gap-2"><Check size={14} className="text-[#70A1FF]" /> Free starter credits</span><span className="flex items-center gap-2"><Check size={14} className="text-[#70A1FF]" /> No prompt expertise required</span></div>
      </div>
      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="af-reveal relative mx-auto w-full max-w-[530px] [animation-delay:.15s]">
      <div className="af-orb af-orb-delay absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#ff4757]/20 blur-3xl" />
      <div className="relative rotate-[2deg] rounded-[25px] border border-[#70A1FF]/30 bg-[#11131c] p-2 shadow-[0_30px_100px_rgba(0,0,0,.5),0_0_55px_rgba(108,92,231,.15)]">
        <div className="relative aspect-[1.15] overflow-hidden rounded-[19px] bg-[#171827]">
          <img src={artworkUrl('hero character', 'portrait')} alt="Anime character preview" className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10]/90 via-transparent to-[#6c5ce7]/10" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-[#0b0c10]/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#c4c4d2] backdrop-blur-md"><span className="h-1.5 w-1.5 rounded-full bg-[#ff4757] shadow-[0_0_9px_#ff4757]" /> Live preview</div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
            <div><div className="af-kicker !text-[9px]">Prompt fragment</div><p className="mt-1 max-w-[230px] text-sm font-semibold text-white">“A courier at the edge of an electric dawn...”</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[#70A1FF]/30 bg-[#70A1FF]/15 text-[#70A1FF]"><Wand2 size={17} /></div>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 pb-1 pt-3 text-[10px] font-medium text-[#797b8b]"><span>01 / 04 frames</span><span className="font-mono text-[#70A1FF]">ANF-2048</span></div>
      </div>
      <div className="absolute -bottom-5 -left-4 rounded-xl border border-white/10 bg-[#191a25]/90 px-3 py-2 text-[11px] shadow-xl backdrop-blur-xl"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#70A1FF]" /> sketch → scene <span className="ml-2 text-[#6e6f7b]">96%</span></div>
    </div>
  );
}

function SectionHeader({ kicker, title, detail }: { kicker: string; title: string; detail: string }) {
  return <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="af-kicker mb-3">{kicker}</div><h2 className="af-heading text-3xl font-extrabold text-white sm:text-4xl">{title}</h2></div><p className="max-w-[340px] text-sm leading-6 text-[#858692]">{detail}</p></div>;
}

function StudentBanner() {
  const [verified, setVerified] = useState(false);
  return (
    <section className="af-shell py-5">
      <div className="relative overflow-hidden rounded-2xl border border-[#6C5CE7]/25 bg-[#17142a] px-5 py-5 sm:px-7">
        <div className="absolute -right-8 -top-16 h-40 w-40 rounded-full bg-[#6C5CE7]/20 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-[#6C5CE7]/25 p-2 text-[#a69cff]"><Zap size={17} /></div><div><p className="text-sm font-extrabold text-white">100 Free Generation Credits for Students</p><p className="mt-1 text-xs text-[#aaa8c0]">Verify with your school email to unlock your student credits and an artist badge.</p></div></div>
          <button type="button" data-testid="button-verify-student" onClick={() => setVerified(true)} className="af-button rounded-lg border border-[#8d80f4]/35 bg-[#6C5CE7]/15 px-4 py-2.5 text-xs font-extrabold text-[#c9c4ff] hover:bg-[#6C5CE7]/25">{verified ? 'Verification link sent' : 'Verify student status'} {verified ? <Check className="ml-1 inline" size={14} /> : <ArrowRight className="ml-1 inline" size={14} />}</button>
        </div>
      </div>
    </section>
  );
}

function SceneGenerator({ credits, onSuccess }: { credits: number; onSuccess: () => void }) {
  const mutation = useGenerateScene();
  const [prompt, setPrompt] = useState('A quiet ramen shop on the moon, 2am, rain against the glass');
  const [style, setStyle] = useState('Cinematic Anime');
  const [ratio, setRatio] = useState('16:9');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  useEffect(() => {
    if (!isGenerating) return;
    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.ceil(Math.random() * 13), 94));
    }, 180);
    return () => window.clearInterval(timer);
  }, [isGenerating]);
  const handleGenerate = () => {
    if (credits < 1) { setNotice('You are out of credits. Verify your student status to keep creating.'); return; }
    if (prompt.trim().length < 3) { setNotice('Give your scene a little more detail first.'); return; }
    setNotice('');
    setProgress(0);
    setIsGenerating(true);
    mutation.mutate({ data: { prompt, style, aspectRatio: ratio } }, {
      onSuccess: (data) => {
        setProgress(100);
        window.setTimeout(() => {
          setResult(data);
          setIsGenerating(false);
          queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
          onSuccess();
        }, 450);
      },
      onError: () => {
        setIsGenerating(false);
        setNotice('The forge is taking a breather. Try again in a moment.');
      },
    });
  };
  return (
    <div id="scene-generator" className="af-glass rounded-[22px] p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between"><div><div className="af-kicker mb-2">01 / scene generator</div><h3 className="text-xl font-extrabold text-white">Start with a feeling</h3></div><div className="rounded-lg border border-[#70A1FF]/20 bg-[#70A1FF]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#9ec1ff]">MOCK READY</div></div>
      <label className="af-label mb-2 block" htmlFor="scene-prompt">Scene prompt</label>
      <textarea id="scene-prompt" data-testid="input-scene-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className="af-input resize-none p-3.5 text-sm leading-6" placeholder="Describe a moment, not a shopping list..." />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><label className="af-label mb-2 block" htmlFor="scene-style">Visual language</label><div className="relative"><select id="scene-style" data-testid="select-scene-style" value={style} onChange={(e) => setStyle(e.target.value)} className="af-input appearance-none p-3 text-sm"><option>Shonen Anime</option><option>Cinematic Anime</option><option>Cyberpunk Anime</option><option>90s Anime</option><option>Dark Fantasy</option><option>Fantasy Anime</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[#777989]" size={16} /></div></div>
        <div><span className="af-label mb-2 block">Frame</span><div className="grid grid-cols-3 gap-2">{['16:9', '1:1', '9:16'].map((item) => <button type="button" key={item} data-testid={`button-ratio-${item.replace(':', '-')}`} onClick={() => setRatio(item)} className={`rounded-lg border py-2.5 text-xs font-bold transition-colors ${ratio === item ? 'border-[#6C5CE7] bg-[#6C5CE7]/20 text-white' : 'border-white/10 bg-white/[.03] text-[#777989] hover:border-white/25'}`}>{item}</button>)}</div></div>
      </div>
      <button type="button" data-testid="button-generate-scene" disabled={mutation.isPending || isGenerating} onClick={handleGenerate} className="af-button af-primary mt-6 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-70">{isGenerating ? <><RefreshCw className="mr-2 animate-spin" size={16} /> Composing your frame... {progress}%</> : <><Sparkles className="mr-2" size={16} /> Generate Scene <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[10px]">1 credit</span></>}</button>
      {isGenerating && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#24253a]" aria-label={`Generation progress ${progress}%`}><div className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#70A1FF] transition-all duration-200" style={{ width: `${progress}%` }} /></div>}
      {notice && <p data-testid="status-scene-error" className="mt-3 text-center text-xs text-[#ff8e9a]">{notice}</p>}
      {result && <ResultPreview result={result} />}
    </div>
  );
}

function ResultPreview({ result }: { result: GenerationResult }) {
  return <div className="af-reveal mt-5 overflow-hidden rounded-xl border border-[#70A1FF]/25 bg-[#0b0c10]"><div className="relative aspect-video"><img src={result.imageUrl || artworkUrl(result.prompt)} alt="Generated anime scene" className="h-full w-full object-cover" /><div className="absolute left-3 top-3 rounded-md bg-[#0b0c10]/75 px-2 py-1 text-[10px] font-bold text-[#9ec1ff] backdrop-blur">FORGED / {result.status || 'complete'}</div></div><div className="flex items-center justify-between p-3"><span className="text-xs text-[#858692]">Your frame is ready to direct.</span><IconButton label="Download scene"><Download size={15} /></IconButton></div></div>;
}

function SketchConverter({ credits, onSuccess }: { credits: number; onSuccess: () => void }) {
  const upload = useUploadAsset();
  const convert = useConvertSketch();
  const [file, setFile] = useState<{ name: string; preview: string; assetId?: string } | null>(null);
  const [prompt, setPrompt] = useState('Keep the silhouette, add luminous fabric and expressive eyes');
  const [fidelity, setFidelity] = useState(78);
  const [color, setColor] = useState(64);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isConverting) return;
    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.ceil(Math.random() * 13), 94));
    }, 180);
    return () => window.clearInterval(timer);
  }, [isConverting]);
  const selectFile = (picked?: File) => {
    if (!picked) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(picked.type)) {
      setNotice('Choose a PNG, JPG, or WEBP sketch.');
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      setNotice('Keep sketches under 10MB for the prototype.');
      return;
    }
    setNotice('');
    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result);
      setFile({ name: picked.name, preview });
      upload.mutate({ data: { fileName: picked.name, mimeType: picked.type || 'image/png', dataUrl: preview } }, {
        onSuccess: (data) => setFile({ name: data.fileName, preview: data.previewUrl || preview, assetId: data.assetId }),
        onError: () => setNotice('Upload did not complete. You can try the file again.'),
      });
    };
    reader.readAsDataURL(picked);
  };
  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0]);
  };
  const convertSketch = () => {
    if (credits < 2) { setNotice('You need 2 credits for sketch conversion.'); return; }
    if (!file?.assetId) { setNotice('Upload a sketch to unlock conversion.'); return; }
    setNotice('');
    setProgress(0);
    setIsConverting(true);
    convert.mutate({ data: { assetId: file.assetId, prompt, fidelity, colorIntensity: color } }, {
      onSuccess: (data) => {
        setProgress(100);
        window.setTimeout(() => {
          setResult(data);
          setIsConverting(false);
          queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
          onSuccess();
        }, 450);
      },
      onError: () => {
        setIsConverting(false);
        setNotice('Conversion paused. Try again when the forge is ready.');
      },
    });
  };
  return (
    <div id="sketch-to-anime" className="af-glass rounded-[22px] p-5 sm:p-7">
      <div className="mb-6 flex items-center justify-between"><div><div className="af-kicker mb-2">02 / sketch converter</div><h3 className="text-xl font-extrabold text-white">Give it a starting line</h3></div><div className="rounded-lg border border-[#ff4757]/20 bg-[#ff4757]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#ff9aa3]">BETA</div></div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" data-testid="input-sketch-file" onChange={(e) => selectFile(e.target.files?.[0])} />
      <button type="button" data-testid="button-upload-sketch" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="group relative flex min-h-[166px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#6C5CE7]/45 bg-[#6C5CE7]/[.06] p-5 text-center transition-colors hover:border-[#70A1FF]/65 hover:bg-[#6C5CE7]/[.12]">{file ? <><img src={file.preview} alt="Uploaded sketch preview" className="absolute inset-0 h-full w-full object-cover opacity-45" /><div className="relative rounded-lg bg-[#0b0c10]/80 px-3 py-2 backdrop-blur"><ImageIcon className="mx-auto mb-1 text-[#70A1FF]" size={20} /><span className="text-xs font-bold text-white">{file.name}</span><span className="mt-1 block text-[10px] text-[#a6a7b7]">{upload.isPending ? 'Registering asset...' : 'Ready to direct'}</span></div></> : <><CloudUpload className="mb-3 text-[#70A1FF]" size={25} /><span className="text-sm font-bold text-[#d9d8e4]">Drop a sketch here</span><span className="mt-1 text-xs text-[#747684]">PNG, JPG or WEBP · up to 10MB</span></>}</button>
      <label className="af-label mb-2 mt-5 block" htmlFor="sketch-prompt">Direction note</label><input id="sketch-prompt" data-testid="input-sketch-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="af-input p-3 text-sm" />
      <Slider label="Line fidelity" value={fidelity} onChange={setFidelity} color="#70A1FF" /><Slider label="Color intensity" value={color} onChange={setColor} color="#FF4757" />
      <button type="button" data-testid="button-convert-sketch" disabled={convert.isPending || upload.isPending || isConverting} onClick={convertSketch} className="af-button af-pink mt-5 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-70">{isConverting ? <><RefreshCw className="mr-2 animate-spin" size={16} /> Painting over the lines... {progress}%</> : <><Wand2 className="mr-2" size={16} /> Convert sketch <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[10px]">2 credits</span></>}</button>
      {isConverting && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#24253a]" aria-label={`Sketch conversion progress ${progress}%`}><div className="h-full rounded-full bg-gradient-to-r from-[#FF4757] to-[#6C5CE7] transition-all duration-200" style={{ width: `${progress}%` }} /></div>}
      {notice && <p data-testid="status-sketch-error" className="mt-3 text-center text-xs text-[#ff8e9a]">{notice}</p>}
      {file && <div className="mt-5"><div className="mb-2 flex items-center justify-between"><p className="af-label">Before / after</p><span className="text-[10px] uppercase tracking-widest text-[#777989]">{result ? 'Mock result ready' : 'Upload preview ready'}</span></div><div className="grid gap-3 sm:grid-cols-2"><div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0c10]"><div className="border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#9a9baa]">Before · sketch</div><img src={file.preview} alt="Uploaded sketch before conversion" className="aspect-square w-full object-cover" /></div><div className="overflow-hidden rounded-xl border border-[#6C5CE7]/30 bg-[#0b0c10]"><div className="border-b border-[#6C5CE7]/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#aaa1ff]">After · anime</div>{result ? <img src={result.imageUrl || artworkUrl(result.prompt)} alt="Mock anime result after conversion" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center p-6 text-center"><Wand2 className="mb-3 text-[#6C5CE7]" size={24} /><p className="text-xs font-semibold text-[#aaaab8]">Your mock anime result will appear here.</p></div>}</div></div></div>}
    </div>
  );
}

function Slider({ label, value, onChange, color }: { label: string; value: number; onChange: (value: number) => void; color: string }) {
  return <label className="mt-4 block"><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#a6a7b5]">{label}</span><span className="font-mono text-[#e2e1eb]">{value}%</span></div><input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} data-testid={`input-${label.toLowerCase().replace(' ', '-')}`} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#252638] accent-[#6C5CE7]" style={{ accentColor: color }} /></label>;
}

function Studio({ credits, onSceneSuccess, onSketchSuccess }: { credits: number; onSceneSuccess: () => void; onSketchSuccess: () => void }) {
  return <section id="studio" className="af-shell py-16 sm:py-24"><SectionHeader kicker="The cockpit" title="From blank canvas to first frame." detail="Two ways in. One place to keep the weird, wonderful ideas moving." /><div className="grid gap-5 lg:grid-cols-2"><SceneGenerator credits={credits} onSuccess={onSceneSuccess} /><SketchConverter credits={credits} onSuccess={onSketchSuccess} /></div><div className="mt-5 grid gap-5 md:grid-cols-[1.3fr_.7fr]"><div className="af-grid rounded-[22px] border border-white/[.08] p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#70A1FF]/15 text-[#70A1FF]"><Layers3 size={18} /></div><div><p className="text-sm font-extrabold text-white">Direct in passes</p><p className="mt-1 text-xs text-[#858692]">Build a scene without losing the thread.</p></div></div><div className="mt-7 flex items-center gap-2 overflow-hidden">{['Idea', 'Composition', 'Light', 'Frame'].map((step, i) => <div key={step} className="flex min-w-0 flex-1 items-center gap-2"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-[#6C5CE7] text-white' : 'border border-white/15 text-[#7c7d8a]'}`}>{i + 1}</span><span className="truncate text-[10px] font-semibold text-[#878896]">{step}</span>{i < 3 && <span className="h-px min-w-4 flex-1 bg-white/10" />}</div>)}</div></div><div className="rounded-[22px] border border-[#ff4757]/15 bg-[#24141b] p-6"><div className="af-kicker !text-[#ff7a86]">Credits pulse</div><div className="mt-3 flex items-end justify-between"><span data-testid="text-credit-count" className="text-3xl font-extrabold text-white">{credits}</span><span className="mb-1 text-xs text-[#a79aa0]">of 100 student credits</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#43232d]"><div className="h-full rounded-full bg-[#FF4757] transition-all duration-300" style={{ width: `${credits}%` }} /></div><p className="mt-3 text-[11px] leading-5 text-[#ba9da3]">Credits are deducted only after a successful mock generation.</p></div></div></section>;
}

function History() {
  const query = useGetHistory({ query: { queryKey: getGetHistoryQueryKey() } });
  const items = query.data?.length ? query.data : fallbackHistory;
  return <section className="af-shell py-16"><SectionHeader kicker="Your signal trail" title="Recent work, still warm." detail="Every draft stays close. Pick up the thread when the next idea arrives." /><div className="af-glass overflow-hidden rounded-[22px]">{query.isLoading ? <div className="grid gap-3 p-5"><div className="af-shimmer h-16 rounded-xl" /><div className="af-shimmer h-16 rounded-xl" /></div> : query.isError ? <div className="p-8 text-center text-sm text-[#ff9aa3]">History is offline right now. Your local trail is still here.</div> : <div className="divide-y divide-white/[.07]">{items.map((item) => <div key={item.id} data-testid={`row-history-${item.id}`} className="flex items-center gap-4 p-4 sm:p-5"><img src={item.imageUrl || artworkUrl(item.prompt)} alt="" className="h-14 w-20 rounded-lg object-cover" /><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className="rounded bg-[#6C5CE7]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#aaa1ff]">{item.kind}</span><span className="text-[10px] text-[#777987]">{new Date(item.createdAt).toLocaleDateString()}</span></div><p className="truncate text-sm font-semibold text-[#e5e4ed]">{item.prompt}</p></div><span className="hidden items-center gap-1.5 text-xs text-[#6ed6bd] sm:flex"><Check size={13} /> {item.status}</span><IconButton label={`Open history ${item.id}`}><ArrowRight size={15} /></IconButton></div>)}</div>}</div></section>;
}

function Gallery() {
  const query = useGetGallery({ query: { queryKey: getGetGalleryQueryKey() } });
  const like = useLikeGalleryPost();
  const [liked, setLiked] = useState<number[]>([]);
  const posts = query.data?.length ? query.data : fallbackGallery;
  const doLike = (post: GalleryPost) => { if (liked.includes(post.id)) return; setLiked((list) => [...list, post.id]); like.mutate({ id: post.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetGalleryQueryKey() }); } }); };
  return <section id="gallery" className="af-shell py-16 sm:py-24"><SectionHeader kicker="Made in the forge" title="A little proof of life." detail="Browse scenes from artists who are still figuring it out. That is the point." /><div className="grid gap-4 md:grid-cols-3">{query.isLoading ? [1, 2, 3].map((i) => <div key={i} className="af-shimmer aspect-[.84] rounded-2xl" />) : posts.map((post, index) => <article key={post.id} data-testid={`card-gallery-${post.id}`} className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151620] ${index === 1 ? 'md:translate-y-8' : ''}`}><img src={post.imageUrl || artworkUrl(post.prompt, index === 1 ? 'portrait' : 'square')} alt={post.title} className="aspect-[.84] w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-transparent to-transparent opacity-90" /><div className="absolute bottom-0 left-0 right-0 p-5"><div className="mb-2 flex items-center justify-between"><span className="rounded-full border border-white/15 bg-[#0b0c10]/50 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#bdbbca]">{post.style}</span><button type="button" data-testid={`button-like-gallery-${post.id}`} onClick={() => doLike(post)} className={`flex items-center gap-1.5 text-xs font-bold ${liked.includes(post.id) ? 'text-[#ff7380]' : 'text-white/70 hover:text-[#ff7380]'}`}><Heart size={14} fill={liked.includes(post.id) ? 'currentColor' : 'none'} /> {post.likes + (liked.includes(post.id) && !query.data ? 1 : 0)}</button></div><h3 className="text-base font-extrabold text-white">{post.title}</h3><p className="mt-1 text-xs text-[#aaaab5]">by {post.creatorName}</p></div></article>)}</div><div className="mt-10 text-center"><button type="button" data-testid="button-load-gallery" onClick={() => query.refetch()} className="af-button rounded-xl border border-white/15 bg-white/[.04] px-5 py-3 text-xs font-bold text-[#c4c3cd] hover:border-[#70A1FF]/50 hover:text-white"><RefreshCw className="mr-2 inline" size={14} /> Refresh gallery</button></div></section>;
}

function Pricing() {
  return <section id="pricing" className="af-shell py-16 sm:py-24"><SectionHeader kicker="Pick your pace" title="Keep making strange things." detail="Start free. Upgrade when your scenes start asking for a bigger canvas." /><div className="grid gap-4 md:grid-cols-2"><PriceCard name="Free" price="$0" detail="For students and first ideas" items={['100 student credits', 'Basic generation', 'Community gallery']} /><PriceCard name="Creator" price="$12" detail="For making a world" featured items={['More generations', 'Higher quality', 'More creative controls']} /></div></section>;
}
function PriceCard({ name, price, detail, items, featured }: { name: string; price: string; detail: string; items: string[]; featured?: boolean }) {
  return <div className={`relative rounded-2xl border p-6 ${featured ? 'border-[#6C5CE7]/60 bg-[#1a1730] shadow-[0_20px_60px_rgba(108,92,231,.15)]' : 'border-white/10 bg-[#111219]'}`}>{featured && <div className="absolute right-5 top-5 rounded-full bg-[#6C5CE7] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white">Most loved</div>}<div className="af-kicker">{name}</div><p className="mt-5 text-4xl font-extrabold tracking-[-.06em] text-white">{price}<span className="ml-1 text-sm font-semibold tracking-normal text-[#838491]">{price !== '$0' && '/ month'}</span></p><p className="mt-2 text-xs text-[#898a97]">{detail}</p><div className="my-6 h-px bg-white/10" /><ul className="space-y-3">{items.map((item) => <li key={item} className="flex items-center gap-2 text-xs text-[#c2c1cc]"><Check size={14} className="text-[#70A1FF]" />{item}</li>)}</ul><Link href="/signup" data-testid={`link-pricing-${name.toLowerCase()}`} className={`af-button mt-7 block rounded-xl py-3 text-center text-xs font-extrabold ${featured ? 'af-primary text-white' : 'border border-white/15 text-[#dddde5] hover:bg-white/[.05]'}`}>{price === '$0' ? 'Start for free' : 'Choose plan'}</Link></div>;
}

function Footer() {
  return <footer className="border-t border-white/[.07] py-8"><div className="af-shell flex flex-col items-center justify-between gap-4 text-xs text-[#6f707c] sm:flex-row"><span>© 2025 AnimeForge AI</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6ed6bd]" /> Forge status: operational</span><span>Built for unfinished ideas.</span></div></footer>;
}

function Home() {
  const [credits, setCredits] = useState(100);
  return <div className="af-app"><Nav /><main><Hero /><StudentBanner /><Studio credits={credits} onSceneSuccess={() => setCredits((current) => Math.max(current - 1, 0))} onSketchSuccess={() => setCredits((current) => Math.max(current - 2, 0))} /><History /><Gallery /><Pricing /></main><Footer /></div>;
}

function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const isSignup = mode === 'signup';
  const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); setSubmitted(true); setTimeout(() => setLocation('/'), 900); };
  return <div className="af-app grid min-h-[100dvh] lg:grid-cols-[.8fr_1.2fr]"><div className="relative hidden overflow-hidden border-r border-white/[.07] lg:block"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(108,92,231,.24),transparent_32rem)]" /><div className="af-grid absolute inset-0 opacity-40" /><div className="relative flex h-full flex-col justify-between p-12"><Link href="/" data-testid="link-auth-logo" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#6C5CE7]"><Sparkles size={18} /></span><span className="text-sm font-extrabold tracking-[-.03em] text-white">ANIME<span className="text-[#70A1FF]">FORGE</span><span className="text-[#ff4757]"> AI</span></span></Link><div><div className="af-kicker mb-5">Your creative cockpit</div><h1 className="af-heading max-w-[500px] text-6xl font-extrabold text-white">Keep the<br /><span className="text-[#70A1FF]">weird idea.</span></h1><p className="mt-6 max-w-[360px] text-sm leading-6 text-[#9293a1]">A quiet place to make scenes, test characters, and follow a thought until it becomes a world.</p></div><p className="text-xs text-[#636572]">ANF / CREATOR NETWORK / 01</p></div></div><div className="flex min-h-[100dvh] items-center justify-center p-6 sm:p-10"><div className="w-full max-w-[420px]"><Link href="/" data-testid="link-auth-back" className="mb-12 inline-flex items-center gap-2 text-xs font-bold text-[#81828f] hover:text-white lg:hidden"><ArrowRight className="rotate-180" size={14} /> Back to AnimeForge</Link><div className="mb-10"><div className="af-kicker mb-3">{isSignup ? 'Open a studio pass' : 'Welcome back, director'}</div><h2 className="af-heading text-4xl font-extrabold text-white">{isSignup ? 'Make room for the idea.' : 'Pick up where you left off.'}</h2><p className="mt-4 text-sm leading-6 text-[#858692]">{isSignup ? 'Your first 60 credits are waiting. No card, no prompt jargon.' : 'Your frames, references, and late-night experiments are still warm.'}</p></div><form onSubmit={submit} className="space-y-4">{isSignup && <div><label className="af-label mb-2 block" htmlFor="auth-name">Your name</label><input id="auth-name" data-testid="input-auth-name" required className="af-input p-3.5 text-sm" placeholder="How should we credit you?" /></div>}<div><label className="af-label mb-2 block" htmlFor="auth-email">Email address</label><input id="auth-email" data-testid="input-auth-email" type="email" required className="af-input p-3.5 text-sm" placeholder="you@somewhere.studio" /></div><div><label className="af-label mb-2 block" htmlFor="auth-password">Password</label><input id="auth-password" data-testid="input-auth-password" type="password" required minLength={6} className="af-input p-3.5 text-sm" placeholder="Six characters or more" /></div><button type="submit" data-testid="button-auth-submit" disabled={submitted} className="af-button af-pink mt-3 w-full rounded-xl py-3.5 text-sm font-extrabold text-white disabled:opacity-70">{submitted ? <><RefreshCw className="mr-2 inline animate-spin" size={15} /> Opening your studio...</> : isSignup ? 'Create my studio pass' : 'Enter the studio'} <ArrowRight className="ml-1 inline" size={15} /></button></form>{!isSignup && <button type="button" data-testid="button-forgot-password" onClick={() => setSubmitted(true)} className="mt-5 w-full text-center text-xs text-[#858692] underline decoration-white/20 underline-offset-4 hover:text-white">Forgot your password?</button>}<div className="mt-9 border-t border-white/[.08] pt-6 text-center text-xs text-[#777885]">{isSignup ? <>Already have a pass? <Link href="/login" data-testid="link-auth-login" className="font-bold text-[#a9a3ff] hover:text-white">Log in</Link></> : <>New to the forge? <Link href="/signup" data-testid="link-auth-signup" className="font-bold text-[#a9a3ff] hover:text-white">Create an account</Link></>}</div><p className="mt-7 flex items-center justify-center gap-2 text-[10px] text-[#5e606b]"><LockKeyhole size={12} /> Your drafts stay yours.</p></div></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/login"><Auth mode="login" /></Route><Route path="/signup"><Auth mode="signup" /></Route><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;