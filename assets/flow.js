// Animated terminal session on the homepage.
// Looks like a real Python REPL — types commands character by character,
// streams JSON output, then runs the tool. Loops continuously.

(function () {
  const screen = document.getElementById('term-screen');
  if (!screen) return;

  const PROMPT = '<span class="t-prompt">&gt;&gt;&gt; </span>';
  const SHELL  = '<span class="t-prompt">$ </span>';

  // Sequence of steps. Types are:
  //   out  — system / banner output (appears instantly)
  //   cmd  — REPL command, prefix '>>> ', typed char by char
  //   sh   — shell command, prefix '$ ', typed char by char
  //   res  — multi-line response from a function call
  //   note — '# ...' comment line, typed slowly for emphasis
  //   wait — pause (ms)
  //   clear — clear the screen
  const SEQUENCE = [
    ['out',  'Python 3.11.5 (main) on linux'],
    ['out',  'Type "help", "copyright", "credits" or "license" for more information.'],
    ['wait', 500],
    ['cmd',  'from clibrary_hub import router'],
    ['wait', 350],
    ['cmd',  'router.route("把 demo.mp4 做成 gif")'],
    ['wait', 700],
    ['res', [
      '{',
      '  <k>"action"</k>:     <s>"route"</s>,',
      '  <k>"cli"</k>:        <s>"video-to-gif"</s>,',
      '  <k>"params"</k>: {',
      '    <k>"input"</k>:  <s>"demo.mp4"</s>,',
      '    <k>"output"</k>: <s>"demo.gif"</s>,',
      '    <k>"fps"</k>:    <n>15</n>',
      '  },',
      '  <k>"confidence"</k>: <n>0.94</n>,',
      '  <k>"source"</k>:     <s>"A"</s>,',
      '  <k>"latency_ms"</k>: <n>36</n>',
      '}',
    ]],
    ['wait', 1100],
    ['note', '# Agent reads the JSON, then calls the actual CLI'],
    ['wait', 350],
    ['cmd',  'subprocess.run(["video-to-gif", "--input", "demo.mp4", "--output", "demo.gif", "--fps", "15"])'],
    ['wait', 600],
    ['out',  '<g>✓</g> demo.gif written  ·  1.2 MB  ·  75 frames'],
    ['out',  '<m>CompletedProcess(args=[...], returncode=<n>0</n>)</m>'],
    ['wait', 2500],
    ['clear'],
    ['wait', 400],
  ];

  // Tunables
  const CHAR_DELAY = 35;     // ms per char while typing a command
  const RES_LINE_GAP = 70;   // ms between streamed JSON lines

  function append(html, cls = '') {
    const div = document.createElement('div');
    div.className = 't-line ' + cls;
    div.innerHTML = html;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
    return div;
  }

  // Decorate <k> <s> <n> <g> <m> tokens with real CSS classes.
  function colorize(html) {
    return html
      .replaceAll('<k>', '<span class="t-key">').replaceAll('</k>', '</span>')
      .replaceAll('<s>', '<span class="t-val">').replaceAll('</s>', '</span>')
      .replaceAll('<n>', '<span class="t-num">').replaceAll('</n>', '</span>')
      .replaceAll('<g>', '<span class="t-good">').replaceAll('</g>', '</span>')
      .replaceAll('<m>', '<span class="t-muted">').replaceAll('</m>', '</span>');
  }

  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function typeCmd(prefix, text) {
    const line = append(prefix);
    for (let i = 0; i < text.length; i++) {
      line.innerHTML = prefix + escape(text.slice(0, i + 1));
      // micro-jitter so it doesn't feel mechanical
      await delay(CHAR_DELAY + (Math.random() < 0.08 ? 90 : 0));
    }
  }

  // Minimal escape — we don't allow user input here, but keep angle brackets safe
  function escape(s) {
    return s.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  let running = true;

  async function play() {
    while (running) {
      for (const step of SEQUENCE) {
        if (!running) return;
        const [kind, payload] = step;

        if (kind === 'out')   append(colorize(payload));
        else if (kind === 'note')  append('<span class="t-note">' + escape(payload) + '</span>');
        else if (kind === 'cmd')   await typeCmd(PROMPT, payload);
        else if (kind === 'sh')    await typeCmd(SHELL, payload);
        else if (kind === 'res') {
          for (const line of payload) {
            if (!running) return;
            append(colorize(line), 't-res');
            await delay(RES_LINE_GAP);
          }
        }
        else if (kind === 'wait')  await delay(payload);
        else if (kind === 'clear') screen.innerHTML = '';
      }
    }
  }

  // Pause the loop while the section isn't visible.
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries[0]?.isIntersecting;
      if (visible && !running) { running = true; play(); }
      if (!visible)            { running = false; }
    },
    { threshold: 0.15 }
  );
  observer.observe(screen);

  play();
})();
