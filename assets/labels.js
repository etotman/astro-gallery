// Object labels over the hero image: show/hide, small objects, colour and opacity (remembered per viewer).
(function () {
  const fig = document.querySelector('.hero .labels') && document.querySelector('.hero .labels').closest('.hero');
  const ctl = fig && fig.querySelector('.lctl');
  if (!fig || !ctl) return;
  const KEY = 'gallery-labels';
  let st = { on: false, all: false, c: '#d9b77a', o: 85 };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage blocked */ }
  const toggle = ctl.querySelector('.ltoggle');
  const all = ctl.querySelector('.lall input');
  const pick = ctl.querySelector('input[type=color]');
  const op = ctl.querySelector('.lop input');
  const swatches = ctl.querySelectorAll('.lcolor button');

  function apply() {
    fig.classList.toggle('labels-on', st.on);
    fig.classList.toggle('labels-all', st.all);
    fig.style.setProperty('--lc', st.c);
    fig.style.setProperty('--lo', st.o / 100);
    toggle.setAttribute('aria-pressed', st.on);
    toggle.textContent = st.on ? 'Hide labels' : "Show what's in this picture";
    all.checked = st.all;
    pick.value = st.c;
    op.value = st.o;
    swatches.forEach(b => b.classList.toggle('sel', b.dataset.c.toLowerCase() === st.c.toLowerCase()));
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage blocked */ }
    setTimeout(fitNames, 30);
  }
  // Name placement at the size the picture is actually shown: in priority order (the page lists labels most
  // important first), each name candidate tries right, left, above, below its ring and takes the first spot
  // inside the picture that clears names already placed and every other ring; otherwise it stays hidden
  // (hover or tap its ring). Rings are obstacles only by their outline when they are large (a whole galaxy).
  const POS = ['p-r', 'p-l', 'p-t', 'p-b'];
  function fitNames() {
    if (!fig.classList.contains('labels-on')) return;
    const box = fig.querySelector('.labels').getBoundingClientRect();
    if (!box.width) return;
    const shown = [...fig.querySelectorAll('.lbl')].filter(l => getComputedStyle(l).display !== 'none');
    const rings = shown.map(l => {
      const r = l.querySelector('.ring');
      if (!r) return null;
      const q = r.getBoundingClientRect();
      return { l, x: q.left + q.width / 2, y: q.top + q.height / 2, r: q.width / 2 };
    }).filter(Boolean);
    const placed = [];
    const overlaps = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    function hitsRing(q, own) {
      for (const c of rings) {
        if (c.l === own) continue;
        const nx = Math.min(Math.max(c.x, q.left), q.right), ny = Math.min(Math.max(c.y, q.top), q.bottom);
        const near = Math.hypot(nx - c.x, ny - c.y);
        if (c.r > 60) {
          const fx = Math.max(Math.abs(q.left - c.x), Math.abs(q.right - c.x));
          const fy = Math.max(Math.abs(q.top - c.y), Math.abs(q.bottom - c.y));
          if (near < c.r + 2 && Math.hypot(fx, fy) > c.r - 2) return true;
        } else if (near < c.r + 2) return true;
      }
      return false;
    }
    shown.forEach(l => {
      if (!l.classList.contains('cand')) return;
      const b = l.querySelector('b');
      l.classList.add('on');
      let ok = false;
      for (const p of POS) {
        l.classList.remove(...POS); l.classList.add(p);
        const q = b.getBoundingClientRect();
        const g = { left: q.left - 3, right: q.right + 3, top: q.top - 1, bottom: q.bottom + 1 };
        if (q.left < box.left + 1 || q.right > box.right - 1 || q.top < box.top + 1 || q.bottom > box.bottom - 1) continue;
        if (placed.some(p2 => overlaps(g, p2)) || hitsRing(g, l)) continue;
        placed.push(g); ok = true; break;
      }
      if (!ok) { l.classList.remove('on', ...POS); l.classList.add('p-r'); }
    });
  }
  window.addEventListener('resize', () => setTimeout(fitNames, 30));
  const heroImg = fig.querySelector('.zoom img');
  if (heroImg && !heroImg.complete) heroImg.addEventListener('load', () => setTimeout(fitNames, 30));
  if (document.fonts) document.fonts.ready.then(() => setTimeout(fitNames, 30));
  toggle.addEventListener('click', () => { st.on = !st.on; apply(); });
  all.addEventListener('change', () => { st.all = all.checked; if (st.all) st.on = true; apply(); });
  swatches.forEach(b => b.addEventListener('click', () => { st.c = b.dataset.c; st.on = true; apply(); }));
  pick.addEventListener('input', () => { st.c = pick.value; st.on = true; apply(); });
  op.addEventListener('input', () => { st.o = +op.value; apply(); });

  // tap/hover a marker for its details; a tap on a marker must not open the full-resolution viewer
  fig.querySelectorAll('.lbl').forEach(l => {
    l.addEventListener('click', e => {
      if (!fig.classList.contains('labels-on')) return;
      e.preventDefault(); e.stopPropagation();
      const was = l.classList.contains('tip');
      fig.querySelectorAll('.lbl.tip').forEach(x => x.classList.remove('tip'));
      if (!was) l.classList.add('tip');
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.lbl')) fig.querySelectorAll('.lbl.tip').forEach(x => x.classList.remove('tip'));
  });
  apply();
})();
