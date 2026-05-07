// Animated routing-flow demo on the homepage.
// Cycles through stages, lighting each one in sequence with a smooth
// hand-off arrow in between. Restarts after a pause.

(function () {
  const root = document.getElementById('flow');
  if (!root) return;

  const stages = Array.from(root.querySelectorAll('.flow-stage'));
  const arrows = Array.from(root.querySelectorAll('.flow-arrow'));
  if (stages.length === 0) return;

  // Per-stage dwell (ms). Tune for readability vs pace.
  const DWELL = 2200;
  const ARROW_GAP = 600;     // time arrow lights up before next stage
  const RESET_GAP = 1800;    // pause after final stage before restarting

  let index = 0;
  let running = true;

  function clearAll() {
    stages.forEach((s) => s.classList.remove('active'));
    arrows.forEach((a) => a.classList.remove('active'));
  }

  function activate(i) {
    clearAll();
    stages[i].classList.add('active');
  }

  async function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function cycle() {
    while (running) {
      for (let i = 0; i < stages.length; i++) {
        activate(i);
        await delay(DWELL);

        // light up the arrow that connects this stage to the next
        if (i < arrows.length && i < stages.length - 1) {
          arrows[i].classList.add('active');
          await delay(ARROW_GAP);
        }
      }
      await delay(RESET_GAP);
    }
  }

  // Pause animation when the section is off-screen so we don't
  // burn cycles on a page the user isn't looking at.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        running = e.isIntersecting;
        if (running) cycle();
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(root);
})();
