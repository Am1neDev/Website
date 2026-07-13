import fs from 'node:fs';
import path from 'node:path';

const FONT_DIR = 'node_modules/@fontsource/cairo/files';
const weights = [400, 600, 700, 800, 900];
const RANGE = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  arabic: 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+08A0-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FEFF',
};
function face(subset, w) {
  const b64 = fs.readFileSync(path.join(FONT_DIR, `cairo-${subset}-${w}-normal.woff2`)).toString('base64');
  return `@font-face{font-family:'Cairo';font-style:normal;font-weight:${w};font-display:block;`
    + `unicode-range:${RANGE[subset]};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}
const faces = weights.flatMap(w => [face('arabic', w), face('latin', w)]).join('\n');

// ---- SVG line icons (inherit currentColor) ----
const I = {
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2.6"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15.4" r="1.35" fill="currentColor" stroke="none"/></svg>`,
  nologin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="8" r="3.6"/><path d="M3 20a6.6 6.6 0 0 1 11-4.4"/><path d="M17.5 15.5l4 4M21.5 15.5l-4 4"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="9.5" width="17" height="11" rx="2"/><path d="M3.5 13.5h17M12 9.5v11"/><path d="M12 9.5S10.6 5 8.1 5 5.4 7.4 5.4 7.4 6.4 9.5 8.9 9.5H12z"/><path d="M12 9.5s1.4-4.5 3.9-4.5S18.6 7.4 18.6 7.4 17.6 9.5 15.1 9.5H12z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3.2v4.8c0 4.7-3.2 8-7.5 9.5-4.3-1.5-7.5-4.8-7.5-9.5V6.2z"/><path d="M8.8 12.2l2.3 2.3 4.3-4.6"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13.4 2.4 5.1 13.1c-.4.5 0 1.2.6 1.2h4.2l-1.4 7c-.1.7.8 1.1 1.2.5l8.3-10.7c.4-.5 0-1.2-.6-1.2h-4.2l1.4-7c.1-.7-.8-1.1-1.2-.5z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.2 12.4l2.6 2.6L16 9.2"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l3.2 5.2L12 21 2.8 8.2z"/><path d="M2.8 8.2h18.4M9 3 6 8.2 12 21l6-12.8L15 3"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5c.5 3.9 2.1 5.5 6 6-3.9.5-5.5 2.1-6 6-.5-3.9-2.1-5.5-6-6 3.9-.5 5.5-2.1 6-6z"/></svg>`,
  ghost: `<svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 2C10.5 2 6.8 6 6.8 11.4c0 2.1.1 4.6-.2 6.3-.2 1.3-.9 2.2-1.9 2.9-.6.4-1 .8-1 1.5 0 .9.8 1.4 1.7 1.7 1.1.4 1.8.6 2.4 1.6.2.3.3.7.6 1 .4.4 1 .4 1.7.2.6-.1 1.3-.3 2.1.1.7.3 1.4 1.2 3.3 1.2s2.6-.9 3.3-1.2c.8-.4 1.5-.2 2.1-.1.7.2 1.3.2 1.7-.2.3-.3.4-.7.6-1 .6-1 1.3-1.2 2.4-1.6.9-.3 1.7-.8 1.7-1.7 0-.7-.4-1.1-1-1.5-1-.7-1.7-1.6-1.9-2.9-.3-1.7-.2-4.2-.2-6.3C25.2 6 21.5 2 16 2z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5l-7 7 7 7"/><path d="M20 12H7"/></svg>`,
};

const GRAIN = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`
);

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
${faces}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
html,body{width:1080px;height:1920px;overflow:hidden;background:#040406;}
body{font-family:'Cairo','Noto Color Emoji',sans-serif;position:relative;color:#fff;}
#stage{position:absolute;inset:0;width:1080px;height:1920px;overflow:hidden;
  background:radial-gradient(140% 90% at 50% -8%, #14110a 0%, #0a0a0f 42%, #050507 100%);}
.aurora{position:absolute;border-radius:50%;filter:blur(15px);opacity:.75;will-change:transform;}
#a1{width:900px;height:900px;background:radial-gradient(circle,#ffcf1e,transparent 62%);}
#a2{width:820px;height:820px;background:radial-gradient(circle,#ff7a00,transparent 62%);opacity:.6;}
#a3{width:760px;height:760px;background:radial-gradient(circle,#7b3bff,transparent 64%);opacity:.42;}
#a4{width:680px;height:680px;background:radial-gradient(circle,#ff2fa0,transparent 64%);opacity:.30;}
#grain{position:absolute;inset:-40px;background-image:url("${GRAIN}");background-size:260px 260px;
  opacity:.06;mix-blend-mode:overlay;pointer-events:none;}
#leak{position:absolute;top:-30%;left:-30%;width:160%;height:70%;pointer-events:none;
  background:linear-gradient(115deg,transparent 40%,rgba(255,236,150,.10) 50%,transparent 60%);}
#vig{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(125% 100% at 50% 45%, transparent 52%, rgba(0,0,0,.62));}

.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:0 92px;will-change:transform,opacity;opacity:0;}
[data-a]{will-change:transform,opacity,filter;}

.grad{background:linear-gradient(180deg,#fff7c2 0%,#ffd21e 52%,#ff9500 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;}

/* S1 */
.ringwrap{position:relative;width:400px;height:400px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
#ring{position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(from var(--r,0deg),transparent 0%,#ffe11e 18%,transparent 38%,transparent 62%,#ff8a00 80%,transparent 100%);
  -webkit-mask:radial-gradient(circle,transparent 61%,#000 62%,#000 74%,transparent 75%);
          mask:radial-gradient(circle,transparent 61%,#000 62%,#000 74%,transparent 75%);
  filter:blur(2px) drop-shadow(0 0 24px rgba(255,210,20,.5));opacity:.95;}
.badge{width:300px;height:300px;border-radius:74px;position:relative;
  background:linear-gradient(150deg,rgba(40,40,50,.55),rgba(12,12,18,.65));
  border:1.5px solid rgba(255,255,255,.14);
  box-shadow:0 30px 90px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.14), inset 0 -30px 60px rgba(0,0,0,.35);
  display:flex;align-items:center;justify-content:center;}
.badge svg{width:168px;height:168px;color:#ffe11e;filter:drop-shadow(0 0 30px rgba(255,220,30,.95));}
.plus{position:absolute;top:30px;right:34px;font-size:82px;font-weight:900;line-height:.8;
  filter:drop-shadow(0 0 20px rgba(255,220,30,.7));}
h1{font-size:132px;font-weight:900;letter-spacing:-4px;line-height:1;direction:ltr;
  filter:drop-shadow(0 8px 30px rgba(0,0,0,.5));}
.pill{display:inline-flex;align-items:center;gap:16px;font-size:42px;font-weight:800;color:#ffe36b;
  background:rgba(255,220,40,.08);border:1.5px solid rgba(255,220,40,.32);
  padding:16px 36px;border-radius:100px;margin-top:34px;
  box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.14);}
.pill svg{width:38px;height:38px;color:#ffdb2e;}
.sub{font-size:42px;font-weight:600;color:#b9b9c6;margin-top:26px;}

/* headings */
.h2{font-size:82px;font-weight:900;color:#fff;margin-bottom:60px;text-align:center;line-height:1.08;letter-spacing:-1px;}

/* S2 chips */
.chip{display:flex;align-items:center;gap:30px;width:836px;
  background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.028));
  border:1.5px solid rgba(255,255,255,.10);
  border-radius:34px;padding:30px 36px;box-shadow:0 20px 46px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.10);}
.chip+.chip{margin-top:28px;}
.itile{flex:0 0 auto;width:96px;height:96px;border-radius:26px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(160deg,rgba(255,220,40,.22),rgba(255,140,0,.12));
  border:1.5px solid rgba(255,220,40,.30);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 8px 20px rgba(0,0,0,.3);}
.itile svg{width:52px;height:52px;color:#ffdb2e;filter:drop-shadow(0 0 10px rgba(255,210,20,.5));}
.chip .tx{font-size:46px;font-weight:700;color:#f2f2f7;}

/* S3 cards */
.card{display:flex;align-items:center;justify-content:space-between;width:852px;position:relative;
  background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));
  border:1.5px solid rgba(255,255,255,.10);
  border-radius:38px;padding:28px 40px;box-shadow:0 22px 52px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.10);}
.card+.card{margin-top:30px;}
.card.best{border:none;padding:30px 42px;box-shadow:0 26px 64px rgba(0,0,0,.5),0 0 46px rgba(255,200,20,.20);}
.card.best::before{content:'';position:absolute;inset:-2px;border-radius:40px;z-index:-1;
  background:conic-gradient(from var(--a,0deg),#ffe11e,#ff8a00,#ff2fa0,#ffe11e);}
.card.best::after{content:'';position:absolute;inset:0;border-radius:38px;z-index:-1;
  background:linear-gradient(180deg,#151119,#0e0c12);}
.dur{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:206px;
  background:rgba(0,0,0,.30);border:1.5px solid rgba(255,255,255,.10);border-radius:26px;padding:20px 26px;}
.dur .n{font-size:70px;font-weight:900;line-height:1;direction:ltr;}
.dur .u{font-size:32px;font-weight:700;color:#a7a7b4;}
.price{display:flex;align-items:baseline;gap:12px;}
.price .v{font-size:112px;font-weight:900;line-height:.86;direction:ltr;letter-spacing:-2px;
  filter:drop-shadow(0 0 26px rgba(255,200,20,.35));}
.price .c{font-size:44px;font-weight:800;color:#eaeaf0;}
.tag{position:absolute;top:-24px;left:40px;display:flex;align-items:center;gap:8px;
  background:linear-gradient(180deg,#ffe11e,#ffb400);color:#1a1205;font-weight:900;font-size:29px;
  padding:8px 20px;border-radius:100px;box-shadow:0 10px 24px rgba(255,190,20,.4);}
.tag svg{width:26px;height:26px;color:#1a1205;}

/* S4 */
.badges{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;margin-bottom:66px;}
.tb{display:flex;align-items:center;gap:14px;font-size:37px;font-weight:700;color:#eaeaf0;
  background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.11);
  border-radius:100px;padding:16px 30px;box-shadow:inset 0 1px 0 rgba(255,255,255,.10);}
.tb svg{width:36px;height:36px;color:#ffdb2e;}
.cta{position:relative;overflow:hidden;font-size:100px;font-weight:900;color:#160f00;letter-spacing:-2px;
  background:linear-gradient(180deg,#ffe11e,#ffb400);padding:30px 78px;border-radius:42px;
  box-shadow:0 28px 66px rgba(255,190,20,.42),inset 0 2px 0 rgba(255,255,255,.55);display:flex;align-items:center;gap:26px;}
.cta svg{width:74px;height:74px;color:#160f00;}
.cta .shine{position:absolute;top:0;bottom:0;width:180px;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);
  left:var(--sx,-260px);}
.store{font-size:96px;font-weight:900;margin-top:58px;letter-spacing:-1px;}
.snap{display:flex;align-items:center;gap:20px;margin-top:24px;font-size:52px;font-weight:800;color:#ffdb2e;direction:ltr;}
.snap svg{width:62px;height:62px;color:#ffe11e;filter:drop-shadow(0 0 14px rgba(255,210,20,.7));}
.tl{font-size:40px;font-weight:600;color:#b9b9c6;margin-top:30px;text-align:center;}

#track{position:absolute;top:34px;left:50%;transform:translateX(-50%);display:flex;gap:12px;z-index:5;}
#track .seg{width:96px;height:7px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden;}
#track .seg i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffe11e,#ff8a00);
  box-shadow:0 0 12px rgba(255,210,20,.6);}
#wm{position:absolute;bottom:40px;left:0;right:0;text-align:center;font-size:30px;font-weight:800;
  color:rgba(255,255,255,.5);letter-spacing:3px;display:flex;align-items:center;justify-content:center;gap:12px;}
#wm svg{width:34px;height:34px;color:rgba(255,219,46,.75);}
</style>
</head>
<body>
<div id="stage">
  <div class="aurora" id="a1"></div>
  <div class="aurora" id="a2"></div>
  <div class="aurora" id="a3"></div>
  <div class="aurora" id="a4"></div>
  <div id="leak"></div>

  <!-- S1 -->
  <section class="scene" data-s="0">
    <div class="ringwrap" data-a="pop" data-d="0.02">
      <div id="ring"></div>
      <div class="badge">${I.ghost}<span class="plus grad">+</span></div>
    </div>
    <h1 data-a="blurup" data-d="0.30"><span style="color:#fff">Snapchat</span><span class="grad">+</span></h1>
    <div class="pill" data-a="blurup" data-d="0.50">${I.spark}<span>ميزات حصرية و مميزة</span></div>
    <div class="sub" data-a="blurup" data-d="0.66">بأرخص ثمن في الجزائر 🇩🇿</div>
  </section>

  <!-- S2 -->
  <section class="scene" data-s="1">
    <div class="h2" data-a="blurup" data-d="0.02">كيفاش نخدمو؟ <span class="grad">ساهل ياسر</span></div>
    <div class="chip" data-a="blurright" data-d="0.22"><span class="itile">${I.lock}</span><span class="tx">بدون كلمة مرور</span></div>
    <div class="chip" data-a="blurright" data-d="0.38"><span class="itile">${I.nologin}</span><span class="tx">بدون تسجيل دخول</span></div>
    <div class="chip" data-a="blurright" data-d="0.54"><span class="itile">${I.gift}</span><span class="tx">غير أضفني كصديق و نبعتولك Gift</span></div>
  </section>

  <!-- S3 -->
  <section class="scene" data-s="2">
    <div class="h2" data-a="blurup" data-d="0.02">إختار العرض اللي يناسبك <span class="grad">🏷️</span></div>
    <div class="card" data-a="pop" data-d="0.22">
      <div class="dur"><span class="n grad">3</span><span class="u">أشهر</span></div>
      <div class="price"><span class="v grad">1500</span><span class="c">دج</span></div>
    </div>
    <div class="card" data-a="pop" data-d="0.36">
      <div class="dur"><span class="n grad">6</span><span class="u">أشهر</span></div>
      <div class="price"><span class="v grad">2500</span><span class="c">دج</span></div>
    </div>
    <div class="card best" data-a="pop" data-d="0.50">
      <div class="tag">${I.diamond}<span>الأوفر</span></div>
      <div class="dur"><span class="n grad">12</span><span class="u">شهر</span></div>
      <div class="price"><span class="v grad">4500</span><span class="c">دج</span></div>
    </div>
  </section>

  <!-- S4 -->
  <section class="scene" data-s="3">
    <div class="badges">
      <div class="tb" data-a="blurup" data-d="0.04">${I.shield}<span>100% آمن</span></div>
      <div class="tb" data-a="blurup" data-d="0.12">${I.bolt}<span>تفعيل سريع</span></div>
      <div class="tb" data-a="blurup" data-d="0.20">${I.check}<span>ثقة و ضمان</span></div>
    </div>
    <div class="cta" data-a="pop" data-d="0.32">${I.arrow}<span>أطلب الآن</span><span class="shine"></span></div>
    <div class="store grad" data-a="blurup" data-d="0.56">BNS Store</div>
    <div class="snap" data-a="blurup" data-d="0.70">${I.ghost}<span>i48446539</span></div>
    <div class="tl" data-a="blurup" data-d="0.84">أضفني و استلم Snapchat+ في دقائق</div>
  </section>

  <div id="vig"></div>
  <div id="grain"></div>
  <div id="track"><div class="seg"><i></i></div><div class="seg"><i></i></div><div class="seg"><i></i></div><div class="seg"><i></i></div></div>
  <div id="wm">${I.ghost}<span>BNS STORE</span></div>
</div>

<script>
const T = 14.0;
const scenes = [ {s:0.0,e:3.3}, {s:3.0,e:6.8}, {s:6.5,e:11.2}, {s:10.9,e:14.0} ];
const ENTER=0.55, EXIT=0.42;
const clamp01=x=>x<0?0:x>1?1:x;
const outCubic=x=>1-Math.pow(1-x,3);
const outQuint=x=>1-Math.pow(1-x,5);
const outExpo=x=>x>=1?1:1-Math.pow(2,-10*x);
const outBack=x=>{const c1=1.6,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};

const stage=document.getElementById('stage');
const blobs=[
  {el:document.getElementById('a1'),x:220,y:340,ax:120,ay:90,sp:0.19,ph:0},
  {el:document.getElementById('a2'),x:820,y:560,ax:140,ay:110,sp:0.15,ph:2.1},
  {el:document.getElementById('a3'),x:300,y:1360,ax:150,ay:130,sp:0.13,ph:4.0},
  {el:document.getElementById('a4'),x:800,y:1500,ax:130,ay:120,sp:0.17,ph:1.0},
];

const sceneEls=[...document.querySelectorAll('.scene')];
const kids=new Map();
document.querySelectorAll('[data-a]').forEach(ch=>kids.set(ch,{a:ch.dataset.a,d:parseFloat(ch.dataset.d)}));
const DUR=0.60;

function child(ch,cfg,tin){
  const p=clamp01((tin-cfg.d)/DUR);
  let op=clamp01(p*1.25), tf='', fl='none';
  if(cfg.a==='pop'){const e=outBack(p);const s=0.62+e*0.38;tf='scale('+s+')';if(p<1)fl='blur('+(1-outExpo(p))*10+'px)';}
  else if(cfg.a==='blurup'){const e=outQuint(p);tf='translateY('+(1-e)*40+'px)';if(p<1)fl='blur('+(1-outExpo(p))*13+'px)';}
  else if(cfg.a==='blurright'){const e=outQuint(p);tf='translateX('+(1-e)*130+'px)';if(p<1)fl='blur('+(1-outExpo(p))*13+'px)';}
  ch.style.opacity=op;ch.style.transform=tf;ch.style.filter=fl;
}

window.render=function(t){
  for(const b of blobs){
    const x=b.x+Math.sin(t*b.sp+b.ph)*b.ax, y=b.y+Math.cos(t*b.sp*0.85+b.ph)*b.ay;
    b.el.style.transform='translate('+(x-b.el.offsetWidth/2)+'px,'+(y-b.el.offsetHeight/2)+'px)';
  }

  document.getElementById('leak').style.transform='translateX('+((t/T*2-0.5)*900)+'px) rotate(6deg)';
  const segs=document.querySelectorAll('#track .seg i');
  scenes.forEach((sc,i)=>{segs[i].style.width=clamp01((t-sc.s)/(sc.e-sc.s))*100+'%';});

  scenes.forEach((sc,i)=>{
    const el=sceneEls[i];
    if(t>=sc.s-0.001 && t<=sc.e+0.4){
      const tin=t-sc.s;
      const en=outCubic(clamp01(tin/ENTER));
      const ex=outCubic(clamp01((sc.e-t)/EXIT));
      el.style.display='flex';
      el.style.opacity=en*ex;
      el.style.transform='translateY('+((1-en)*30 - (1-ex)*24)+'px) scale('+(0.97+en*0.03-(1-ex)*0.03)+')';
      el.querySelectorAll('[data-a]').forEach(ch=>child(ch,kids.get(ch),tin));
      if(i===0){
        document.getElementById('ring').style.setProperty('--r',(t*70)+'deg');
        const bw=el.querySelector('.ringwrap');const fl=Math.sin(t*1.6)*10;
        if(tin>0.7) bw.style.transform='scale(1) translateY('+fl+'px)';
      }
      if(i===2){const best=el.querySelector('.card.best');best.style.setProperty('--a',(t*110)+'deg');}
      if(i===3){
        const cta=el.querySelector('.cta');const ct=t-sc.s-0.32-0.5;
        if(ct>0){cta.style.transform='scale('+(1+0.03*Math.sin(ct*6.5))+')';
          cta.querySelector('.shine').style.setProperty('--sx',(((ct*0.42)%1.6-0.2)*1100-260)+'px');}
      }
    } else { el.style.display='none'; el.style.opacity=0; }
  });
};
window.render(0);
document.fonts.ready.then(()=>{window.__fontsReady=true;});
</script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('wrote index.html', (html.length/1024).toFixed(0)+'KB');
