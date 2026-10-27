(() => {
  'use strict';
  const $ = q => document.querySelector(q);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Empty until the owner publishes something. Supports local .html files or https links.
  const content = window.SITE_CONTENT || { projects:[], writeups:[] };
  for(const [key,id] of [['projects','project'],['writeups','writeup']]) {
    const items = content[key];
    const mount = $(`#${id}-entries`);
    if(!mount || !Array.isArray(items) || !items.length) continue;
    mount.innerHTML = items.map(item => {
      const link = typeof item.href === 'string' && (/^https?:\/\//.test(item.href) || /^(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.html$/.test(item.href)) ? item.href : '#';
      return `<a class="entry" href="${esc(link)}"><div><h2>${esc(item.title || 'Untitled')}</h2><p>${esc(item.summary || '')}</p></div><div class="entry-meta">${esc(item.date || item.tag || '')} &nbsp; <span class="entry-arrow">↗</span></div></a>`;
    }).join('');
    mount.hidden = false;
    $(`#${id}-empty`).hidden = true;
  }
  const year = $('#year'); if(year) year.textContent = String(new Date().getFullYear());

  const button=$('#menu-toggle'), menu=$('#mobile-nav');
  if(button && menu) {
    const close=()=>{menu.hidden=true;button.setAttribute('aria-expanded','false');};
    button.addEventListener('click',()=>{const shouldOpen=menu.hidden;menu.hidden=!shouldOpen;button.setAttribute('aria-expanded',String(shouldOpen));});
    document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});
    window.addEventListener('resize',()=>{if(innerWidth>780)close();});
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  }

  // Two independent pointers: the dot is instant; only the ring trails.
  // Keep their last position between static HTML pages so neither flies in
  // from the upper-left on navigation.
  const precisionMedia = window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  if (precisionMedia.matches) {
    const ring = $('#precision-cursor');
    if (ring) {
      document.documentElement.classList.add('precision-active');
      const dot = $('#precision-dot'); // In the HTML already, so it can appear on the very first paint.
      const KEY = 'portfolio-pointer-v1';
      const readLast = () => {
        try { const s = sessionStorage.getItem(KEY); if (s) return JSON.parse(s); } catch {}
        try { if (window.name.startsWith(KEY + ':')) return JSON.parse(window.name.slice(KEY.length + 1)); } catch {}
        return null;
      };
      const save = (x, y) => {
        const serialized = JSON.stringify({ x, y });
        try { sessionStorage.setItem(KEY, serialized); } catch {}
        try { window.name = KEY + ':' + serialized; } catch {}
      };
      let x = null, y = null, rx = null, ry = null, lastFrame = 0;
      const position = (el, cx, cy) => {
        el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      };
      const hoverAt = (cx, cy) => {
        const target = document.elementFromPoint(cx, cy);
        ring.classList.toggle('on-link', !!target?.closest('a,button'));
      };
      const setVisibility = (visible) => {
        ring.style.opacity = dot.style.opacity = visible ? '1' : '0';
      };
      const prior = readLast();
      if (prior && Number.isFinite(prior.x) && Number.isFinite(prior.y)) {
        x = rx = Math.max(0, Math.min(innerWidth, prior.x));
        y = ry = Math.max(0, Math.min(innerHeight, prior.y));
        position(dot, x, y);
        position(ring, rx, ry);
        setVisibility(true);
        hoverAt(x, y);
      }
      const animateRing = time => {
        if (x !== null) {
          if (rx === null) { rx = x; ry = y; }
          const delta = Math.min(64, lastFrame ? time - lastFrame : 16.7);
          // Time-based smoothing is consistent at 60, 120 and 144 Hz.
          const ease = 1 - Math.exp(-delta / 62);
          rx += (x - rx) * ease;
          ry += (y - ry) * ease;
          position(ring, rx, ry);
        }
        lastFrame = time;
        requestAnimationFrame(animateRing);
      };
      requestAnimationFrame(animateRing);
      document.addEventListener('pointermove', e => {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        x = e.clientX; y = e.clientY;
        if (rx === null) { rx = x; ry = y; position(ring, rx, ry); }
        // Never ease the dot: it stays precisely under the physical pointer.
        position(dot, x, y);
        setVisibility(true);
        hoverAt(x, y);
        save(x, y);
      }, { passive: true });
      document.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') save(e.clientX, e.clientY);
      }, { passive: true });
      document.addEventListener('pointerleave', () => setVisibility(false));
      document.addEventListener('pointerenter', () => { if (x !== null) setVisibility(true); });
      window.addEventListener('pagehide', () => { if (x !== null) save(x, y); });
    }
  }

  // Slow background of technical-looking hexadecimal traces, drawn with canvas.
  // Original procedural artwork; no external assets, logos, fonts or requests.
  const canvas=$('#terminal-canvas');
  if(canvas) {
    const ctx=canvas.getContext('2d',{alpha:true});
    if(ctx) {
      const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const home=document.body.classList.contains('page-home');
      let width=0,height=0,dpr=1,columns=[],frameID=0,last=0,running=true;
      const spacingX=23,spacingY=23;

      // Fixed seeded generator keeps the texture consistent across reloads.
      let seed=927418;
      const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
      const bytes=Array.from({length:256},(_,n)=>n.toString(16).padStart(2,'0').toUpperCase());
      const resize=()=>{
        width=innerWidth;height=innerHeight;
        dpr=Math.min(devicePixelRatio||1,2);
        canvas.width=Math.round(width*dpr);
        canvas.height=Math.round(height*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0);
        // Slight overscan means the columns remain orderly at different sizes.
        const count=Math.ceil(width/spacingX)+2;
        columns=Array.from({length:count},(_,i)=>({
          x:i*spacingX+5,
          offset:rand()*spacingY,
          speed:5+rand()*10, // pixels per second, intentionally very slow
          seed:Math.floor(rand()*256),
          red:rand()<.11,
          phase:rand()*Math.PI*2
        }));
      };
      const paint=(t,dt)=>{
        ctx.clearRect(0,0,width,height);
        ctx.font='10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        ctx.textBaseline='top';
        if(!reduce){
          for(const col of columns)col.offset=(col.offset+col.speed*dt/1000)%spacingY;
        }
        const start=width<780?width*.57:width*.43;
        const fadeDistance=Math.max(1,width-start);
        const rows=Math.ceil(height/spacingY)+2;
        for(const col of columns){
          if(col.x<start)continue;
          const fade=Math.pow(Math.min(1,(col.x-start)/fadeDistance),1.45);
          // Subtle column variation rather than obvious glowing waterfall strips.
          const shift=Math.floor(t*.001*col.speed/spacingY);
          for(let row=-1;row<rows;row++){
            const y=row*spacingY+col.offset;
            if(y < -spacingY || y>height)continue;
            const n=(col.seed+row*37+shift*11)&255;
            const binary=bytes[n];
            const wave=(Math.sin(row*.7+col.phase+t*.00033)+1)*.5;
            const sparse=(n%19===0);
            const alpha=fade*(home ? 0.074 : 0.065)*(0.40+wave*.60);
            if(col.red && sparse){
              ctx.fillStyle=`rgba(202,76,76,${Math.min(.18,alpha*2.05)})`;
            }else{
              ctx.fillStyle=`rgba(175,188,181,${alpha})`;
            }
            ctx.fillText(binary,col.x,y);
          }
        }
      };
      const frame=(t)=>{
        if(!running)return;
        if(!last)last=t;
        const dt=Math.min(75,t-last);
        // ~24fps is sufficient for a background this slow.
        if(t-last>=40){paint(t,dt);last=t;}
        frameID=requestAnimationFrame(frame);
      };
      resize();
      window.addEventListener('resize',()=>{resize();paint(performance.now(),0);},{passive:true});
      // Static frame for accessibility and when the tab is backgrounded.
      if(reduce){paint(0,0);}
      else {
        frameID=requestAnimationFrame(frame);
        document.addEventListener('visibilitychange',()=>{
          if(document.hidden){cancelAnimationFrame(frameID);running=false;}
          else {running=true;last=0;frameID=requestAnimationFrame(frame);}
        });
      }
    }
  }
})();
