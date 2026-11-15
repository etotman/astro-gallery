// Full-resolution viewer: wheel / pinch zoom around the pointer, drag to pan, double-click toggles fit / 1:1.
(function () {
  const btn = document.querySelector('.zoom');
  const viewer = document.querySelector('.viewer');
  if (!btn || !viewer) return;
  const stage = viewer.querySelector('.stage');
  const img = stage.querySelector('img');
  const W = +btn.dataset.w, H = +btn.dataset.h;
  let s = 1, x = 0, y = 0, fit = 1, lastFocus = null;
  const ptrs = new Map();
  let pinch = null, drag = null;

  const apply = () => { img.style.transform = `translate(${x}px,${y}px) scale(${s})`; };
  function clamp() {
    const vw = stage.clientWidth, vh = stage.clientHeight, w = W * s, h = H * s;
    x = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, x));
    y = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, y));
  }
  function fitView() {
    fit = Math.min(stage.clientWidth / W, stage.clientHeight / H);
    s = fit; clamp(); apply();
  }
  function zoomAt(f, cx, cy) {
    const ns = Math.min(Math.max(s * f, fit), 4);
    x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns; clamp(); apply();
  }

  function open() {
    lastFocus = document.activeElement;
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    img.width = W; img.height = H;
    if (!img.src) {
      img.src = btn.querySelector('img').src;          // show the display copy at once
      stage.classList.add('loading');
      const full = new Image();
      full.onload = () => { img.src = full.src; stage.classList.remove('loading'); };
      full.src = btn.dataset.full;
    }
    fitView();
    viewer.querySelector('.vclose').focus();
  }
  function close() {
    viewer.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  btn.addEventListener('click', open);
  viewer.querySelector('.vclose').addEventListener('click', close);
  window.addEventListener('resize', () => { if (!viewer.hidden) { const was = s <= fit + 1e-6; fit = Math.min(stage.clientWidth / W, stage.clientHeight / H); if (was) s = fit; clamp(); apply(); } });

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  stage.addEventListener('dblclick', e => {
    const r = stage.getBoundingClientRect();
    if (s > fit * 1.05) fitView(); else zoomAt(1 / s, e.clientX - r.left, e.clientY - r.top);
  });

  stage.addEventListener('pointerdown', e => {
    stage.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s };
      drag = null;
    } else {
      drag = { x: e.clientX - x, y: e.clientY - y };
      stage.classList.add('drag');
    }
  });
  stage.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const r = stage.getBoundingClientRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(pinch.s * d / pinch.d / s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    } else if (drag) {
      x = e.clientX - drag.x; y = e.clientY - drag.y; clamp(); apply();
    }
  });
  const up = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) { drag = null; stage.classList.remove('drag'); }
    else if (ptrs.size === 1) { const p = [...ptrs.values()][0]; drag = { x: p.x - x, y: p.y - y }; }
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);

  document.addEventListener('keydown', e => {
    if (!viewer.hidden) {
      const c = [stage.clientWidth / 2, stage.clientHeight / 2];
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') zoomAt(1.25, ...c);
      else if (e.key === '-') zoomAt(0.8, ...c);
      else if (e.key === '0') fitView();
      return;
    }
    if (e.target.closest('input, textarea')) return;
    const link = e.key === 'ArrowLeft' ? document.querySelector('a[rel=prev]') : e.key === 'ArrowRight' ? document.querySelector('a[rel=next]') : null;
    if (link) location.href = link.href;
  });
})();
