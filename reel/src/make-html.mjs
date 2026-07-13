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

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
${faces}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
html,body{width:1080px;height:1920px;overflow:hidden;background:#08080c;}
body{font-family:'Cairo','Noto Color Emoji',sans-serif;position:relative;}
#stage{position:absolute;inset:0;width:1080px;height:1920px;overflow:hidden;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(255,224,0,.10), transparent 55%),
    radial-gradient(90% 60% at 50% 115%, rgba(255,224,0,.08), transparent 55%),
    linear-gradient(160deg,#0c0c12 0%,#0a0a10 45%,#070709 100%);}
#glow{position:absolute;left:50%;top:50%;width:1400px;height:1400px;transform:translate(-50%,-50%);
  background:radial-gradient(circle, rgba(255,220,0,.14), rgba(255,220,0,.05) 35%, transparent 60%);
  filter:blur(10px);pointer-events:none;}
#vig{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,.55));}
.spark{position:absolute;border-radius:50%;background:#ffe600;
  box-shadow:0 0 12px 2px rgba(255,230,0,.7);will-change:transform,opacity;}
.scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:0 96px;will-change:transform,opacity;opacity:0;}
.brandwrap{display:flex;flex-direction:column;align-items:center;gap:28px;}
.badge{width:340px;height:340px;border-radius:78px;position:relative;
  background:linear-gradient(160deg,#1a1a22,#0e0e14);
  box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 2px 0 rgba(255,255,255,.06),0 0 0 2px rgba(255,230,0,.18);
  display:flex;align-items:center;justify-content:center;}
.ghost{width:190px;height:190px;filter:drop-shadow(0 0 26px rgba(255,230,0,.9));}
.plus{position:absolute;top:34px;right:40px;font-size:96px;font-weight:900;color:#ffe600;line-height:.8;
  text-shadow:0 0 24px rgba(255,230,0,.8);}
h1{font-size:118px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1;direction:ltr;}
h1 .p{color:#ffe600;}
.sub{font-size:44px;font-weight:600;color:#c9c9d4;}
.kick{font-size:40px;font-weight:800;color:#ffe600;background:rgba(255,230,0,.10);
  border:1.5px solid rgba(255,230,0,.35);padding:14px 34px;border-radius:100px;}
.h2{font-size:78px;font-weight:900;color:#fff;margin-bottom:56px;text-align:center;line-height:1.1;}
.h2 .y{color:#ffe600;}
.chip{display:flex;align-items:center;gap:26px;width:820px;background:linear-gradient(180deg,#16161f,#101017);
  border:1.5px solid rgba(255,255,255,.07);border-radius:34px;padding:34px 40px;
  box-shadow:0 18px 44px rgba(0,0,0,.45);will-change:transform,opacity;}
.chip .ic{font-size:64px;flex:0 0 auto;}
.chip .tx{font-size:46px;font-weight:700;color:#f2f2f7;}
.chip+.chip{margin-top:30px;}
.card{display:flex;align-items:center;justify-content:space-between;width:840px;
  background:linear-gradient(180deg,#17171f,#101017);border:1.5px solid rgba(255,255,255,.08);
  border-radius:40px;padding:30px 44px;box-shadow:0 20px 50px rgba(0,0,0,.5);position:relative;
  will-change:transform,opacity;}
.card+.card{margin-top:34px;}
.card.best{border-color:rgba(255,230,0,.55);box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 40px rgba(255,230,0,.18);}
.dur{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  background:#0c0c11;border:1.5px solid rgba(255,255,255,.08);border-radius:26px;
  padding:22px 30px;min-width:220px;}
.dur .n{font-size:66px;font-weight:900;color:#fff;line-height:1;}
.dur .u{font-size:34px;font-weight:700;color:#a9a9b6;}
.price{display:flex;align-items:baseline;gap:14px;}
.price .v{font-size:104px;font-weight:900;color:#ffe600;line-height:.9;direction:ltr;letter-spacing:-1px;text-shadow:0 0 30px rgba(255,230,0,.45);}
.dur .n{direction:ltr;}
.price .c{font-size:46px;font-weight:800;color:#fff;}
.tag{position:absolute;top:-26px;left:44px;background:#ffe600;color:#111;font-weight:900;font-size:30px;
  padding:8px 22px;border-radius:100px;box-shadow:0 8px 20px rgba(255,230,0,.35);}
.badges{display:flex;gap:22px;flex-wrap:wrap;justify-content:center;margin-bottom:64px;}
.tb{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.09);
  border-radius:100px;padding:18px 30px;font-size:38px;font-weight:700;color:#eaeaf0;}
.cta{font-size:104px;font-weight:900;color:#111;background:linear-gradient(180deg,#ffe600,#ffcf00);
  padding:30px 74px;border-radius:40px;box-shadow:0 26px 60px rgba(255,220,0,.4),inset 0 2px 0 rgba(255,255,255,.5);
  will-change:transform;line-height:1;}
.store{font-size:92px;font-weight:900;color:#fff;margin-top:56px;letter-spacing:1px;}
.snap{display:flex;align-items:center;gap:20px;margin-top:26px;font-size:52px;font-weight:800;color:#ffe600;}
.snap .g{width:66px;height:66px;filter:drop-shadow(0 0 14px rgba(255,230,0,.7));}
.tl{font-size:40px;font-weight:600;color:#c9c9d4;margin-top:30px;text-align:center;}
#bar{position:absolute;left:0;bottom:0;height:9px;background:linear-gradient(90deg,#ffe600,#ff9d00);
  box-shadow:0 0 18px rgba(255,220,0,.6);width:0;}
#watermark{position:absolute;bottom:44px;left:0;right:0;text-align:center;font-size:32px;font-weight:800;
  color:rgba(255,255,255,.55);letter-spacing:2px;}
</style>
</head>
<body>
<div id="stage">
  <div id="glow"></div>

  <!-- S1 HOOK -->
  <section class="scene" data-s="0">
    <div class="brandwrap">
      <div class="badge" data-a="pop" data-d="0.05">
        <svg class="ghost" viewBox="0 0 32 32" fill="#ffe600"><path d="M16 2C10.5 2 6.8 6 6.8 11.4c0 2.1.1 4.6-.2 6.3-.2 1.3-.9 2.2-1.9 2.9-.6.4-1 .8-1 1.5 0 .9.8 1.4 1.7 1.7 1.1.4 1.8.6 2.4 1.6.2.3.3.7.6 1 .4.4 1 .4 1.7.2.6-.1 1.3-.3 2.1.1.7.3 1.4 1.2 3.3 1.2s2.6-.9 3.3-1.2c.8-.4 1.5-.2 2.1-.1.7.2 1.3.2 1.7-.2.3-.3.4-.7.6-1 .6-1 1.3-1.2 2.4-1.6.9-.3 1.7-.8 1.7-1.7 0-.7-.4-1.1-1-1.5-1-.7-1.7-1.6-1.9-2.9-.3-1.7-.2-4.2-.2-6.3C25.2 6 21.5 2 16 2z"/></svg>
        <span class="plus">+</span>
      </div>
      <h1 data-a="up" data-d="0.28">Snapchat<span class="p">+</span></h1>
      <div class="kick" data-a="up" data-d="0.46">ميزات حصرية و مميزة ✨</div>
      <div class="sub" data-a="up" data-d="0.62">بأرخص ثمن في الجزائر 🇩🇿🔥</div>
    </div>
  </section>

  <!-- S2 FEATURES -->
  <section class="scene" data-s="1">
    <div class="h2">كيفاش نخدمو؟ <span class="y">ساهل ياسر 👇</span></div>
    <div class="chip" data-a="right" data-d="0.22"><span class="ic">🔒</span><span class="tx">بدون كلمة مرور</span></div>
    <div class="chip" data-a="right" data-d="0.40"><span class="ic">🚪</span><span class="tx">بدون تسجيل دخول</span></div>
    <div class="chip" data-a="right" data-d="0.58"><span class="ic">🎁</span><span class="tx">غير أضفني كصديق و نبعتولك Gift</span></div>
  </section>

  <!-- S3 PRICES -->
  <section class="scene" data-s="2">
    <div class="h2">الأثمنة <span class="y">🏷️</span></div>
    <div class="card" data-a="pop" data-d="0.22">
      <div class="dur"><span class="n">3</span><span class="u">أشهر</span></div>
      <div class="price"><span class="v">1500</span><span class="c">دج</span></div>
    </div>
    <div class="card" data-a="pop" data-d="0.40">
      <div class="dur"><span class="n">6</span><span class="u">أشهر</span></div>
      <div class="price"><span class="v">2500</span><span class="c">دج</span></div>
    </div>
    <div class="card best" data-a="pop" data-d="0.58">
      <div class="tag">💎 الأوفر</div>
      <div class="dur"><span class="n">12</span><span class="u">شهر</span></div>
      <div class="price"><span class="v">4500</span><span class="c">دج</span></div>
    </div>
  </section>

  <!-- S4 CTA -->
  <section class="scene" data-s="3">
    <div class="badges">
      <div class="tb" data-a="up" data-d="0.05">🛡️ 100% آمن</div>
      <div class="tb" data-a="up" data-d="0.14">⚡ تفعيل سريع</div>
      <div class="tb" data-a="up" data-d="0.23">✅ ثقة و ضمان</div>
    </div>
    <div class="cta" data-a="pop" data-d="0.34">أطلب الآن ! 🚀</div>
    <div class="store" data-a="up" data-d="0.58">BNS Store</div>
    <div class="snap" data-a="up" data-d="0.72">
      <svg class="g" viewBox="0 0 32 32" fill="#ffe600"><path d="M16 2C10.5 2 6.8 6 6.8 11.4c0 2.1.1 4.6-.2 6.3-.2 1.3-.9 2.2-1.9 2.9-.6.4-1 .8-1 1.5 0 .9.8 1.4 1.7 1.7 1.1.4 1.8.6 2.4 1.6.2.3.3.7.6 1 .4.4 1 .4 1.7.2.6-.1 1.3-.3 2.1.1.7.3 1.4 1.2 3.3 1.2s2.6-.9 3.3-1.2c.8-.4 1.5-.2 2.1-.1.7.2 1.3.2 1.7-.2.3-.3.4-.7.6-1 .6-1 1.3-1.2 2.4-1.6.9-.3 1.7-.8 1.7-1.7 0-.7-.4-1.1-1-1.5-1-.7-1.7-1.6-1.9-2.9-.3-1.7-.2-4.2-.2-6.3C25.2 6 21.5 2 16 2z"/></svg>
      <span>i48446539</span>
    </div>
    <div class="tl" data-a="up" data-d="0.86">أضفني و استلم Snapchat+ في دقائق</div>
  </section>

  <div id="vig"></div>
  <div id="bar"></div>
  <div id="watermark">👻 BNS STORE</div>
</div>

<script>
const T = 14.0;
const scenes = [
  {s:0.0, e:3.2},
  {s:2.9, e:6.7},
  {s:6.4, e:11.1},
  {s:10.8, e:14.0},
];
const ENTER=0.55, EXIT=0.45;
const clamp01=x=>x<0?0:x>1?1:x;
const outCubic=x=>1-Math.pow(1-x,3);
const inCubic=x=>x*x*x;
const outBack=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};

// particles
const stage=document.getElementById('stage');
const parts=[];
for(let i=0;i<26;i++){
  const el=document.createElement('div');el.className='spark';
  const sz=2+Math.random()*7;el.style.width=sz+'px';el.style.height=sz+'px';
  const p={el,x:Math.random()*1080,y:Math.random()*1920,sp:26+Math.random()*60,
    ph:Math.random()*6.28,tw:0.6+Math.random()*1.8,dr:(Math.random()-.5)*26};
  parts.push(p);stage.insertBefore(el,document.getElementById('vig'));
}

const sceneEls=[...document.querySelectorAll('.scene')];
const childData=new Map();
sceneEls.forEach(sc=>{
  [...sc.children].forEach(ch=>{
    if(ch.dataset.a) childData.set(ch,{a:ch.dataset.a,d:parseFloat(ch.dataset.d)});
  });
});
// nested (brandwrap children)
document.querySelectorAll('[data-a]').forEach(ch=>{
  if(!childData.has(ch)) childData.set(ch,{a:ch.dataset.a,d:parseFloat(ch.dataset.d)});
});

function applyChild(ch, cfg, tin){
  const p=clamp01((tin-cfg.d)/0.5);
  let op=p, tf='';
  if(cfg.a==='pop'){const s=0.4+outBack(p)*0.6;op=clamp01(p*1.4);tf='scale('+s+')';}
  else if(cfg.a==='up'){const y=(1-outCubic(p))*46;op=p;tf='translateY('+y+'px)';}
  else if(cfg.a==='right'){const x=(1-outCubic(p))*140;op=p;tf='translateX('+x+'px)';}
  ch.style.opacity=op;
  ch.style.transform=tf;
}

window.render=function(t){
  // background
  const glow=document.getElementById('glow');
  const gp=0.55+0.45*Math.sin(t*1.25);
  glow.style.opacity=(0.6+gp*0.4);
  glow.style.transform='translate(-50%,-50%) scale('+(0.92+gp*0.12)+')';
  document.getElementById('bar').style.width=clamp01(t/T)*1080+'px';
  for(const p of parts){
    let y=p.y-(t*p.sp);
    y=((y%1980)+1980)%1980-30;
    const x=p.x+Math.sin(t*0.6+p.ph)*p.dr;
    const tw=0.25+0.75*(0.5+0.5*Math.sin(t*p.tw+p.ph));
    p.el.style.transform='translate('+x+'px,'+y+'px)';
    p.el.style.opacity=tw*0.85;
  }
  // scenes
  scenes.forEach((sc,i)=>{
    const el=sceneEls[i];
    let vis=0, wtf='';
    if(t>=sc.s-0.001 && t<=sc.e+0.001){
      const tin=t-sc.s;
      const en=clamp01(tin/ENTER);
      const exRaw=(sc.e-t);
      const ex=clamp01(exRaw/EXIT);
      const enE=outCubic(en), exE=outCubic(ex);
      vis=enE*exE;
      const yIn=(1-enE)*44;
      const scl=0.94+enE*0.06 + (1-exE)*0.05;
      wtf='translateY('+yIn+'px) scale('+scl+')';
      el.style.display='flex';
      // children enter (ride wrapper for exit)
      el.querySelectorAll('[data-a]').forEach(ch=>{
        applyChild(ch, childData.get(ch), tin);
      });
      // cta pulse
      if(i===3){
        const cta=el.querySelector('.cta');
        const ct=t-sc.s-0.34-0.5;
        if(ct>0){const ps=1+0.035*Math.sin(ct*7.5);cta.style.transform='scale('+ps+')';}
      }
    } else {
      el.style.display='none';
    }
    el.style.opacity=vis;
    if(vis>0) el.style.transform=wtf;
  });
};
window.render(0);
document.fonts.ready.then(()=>{window.__fontsReady=true;});
</script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('wrote index.html', (html.length/1024).toFixed(0)+'KB');
