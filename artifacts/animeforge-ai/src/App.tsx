import { useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Camera, Check, ChevronDown, Clapperboard, Clock3, Film, Heart,
  LockKeyhole, Menu, RefreshCw, Sparkles, Upload, Video, X, Zap,
} from 'lucide-react';
import {
  getGetGalleryQueryKey, getGetHistoryQueryKey, useGenerateVideo, useGetGallery,
  useGetHistory, useLikeGalleryPost, useRegisterCharacterReference,
} from '@workspace/api-client-react';
import type { CharacterReference, GalleryPost, HistoryItem, VideoJob } from '@workspace/api-client-react';
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
          <a href="#studio" data-testid="link-scene-generator" className="transition-colors hover:text-white">Video Studio</a>
          <a href="#storyboard" data-testid="link-sketch-to-anime" className="transition-colors hover:text-white">Storyboard</a>
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
        <h1 className="af-heading max-w-[720px] text-[clamp(3.2rem,8vw,6.6rem)] font-extrabold text-white">Turn Your Detailed Prompt<br /><span className="text-[#70A1FF]">into a 60-Second Anime Scene</span></h1>
        <p className="mt-7 max-w-[560px] text-base leading-7 text-[#9d9eab] sm:text-lg">Plan characters, camera, dialogue, lighting, and atmosphere into a multi-shot anime sequence. No fake video previews — every job shows its real provider status.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#studio" data-testid="button-try-video-studio" className="af-button af-pink inline-flex items-center rounded-xl px-5 py-3.5 text-sm font-extrabold text-white">Plan a 60s Scene <ArrowRight className="ml-2" size={16} /></a>
          <a href="#storyboard" data-testid="button-view-storyboard" className="af-button inline-flex items-center rounded-xl border border-white/15 bg-white/[.04] px-5 py-3.5 text-sm font-bold text-[#dddce5] hover:border-white/30 hover:bg-white/[.08]"><Clapperboard className="mr-2" size={14} /> See the storyboard flow</a>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-5 text-xs text-[#737582]"><span className="flex items-center gap-2"><Check size={14} className="text-[#70A1FF]" /> Minimum 60 seconds</span><span className="flex items-center gap-2"><Check size={14} className="text-[#70A1FF]" /> Shot-by-shot continuity</span></div>
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
        <div className="relative aspect-[1.15] overflow-hidden rounded-[19px] bg-[#171827] p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(112,161,255,.24),transparent_35%),linear-gradient(135deg,#171827,#0d101c)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#0b0c10]/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#c4c4d2]"><span className="h-1.5 w-1.5 rounded-full bg-[#ff4757] shadow-[0_0_9px_#ff4757]" /> Storyboard plan</div><span className="rounded border border-[#70A1FF]/25 px-2 py-1 text-[9px] font-bold text-[#9ec1ff]">60 SEC MIN</span></div>
            <div className="space-y-2">
              {[['01', 'ESTABLISHING WIDE', '00:00 — 00:10'], ['02', 'CHARACTER ENTRANCE', '00:10 — 00:20'], ['03', 'EMOTIONAL CLOSE-UP', '00:20 — 00:30'], ['04', 'ACTION / CAMERA MOVE', '00:30 — 00:40'], ['05', 'DIALOGUE BEAT', '00:40 — 00:50'], ['06', 'QUIET PULL-BACK', '00:50 — 01:00']].map(([number, title, time]) => <div key={number} className="flex items-center gap-3 rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2"><span className="font-mono text-[10px] text-[#70A1FF]">{number}</span><span className="flex-1 text-[10px] font-bold tracking-wide text-[#d8d7e3]">{title}</span><span className="font-mono text-[9px] text-[#777989]">{time}</span></div>)}
            </div>
            <p className="max-w-[330px] text-xs leading-5 text-[#a6a7b5]">A storyboard is the first honest artifact. Video output appears only when a real provider is connected.</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 pb-1 pt-3 text-[10px] font-medium text-[#797b8b]"><span>06 shots / 60 seconds</span><span className="font-mono text-[#70A1FF]">VIDEO PLAN</span></div>
      </div>
      <div className="absolute -bottom-5 -left-4 rounded-xl border border-white/10 bg-[#191a25]/90 px-3 py-2 text-[11px] shadow-xl backdrop-blur-xl"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ffb454]" /> provider status <span className="ml-2 text-[#ffb454]">not connected</span></div>
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
           <div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-[#6C5CE7]/25 p-2 text-[#a69cff]"><Zap size={17} /></div><div><p className="text-sm font-extrabold text-white">Free storyboard planning for students</p><p className="mt-1 text-xs text-[#aaa8c0]">Verify with your school email to unlock your student credits and an artist badge when video providers are connected.</p></div></div>
          <button type="button" data-testid="button-verify-student" onClick={() => setVerified(true)} className="af-button rounded-lg border border-[#8d80f4]/35 bg-[#6C5CE7]/15 px-4 py-2.5 text-xs font-extrabold text-[#c9c4ff] hover:bg-[#6C5CE7]/25">{verified ? 'Verification link sent' : 'Verify student status'} {verified ? <Check className="ml-1 inline" size={14} /> : <ArrowRight className="ml-1 inline" size={14} />}</button>
        </div>
      </div>
    </section>
  );
}

function VideoStudio() {
  const queryClient = useQueryClient();
  const generate = useGenerateVideo();
  const registerReference = useRegisterCharacterReference();
  const [prompt, setPrompt] = useState('A young courier arrives at a rain-soaked lunar ramen shop at 2am. She recognizes a missing friend behind the counter, hides her fear, and reveals a glowing letter. Start with a wide exterior, move through the window reflection into intimate close-ups, then pull back as the neon sign flickers and the rain becomes starlight. Natural dialogue, restrained emotion, cinematic atmosphere.');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [style, setStyle] = useState('Cinematic anime');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [cameraMovement, setCameraMovement] = useState('Slow dolly, motivated tracking, gentle pull-back');
  const [characterName, setCharacterName] = useState('');
  const [referenceNotes, setReferenceNotes] = useState('');
  const [references, setReferences] = useState<CharacterReference[]>([]);
  const [notice, setNotice] = useState('');
  const [job, setJob] = useState<VideoJob | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectReference = (picked?: File) => {
    if (!picked) return;
    if (references.length >= 4) { setNotice('A scene can use up to 4 character references.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(picked.type)) { setNotice('Choose a PNG, JPG, or WEBP character reference.'); return; }
    if (picked.size > 10 * 1024 * 1024) { setNotice('Keep character references under 10MB.'); return; }
    if (!characterName.trim()) { setNotice('Name the character before uploading the reference.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      registerReference.mutate({ data: { characterName: characterName.trim(), fileName: picked.name, mimeType: picked.type, dataUrl: String(reader.result), notes: referenceNotes.trim() } }, {
        onSuccess: (reference) => {
          setReferences((current) => [...current, reference]);
          setCharacterName('');
          setReferenceNotes('');
          setNotice('');
        },
        onError: () => setNotice('Character reference registration failed. Try the file again.'),
      });
    };
    reader.readAsDataURL(picked);
  };

  const generateVideo = () => {
    if (prompt.trim().length < 40) { setNotice('Write at least 40 characters so the storyboard has enough direction.'); return; }
    setNotice('');
    generate.mutate({ data: { prompt, durationSeconds, aspectRatio, style, cameraMovement, characterReferenceIds: references.map((reference) => reference.assetId) } }, {
      onSuccess: (data) => {
        setJob(data);
        queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
      },
      onError: () => setNotice('The video planning request failed. Your prompt was not submitted to a provider.'),
    });
  };

  return (
    <section id="studio" className="af-shell py-16 sm:py-24">
      <SectionHeader kicker="01 / video studio" title="Build the whole scene, not a single frame." detail="Describe the story in detail. AnimeForge turns it into a minimum 60-second shot plan and keeps provider status explicit." />
      <div className="af-glass rounded-[22px] p-5 sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="af-kicker mb-2">60-second scene workflow</div><h3 className="text-xl font-extrabold text-white">Prompt → characters → storyboard → video job</h3></div><div className="flex items-center gap-2 rounded-lg border border-[#ffb454]/25 bg-[#ffb454]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#ffd08a]"><Clock3 size={12} /> PROVIDER GATE</div></div>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <label className="af-label mb-2 block" htmlFor="scene-prompt">Detailed scene prompt</label>
            <textarea id="scene-prompt" data-testid="input-video-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={9} className="af-input resize-none p-3.5 text-sm leading-6" placeholder="Describe characters, location, actions, camera movement, lighting, dialogue, and atmosphere..." />
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#737582]"><span>{prompt.length} characters · storyboard-ready prompts are specific</span><span className={prompt.length < 40 ? 'text-[#ffb454]' : 'text-[#6ed6bd]'}>{prompt.length < 40 ? 'Add more detail' : 'Enough direction'}</span></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className="af-label mb-2 block" htmlFor="scene-style">Anime style</label><div className="relative"><select id="scene-style" data-testid="select-video-style" value={style} onChange={(e) => setStyle(e.target.value)} className="af-input appearance-none p-3 text-sm"><option>Cinematic anime</option><option>Shonen anime</option><option>90s cel anime</option><option>Cyberpunk anime</option><option>Dark fantasy anime</option><option>Slice-of-life anime</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[#777989]" size={16} /></div></div>
              <div><label className="af-label mb-2 block" htmlFor="camera-movement">Camera movement</label><div className="relative"><select id="camera-movement" data-testid="select-camera-movement" value={cameraMovement} onChange={(e) => setCameraMovement(e.target.value)} className="af-input appearance-none p-3 text-sm"><option>Slow dolly, motivated tracking, gentle pull-back</option><option>Handheld anime energy with snap zooms</option><option>Locked-off compositions with subtle pans</option><option>Orbiting camera with dramatic crane rise</option><option>First-person push-in and rack focus</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-[#777989]" size={16} /></div></div>
            </div>
          </div>
          <CharacterReferencePanel characterName={characterName} setCharacterName={setCharacterName} notes={referenceNotes} setNotes={setReferenceNotes} references={references} inputRef={inputRef} isPending={registerReference.isPending} onSelect={selectReference} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-white/[.08] pt-5 sm:grid-cols-[.7fr_1fr]">
          <div><span className="af-label mb-2 block">Scene duration</span><div className="flex items-center gap-3"><input type="range" min={60} max={300} step={10} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} data-testid="input-video-duration" className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#252638] accent-[#6C5CE7]" /><span className="min-w-[74px] rounded-lg border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 px-3 py-2 text-center text-xs font-bold text-[#c8c3ff]">{durationSeconds}s min</span></div></div>
          <div><span className="af-label mb-2 block">Aspect ratio</span><div className="grid grid-cols-3 gap-2">{(['16:9', '9:16', '1:1'] as const).map((item) => <button type="button" key={item} data-testid={`button-video-ratio-${item.replace(':', '-')}`} onClick={() => setAspectRatio(item)} className={`rounded-lg border py-2.5 text-xs font-bold transition-colors ${aspectRatio === item ? 'border-[#6C5CE7] bg-[#6C5CE7]/20 text-white' : 'border-white/10 bg-white/[.03] text-[#777989] hover:border-white/25'}`}>{item}</button>)}</div></div>
        </div>
        <button type="button" data-testid="button-generate-video" disabled={generate.isPending || registerReference.isPending} onClick={generateVideo} className="af-button af-primary mt-6 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-70">{generate.isPending ? <><RefreshCw className="mr-2 animate-spin" size={16} /> Building storyboard...</> : <><Video className="mr-2" size={16} /> Plan &amp; queue 60s video scene</>}</button>
        {notice && <p data-testid="status-video-error" className="mt-3 text-center text-xs text-[#ffb0b7]">{notice}</p>}
        {job && <VideoJobPanel job={job} />}
      </div>
    </section>
  );
}

function CharacterReferencePanel({ characterName, setCharacterName, notes, setNotes, references, inputRef, isPending, onSelect }: { characterName: string; setCharacterName: (value: string) => void; notes: string; setNotes: (value: string) => void; references: CharacterReference[]; inputRef: React.RefObject<HTMLInputElement | null>; isPending: boolean; onSelect: (file?: File) => void }) {
  return <div className="rounded-2xl border border-[#70A1FF]/15 bg-[#0b0c10]/35 p-4"><div className="mb-4 flex items-start justify-between gap-3"><div><div className="af-label">Character continuity</div><p className="mt-1 text-xs leading-5 text-[#858692]">Reference images are passed to every shot plan. They do not become a fake generated frame.</p></div><Camera className="text-[#70A1FF]" size={18} /></div><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" data-testid="input-character-reference" onChange={(e) => onSelect(e.target.files?.[0])} /><div className="grid gap-2 sm:grid-cols-2"><input value={characterName} onChange={(e) => setCharacterName(e.target.value)} className="af-input p-3 text-sm" placeholder="Character name" data-testid="input-character-name" /><input value={notes} onChange={(e) => setNotes(e.target.value)} className="af-input p-3 text-sm" placeholder="Continuity notes (optional)" data-testid="input-character-notes" /></div><button type="button" onClick={() => inputRef.current?.click()} data-testid="button-upload-character-reference" disabled={isPending} className="af-button mt-3 flex w-full items-center justify-center rounded-xl border border-dashed border-[#70A1FF]/35 bg-[#70A1FF]/[.06] py-3 text-xs font-bold text-[#b9d0ff] disabled:opacity-60"><Upload className="mr-2" size={15} /> {isPending ? 'Registering reference...' : 'Upload character reference'}</button>{references.length > 0 && <div className="mt-4 space-y-2">{references.map((reference) => <div key={reference.assetId} className="flex items-center gap-3 rounded-xl border border-white/[.08] bg-white/[.03] p-2"><img src={reference.previewUrl} alt={`${reference.characterName} reference`} className="h-12 w-12 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-xs font-bold text-white">{reference.characterName}</p><p className="truncate text-[10px] text-[#858692]">{reference.notes || 'Continuity reference attached to every shot'}</p></div><span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[#6ed6bd]">attached</span></div>)}</div>}<p className="mt-3 text-[10px] leading-4 text-[#737582]">PNG, JPG, or WEBP · up to 10MB · up to 4 references</p></div>;
}

function VideoJobPanel({ job }: { job: VideoJob }) {
  return <div id="storyboard" className="af-reveal mt-6 overflow-hidden rounded-2xl border border-[#ffb454]/25 bg-[#1e1810]"><div className="flex flex-col justify-between gap-3 border-b border-[#ffb454]/15 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffb454]/15 text-[#ffd08a]"><Film size={18} /></div><div><p className="text-sm font-extrabold text-white">Video job #{job.id} · {job.durationSeconds}s storyboard</p><p data-testid="status-video-provider" className="mt-1 text-xs text-[#e1bc7d]">Video generation is not connected yet</p></div></div><span className="rounded-full border border-[#ffb454]/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffd08a]">{job.status.replace('_', ' ')}</span></div><div className="p-4"><p className="text-sm leading-6 text-[#c8bca7]">{job.message}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[.08] bg-black/15 p-3"><p className="text-[10px] uppercase tracking-widest text-[#888070]">Provider</p><p className="mt-1 text-xs font-bold text-white">{job.provider}</p></div><div className="rounded-xl border border-white/[.08] bg-black/15 p-3"><p className="text-[10px] uppercase tracking-widest text-[#888070]">Continuity</p><p className="mt-1 text-xs font-bold text-white">{job.characterReferenceIds.length} reference(s)</p></div><div className="rounded-xl border border-white/[.08] bg-black/15 p-3"><p className="text-[10px] uppercase tracking-widest text-[#888070]">Output</p><p className="mt-1 text-xs font-bold text-[#ffb454]">{job.outputUrl ? 'Video ready' : 'Waiting for provider'}</p></div></div><div className="mt-5"><div className="mb-3 flex items-center justify-between"><p className="af-label">Storyboard · {job.storyboard.length} shots</p><span className="text-[10px] font-mono text-[#888070]">{job.durationSeconds}s total</span></div><div className="space-y-2">{job.storyboard.map((shot) => <div key={shot.shotNumber} className="grid gap-2 rounded-xl border border-white/[.08] bg-black/15 p-3 sm:grid-cols-[48px_90px_1fr] sm:items-start"><span className="font-mono text-xs font-bold text-[#70A1FF]">SHOT {String(shot.shotNumber).padStart(2, '0')}</span><span className="text-[10px] font-semibold text-[#aaa08e]">{shot.startSeconds}s · {shot.durationSeconds}s<br />{shot.framing}</span><div><p className="text-xs font-semibold leading-5 text-white">{shot.action}</p><p className="mt-1 text-[10px] leading-4 text-[#888070]">Camera: {shot.cameraMovement} · {shot.continuity}</p></div></div>)}</div></div></div></div>;
}

function Slider({ label, value, onChange, color }: { label: string; value: number; onChange: (value: number) => void; color: string }) {
  return <label className="mt-4 block"><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#a6a7b5]">{label}</span><span className="font-mono text-[#e2e1eb]">{value}%</span></div><input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} data-testid={`input-${label.toLowerCase().replace(' ', '-')}`} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#252638] accent-[#6C5CE7]" style={{ accentColor: color }} /></label>;
}

function Studio() {
  return <VideoStudio />;
}

function History() {
  const query = useGetHistory({ query: { queryKey: getGetHistoryQueryKey() } });
  const items = query.data ?? [];
  return <section className="af-shell py-16"><SectionHeader kicker="Your signal trail" title="Video plans, not fake frames." detail="Every storyboard job keeps its prompt, duration, and provider state visible." /><div className="af-glass overflow-hidden rounded-[22px]">{query.isLoading ? <div className="grid gap-3 p-5"><div className="af-shimmer h-16 rounded-xl" /><div className="af-shimmer h-16 rounded-xl" /></div> : query.isError ? <div className="p-8 text-center text-sm text-[#ff9aa3]">Video history is offline right now.</div> : items.length === 0 ? <div className="p-8 text-center"><Film className="mx-auto mb-3 text-[#6C5CE7]" size={22} /><p className="text-sm font-bold text-white">No video plans yet</p><p className="mt-1 text-xs text-[#858692]">Your first storyboard will appear here after you submit a scene.</p></div> : <div className="divide-y divide-white/[.07]">{items.map((item) => <div key={item.id} data-testid={`row-history-${item.id}`} className="flex items-center gap-4 p-4 sm:p-5"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#ffb454]/20 bg-[#ffb454]/10 text-[#ffd08a]"><Video size={18} /></div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className="rounded bg-[#6C5CE7]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#aaa1ff]">{item.kind}</span><span className="text-[10px] text-[#777987]">{new Date(item.createdAt).toLocaleDateString()}</span></div><p className="truncate text-sm font-semibold text-[#e5e4ed]">{item.prompt}</p></div><span className="hidden items-center gap-1.5 text-xs uppercase tracking-wider text-[#ffb454] sm:flex">{item.status.replace('_', ' ')}</span></div>)}</div>}</div></section>;
}

function Gallery() {
  const query = useGetGallery({ query: { queryKey: getGetGalleryQueryKey() } });
  const like = useLikeGalleryPost();
  const [liked, setLiked] = useState<number[]>([]);
  const posts = query.data?.length ? query.data : fallbackGallery;
  const doLike = (post: GalleryPost) => { if (liked.includes(post.id)) return; setLiked((list) => [...list, post.id]); like.mutate({ id: post.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetGalleryQueryKey() }); } }); };
  return <section id="gallery" className="af-shell py-16 sm:py-24"><SectionHeader kicker="Visual reference board" title="A little proof of life." detail="These community images are inspiration only, not generated video outputs. Your real scene plans live in the storyboard history." /><div className="grid gap-4 md:grid-cols-3">{query.isLoading ? [1, 2, 3].map((i) => <div key={i} className="af-shimmer aspect-[.84] rounded-2xl" />) : posts.map((post, index) => <article key={post.id} data-testid={`card-gallery-${post.id}`} className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151620] ${index === 1 ? 'md:translate-y-8' : ''}`}><img src={post.imageUrl || artworkUrl(post.prompt, index === 1 ? 'portrait' : 'square')} alt={`${post.title} inspiration reference`} className="aspect-[.84] w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-transparent to-transparent opacity-90" /><div className="absolute bottom-0 left-0 right-0 p-5"><div className="mb-2 flex items-center justify-between"><span className="rounded-full border border-white/15 bg-[#0b0c10]/50 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[#bdbbca]">{post.style}</span><button type="button" data-testid={`button-like-gallery-${post.id}`} onClick={() => doLike(post)} className={`flex items-center gap-1.5 text-xs font-bold ${liked.includes(post.id) ? 'text-[#ff7380]' : 'text-white/70 hover:text-[#ff7380]'}`}><Heart size={14} fill={liked.includes(post.id) ? 'currentColor' : 'none'} /> {post.likes + (liked.includes(post.id) && !query.data ? 1 : 0)}</button></div><h3 className="text-base font-extrabold text-white">{post.title}</h3><p className="mt-1 text-xs text-[#aaaab5]">by {post.creatorName}</p></div></article>)}</div><div className="mt-10 text-center"><button type="button" data-testid="button-load-gallery" onClick={() => query.refetch()} className="af-button rounded-xl border border-white/15 bg-white/[.04] px-5 py-3 text-xs font-bold text-[#c4c3cd] hover:border-[#70A1FF]/50 hover:text-white"><RefreshCw className="mr-2 inline" size={14} /> Refresh board</button></div></section>;
}

function Pricing() {
  return <section id="pricing" className="af-shell py-16 sm:py-24"><SectionHeader kicker="Pick your pace" title="Keep making strange things." detail="Start free. Upgrade when a connected provider makes your storyboard ready for production." /><div className="grid gap-4 md:grid-cols-2"><PriceCard name="Free" price="$0" detail="For students and first ideas" items={['Storyboard planning', 'Character references', 'Community reference board']} /><PriceCard name="Creator" price="$12" detail="For making a world" featured items={['More video jobs', 'Higher provider limits', 'More continuity controls']} /></div></section>;
}
function PriceCard({ name, price, detail, items, featured }: { name: string; price: string; detail: string; items: string[]; featured?: boolean }) {
  return <div className={`relative rounded-2xl border p-6 ${featured ? 'border-[#6C5CE7]/60 bg-[#1a1730] shadow-[0_20px_60px_rgba(108,92,231,.15)]' : 'border-white/10 bg-[#111219]'}`}>{featured && <div className="absolute right-5 top-5 rounded-full bg-[#6C5CE7] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white">Most loved</div>}<div className="af-kicker">{name}</div><p className="mt-5 text-4xl font-extrabold tracking-[-.06em] text-white">{price}<span className="ml-1 text-sm font-semibold tracking-normal text-[#838491]">{price !== '$0' && '/ month'}</span></p><p className="mt-2 text-xs text-[#898a97]">{detail}</p><div className="my-6 h-px bg-white/10" /><ul className="space-y-3">{items.map((item) => <li key={item} className="flex items-center gap-2 text-xs text-[#c2c1cc]"><Check size={14} className="text-[#70A1FF]" />{item}</li>)}</ul><Link href="/signup" data-testid={`link-pricing-${name.toLowerCase()}`} className={`af-button mt-7 block rounded-xl py-3 text-center text-xs font-extrabold ${featured ? 'af-primary text-white' : 'border border-white/15 text-[#dddde5] hover:bg-white/[.05]'}`}>{price === '$0' ? 'Start for free' : 'Choose plan'}</Link></div>;
}

function Footer() {
  return <footer className="border-t border-white/[.07] py-8"><div className="af-shell flex flex-col items-center justify-between gap-4 text-xs text-[#6f707c] sm:flex-row"><span>© 2025 AnimeForge AI</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#6ed6bd]" /> Forge status: operational</span><span>Built for unfinished ideas.</span></div></footer>;
}

function Home() {
  return <div className="af-app"><Nav /><main><Hero /><StudentBanner /><Studio /><History /><Gallery /><Pricing /></main><Footer /></div>;
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