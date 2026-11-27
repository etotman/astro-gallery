// Sky map: click the small chart to open the large one in a dialog; click outside it, x, or Esc closes.
document.querySelectorAll('.skyopen').forEach(btn => {
  const dlg = btn.parentElement.querySelector('.skydlg');
  if (!dlg || !dlg.showModal) return;
  btn.addEventListener('click', () => dlg.showModal());
  dlg.querySelector('.skyclose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // backdrop
});
