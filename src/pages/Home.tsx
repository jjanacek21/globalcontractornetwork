import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import animatedLogoAsset from "@/assets/gcn-animated-logo.mp4.asset.json";

/* ------------------------------------------------------------------ */
/*  Self-contained landing page styled with scoped CSS (gcn- prefix)  */
/* ------------------------------------------------------------------ */

const SCOPED_CSS = `
.gcn-home{font-family:var(--gcn-body);color:var(--gcn-ink);background:var(--gcn-ground);line-height:1.6;-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
.gcn-home *{box-sizing:border-box}.gcn-home a{color:inherit;text-decoration:none}.gcn-home img{max-width:100%;display:block}
.gcn-home .container{max-width:var(--gcn-maxw);margin:0 auto;padding:0 24px}
.gcn-home h1,.gcn-home h2,.gcn-home h3,.gcn-home h4{font-family:var(--gcn-display);letter-spacing:0;line-height:1.12;margin:0 0 .4em;color:var(--gcn-ink)}
.gcn-home h1{font-size:clamp(2.7rem,6vw,4.8rem);font-weight:800;line-height:1.02}.gcn-home h2{font-size:clamp(2rem,4vw,3rem);font-weight:750}.gcn-home h3{font-size:1.18rem;font-weight:700}.gcn-home p{margin:0 0 1em;color:var(--gcn-ink-2)}
.gcn-home .lead{font-size:1.15rem;color:var(--gcn-ink-2);max-width:690px}.gcn-home .green-text,.gcn-home .gold-text{color:var(--gcn-ink-grass);background:none;text-shadow:none}.gcn-home .hero h1 .gold-text{background:var(--gcn-grad-txt);-webkit-background-clip:text;background-clip:text;color:transparent}
.gcn-home .eyebrow{display:inline-flex;align-items:center;text-transform:uppercase;letter-spacing:.12em;font-size:.73rem;font-weight:750;color:var(--gcn-ink-grass);background:var(--gcn-fill-grass);border:1px solid color-mix(in srgb,var(--gcn-grass-2) 30%,transparent);padding:6px 12px;border-radius:999px}
.gcn-home .btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:13px;font:700 .92rem var(--gcn-body);cursor:pointer;border:0;transition:filter .18s ease,box-shadow .18s ease,transform .12s ease}
.gcn-home .btn-green,.gcn-home .btn-gold{color:#04120a;background:var(--gcn-grad);box-shadow:var(--gcn-shadow-glow),inset 0 1px 0 rgba(255,255,255,.35)}
.gcn-home .btn-green::after,.gcn-home .btn-gold::after{content:"";position:absolute;inset:-40% auto -40% -45%;width:28%;transform:skewX(-20deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);pointer-events:none}
.gcn-home .btn-green:hover::after,.gcn-home .btn-gold:hover::after{animation:gcn-sheen .7s ease-out once}.gcn-home .btn:hover{filter:brightness(1.06)}.gcn-home .btn:active{transform:translateY(1px)}
.gcn-home .btn-ghost{color:var(--gcn-ink);background:var(--gcn-panel-3);border:1px solid var(--gcn-line);box-shadow:none}.gcn-home .btn-link{background:transparent;color:var(--gcn-ink-teal);padding-inline:5px;text-decoration:underline;text-underline-offset:4px}
.gcn-home .btn:focus-visible,.gcn-home a:focus-visible,.gcn-home button:focus-visible,.gcn-home summary:focus-visible{outline:2px solid var(--gcn-ink-teal);outline-offset:3px}
.gcn-home header.site{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--gcn-ground-2) 82%,transparent);backdrop-filter:saturate(150%) blur(16px);border-bottom:1px solid var(--gcn-line-soft);box-shadow:0 8px 30px -26px rgba(15,27,56,.45)}
.gcn-home .nav{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:96px}.gcn-home .brand{position:relative;display:flex;align-self:stretch;width:260px;flex:none}.gcn-home .animated-logo{position:relative;display:block;width:260px;aspect-ratio:16/9;overflow:visible}.gcn-home .animated-logo::before{content:"";position:absolute;inset:10% 4%;z-index:-1;background:radial-gradient(ellipse at center,color-mix(in srgb,var(--gcn-grass-2) 26%,transparent) 0 38%,transparent 76%);filter:blur(26px);border-radius:50%;opacity:.5;pointer-events:none}.gcn-home .animated-logo>video,.gcn-home .animated-logo>img,.gcn-home .animated-logo>canvas{width:100%;height:100%;display:block;object-fit:contain;object-position:center}.gcn-home .brand .animated-logo{position:absolute;top:0;left:0;transform:translateY(4px);transition:transform .3s ease}.gcn-home .brand:hover .animated-logo{transform:translateY(4px) scale(1.025)}
.gcn-home .navlinks{display:flex;gap:22px;align-items:center}.gcn-home .navlinks a{font-weight:650;color:var(--gcn-ink-2);font-size:.91rem}.gcn-home .navlinks a:hover{color:var(--gcn-ink-teal)}.gcn-home .nav-cta{display:flex;gap:9px;align-items:center}.gcn-home .theme-toggle,.gcn-home .mobile-trigger{width:42px;height:42px;display:inline-grid;place-items:center;border:1px solid var(--gcn-line);border-radius:12px;color:var(--gcn-ink);background:var(--gcn-panel-2);cursor:pointer;transition:background .18s ease,transform .18s ease}.gcn-home .theme-toggle:hover,.gcn-home .mobile-trigger:hover{background:var(--gcn-panel-3);transform:translateY(-1px)}.gcn-home .theme-toggle svg,.gcn-home .mobile-trigger svg{width:19px;height:19px}.gcn-home .mobile-trigger{display:none}
.gcn-home .hero{position:relative;overflow:hidden;padding:94px 0 104px;background-color:var(--gcn-ground);border-top:0}.gcn-home .hero::before{content:"";position:absolute;inset:-20%;pointer-events:none;background:radial-gradient(circle at 22% 38%,rgba(60,224,138,.14),transparent 30%),radial-gradient(circle at 82% 30%,rgba(35,216,200,.14),transparent 32%);filter:blur(46px)}
.gcn-home .hero .container{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}.gcn-home .rating-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:var(--gcn-panel-2);border:1px solid var(--gcn-line);box-shadow:var(--gcn-shadow);font-size:.84rem;font-weight:650;color:var(--gcn-ink-2)}.gcn-home .rating-pill .stars,.gcn-home .stars{color:var(--gcn-ink-amber);letter-spacing:1px}.gcn-home .hero h1{margin-top:20px}.gcn-home .quoteline{color:var(--gcn-ink-teal);border-left:3px solid var(--gcn-teal);padding:7px 0 7px 14px;margin:12px 0 16px;font-size:1.02rem}.gcn-home .actions{display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;align-items:center}.gcn-home .actions .btn-lg{padding:17px 29px;font-size:1.02rem}.gcn-home .actions-meta{margin-top:13px;font-size:.85rem;color:var(--gcn-ink-3);display:flex;gap:8px;flex-wrap:wrap}.gcn-home .actions-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--gcn-ink-4);align-self:center}.gcn-home .badge-strip{display:inline-flex;align-items:center;gap:10px;margin-top:24px;padding:10px 15px;border-radius:12px;background:var(--gcn-fill-grass);border:1px solid var(--gcn-line);box-shadow:var(--gcn-shadow)}.gcn-home .badge-strip svg{width:18px;color:var(--gcn-ink-grass)}.gcn-home .badge-strip strong{color:var(--gcn-ink-grass);font-size:.9rem}.gcn-home .hero-stats{display:flex;gap:30px;margin-top:29px;flex-wrap:wrap}.gcn-home .hstat .num{font:800 1.65rem var(--gcn-display);color:var(--gcn-ink)}.gcn-home .hstat .lbl{color:var(--gcn-ink-3);font-size:.76rem;text-transform:uppercase;letter-spacing:.08em}
.gcn-home .hero-card-wrap{perspective:1100px}.gcn-home .hero-card{padding:26px;transform-style:preserve-3d;will-change:transform;transition:transform .38s cubic-bezier(.2,.7,.2,1),box-shadow .22s cubic-bezier(.2,.7,.2,1);border-radius:var(--gcn-r-lg);border:1px solid var(--gcn-line);background:linear-gradient(180deg,var(--gcn-panel-2),var(--gcn-panel));box-shadow:var(--gcn-shadow),0 30px 80px -50px rgba(23,194,122,.75);position:relative}.gcn-home .hero-card::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(60,224,138,.09),transparent 38%,rgba(35,216,200,.08));pointer-events:none}.gcn-home .hero-card .head{display:flex;align-items:center;gap:10px;margin-bottom:14px}.gcn-home .hero-card .head .pulse{width:9px;height:9px;border-radius:50%;background:var(--gcn-grass-2);box-shadow:0 0 0 6px var(--gcn-fill-grass)}.gcn-home .hero-card h3{margin:0;color:var(--gcn-ink)}.gcn-home .hero-card .perk{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px solid var(--gcn-line-soft)}.gcn-home .hero-card .perk:last-child{border-bottom:0}.gcn-home .perk .pico,.gcn-home .tile-ico,.gcn-home .ctile-ico,.gcn-home .why-card .ico{width:42px;height:42px;border-radius:11px;flex:none;display:grid;place-items:center;background:var(--gcn-fill-grass);color:var(--gcn-ink-grass);border:1px solid color-mix(in srgb,var(--gcn-grass-2) 20%,transparent)}.gcn-home .perk .pico svg{width:18px;height:18px}.gcn-home .perk .txt strong{display:block;color:var(--gcn-ink);font-size:.94rem}.gcn-home .perk .txt span{display:block;font-size:.83rem;color:var(--gcn-ink-3)}.gcn-home .hero-card .cta-block{margin-top:16px;display:grid;gap:8px}.gcn-home .hero-card .free-line{font-size:.77rem;color:var(--gcn-ink-grass);font-weight:750;text-align:center;text-transform:uppercase;letter-spacing:.05em}
.gcn-home section{padding:88px 0;border-top:1px solid var(--gcn-line-soft);background:var(--gcn-ground)}.gcn-home section:nth-of-type(even){background:var(--gcn-ground-2)}.gcn-home .section-head{max-width:780px;margin:0 auto 48px;text-align:center}.gcn-home .section-head .eyebrow{margin-bottom:14px}.gcn-home .section-head p{color:var(--gcn-ink-3);font-size:1.03rem}.gcn-home .reveal{opacity:1;transform:none}.gcn-home .gcn-enter{animation-delay:var(--reveal-delay,0ms)}
.gcn-home .why-grid,.gcn-home .review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.gcn-home .tile-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.gcn-home .tools-grid,.gcn-home .ctile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.gcn-home .hire-grid,.gcn-home .process-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.gcn-home .ref-grid,.gcn-home .values{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.gcn-home .why-card,.gcn-home .tile,.gcn-home .ctile,.gcn-home .hire,.gcn-home .val,.gcn-home .step,.gcn-home .review,.gcn-home .ref,.gcn-home details,.gcn-home .storm-card,.gcn-home .joinband-quote{position:relative;border-radius:var(--gcn-r);border:1px solid var(--gcn-line);background:linear-gradient(180deg,var(--gcn-panel-2),var(--gcn-panel) 58%);box-shadow:var(--gcn-shadow);transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s cubic-bezier(.2,.7,.2,1),border-color .22s ease}.gcn-home .why-card:hover,.gcn-home .tile:hover,.gcn-home .ctile:hover,.gcn-home .hire:hover,.gcn-home .val:hover,.gcn-home .step:hover,.gcn-home .review:hover,.gcn-home .ref:hover,.gcn-home details:hover{transform:translateY(-4px);box-shadow:var(--gcn-shadow),0 24px 55px -34px rgba(23,194,122,.48);border-color:color-mix(in srgb,var(--gcn-teal) 45%,var(--gcn-line))}
.gcn-home .why-card{padding:28px}.gcn-home .why-card .ico{width:52px;height:52px;margin-bottom:14px}.gcn-home .why-card h3,.gcn-home .tile h3,.gcn-home .ctile h3,.gcn-home .hire h3,.gcn-home .val h4,.gcn-home .step h3{color:var(--gcn-ink)}.gcn-home .tile,.gcn-home .ctile{padding:23px;display:flex;flex-direction:column;text-align:left}.gcn-home .tile-ico,.gcn-home .ctile-ico{width:50px;height:50px;margin-bottom:14px}.gcn-home .tile-ico svg,.gcn-home .ctile-ico svg,.gcn-home .why-card .ico svg{width:23px;height:23px}.gcn-home .tile p,.gcn-home .ctile p{color:var(--gcn-ink-3);font-size:.9rem;flex-grow:1;line-height:1.5}.gcn-home .tile-cta,.gcn-home .ctile-cta{color:var(--gcn-ink-teal);font-weight:700;font-size:.88rem}.gcn-home .ico-blue,.gcn-home .ico-indigo{background:var(--gcn-fill-blue);color:var(--gcn-ink-blue)}.gcn-home .ico-orange,.gcn-home .ico-gold{background:var(--gcn-fill-amber);color:var(--gcn-ink-amber)}.gcn-home .ico-green,.gcn-home .ico-leaf{background:var(--gcn-fill-grass);color:var(--gcn-ink-grass)}.gcn-home .ico-red,.gcn-home .ico-pink{background:var(--gcn-fill-red);color:var(--gcn-ink-red)}.gcn-home .ico-purple,.gcn-home .ico-teal{background:var(--gcn-fill-teal);color:var(--gcn-ink-teal)}
.gcn-home .stats{background:var(--gcn-panel-3);position:relative}.gcn-home .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}.gcn-home .stat-num{font:800 2.65rem var(--gcn-display);color:var(--gcn-ink-grass)}.gcn-home .stat-lbl{color:var(--gcn-ink-3);font-size:.8rem;text-transform:uppercase;letter-spacing:.08em}.gcn-home .tools-section{margin-top:54px}.gcn-home .tools-head{text-align:center;margin-bottom:25px}.gcn-home .tools-head h3{font:750 clamp(1.4rem,2vw,1.8rem) var(--gcn-display)}.gcn-home .tools-head p{color:var(--gcn-ink-3);max-width:600px;margin:auto}.gcn-home .free-pill{display:inline-block;background:var(--gcn-fill-grass);color:var(--gcn-ink-grass);font-size:.7rem;font-weight:800;text-transform:uppercase;padding:3px 8px;border-radius:6px;align-self:flex-start}
.gcn-home .hire{padding:26px 22px}.gcn-home .hire-recommended{border-color:var(--gcn-grass-2);box-shadow:var(--gcn-shadow-glow)}.gcn-home .hire-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--gcn-grad);color:#04120a;padding:4px 12px;border-radius:999px;font-size:.68rem;font-weight:800;text-transform:uppercase;white-space:nowrap}.gcn-home .hire-tier{font:800 1.55rem var(--gcn-display);color:var(--gcn-ink-teal);margin-bottom:8px}.gcn-home .hire-best,.gcn-home .hire ul{color:var(--gcn-ink-3);font-size:.86rem}.gcn-home .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px}.gcn-home .val{padding:18px 18px 18px 22px}.gcn-home .val::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:4px;border-radius:0 4px 4px 0;background:var(--gcn-grad)}.gcn-home .val p{font-size:.92rem;color:var(--gcn-ink-3)}.gcn-home .process-grid{counter-reset:gcnstep}.gcn-home .step{padding:27px 22px}.gcn-home .step::before{counter-increment:gcnstep;content:counter(gcnstep,decimal-leading-zero);font:800 1.65rem var(--gcn-mono);color:var(--gcn-ink-teal);display:block;margin-bottom:8px}.gcn-home .step p{color:var(--gcn-ink-3);font-size:.93rem}
.gcn-home .storm,.gcn-home .contractors,.gcn-home .joinband{background:var(--gcn-ground-2);color:var(--gcn-ink)}.gcn-home .storm .container,.gcn-home .joinband .container{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}.gcn-home .storm h2,.gcn-home .contractors h2,.gcn-home .joinband h2{color:var(--gcn-ink)!important}.gcn-home .storm p,.gcn-home .contractors p,.gcn-home .joinband p{color:var(--gcn-ink-2)!important}.gcn-home .storm-card,.gcn-home .joinband-quote{padding:27px;color:var(--gcn-ink-2)}.gcn-home .storm-card ol{color:var(--gcn-ink-2)}.gcn-home .storm-card strong{color:var(--gcn-ink)}.gcn-home .ctile-badge{position:absolute;top:14px;right:14px;font-size:.68rem;font-weight:800;padding:4px 9px;border-radius:999px;background:var(--gcn-fill-teal);color:var(--gcn-ink-teal)}
.gcn-home .review{padding:25px;display:flex;flex-direction:column}.gcn-home .review p.body{color:var(--gcn-ink-2)}.gcn-home .review .author{margin-top:auto;display:flex;gap:12px;padding-top:14px;border-top:1px solid var(--gcn-line-soft)}.gcn-home .avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;color:#04120a;background:var(--gcn-grad);flex:none}.gcn-home .author-meta strong{display:block}.gcn-home .author-meta span,.gcn-home .ref .role{color:var(--gcn-ink-3);font-size:.84rem}.gcn-home .sample-banner{margin:18px auto 0;max-width:760px;text-align:center;background:var(--gcn-panel-2);border:1px dashed var(--gcn-line);color:var(--gcn-ink-2);padding:10px 14px;border-radius:8px;font-size:.84rem}.gcn-home .ref{padding:21px;display:flex;gap:16px}.gcn-home .ref .quote{color:var(--gcn-ink-2);font-style:italic}.gcn-home details{padding:18px 22px;margin-bottom:10px}.gcn-home details[open]{border-color:var(--gcn-teal)}.gcn-home summary{cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;color:var(--gcn-ink)}.gcn-home summary::after{content:"+";font-size:1.4rem;color:var(--gcn-ink-teal)}.gcn-home details[open] summary::after{content:"–"}.gcn-home details p{margin:12px 0 0;color:var(--gcn-ink-2)}.gcn-home .joinband-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}.gcn-home .joinband-quote .who{margin-top:10px;color:var(--gcn-ink-teal);font-size:.82rem;text-transform:uppercase}
.gcn-home footer{background:var(--gcn-panel);color:var(--gcn-ink-2);padding:55px 0 24px;border-top:1px solid var(--gcn-line)}.gcn-home footer .animated-logo{width:300px;max-width:100%;aspect-ratio:16/9}.gcn-home .foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px}.gcn-home footer h4{font:700 .88rem var(--gcn-display);text-transform:uppercase;color:var(--gcn-ink);margin-bottom:14px}.gcn-home footer ul{padding:0;list-style:none}.gcn-home footer li{margin:8px 0}.gcn-home footer a{color:var(--gcn-ink-3)}.gcn-home footer a:hover{color:var(--gcn-ink-teal)}.gcn-home .foot-bar{border-top:1px solid var(--gcn-line);padding-top:18px;display:flex;justify-content:space-between;gap:10px;font-size:.83rem;color:var(--gcn-ink-3)}.gcn-home .shimmer{animation:none}
@media (max-width:980px){.gcn-home .navlinks{display:none}.gcn-home .mobile-trigger{display:inline-grid}.gcn-home .hero .container,.gcn-home .about-grid,.gcn-home .storm .container,.gcn-home .joinband .container{grid-template-columns:1fr}.gcn-home .hero-card{transform:none!important}.gcn-home .tile-grid{grid-template-columns:repeat(3,1fr)}.gcn-home .hire-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:760px){.gcn-home .nav{min-height:76px}.gcn-home .brand{width:180px}.gcn-home .brand .animated-logo{width:180px;transform:translateY(3px)}.gcn-home .brand:hover .animated-logo{transform:translateY(3px) scale(1.025)}.gcn-home .nav-cta>.btn-ghost{display:none}.gcn-home .hero{padding:66px 0 76px}.gcn-home section{padding:70px 0}.gcn-home .tile-grid,.gcn-home .tools-grid,.gcn-home .ctile-grid,.gcn-home .why-grid,.gcn-home .review-grid{grid-template-columns:repeat(2,1fr)}.gcn-home .stats-grid{grid-template-columns:repeat(2,1fr)}.gcn-home .foot-grid{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.gcn-home .container{padding:0 18px}.gcn-home .nav-cta>.btn-green{display:none}.gcn-home .tile-grid,.gcn-home .tools-grid,.gcn-home .ctile-grid,.gcn-home .why-grid,.gcn-home .review-grid,.gcn-home .hire-grid,.gcn-home .process-grid,.gcn-home .ref-grid,.gcn-home .values,.gcn-home .foot-grid{grid-template-columns:1fr}.gcn-home .hero-stats{gap:18px}.gcn-home .actions .btn{width:100%}.gcn-home .foot-bar{flex-direction:column}}
@media (hover:none),(pointer:coarse){.gcn-home .hero-card{transform:none!important}}
@media (prefers-reduced-motion:reduce){.gcn-home .hero::after{animation:none}.gcn-home .hero-card,.gcn-home .why-card,.gcn-home .tile,.gcn-home .ctile,.gcn-home .hire,.gcn-home .val,.gcn-home .step,.gcn-home .review,.gcn-home .ref{transition:none}.gcn-home .gcn-enter{animation:none!important}.gcn-home .animated-logo video{display:none}.gcn-home .animated-logo img{display:block;object-fit:contain}}
`;

/* ----------------------------- ICON HELPERS ----------------------------- */
const Svg = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const AnimatedLogo = () => (
  <span className="animated-logo" aria-label="The Global Contractor Network">
    <video autoPlay muted loop playsInline preload="metadata" poster="/gcn-logo.png" aria-hidden="true">
      <source src={animatedLogoAsset.url} type="video/mp4" />
    </video>
    <img src="/gcn-logo.png" alt="The Global Contractor Network" />
  </span>
);

/* --------------------------- ANIMATED COUNT-UP --------------------------- */
function CountNum({ target, display }: { target: number; display: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState("0");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !done) {
            setDone(true);
            const dur = 1400;
            const start = performance.now();
            const fmt = (n: number) =>
              n >= 1000 ? Math.round(n / 1000) + "K+" : n.toLocaleString() + "+";
            const frame = (t: number) => {
              const p = Math.min((t - start) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(fmt(Math.floor(eased * target)));
              if (p < 1) requestAnimationFrame(frame);
              else setVal(display);
            };
            requestAnimationFrame(frame);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, display, done]);
  return <div ref={ref} className="num">{val}</div>;
}

/* ---------------------------- REVEAL ON SCROLL ---------------------------- */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("gcn-enter");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll<HTMLElement>(".gcn-home section").forEach((section) => {
      section.querySelectorAll<HTMLElement>(".reveal").forEach((el, index) => {
        el.style.setProperty("--reveal-delay", `${index * 70}ms`);
        io.observe(el);
      });
    });
    return () => io.disconnect();
  }, []);
}

/* -------------------------------- PAGE -------------------------------- */
export default function Home() {
  useReveal();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("gcn.theme", nextTheme);
    setTheme(nextTheme);
  };

  const handleTilt = (event: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)").matches) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const rotateX = -((event.clientY - rect.top) / rect.height - 0.5) * 10;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const resetTilt = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  return (
    <>
      <Helmet>
        <title>Global Contractor Network | Trusted Contractors</title>
        <meta
          name="description"
          content="Get a free AI-powered home project quote in 60 seconds and connect with vetted, insured contractors. Referral-based network — no bidding wars, no spam calls."
        />
        <link rel="canonical" href="https://globalcontractor.network/" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://globalcontractor.network/" />
        <meta property="og:site_name" content="Global Contractor Network" />
        <meta property="og:title" content="Global Contractor Network | Trusted Contractors" />
        <meta
          property="og:description"
          content="Free AI quotes, vetted contractors, and a referral network built on accountability — not bidding wars."
        />
        <meta property="og:image" content="https://globalcontractor.network/gcn-logo.png" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Global Contractor Network | Trusted Contractors" />
        <meta
          name="twitter:description"
          content="Free AI quotes, vetted contractors, and a referral network built on accountability — not bidding wars."
        />
        <meta name="twitter:image" content="https://globalcontractor.network/gcn-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{SCOPED_CSS}</style>

      <div className="gcn-home">
        {/* NAV */}
        <header className="site">
          <div className="container nav">
            <a href="#top" className="brand" aria-label="Global Contractor Network">
              <AnimatedLogo />
            </a>
            <nav className="navlinks" aria-label="Primary">
              <a href="https://gcn.support" target="_blank" rel="noopener noreferrer">GCN Support</a>
              <a href="#services">For Homeowners</a>
              <a href="#contractors">For Contractors</a>
              <a href="#about">About</a>
              <a href="#process">How It Works</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div className="nav-cta">
              <Button type="button" variant="ghost" size="icon" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
                {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
              </Button>
              <Link className="btn btn-ghost gcn-btn-ghost" to="/login">Login</Link>
              <Link className="btn btn-green gcn-btn" to="/join">Join the Network</Link>
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button className="mobile-trigger" aria-label="Open menu">
                    <Menu />
                  </button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col gap-4 mt-8 text-base font-semibold">
                    <a onClick={() => setOpen(false)} href="https://gcn.support" target="_blank" rel="noopener noreferrer">GCN Support</a>
                    <a onClick={() => setOpen(false)} href="#services">For Homeowners</a>
                    <a onClick={() => setOpen(false)} href="#contractors">For Contractors</a>
                    <a onClick={() => setOpen(false)} href="#about">About</a>
                    <a onClick={() => setOpen(false)} href="#process">How It Works</a>
                    <a onClick={() => setOpen(false)} href="#faq">FAQ</a>
                    <Link onClick={() => setOpen(false)} to="/login" className="btn btn-ghost gcn-btn-ghost mt-2">Login</Link>
                    <Link onClick={() => setOpen(false)} to="/join" className="btn btn-green gcn-btn">Join the Network</Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main>
        {/* HERO */}
        <section className="hero gcn-grid-bg is-live" id="top" style={{ borderTop: "none" }}>
          <div className="container">
            <div>
              <span className="rating-pill"><span className="stars">★★★★★</span> Rated 4.9/5 by 500+ verified homeowners</span>
              <h1>Trusted Contractors. <span className="gcn-grad-text">Real Accountability.</span></h1>
              <div className="quoteline">A referral-based network for homeowners and contractors — never a lead-bidding marketplace.</div>
              <p className="lead">Get a free AI-powered quote in minutes, then connect with vetted, insured pros in your area. No spam calls, no bidding wars — just trusted work, backed by our network guarantee.</p>
              <div className="actions">
                <Link to="/schedule-consultation" className="btn btn-green gcn-btn btn-lg">Schedule Consultation <span className="arr">→</span></Link>
                <Link to="/join" className="btn btn-ghost gcn-btn-ghost">Join the Network</Link>
                <Link to="/contractors" className="btn btn-link">I'm a contractor →</Link>
              </div>
              <div className="actions-meta">
                <span>✓ Free to start</span><span className="dot" />
                <span>✓ No credit card</span><span className="dot" />
                <span>✓ Quote in under 60 seconds</span>
              </div>
              <div className="badge-strip">
                <Svg><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></Svg>
                <strong>Referred. Verified. Accountable.</strong>
              </div>
              <div className="hero-stats">
                <div className="hstat"><CountNum target={1000} display="1,000+" /><div className="lbl">Active Contractors</div></div>
                <div className="hstat"><CountNum target={50000} display="50K+" /><div className="lbl">Projects Completed</div></div>
                <div className="hstat"><div className="num">$10M+</div><div className="lbl">Claims Supplemented</div></div>
              </div>
            </div>

            <div className="hero-card-wrap">
            <aside className="hero-card gcn-panel" aria-label="What you get" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
              <div className="head">
                <span className="pulse" />
                <h3>Free for property owners</h3>
              </div>
              <p style={{ margin: "0 0 6px", color: "var(--gcn-ink-3)", fontSize: ".92rem" }}>Manage your projects with the same tools the pros use:</p>

              {[
                { title: "AI estimating tools", sub: "Instant, realistic numbers for any project — no sales call needed.", d: "M12 2v6m0 12v2M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" },
                { title: "Job marketplace", sub: "Post your project — vetted pros respond, one at a time.", svg: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 4v4" /></> },
                { title: "Permit expediting", sub: "We assemble and pull the permit packet for you.", svg: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4" /></> },
                { title: "Virtual contractor", sub: "A real human guide for materials, scope, scheduling.", svg: <><path d="M16 11a4 4 0 10-8 0M2 21v-2a4 4 0 014-4h12a4 4 0 014 4v2" /></> },
                { title: "Vetted contractor directory", sub: "Referred and reviewed by other pros — not bought.", svg: <><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></> },
              ].map((p, i) => (
                <div className="perk" key={i}>
                  <div className="pico"><Svg d={p.d}>{p.svg}</Svg></div>
                  <div className="txt"><strong>{p.title}</strong><span>{p.sub}</span></div>
                </div>
              ))}

              <div className="cta-block">
                <Link className="btn btn-green gcn-btn" style={{ justifyContent: "center" }} to="/join">Create Your Free Account <span className="arr">→</span></Link>
                <span className="free-line">Free • No spam • Cancel anytime</span>
              </div>
            </aside>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="why">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Why We're Different</span>
              <h2><span className="gold-text">Referred. Verified. Accountable.</span></h2>
              <p>Built for contractors, trusted by homeowners.</p>
            </div>
            <div className="why-grid">
              <div className="why-card reveal">
                <div className="ico"><Svg><path d="M16 11a4 4 0 10-8 0" /><circle cx="12" cy="7" r="4" /><path d="M2 21v-2a4 4 0 014-4h12a4 4 0 014 4v2" /></Svg></div>
                <h3>Network, Not Marketplace</h3>
                <p>We build relationships between trusted professionals and property owners. This isn't about transactions — it's about long-term partnerships.</p>
              </div>
              <div className="why-card reveal">
                <div className="ico"><Svg d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></div>
                <h3>Contractors Don't Buy Leads</h3>
                <p>No lead fees, no bidding wars. Contractors get quality referrals from their network, not purchased contacts who've been sold to five companies.</p>
              </div>
              <div className="why-card reveal">
                <div className="ico"><Svg d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" /></div>
                <h3>Homeowners Aren't Spammed</h3>
                <p>One verified match, not ten cold calls. We connect you with the right contractor — referred by professionals who stake their reputation on it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              <div className="reveal"><div className="stat-num">15+</div><div className="stat-lbl">Years in the trades</div></div>
              <div className="reveal"><div className="stat-num">$50M+</div><div className="stat-lbl">Roofing volume produced</div></div>
              <div className="reveal"><div className="stat-num">100%</div><div className="stat-lbl">Stand-behind-our-work guarantee</div></div>
              <div className="reveal"><div className="stat-num">24 hr</div><div className="stat-lbl">Storm response window</div></div>
            </div>
          </div>
        </section>

        {/* GCN BUILDING CONSULTANT HELP DESK */}
        <section id="consultant-support">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Already a Client?</span>
              <h2>Working with a <span className="gold-text">GCN Building Consultant?</span></h2>
              <p>If you're already engaged with a GCN Building Consultant directly, skip the public intake and head straight to our help desk for project updates, document uploads, scheduling, and one-on-one support.</p>
              <div className="actions" style={{ justifyContent: "center", marginTop: 24 }}>
                <a href="https://gcn.support" target="_blank" rel="noopener noreferrer" className="btn btn-green gcn-btn btn-lg">
                  GCN Support <span className="arr">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">For Homeowners</span>
              <h2>Everything Your <span className="green-text">Home Needs</span></h2>
              <p>Direct access to the crews who actually do the work — without paying for a big company's overhead. From emergency repairs to preventive maintenance, get instant quotes and connect with verified contractors for any project.</p>
            </div>

            <div className="tile-grid">
              {[
                { to: "/directory", color: "ico-blue", title: "Contractor Directory", desc: "Find verified, licensed contractors in your area. Read reviews, compare quotes, and hire with confidence.", cta: "Browse Directory", svg: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></> },
                { to: "/services/roofing", color: "ico-orange", title: "Roofing Services", desc: "Full roof replacements, repairs, and inspections. AI-powered instant estimates in seconds.", cta: "Get Quote", d: "M3 11l9-8 9 8M5 9.5V21h14V9.5" },
                { to: "/services", color: "ico-gold", title: "Exterior Restoration", desc: "Siding, soffit, fascia, gutters, and exterior paint. Storm damage repair and full home exteriors.", cta: "Get Quote", svg: <><path d="M3 21h18M5 21V8l7-5 7 5v13" /><path d="M9 14h6M9 17h6" /></> },
                { to: "/services", color: "ico-green", title: "Windows", desc: "Impact-rated windows and doors. Energy-efficient installations with professional service.", cta: "Get Quote", svg: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12h18M12 3v18" /></> },
                { to: "/services", color: "ico-purple", title: "Interior Restoration", desc: "Drywall, flooring, paint, kitchens, bathrooms. Water damage and mold remediation, top to bottom.", cta: "Get Quote", svg: <><path d="M3 12l9-9 9 9v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></> },
                { to: "/services", color: "ico-red", title: "Handyman Services", desc: "Small repairs, quick fixes, and to-do list jobs. Affordable rates from vetted local pros.", cta: "Get Quote", d: "M14.7 6.3a4 4 0 00-5.4 5.4l-7 7a2.1 2.1 0 003 3l7-7a4 4 0 005.4-5.4l-2.7 2.7-2.4-2.4z" },
                { to: "/prep-your-property", color: "ico-teal", title: "Pre-Storm Inspections", desc: "Hurricane prep inspections, roof & exterior reports, and interior inventory for insurance records.", cta: "Get Quote", d: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                { to: "/services", color: "ico-leaf", title: "Trees & Landscaping", desc: "Professional tree removal, trimming, and landscaping services. Beautify and protect your property.", cta: "Get Quote", svg: <><path d="M12 22V12M5 19c0-7 4-12 7-12s7 5 7 12" /><path d="M5 19h14" /></> },
              ].map((t, i) => (
                <Link key={i} to={t.to} className="tile reveal gcn-panel">
                  <div className={`tile-ico ${t.color}`}><Svg d={t.d}>{t.svg}</Svg></div>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                  <span className="tile-cta">{t.cta} <span className="arr">→</span></span>
                </Link>
              ))}
            </div>

            {/* Tools */}
            <div className="tools-section reveal">
              <div className="tools-head">
                <span className="eyebrow">Built-in Tools</span>
                <h3>Free with every homeowner account</h3>
                <p>Real tools the pros use — included the moment you sign up. No subscriptions, no upsells.</p>
              </div>
              <div className="tools-grid">
                {[
                  { color: "ico-indigo", title: "AI Estimating Tools", desc: "Know what any project should cost before you call anyone — instant estimates from real cost data.", d: "M12 2v6m0 12v2M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24" },
                  { color: "ico-pink", title: "Permit Expediting", desc: "We assemble and pull the permit packet for your project — no trips to the building department.", d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4" },
                  { color: "ico-red", title: "Insurance Claim Services", desc: "We meet your adjuster, document the damage, and manage the claim from first call to final payment.", svg: <><path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" /><path d="M9 12l2 2 4-4" /></> },
                  { color: "ico-gold", title: "Virtual Contractor", desc: "A real human consultant on your job — materials list, scope, scheduling, crew dispatch.", svg: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0112 0v1" /><path d="M18 8a3 3 0 110-6" /></> },
                  { color: "ico-green", title: "Job Marketplace", desc: "Post your project with a budget — vetted contractors come to you with offers. No bidding wars.", svg: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h6M7 16h8" /></> },
                  { color: "ico-purple", title: "Homeowner Dashboard", desc: "Organize projects, photos, receipts, warranties, and inspection reports — perfect for storm prep.", svg: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></> },
                ].map((t, i) => (
                  <Link key={i} to="/join" className="tile reveal gcn-panel">
                    <div className={`tile-ico ${t.color}`}><Svg d={t.d}>{t.svg}</Svg></div>
                    <h3>{t.title}</h3>
                    <p>{t.desc}</p>
                    <span className="free-pill">Included Free</span>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <Link to="/join" className="btn btn-green gcn-btn">Create Your Free Account <span className="arr">→</span></Link>
              </div>
            </div>
          </div>
        </section>

        {/* HIRE OPTIONS */}
        <section id="hire-options">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Choose How You Hire</span>
              <h2>The right level of help, <span className="gold-text">at the right price</span></h2>
              <p>Not every project needs a big company. With GCN you pick the lane that fits your project, your budget, and how involved you want to be.</p>
            </div>
            <div className="hire-grid">
              {[
                { tier: "$", title: "Hire a Handyman", best: "Best for: small repairs, quick fixes, low-budget work where licensing isn't required.", items: ["Verified handyman directory", "Per-job pricing, no contract", "Same-week availability"] },
                { tier: "$$", title: "Hire a Crew Direct", best: "Best for: homeowners willing to GC their own job and skip company overhead.", items: ["Direct connection to vetted crews", "You handle materials & permits (we can help)", "Save 20–40% vs. traditional GC pricing"] },
                { tier: "$$$", title: "Hire a Virtual Contractor", best: "Best for: most homeowners — a project manager without paying full company markup.", items: ["Real human consultant on your job", "Materials list, permit packet, crew dispatch", "End-to-end project oversight"], recommended: true },
                { tier: "$$$$", title: "Hire a Full Company", best: "Best for: complex, premium, or time-sensitive jobs where you don't want to think about it.", items: ["Top-rated full-service contractors", "Premium warranties & insurance backing", "Single point of contact, full overhead"] },
              ].map((h, i) => (
                <div key={i} className={`hire reveal gcn-panel ${h.recommended ? "hire-recommended" : ""}`}>
                  {h.recommended && <span className="hire-badge">Most Popular</span>}
                  <div className="hire-tier">{h.tier}</div>
                  <h3>{h.title}</h3>
                  <p className="hire-best">{h.best}</p>
                  <ul>{h.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ABOUT */}
        <section id="about" className="about">
          <div className="container">
            <div className="about-grid">
              <div className="reveal">
                <span className="eyebrow">Who We Are</span>
                <h2>A network built <span className="gold-text">by contractors</span> — for the homeowners they serve.</h2>
                <p>Global Contractor Network was founded by a builder with 15+ years in the field, producing tens of millions in roofing volume for South Florida homeowners. We've seen the industry from every angle: the crews doing the actual work, the salespeople running appointments, the office managing claims, and the homeowners stuck in the middle.</p>
                <p>What we kept seeing was the same problem: homeowners overpaying because of bloated overhead, and crews getting underpaid because too many hands were in the deal. So we built something different — a network where homeowners deal with one trusted contractor, the right crew gets the work, and good craftsmanship gets rewarded.</p>
                <p>Today, GCN is your one-stop shop for roofing, insurance restoration, and general contracting in South Florida. We qualify the work, assemble the right crew, and stand behind every job — with 15+ years of field experience behind us. The bigger vision — a national network of vetted contractors with real tools and aligned incentives — is what we're building toward. But it starts with the work in front of us, done well.</p>
              </div>
              <div className="reveal">
                <span className="eyebrow">Mission &amp; Values</span>
                <h2 style={{ fontSize: "1.7rem" }}>What we stand for</h2>
                <p>The standard we hold ourselves to on every project — even the hard ones.</p>
                <div className="values">
                  {[
                    ["Stand behind the work", "If something's wrong, we make it right. Even if it costs us a couple extra days or a couple extra dollars."],
                    ["Answer the phone", "Especially when the conversation is hard. Communication is half of contracting."],
                    ["Right crew for the job", "We don't force a one-size-fits-all team onto your project. We assemble what the work actually needs."],
                    ["Fair pricing, real value", "No bloated overhead baked into the bill. You pay for the work — not a marketing budget."],
                    ["Quality over speed", "We finish on time when we can, but we don't cut corners to do it. Inspections and warranties matter."],
                    ["Three sides to a story", "We listen. Most issues come from missed expectations — we set them clearly upfront, in writing."],
                  ].map(([h, p], i) => (
                    <div className="val gcn-panel" key={i}><h4>{h}</h4><p>{p}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section id="process" className="process">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">How It Works</span>
              <h2>Simple, transparent, <span className="green-text">no surprises</span></h2>
              <p>From the first call to the final inspection, here's exactly how a project moves through our process.</p>
            </div>
            <div className="process-grid">
              {[
                ["Tell us about it", "Send a few details about the project. We respond within one business day with next steps — no marketing call, no shared lead."],
                ["Free site visit", "We come out, inspect the work, and put together a real estimate. If it's an insurance claim, we meet the adjuster with you."],
                ["Crew & permits", "We pull permits, order materials, and assign the right crew. You get one project manager — your point of contact start to finish."],
                ["Build & warranty", "We build the job, pass inspections, and stand behind it. Final walkthrough and warranty paperwork — in writing."],
              ].map(([h, p], i) => (
                <div className="step reveal gcn-panel" key={i}><h3>{h}</h3><p>{p}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* STORM */}
        <section className="storm">
          <div className="container">
            <div className="reveal">
              <span className="eyebrow" style={{ background: "var(--gcn-fill-grass)", color: "var(--gcn-ink-grass)" }}>Storm Damage?</span>
              <h2 style={{ marginTop: 14 }}>We make insurance claims <span className="gold-text">simple.</span></h2>
              <p>If you have legitimate damage after a storm, you deserve a contractor who handles the moving parts so you can focus on your family. Call your insurance, meet the adjuster, and submit your claim info to our team — we take it from there.</p>
              <div className="actions" style={{ marginTop: 18 }}>
                <Link to="/join" className="btn btn-gold gcn-btn">Start a Claim Review <span className="arr">→</span></Link>
                <a href="tel:+10000000000" className="btn btn-ghost gcn-btn-ghost" style={{ background: "var(--gcn-panel-2)", color: "var(--gcn-ink)", borderColor: "var(--gcn-line)" }}>Call Storm Response</a>
              </div>
            </div>
            <div className="storm-card reveal gcn-panel">
              <h3 style={{ color: "var(--gcn-ink)", marginBottom: 14 }}>What we handle for you</h3>
              <ol>
                <li><strong>Free post-storm inspection</strong> — documented with photos and notes</li>
                <li><strong>Adjuster meet</strong> — we attend with you and advocate for what's covered</li>
                <li><strong>Materials &amp; permits</strong> — pulled and scheduled in the right order</li>
                <li><strong>Crew dispatch</strong> — vetted, insured, and held to our standard</li>
                <li><strong>Inspection &amp; close</strong> — no payment to crew until the job passes</li>
              </ol>
            </div>
          </div>
        </section>

        {/* CONTRACTORS */}
        <section id="contractors" className="contractors">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow" style={{ background: "var(--gcn-fill-grass)", color: "var(--gcn-ink-grass)" }}>For Contractors</span>
              <h2 style={{ color: "var(--gcn-ink)" }}>Powerful Tools to <span className="gold-text shimmer">Grow Your Business</span></h2>
              <p style={{ color: "var(--gcn-ink-2)" }}>From lead generation to project completion, we provide everything you need to scale your contracting business — without buying shared leads or competing in bidding wars.</p>
            </div>
            <div className="ctile-grid">
              {[
                { color: "ico-blue", title: "Directory Listing", desc: "Get listed in our verified contractor directory. Attract qualified leads and showcase your work.", svg: <path d="M3 21h18M5 21V8l7-5 7 5v13M9 12h6M9 16h6" /> },
                { color: "ico-indigo", title: "CRM Portal", desc: "Manage leads, customers, and projects in one place. Track everything from first contact to completion.", svg: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></> },
                { color: "ico-pink", title: "Permit Expediting", desc: "Fast-track permits with our Permit Queens team. Qualifying services and building department navigation.", svg: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4" /></> },
                { color: "ico-green", title: "Supplements & Estimating", desc: "Maximize insurance claims with Xactimate-ready supplements. Professional estimating services.", svg: <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></> },
                { color: "ico-orange", title: "Digital Marketing", desc: "Website design, SEO, social media management. Grow your brand and generate more leads.", svg: <><path d="M3 11l18-7v16L3 13z" /><path d="M3 11v8M11 8v9" /></> },
                { color: "ico-purple", title: "Training Academy", desc: "Certifications and courses for your team. Stay ahead with industry-leading training programs.", svg: <><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5" /></> },
                { color: "ico-teal", title: "Contractor Social Hub", desc: "Network with other contractors. Share knowledge, find partners, and grow together.", badge: ["soon", "Coming Soon"], svg: <><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" /></> },
                { color: "ico-gold", title: "Referral Program", desc: "Earn by referring customers. Get paid for every lead that converts through the network.", badge: ["earn", "Earn $$$"], svg: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /> },
                { color: "ico-purple", title: "Door to Door World", desc: "GPS-tracked canvassing with gamified challenges. Earn points for every door you knock.", badge: ["new", "New"], svg: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></> },
              ].map((c, i) => (
                <Link key={i} to="/contractors" className="ctile reveal gcn-panel">
                  {c.badge && <span className={`ctile-badge ctile-badge-${c.badge[0]}`}>{c.badge[1]}</span>}
                  <div className={`ctile-ico ${c.color}`}><Svg>{c.svg}</Svg></div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <span className="ctile-cta">Learn More <span className="arr">→</span></span>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 42 }} className="reveal">
              <Link to="/contractors" className="btn btn-gold gcn-btn">Apply to Join the Network <span className="arr">→</span></Link>
              <p style={{ marginTop: 12, color: "var(--gcn-ink-3)", fontSize: ".88rem" }}>Plus the GCN App: Estimating + Invoicing • Prospecting • D2D Live Stream • Job Marketplace • Contract Signing • Virtual Rep Card</p>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="reviews">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Reviews</span>
              <h2>What homeowners say <span className="gold-text">after the dust settles</span></h2>
              <p>The kind of feedback we work to earn on every project. Real reviews from real customers will replace these as we collect them on the platform.</p>
            </div>
            <div className="review-grid">
              {[
                ["MR", "Maria R.", "Boca Raton, FL — Tile Re-Roof", "They walked me through the insurance claim like I was family. Met my adjuster, handled the paperwork, and the crew was on my roof within a week. The job passed inspection on the first try."],
                ["DK", "David K.", "Fort Lauderdale, FL — Metal Roof", "I called three other roofers and got three different stories. GCN actually showed up on time, gave me a real number in writing, and stood behind it. No upsell, no games."],
                ["SP", "Sandra P.", "Naples, FL — Storm Repair", "What sold me was the phone call mid-project when something came up. They told me straight, fixed it, and kept us on schedule. That's rare in this business."],
                ["JT", "James T.", "Delray Beach, FL — Tile Repair", "Used them for a tile repair the HOA was hounding me about. They had the matching profile in stock — three other companies told me my tile was discontinued. Saved me thousands."],
                ["LB", "Linda B.", "Jupiter, FL — Multi-Trade Exterior", "They didn't just do my roof — they coordinated the gutters, soffit, and paint guys too. One contract, one project manager, one bill. Way easier than chasing four different contractors."],
                ["RC", "Robert C.", "Coral Springs, FL — Inspection & Claim", "Pre-storm inspection paid for itself. When the storm hit, we already had the documentation ready and the claim went smoothly. Worth every dollar."],
              ].map(([initials, name, meta, body], i) => (
                <div className="review reveal gcn-panel" key={i}>
                  <div className="stars">★★★★★</div>
                  <p className="body">"{body}"</p>
                  <div className="author">
                    <div className="avatar">{initials}</div>
                    <div className="author-meta"><strong>{name}</strong><span>{meta}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sample-banner">
              <strong>Note:</strong> These review examples are illustrative and represent the kind of feedback we aim to earn. Verified reviews from real GCN customers will replace these as we collect them through the platform.
            </div>
          </div>
        </section>

        {/* REFERENCES */}
        <section id="references" className="references">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">References</span>
              <h2>People who'll <span className="gold-text">go to bat</span> for us</h2>
              <p>Past customers and trade partners who've agreed to be referral references. We connect prospective customers directly with them so you can ask the hard questions.</p>
            </div>
            <div className="ref-grid">
              {[
                ["EH", "Eduardo H.", "Tile Roof Specialist • Trade Partner • 12 years working alongside our team", "They run a tight ship. When I'm on one of their jobs, I know the materials are right, the permit is real, and I'll get paid the day the inspection passes."],
                ["PG", "Patricia G.", "Past Customer • Boca Raton, FL • Tile re-roof, 2023", "Happy to take a call from anyone considering them. The whole process was the smoothest contracting experience I've had in 20 years of owning this house."],
                ["MA", "Marcus A.", "Insurance Claim — Past Customer • Naples, FL • 2024", "They handled my adjuster meeting and got my claim settled fairly. I'd send my neighbors to them in a heartbeat."],
                ["JV", "Jennifer V.", "HOA Property Manager • South Florida • Multi-property partner", "Reliable, communicative, and they actually answer the phone when something comes up. That's all I need from a contractor."],
              ].map(([initials, name, role, q], i) => (
                <div className="ref reveal gcn-panel" key={i}>
                  <div className="avatar">{initials}</div>
                  <div>
                    <h4>{name}</h4>
                    <p className="role">{role}</p>
                    <p className="quote">"{q}"</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", color: "var(--gcn-ink-3)", fontSize: ".9rem", marginTop: 18 }}>
              <em>Reference profiles are illustrative — real verified references available on request, with direct contact through our platform.</em>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="faq">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Frequently Asked</span>
              <h2>Questions homeowners <span className="green-text">actually ask us</span></h2>
              <p>Don't see yours? Reach out through the network — we'll get you a real answer.</p>
            </div>
            <div style={{ maxWidth: 840, margin: "0 auto" }}>
              {[
                ["Are you licensed and insured?", "Yes. We carry the licenses and insurance required to operate as a contractor in Florida, and we'll send copies on request. Every crew on our jobs is held to the same standard."],
                ["What areas do you serve?", "South Florida — including Palm Beach, Broward, Miami-Dade, Collier, and surrounding counties. For storm response, we'll deploy further out as conditions require."],
                ["Do you handle insurance claims?", "Yes. We'll meet your adjuster, document the damage, manage materials and permits, and run the project from claim to completion. You get one point of contact through the whole process."],
                ["How fast can you start?", "Most projects start within 2–3 weeks of contract signing, depending on permit timing and material availability. Storm response and emergency mitigation move faster — often within 24–48 hours."],
                ["Why are you cheaper than the big roofing companies?", "We don't carry the overhead of a giant sales team or marketing fleet. We qualify the work, assign the right crew, and pay the people doing the work fairly. The savings show up in your estimate without cutting quality."],
                ["What about warranty?", "Every job comes with a written workmanship warranty plus the manufacturer warranty on materials. We stand behind our work — if something's wrong, we make it right."],
                ["Can you match my discontinued tile?", "Often, yes. We harvest discontinued tile profiles from tear-offs and stock them at our warehouse for repair work. Send a photo or sample and we'll check inventory."],
                ["Is the homeowner account really free?", "Yes. Creating a property owner account is free — including AI estimates, the job marketplace, the contractor directory, and virtual contractor support. You only pay if you hire a contractor through the network for your project."],
                ["How does the job marketplace work?", "Instead of calling 10 companies for bids, post your project to the marketplace with a budget. Verified contractors interact with the listing — they can accept your number or submit a counter-offer. You pick who you want to work with. No shared lead, no spam."],
                ["What's a \"virtual contractor\"?", "A real human consultant assigned to your project. They help you choose materials, build the scope, assemble the permit packet, and dispatch a vetted crew — all without the markup of a full-service contracting company. You stay in control of the budget while we handle the moving parts."],
                ["Can I store property docs and photos in my account?", "Yes. Your free homeowner profile lets you upload photos, receipts, warranties, inspection reports, and roof/structure documentation. It's especially useful for storm prep and insurance claims — everything in one place when you need it."],
              ].map(([q, a], i) => (
                <details key={i} className="gcn-panel reveal">
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* JOIN BAND */}
        <section className="joinband">
          <div className="container">
            <div className="reveal">
              <span className="eyebrow" style={{ background: "var(--gcn-fill-grass)", color: "var(--gcn-ink-grass)" }}>Ready When You Are</span>
              <h2 style={{ marginTop: 14 }}>Join the network. <span className="gold-text shimmer">Manage your projects for free.</span></h2>
              <p>Free access to AI estimating tools, the job marketplace, permit expediting, virtual contractor services, and a vetted contractor directory. Built on referrals, not lead-selling.</p>
              <div className="joinband-cta">
                <Link to="/join" className="btn btn-gold gcn-btn">Join the Network <span className="arr">→</span></Link>
                <Link to="/contractors" className="btn btn-ghost gcn-btn-ghost" style={{ background: "var(--gcn-panel-2)", color: "var(--gcn-ink)", borderColor: "var(--gcn-line)" }}>For Contractors <span className="arr">→</span></Link>
              </div>
            </div>
            <div className="joinband-quote reveal gcn-panel">
              "We're not another lead-gen site. We're a referral-driven network where good work is the only currency. Contractors get paid for great work — homeowners stop overpaying for overhead."
              <div className="who">— GCN Founder</div>
            </div>
          </div>
        </section>
        </main>

        {/* FOOTER */}
        <footer>
          <div className="container">
            <div className="foot-grid">
              <div>
                <AnimatedLogo />
                <p style={{ marginTop: 14, color: "var(--gcn-ink-2)", fontSize: ".94rem" }}>
                  Referred. Verified. Accountable. A network for the homeowners who want trusted contractors and the pros who do the work.
                </p>
              </div>
              <div>
                <h4>Services</h4>
                <ul>
                  <li><a href="#services">Roofing</a></li>
                  <li><a href="#services">Insurance Restoration</a></li>
                  <li><a href="#services">General Contracting</a></li>
                  <li><a href="#services">Pre-Storm Inspections</a></li>
                </ul>
              </div>
              <div>
                <h4>Network</h4>
                <ul>
                  <li><Link to="/join">Join the Network</Link></li>
                  <li><Link to="/contractors">For Contractors</Link></li>
                  <li><Link to="/directory">Directory</Link></li>
                  <li><Link to="/login">Member Login</Link></li>
                </ul>
              </div>
              <div>
                <h4>Company</h4>
                <ul>
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#process">How It Works</a></li>
                  <li><a href="#references">References</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="foot-bar">
              <span>© 2026 Global Contractor Network. Licensed &amp; insured. All rights reserved.</span>
              <span>Built for the homeowners and crews who do the work.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
