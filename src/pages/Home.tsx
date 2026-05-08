import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Self-contained landing page styled with scoped CSS (gcn- prefix)  */
/* ------------------------------------------------------------------ */

const SCOPED_CSS = `
.gcn-home{
  --green-900:#0e3a25; --green-800:#15522f; --green-700:#1f5436; --green-600:#2d6a4f;
  --green-500:#3d8a66; --green-100:#e8f1ec; --green-50:#f3f8f5;
  --gold-900:#7a5a14; --gold-700:#b8860b; --gold-600:#d4af37; --gold-500:#e6c557;
  --gold-400:#f0d77a; --gold-300:#fbe9a8;
  --ink:#0d1b14; --ink-2:#243228; --muted:#5a6a60; --line:#e3ddc9;
  --paper:#fbf8f0; --paper-2:#f5efdf;
  --shadow-sm:0 2px 6px rgba(15,58,37,.06);
  --shadow:0 14px 40px rgba(15,58,37,.10);
  --shadow-lg:0 28px 60px rgba(15,58,37,.16);
  --shadow-gold:0 14px 40px rgba(184,134,11,.25);
  --radius:14px; --maxw:1240px;
  font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink);
  background:
    radial-gradient(1100px 600px at 90% -10%, rgba(212,175,55,.10), transparent 60%),
    radial-gradient(900px 600px at -10% 30%, rgba(45,106,79,.08), transparent 60%),
    var(--paper);
  line-height:1.6;-webkit-font-smoothing:antialiased;
  scroll-behavior:smooth;
}
.gcn-home *{box-sizing:border-box}
.gcn-home a{color:inherit;text-decoration:none}
.gcn-home img{max-width:100%;display:block}
.gcn-home .container{max-width:var(--maxw);margin:0 auto;padding:0 24px}
.gcn-home .eyebrow{display:inline-block;text-transform:uppercase;letter-spacing:.16em;font-size:.75rem;font-weight:700;color:var(--green-700);background:var(--green-100);padding:6px 12px;border-radius:999px}
.gcn-home h1,.gcn-home h2,.gcn-home h3,.gcn-home h4{font-family:"Playfair Display",Georgia,serif;letter-spacing:-.01em;line-height:1.15;margin:0 0 .4em;color:var(--ink)}
.gcn-home h1{font-size:clamp(2.4rem,5vw,4rem);font-weight:800}
.gcn-home h2{font-size:clamp(1.8rem,3vw,2.6rem);font-weight:700}
.gcn-home h3{font-size:1.25rem;font-weight:700;font-family:"Inter",sans-serif;letter-spacing:0}
.gcn-home .gold-text{background:linear-gradient(180deg,var(--gold-400) 0%,var(--gold-700) 50%,var(--gold-900) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 1px 0 rgba(255,255,255,.25)}
.gcn-home .green-text{color:var(--green-700)}
.gcn-home p{margin:0 0 1em;color:var(--ink-2)}
.gcn-home .lead{font-size:1.18rem;color:var(--ink-2)}

/* Buttons */
.gcn-home .btn{display:inline-flex;align-items:center;gap:8px;padding:14px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:.98rem;border:1.5px solid transparent;font-family:inherit;transition:transform .12s,box-shadow .18s,filter .18s;position:relative}
.gcn-home .btn-green{color:#fff;background:linear-gradient(180deg,var(--green-600) 0%,var(--green-800) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -2px 0 rgba(0,0,0,.18),0 8px 18px rgba(15,58,37,.28)}
.gcn-home .btn-green:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 -2px 0 rgba(0,0,0,.18),0 14px 28px rgba(15,58,37,.36)}
.gcn-home .btn-gold{color:var(--green-900);background:linear-gradient(180deg,var(--gold-400) 0%,var(--gold-600) 50%,var(--gold-700) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.18),0 8px 18px rgba(184,134,11,.35);border-color:rgba(122,90,20,.4)}
.gcn-home .btn-gold:hover{transform:translateY(-2px);filter:saturate(1.05) brightness(1.04);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.18),0 16px 32px rgba(184,134,11,.45)}
.gcn-home .btn-ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);box-shadow:var(--shadow-sm)}
.gcn-home .btn-ghost:hover{border-color:var(--green-700);color:var(--green-800)}
.gcn-home .btn .arr{display:inline-block;transition:transform .15s}
.gcn-home .btn:hover .arr{transform:translateX(3px)}

/* Nav */
.gcn-home header.site{position:sticky;top:0;z-index:50;background:rgba(251,248,240,.86);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid rgba(31,84,54,.10)}
.gcn-home .nav{display:flex;align-items:center;justify-content:space-between;padding:14px 0;gap:18px}
.gcn-home .brand{display:flex;align-items:center;gap:12px}
.gcn-home .navlinks{display:flex;gap:26px;align-items:center}
.gcn-home .navlinks a{font-weight:600;color:var(--ink-2);font-size:.95rem}
.gcn-home .navlinks a:hover{color:var(--green-700)}
.gcn-home .nav-cta{display:flex;gap:10px;align-items:center}
.gcn-home .mobile-trigger{display:none;background:none;border:none;color:var(--ink);padding:8px;cursor:pointer}
@media (max-width:980px){.gcn-home .navlinks{display:none}.gcn-home .mobile-trigger{display:inline-flex}}
@media (max-width:560px){.gcn-home .nav-cta .btn:not(.btn-green){display:none}}
.gcn-home .logo-img{height:192px;width:auto;max-width:720px;object-fit:contain;background:transparent;filter:drop-shadow(0 8px 14px rgba(122,90,20,.4));transition:transform .4s}
.gcn-home .brand:hover .logo-img{transform:scale(1.03)}
.gcn-home footer .logo-img{height:168px}
@media (max-width:560px){.gcn-home .logo-img{height:120px}.gcn-home footer .logo-img{height:100px}}

/* Hero */
.gcn-home .hero{position:relative;overflow:hidden;padding:96px 0 110px;background:radial-gradient(900px 500px at 85% 20%,rgba(212,175,55,.18),transparent 55%),radial-gradient(800px 500px at 0% 80%,rgba(45,106,79,.12),transparent 55%),linear-gradient(180deg,var(--paper) 0%,var(--paper-2) 100%)}
.gcn-home .hero::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(transparent 95%,rgba(31,84,54,.04) 95%),linear-gradient(90deg,transparent 95%,rgba(31,84,54,.04) 95%);background-size:48px 48px;mask-image:radial-gradient(circle at 50% 30%,black 30%,transparent 80%)}
.gcn-home .hero .container{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.gcn-home .rating-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:linear-gradient(180deg,#fff 0%,var(--gold-300) 100%);border:1px solid var(--gold-500);box-shadow:0 4px 12px rgba(184,134,11,.18);font-size:.86rem;font-weight:600;color:var(--green-900)}
.gcn-home .rating-pill .stars{color:var(--gold-700);letter-spacing:1px}
.gcn-home .hero h1{margin-top:18px}
.gcn-home .quoteline{font-style:italic;color:var(--green-800);border-left:3px solid var(--gold-600);padding:8px 0 8px 14px;margin:8px 0 16px;font-size:1.05rem}
.gcn-home .actions{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap;align-items:center}
.gcn-home .actions .btn-lg{padding:18px 30px;font-size:1.05rem;border-radius:14px}
.gcn-home .actions .btn-link{background:transparent;border:none;box-shadow:none;color:var(--green-800);font-weight:600;padding:10px 6px;text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(31,84,54,.35)}
.gcn-home .actions .btn-link:hover{color:var(--green-900);text-decoration-color:var(--green-700);transform:none}
.gcn-home .actions-meta{margin-top:12px;font-size:.86rem;color:var(--muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gcn-home .actions-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--muted);display:inline-block}
.gcn-home .badge-strip{display:inline-flex;align-items:center;gap:10px;margin-top:24px;padding:10px 16px;border-radius:12px;background:linear-gradient(135deg,#fff 0%,var(--green-50) 100%);border:1px solid var(--line);box-shadow:var(--shadow-sm)}
.gcn-home .badge-strip svg{width:18px;height:18px;color:var(--green-700);flex:none}
.gcn-home .badge-strip strong{color:var(--green-900);font-size:.92rem;letter-spacing:.02em}
.gcn-home .hero-stats{display:flex;gap:32px;margin-top:30px;flex-wrap:wrap}
.gcn-home .hstat .num{font-family:"Playfair Display",serif;font-size:1.7rem;font-weight:800;color:var(--green-800)}
.gcn-home .hstat .lbl{color:var(--muted);font-size:.82rem;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
.gcn-home .hero-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:26px;box-shadow:var(--shadow-lg);transform:perspective(1200px) rotateX(2deg) rotateY(-4deg);animation:gcnFloatY 5s ease-in-out infinite;position:relative}
.gcn-home .hero-card::before{content:"";position:absolute;inset:-2px;border-radius:20px;z-index:-1;background:linear-gradient(135deg,var(--gold-500),var(--green-600));filter:blur(12px);opacity:.35}
@keyframes gcnFloatY{0%,100%{transform:perspective(1200px) rotateX(2deg) rotateY(-4deg) translateY(0)}50%{transform:perspective(1200px) rotateX(2deg) rotateY(-4deg) translateY(-8px)}}
.gcn-home .hero-card .head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.gcn-home .hero-card .head .pulse{width:10px;height:10px;border-radius:50%;background:var(--green-600);box-shadow:0 0 0 0 rgba(45,106,79,.6);animation:gcnPulse 1.8s infinite}
@keyframes gcnPulse{0%{box-shadow:0 0 0 0 rgba(45,106,79,.6)}70%{box-shadow:0 0 0 12px rgba(45,106,79,0)}100%{box-shadow:0 0 0 0 rgba(45,106,79,0)}}
.gcn-home .hero-card h3{margin:0;font-family:"Playfair Display",serif;font-size:1.2rem;color:var(--green-900)}
.gcn-home .hero-card .perk{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px dashed var(--line)}
.gcn-home .hero-card .perk:last-child{border-bottom:0}
.gcn-home .perk .pico{width:34px;height:34px;border-radius:9px;flex:none;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold-400),var(--gold-700));color:var(--green-900);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 4px 10px rgba(184,134,11,.25)}
.gcn-home .perk .pico svg{width:17px;height:17px}
.gcn-home .perk .txt strong{display:block;color:var(--green-900);font-size:.96rem}
.gcn-home .perk .txt span{font-size:.84rem;color:var(--muted)}
.gcn-home .hero-card .cta-block{margin-top:16px;display:grid;gap:8px}
.gcn-home .hero-card .free-line{font-size:.84rem;color:var(--green-700);font-weight:700;letter-spacing:.04em;text-align:center;text-transform:uppercase}
@media (max-width:980px){.gcn-home .hero{padding:64px 0 84px}.gcn-home .hero .container{grid-template-columns:1fr;gap:40px}.gcn-home .hero-card{transform:none;animation:none}}

/* Section scaffold */
.gcn-home section{padding:96px 0;border-top:1px solid var(--line)}
.gcn-home .section-head{max-width:780px;margin:0 auto 52px;text-align:center}
.gcn-home .section-head .eyebrow{margin-bottom:14px}
.gcn-home .section-head p{color:var(--muted);font-size:1.05rem}
.gcn-home .reveal{opacity:0;transform:translateY(24px);transition:opacity .8s,transform .8s}
.gcn-home .reveal.in{opacity:1;transform:none}

/* Why */
.gcn-home .why{background:#fff;border-top:none}
.gcn-home .why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.gcn-home .why-card{background:linear-gradient(180deg,#fff 0%,var(--green-50) 100%);border:1px solid var(--line);border-radius:var(--radius);padding:28px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s}
.gcn-home .why-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.gcn-home .why-card .ico{width:52px;height:52px;border-radius:12px;display:grid;place-items:center;margin-bottom:14px;background:linear-gradient(135deg,var(--gold-400),var(--gold-700));color:var(--green-900);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 18px rgba(184,134,11,.25)}
.gcn-home .why-card .ico svg{width:24px;height:24px}
.gcn-home .why-card h3{margin-bottom:6px;color:var(--green-900)}
@media (max-width:880px){.gcn-home .why-grid{grid-template-columns:1fr}}

/* Stats */
.gcn-home .stats{background:linear-gradient(135deg,var(--green-800) 0%,var(--green-700) 50%,var(--green-900) 100%);color:#fff;border-top:none;position:relative;overflow:hidden}
.gcn-home .stats::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 50%,rgba(212,175,55,.18),transparent 50%),radial-gradient(circle at 80% 50%,rgba(212,175,55,.12),transparent 50%)}
.gcn-home .stats .container{position:relative;z-index:1}
.gcn-home .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center}
.gcn-home .stat-num{font-family:"Playfair Display",serif;font-size:2.8rem;font-weight:800;line-height:1;background:linear-gradient(180deg,var(--gold-300) 0%,var(--gold-600) 60%,var(--gold-700) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}
.gcn-home .stat-lbl{color:#cfe1d6;font-size:.85rem;margin-top:8px;text-transform:uppercase;letter-spacing:.1em}
@media (max-width:760px){.gcn-home .stats-grid{grid-template-columns:repeat(2,1fr)}}

/* Tile grids */
.gcn-home .tile-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.gcn-home .tile{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px;box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s,border-color .2s;display:flex;flex-direction:column;color:var(--ink);text-align:left}
.gcn-home .tile:hover{transform:translateY(-4px);box-shadow:var(--shadow);border-color:var(--green-600)}
.gcn-home .tile-ico{width:50px;height:50px;border-radius:11px;display:grid;place-items:center;margin-bottom:14px;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 16px rgba(0,0,0,.12)}
.gcn-home .tile-ico svg{width:23px;height:23px}
.gcn-home .tile h3{margin:0 0 6px;font-size:1.05rem;color:var(--green-900);font-family:"Inter",sans-serif}
.gcn-home .tile p{margin:0 0 14px;color:var(--ink-2);font-size:.92rem;flex-grow:1;line-height:1.5}
.gcn-home .tile-cta{color:var(--green-700);font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:4px}
.gcn-home .tile-cta .arr{transition:transform .15s}
.gcn-home .tile:hover .tile-cta .arr{transform:translateX(3px)}
.gcn-home .ico-blue{background:linear-gradient(135deg,#3b82f6,#1d4ed8)}
.gcn-home .ico-orange{background:linear-gradient(135deg,#fb923c,#ea580c)}
.gcn-home .ico-gold{background:linear-gradient(135deg,#fbbf24,#d97706)}
.gcn-home .ico-green{background:linear-gradient(135deg,#34d399,#059669)}
.gcn-home .ico-red{background:linear-gradient(135deg,#f87171,#dc2626)}
.gcn-home .ico-purple{background:linear-gradient(135deg,#a78bfa,#7c3aed)}
.gcn-home .ico-teal{background:linear-gradient(135deg,#22d3ee,#0891b2)}
.gcn-home .ico-leaf{background:linear-gradient(135deg,#4ade80,#15803d)}
.gcn-home .ico-indigo{background:linear-gradient(135deg,#818cf8,#4338ca)}
.gcn-home .ico-pink{background:linear-gradient(135deg,#f472b6,#be185d)}
@media (max-width:1100px){.gcn-home .tile-grid{grid-template-columns:repeat(3,1fr)}}
@media (max-width:760px){.gcn-home .tile-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:460px){.gcn-home .tile-grid{grid-template-columns:1fr}}

/* Tools */
.gcn-home .tools-section{margin-top:56px}
.gcn-home .tools-head{text-align:center;margin-bottom:26px}
.gcn-home .tools-head h3{font-family:"Playfair Display",Georgia,serif;font-size:clamp(1.4rem,2vw,1.8rem);color:var(--green-900);margin:0;font-weight:700}
.gcn-home .tools-head p{color:var(--muted);margin:6px auto 0;max-width:600px;font-size:.98rem}
.gcn-home .tools-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
@media (max-width:880px){.gcn-home .tools-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.gcn-home .tools-grid{grid-template-columns:1fr}}
.gcn-home .free-pill{display:inline-block;background:var(--green-100);color:var(--green-800);font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:6px;margin-top:auto;align-self:flex-start}

/* Floating icon depth + hover */
.gcn-home .tile-ico,.gcn-home .ctile-ico,.gcn-home .why-card .ico,.gcn-home .perk .pico{position:relative;transform-style:preserve-3d;will-change:transform,box-shadow,filter;transition:transform .45s cubic-bezier(.2,.8,.2,1.4),box-shadow .35s,filter .35s;animation:gcnIconBob 4.2s ease-in-out infinite;animation-delay:var(--bob-delay,0s)}
@keyframes gcnIconBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.gcn-home .tile:hover .tile-ico,.gcn-home .ctile:hover .ctile-ico,.gcn-home .why-card:hover .ico,.gcn-home .perk:hover .pico{animation:none;transform:translateY(-8px) rotateX(8deg) rotateY(-6deg) scale(1.08);filter:brightness(1.10) saturate(1.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 4px rgba(0,0,0,.14),0 22px 40px rgba(0,0,0,.28),0 8px 14px var(--icon-glow,rgba(212,175,55,.55)),0 0 28px var(--icon-glow,rgba(212,175,55,.4))}
.gcn-home .ico-blue{--icon-glow:rgba(59,130,246,.55)}
.gcn-home .ico-orange{--icon-glow:rgba(249,115,22,.55)}
.gcn-home .ico-gold{--icon-glow:rgba(217,119,6,.55)}
.gcn-home .ico-green{--icon-glow:rgba(22,163,74,.55)}
.gcn-home .ico-red{--icon-glow:rgba(220,38,38,.55)}
.gcn-home .ico-purple{--icon-glow:rgba(124,58,237,.55)}
.gcn-home .ico-teal{--icon-glow:rgba(8,145,178,.55)}
.gcn-home .ico-leaf{--icon-glow:rgba(21,128,61,.55)}
.gcn-home .ico-indigo{--icon-glow:rgba(67,56,202,.55)}
.gcn-home .ico-pink{--icon-glow:rgba(190,24,93,.55)}
.gcn-home .tile-grid>*:nth-child(1) .tile-ico,.gcn-home .tools-grid>*:nth-child(1) .tile-ico,.gcn-home .ctile-grid>*:nth-child(1) .ctile-ico,.gcn-home .why-grid>*:nth-child(1) .ico{--bob-delay:0s}
.gcn-home .tile-grid>*:nth-child(2) .tile-ico,.gcn-home .tools-grid>*:nth-child(2) .tile-ico,.gcn-home .ctile-grid>*:nth-child(2) .ctile-ico,.gcn-home .why-grid>*:nth-child(2) .ico{--bob-delay:.35s}
.gcn-home .tile-grid>*:nth-child(3) .tile-ico,.gcn-home .tools-grid>*:nth-child(3) .tile-ico,.gcn-home .ctile-grid>*:nth-child(3) .ctile-ico,.gcn-home .why-grid>*:nth-child(3) .ico{--bob-delay:.7s}
.gcn-home .tile-grid>*:nth-child(4) .tile-ico,.gcn-home .tools-grid>*:nth-child(4) .tile-ico,.gcn-home .ctile-grid>*:nth-child(4) .ctile-ico{--bob-delay:1.05s}
.gcn-home .tile-grid>*:nth-child(5) .tile-ico,.gcn-home .tools-grid>*:nth-child(5) .tile-ico,.gcn-home .ctile-grid>*:nth-child(5) .ctile-ico{--bob-delay:1.4s}
.gcn-home .tile-grid>*:nth-child(6) .tile-ico,.gcn-home .tools-grid>*:nth-child(6) .tile-ico,.gcn-home .ctile-grid>*:nth-child(6) .ctile-ico{--bob-delay:1.75s}
.gcn-home .tile-grid>*:nth-child(7) .tile-ico,.gcn-home .ctile-grid>*:nth-child(7) .ctile-ico{--bob-delay:2.1s}
.gcn-home .tile-grid>*:nth-child(8) .tile-ico,.gcn-home .ctile-grid>*:nth-child(8) .ctile-ico{--bob-delay:2.45s}
.gcn-home .ctile-grid>*:nth-child(9) .ctile-ico{--bob-delay:2.8s}
.gcn-home .tile,.gcn-home .ctile,.gcn-home .why-card,.gcn-home .hero-card .perk{perspective:800px;transform-style:preserve-3d}

/* Hire */
.gcn-home #hire-options{background:linear-gradient(180deg,#fff 0%,var(--paper) 100%)}
.gcn-home .hire-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:18px}
.gcn-home .hire{background:#fff;border:1px solid var(--line);border-radius:14px;padding:26px 22px;box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s,border-color .2s;position:relative}
.gcn-home .hire:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.gcn-home .hire-recommended{border-color:var(--gold-600);box-shadow:var(--shadow-gold)}
.gcn-home .hire-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(180deg,var(--gold-400),var(--gold-700));color:var(--green-900);padding:4px 12px;border-radius:6px;font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(122,90,20,.4);box-shadow:0 4px 10px rgba(184,134,11,.3);white-space:nowrap}
.gcn-home .hire-tier{font-family:"Playfair Display",serif;font-weight:800;font-size:1.6rem;background:linear-gradient(180deg,var(--gold-400),var(--gold-700));-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px;letter-spacing:.06em}
.gcn-home .hire h3{font-size:1.08rem;color:var(--green-900);margin-bottom:8px;font-family:"Inter",sans-serif}
.gcn-home .hire-best{font-size:.86rem;color:var(--muted);font-style:italic;margin:0 0 12px;line-height:1.5}
.gcn-home .hire ul{margin:0;padding-left:18px;color:var(--ink-2);font-size:.9rem}
.gcn-home .hire ul li{margin:4px 0}
@media (max-width:980px){.gcn-home .hire-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.gcn-home .hire-grid{grid-template-columns:1fr}}

/* About */
.gcn-home .about{background:linear-gradient(180deg,var(--paper) 0%,#fff 100%)}
.gcn-home .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
.gcn-home .values{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:8px}
.gcn-home .val{padding:18px 18px 18px 22px;background:#fff;border-radius:12px;border:1px solid var(--line);position:relative;box-shadow:var(--shadow-sm);transition:transform .2s}
.gcn-home .val::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:4px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,var(--gold-400),var(--gold-700))}
.gcn-home .val:hover{transform:translateX(3px)}
.gcn-home .val h4{margin:0 0 6px;font-family:"Inter",sans-serif;font-size:1rem;color:var(--green-900)}
.gcn-home .val p{margin:0;color:var(--ink-2);font-size:.94rem}
@media (max-width:980px){.gcn-home .about-grid{grid-template-columns:1fr;gap:40px}}
@media (max-width:520px){.gcn-home .values{grid-template-columns:1fr}}

/* Process */
.gcn-home .process{background:#fff}
.gcn-home .process-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;counter-reset:gcnstep}
.gcn-home .step{background:linear-gradient(180deg,#fff 0%,var(--green-50) 100%);border:1px solid var(--line);border-radius:var(--radius);padding:28px 22px;position:relative;box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s}
.gcn-home .step:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.gcn-home .step::before{counter-increment:gcnstep;content:counter(gcnstep,decimal-leading-zero);font-family:"Playfair Display",serif;font-size:1.7rem;font-weight:800;background:linear-gradient(180deg,var(--gold-400),var(--gold-700));-webkit-background-clip:text;background-clip:text;color:transparent;display:block;margin-bottom:8px}
.gcn-home .step h3{margin-bottom:6px;color:var(--green-900)}
.gcn-home .step p{margin:0;color:var(--muted);font-size:.95rem}
@media (max-width:880px){.gcn-home .process-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.gcn-home .process-grid{grid-template-columns:1fr}}

/* Storm */
.gcn-home .storm{background:linear-gradient(135deg,var(--green-900) 0%,var(--green-700) 100%);color:#fff;border-top:none;position:relative;overflow:hidden}
.gcn-home .storm::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 75% 30%,rgba(212,175,55,.22),transparent 50%)}
.gcn-home .storm .container{position:relative;z-index:1;display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.gcn-home .storm h2{color:#fff}
.gcn-home .storm p{color:#cfe1d6}
.gcn-home .storm-card{background:rgba(255,255,255,.06);border:1px solid rgba(212,175,55,.3);border-radius:16px;padding:28px;backdrop-filter:blur(8px)}
.gcn-home .storm-card ol{margin:0;padding-left:20px;color:#cfe1d6}
.gcn-home .storm-card ol li{margin:8px 0}
.gcn-home .storm-card ol li strong{color:#fff}
@media (max-width:880px){.gcn-home .storm .container{grid-template-columns:1fr}}

/* Contractors */
.gcn-home .contractors{background:radial-gradient(900px 500px at 80% 15%,rgba(212,175,55,.14),transparent 55%),radial-gradient(700px 400px at 10% 90%,rgba(45,106,79,.18),transparent 60%),linear-gradient(180deg,#0a1410 0%,#0f1c17 60%,#0a1410 100%);color:#fff;border-top:none}
.gcn-home .ctile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.gcn-home .ctile{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:26px;display:flex;flex-direction:column;color:#fff;transition:transform .2s,border-color .2s,background .2s;position:relative;text-align:left}
.gcn-home .ctile:hover{transform:translateY(-4px);border-color:rgba(212,175,55,.45);background:rgba(255,255,255,.05)}
.gcn-home .ctile-ico{width:50px;height:50px;border-radius:11px;display:grid;place-items:center;margin-bottom:14px;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 18px rgba(0,0,0,.35)}
.gcn-home .ctile-ico svg{width:23px;height:23px}
.gcn-home .ctile h3{margin:0 0 6px;font-size:1.05rem;color:#fff;font-family:"Inter",sans-serif}
.gcn-home .ctile p{margin:0 0 14px;color:#9eb3a4;font-size:.92rem;flex-grow:1;line-height:1.5}
.gcn-home .ctile-cta{color:var(--green-500);font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:4px}
.gcn-home .ctile-badge{position:absolute;top:14px;right:14px;font-size:.7rem;font-weight:800;letter-spacing:.08em;padding:4px 10px;border-radius:6px}
.gcn-home .ctile-badge-soon{background:rgba(255,255,255,.95);color:#0e3a25}
.gcn-home .ctile-badge-earn{background:linear-gradient(180deg,#fbbf24,#d97706);color:#0e3a25;box-shadow:0 4px 10px rgba(184,134,11,.4)}
.gcn-home .ctile-badge-new{background:linear-gradient(180deg,#34d399,#059669);color:#fff}
@media (max-width:980px){.gcn-home .ctile-grid{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.gcn-home .ctile-grid{grid-template-columns:1fr}}

/* Reviews */
.gcn-home .reviews{background:linear-gradient(180deg,#fff 0%,var(--green-50) 100%)}
.gcn-home .review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.gcn-home .review{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:26px;display:flex;flex-direction:column;box-shadow:var(--shadow-sm);transition:transform .2s,box-shadow .2s}
.gcn-home .review:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.gcn-home .stars{color:var(--gold-700);font-size:1rem;letter-spacing:2px;margin-bottom:10px;filter:drop-shadow(0 1px 1px rgba(122,90,20,.25))}
.gcn-home .review p.body{font-size:.98rem;color:var(--ink-2)}
.gcn-home .review .author{margin-top:auto;display:flex;align-items:center;gap:12px;padding-top:14px;border-top:1px solid var(--line)}
.gcn-home .avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:.92rem;color:#fff;background:linear-gradient(135deg,var(--green-700),var(--green-900));box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 8px rgba(15,58,37,.2);flex:none}
.gcn-home .author-meta{font-size:.88rem}
.gcn-home .author-meta strong{display:block;color:var(--ink)}
.gcn-home .author-meta span{color:var(--muted)}
@media (max-width:880px){.gcn-home .review-grid{grid-template-columns:1fr}}
.gcn-home .sample-banner{margin:18px auto 0;max-width:760px;text-align:center;background:#fff;border:1px dashed var(--gold-700);color:var(--ink-2);padding:10px 14px;border-radius:8px;font-size:.86rem}

/* References */
.gcn-home .references{background:#fff}
.gcn-home .ref-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.gcn-home .ref{background:linear-gradient(180deg,#fff 0%,var(--paper) 100%);border:1px solid var(--line);border-radius:12px;padding:22px;display:flex;gap:16px;align-items:flex-start;box-shadow:var(--shadow-sm)}
.gcn-home .ref h4{margin:0 0 4px;font-family:"Inter",sans-serif;font-size:1rem;color:var(--green-900)}
.gcn-home .ref .role{color:var(--muted);font-size:.86rem;margin:0 0 8px}
.gcn-home .ref .quote{margin:0;font-size:.94rem;color:var(--ink-2);font-style:italic}
@media (max-width:760px){.gcn-home .ref-grid{grid-template-columns:1fr}}

/* FAQ */
.gcn-home .faq{background:linear-gradient(180deg,var(--paper) 0%,#fff 100%)}
.gcn-home details{border:1px solid var(--line);border-radius:12px;padding:18px 22px;margin-bottom:10px;background:#fff;box-shadow:var(--shadow-sm);transition:border-color .15s,box-shadow .15s}
.gcn-home details[open]{border-color:var(--gold-600);box-shadow:var(--shadow)}
.gcn-home summary{cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between;align-items:center;color:var(--green-900)}
.gcn-home summary::-webkit-details-marker{display:none}
.gcn-home summary::after{content:"+";font-size:1.5rem;color:var(--gold-700);font-weight:800;transition:transform .15s}
.gcn-home details[open] summary::after{content:"–"}
.gcn-home details p{margin:12px 0 0;color:var(--ink-2)}

/* Join band */
.gcn-home .joinband{background:radial-gradient(700px 300px at 80% 50%,rgba(212,175,55,.20),transparent 60%),linear-gradient(135deg,var(--green-800) 0%,var(--green-900) 100%);color:#fff;border-top:none;position:relative;overflow:hidden}
.gcn-home .joinband .container{position:relative;z-index:1;display:grid;grid-template-columns:1.2fr .8fr;gap:40px;align-items:center}
.gcn-home .joinband h2{color:#fff}
.gcn-home .joinband p{color:#dcebe2}
.gcn-home .joinband-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:14px}
.gcn-home .joinband-quote{background:rgba(255,255,255,.06);border:1px solid rgba(212,175,55,.3);border-radius:14px;padding:22px;backdrop-filter:blur(6px);font-style:italic;color:#f3e9c8}
.gcn-home .joinband-quote .who{margin-top:10px;font-style:normal;color:var(--gold-400);font-size:.85rem;letter-spacing:.06em;text-transform:uppercase}
@media (max-width:880px){.gcn-home .joinband .container{grid-template-columns:1fr}}

/* Footer */
.gcn-home footer{background:var(--ink);color:#cdd6cf;padding:60px 0 24px}
.gcn-home .foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:36px;margin-bottom:36px}
.gcn-home footer h4{color:#fff;font-family:"Inter",sans-serif;font-size:.92rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px}
.gcn-home footer ul{padding:0;list-style:none;margin:0}
.gcn-home footer ul li{margin:8px 0;font-size:.94rem}
.gcn-home footer ul li a{color:#cdd6cf}
.gcn-home footer ul li a:hover{color:var(--gold-400)}
.gcn-home .foot-bar{border-top:1px solid rgba(255,255,255,.08);padding-top:18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:.85rem;color:#8a9990}
@media (max-width:880px){.gcn-home .foot-grid{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.gcn-home .foot-grid{grid-template-columns:1fr}}

/* Shimmer */
@keyframes gcnShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.gcn-home .shimmer{background:linear-gradient(90deg,var(--gold-700) 0%,var(--gold-300) 50%,var(--gold-700) 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gcnShimmer 5s linear infinite}

@media (prefers-reduced-motion:reduce){
  .gcn-home .tile-ico,.gcn-home .ctile-ico,.gcn-home .why-card .ico,.gcn-home .perk .pico{animation:none}
  .gcn-home .hero-card{animation:none}
}
`;

/* ----------------------------- ICON HELPERS ----------------------------- */
const Svg = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
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
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".gcn-home .reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* -------------------------------- PAGE -------------------------------- */
export default function Home() {
  useReveal();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Global Contractor Network — Trusted Contractors. Real Accountability.</title>
        <meta
          name="description"
          content="Get a free AI-powered home project quote in 60 seconds and connect with vetted, insured contractors. Referral-based network — no bidding wars, no spam calls."
        />
        <link rel="canonical" href="https://globalcontractor.network/" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://globalcontractor.network/" />
        <meta property="og:site_name" content="Global Contractor Network" />
        <meta property="og:title" content="Global Contractor Network — Trusted Contractors. Real Accountability." />
        <meta
          property="og:description"
          content="Free AI quotes, vetted contractors, and a referral network built on accountability — not bidding wars."
        />
        <meta property="og:image" content="https://globalcontractor.network/gcn-logo.png" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Global Contractor Network — Trusted Contractors. Real Accountability." />
        <meta
          name="twitter:description"
          content="Free AI quotes, vetted contractors, and a referral network built on accountability — not bidding wars."
        />
        <meta name="twitter:image" content="https://globalcontractor.network/gcn-logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </Helmet>

      <style>{SCOPED_CSS}</style>

      <div className="gcn-home">
        {/* NAV */}
        <header className="site">
          <div className="container nav mx-0 pb-0 border">
            <a href="#top" className="brand" aria-label="Global Contractor Network">
              <img className="logo-img" src="/gcn-logo.png" alt="The Global Contractor Network" />
            </a>
            <nav className="navlinks" aria-label="Primary">
              <a href="#services">For Homeowners</a>
              <a href="#contractors">For Contractors</a>
              <a href="#about">About</a>
              <a href="#process">How It Works</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div className="nav-cta">
              <Link className="btn btn-ghost" to="/login">Login</Link>
              <Link className="btn btn-green" to="/join">Join the Network</Link>
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button className="mobile-trigger" aria-label="Open menu">
                    <Menu />
                  </button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="flex flex-col gap-4 mt-8 text-base font-semibold">
                    <a onClick={() => setOpen(false)} href="#services">For Homeowners</a>
                    <a onClick={() => setOpen(false)} href="#contractors">For Contractors</a>
                    <a onClick={() => setOpen(false)} href="#about">About</a>
                    <a onClick={() => setOpen(false)} href="#process">How It Works</a>
                    <a onClick={() => setOpen(false)} href="#faq">FAQ</a>
                    <Link onClick={() => setOpen(false)} to="/login" className="btn btn-ghost mt-2">Login</Link>
                    <Link onClick={() => setOpen(false)} to="/join" className="btn btn-green">Join the Network</Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero" id="top" style={{ borderTop: "none" }}>
          <div className="container">
            <div>
              <span className="rating-pill"><span className="stars">★★★★★</span> Rated 4.9/5 by 500+ verified homeowners</span>
              <h1>Trusted Contractors. <span className="green-text">Real</span> <span className="gold-text shimmer">Accountability.</span></h1>
              <div className="quoteline">A referral-based network for homeowners and contractors — never a lead-bidding marketplace.</div>
              <p className="lead">Get a free AI-powered quote in minutes, then connect with vetted, insured pros in your area. No spam calls, no bidding wars — just trusted work, backed by our network guarantee.</p>
              <div className="actions">
                <Link to="/join" className="btn btn-green btn-lg">Get My Free Quote <span className="arr">→</span></Link>
                <Link to="/join" className="btn btn-ghost">Join the Network</Link>
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

            <aside className="hero-card" aria-label="What you get">
              <div className="head">
                <span className="pulse" />
                <h3>Free for property owners</h3>
              </div>
              <p style={{ margin: "0 0 6px", color: "var(--muted)", fontSize: ".92rem" }}>Manage your projects with the same tools the pros use:</p>

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
                <Link className="btn btn-green" style={{ justifyContent: "center" }} to="/join">Create Your Free Account <span className="arr">→</span></Link>
                <span className="free-line">Free • No spam • Cancel anytime</span>
              </div>
            </aside>
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
                <Link key={i} to={t.to} className="tile reveal">
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
                  <Link key={i} to="/join" className="tile reveal">
                    <div className={`tile-ico ${t.color}`}><Svg d={t.d}>{t.svg}</Svg></div>
                    <h3>{t.title}</h3>
                    <p>{t.desc}</p>
                    <span className="free-pill">Included Free</span>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <Link to="/join" className="btn btn-green">Create Your Free Account <span className="arr">→</span></Link>
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
                <div key={i} className={`hire reveal ${h.recommended ? "hire-recommended" : ""}`}>
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
                    <div className="val" key={i}><h4>{h}</h4><p>{p}</p></div>
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
                <div className="step reveal" key={i}><h3>{h}</h3><p>{p}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* STORM */}
        <section className="storm">
          <div className="container">
            <div className="reveal">
              <span className="eyebrow" style={{ background: "rgba(212,175,55,.15)", color: "var(--gold-400)" }}>Storm Damage?</span>
              <h2 style={{ marginTop: 14 }}>We make insurance claims <span className="gold-text">simple.</span></h2>
              <p>If you have legitimate damage after a storm, you deserve a contractor who handles the moving parts so you can focus on your family. Call your insurance, meet the adjuster, and submit your claim info to our team — we take it from there.</p>
              <div className="actions" style={{ marginTop: 18 }}>
                <Link to="/join" className="btn btn-gold">Start a Claim Review <span className="arr">→</span></Link>
                <a href="tel:+10000000000" className="btn btn-ghost" style={{ background: "rgba(255,255,255,.06)", color: "#fff", borderColor: "rgba(255,255,255,.3)" }}>Call Storm Response</a>
              </div>
            </div>
            <div className="storm-card reveal">
              <h3 style={{ color: "#fff", marginBottom: 14 }}>What we handle for you</h3>
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
              <span className="eyebrow" style={{ background: "rgba(212,175,55,.15)", color: "var(--gold-400)" }}>For Contractors</span>
              <h2 style={{ color: "#fff" }}>Powerful Tools to <span className="gold-text shimmer">Grow Your Business</span></h2>
              <p style={{ color: "#cfe1d6" }}>From lead generation to project completion, we provide everything you need to scale your contracting business — without buying shared leads or competing in bidding wars.</p>
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
                <Link key={i} to="/contractors" className="ctile reveal">
                  {c.badge && <span className={`ctile-badge ctile-badge-${c.badge[0]}`}>{c.badge[1]}</span>}
                  <div className={`ctile-ico ${c.color}`}><Svg>{c.svg}</Svg></div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <span className="ctile-cta">Learn More <span className="arr">→</span></span>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 42 }} className="reveal">
              <Link to="/contractors" className="btn btn-gold">Apply to Join the Network <span className="arr">→</span></Link>
              <p style={{ marginTop: 12, color: "#9eb3a4", fontSize: ".88rem" }}>Plus the GCN App: Estimating + Invoicing • Prospecting • D2D Live Stream • Job Marketplace • Contract Signing • Virtual Rep Card</p>
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
                <div className="review reveal" key={i}>
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
                <div className="ref reveal" key={i}>
                  <div className="avatar">{initials}</div>
                  <div>
                    <h4>{name}</h4>
                    <p className="role">{role}</p>
                    <p className="quote">"{q}"</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: ".9rem", marginTop: 18 }}>
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
                <details key={i}>
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
              <span className="eyebrow" style={{ background: "rgba(212,175,55,.15)", color: "var(--gold-400)" }}>Ready When You Are</span>
              <h2 style={{ marginTop: 14 }}>Join the network. <span className="gold-text shimmer">Manage your projects for free.</span></h2>
              <p>Free access to AI estimating tools, the job marketplace, permit expediting, virtual contractor services, and a vetted contractor directory. Built on referrals, not lead-selling.</p>
              <div className="joinband-cta">
                <Link to="/join" className="btn btn-gold">Join the Network <span className="arr">→</span></Link>
                <Link to="/contractors" className="btn btn-ghost" style={{ background: "rgba(255,255,255,.06)", color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>For Contractors <span className="arr">→</span></Link>
              </div>
            </div>
            <div className="joinband-quote reveal">
              "We're not another lead-gen site. We're a referral-driven network where good work is the only currency. Contractors get paid for great work — homeowners stop overpaying for overhead."
              <div className="who">— GCN Founder</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="container">
            <div className="foot-grid">
              <div>
                <img className="logo-img" src="/gcn-logo.png" alt="The Global Contractor Network" />
                <p style={{ marginTop: 14, color: "#cdd6cf", fontSize: ".94rem" }}>
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
