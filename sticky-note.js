(() => {
  const note = document.querySelector('.jess-note');
  const handle = document.getElementById('note-drag');
  const reset = document.getElementById('note-reset');
  if (!note || !handle || !reset) return;
  let x = 0, y = 0, drag = null;
  const paint = () => {
    note.style.setProperty('--note-x', `${x}px`);
    note.style.setProperty('--note-y', `${y}px`);
    reset.hidden = x === 0 && y === 0;
  };
  function move(dx, dy) {
    const box = note.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - box.width - 8);
    const bottom = Math.max(8, window.innerHeight - box.height - 8);
    x += Math.min(right, Math.max(8, box.left + dx)) - box.left;
    y += Math.min(bottom, Math.max(8, box.top + dy)) - box.top;
    paint();
  }
  function finish() {
    if (!drag) return;
    const id = drag.id;
    drag = null;
    note.classList.remove('is-dragging');
    if (note.hasPointerCapture(id)) note.releasePointerCapture(id);
  }
  function restore() {
    finish();
    x = 0; y = 0; paint();
  }
  note.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    if (event.target.closest('button,a,input') && !event.target.closest('#note-drag')) return;
    // Touch scrolling stays natural outside the dedicated grip.
    if (event.pointerType !== 'mouse' && !event.target.closest('#note-drag')) return;
    event.preventDefault();
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY};
    note.setPointerCapture(event.pointerId);
    note.classList.add('is-dragging');
  });
  note.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    move(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX; drag.y = event.clientY;
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => note.addEventListener(type, finish));
  handle.addEventListener('keydown', event => {
    const step = event.shiftKey ? 40 : 10;
    const directions = {ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
    if (directions[event.key]) {event.preventDefault();move(...directions[event.key]);}
    if (event.key === 'Home' || event.key === 'Escape') {event.preventDefault();restore();}
  });
  reset.addEventListener('click', () => {restore();handle.focus();});
  window.addEventListener('resize', restore);
})();
