// Mouse parallax — updates --mx / --my CSS vars on body
// Different background layers translate at different speeds
// to create depth (set in style.css).

(function () {
  if (window.matchMedia('(hover: none)').matches) return; // skip on touch devices

  const root = document.documentElement;
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rafId = null;

  function onMove(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Map mouse position to range [-30, 30] px
    targetX = ((e.clientX / w) - 0.5) * 60;
    targetY = ((e.clientY / h) - 0.5) * 60;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    // Smooth interpolation toward target
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    root.style.setProperty('--mx', currentX.toFixed(2) + 'px');
    root.style.setProperty('--my', currentY.toFixed(2) + 'px');

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  window.addEventListener('mousemove', onMove, { passive: true });
})();
