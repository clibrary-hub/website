// Animated terminal sessions on the homepage.
// Supports multiple terminals on one page. Each <div class="term-screen">
// declares which scenario + language it plays via data-seq + data-lang.
//
//   data-seq:   "human" | "agent"
//   data-lang:  "en"    | "zh"

(function () {
  const screens = document.querySelectorAll('.term-screen');
  if (!screens.length) return;

  const PROMPT = '<span class="t-prompt">&gt;&gt;&gt; </span>';
  const CONT   = '<span class="t-prompt">... </span>';

  // ── Sequences ───────────────────────────────────────────────────────────

  const SEQ = {
    'human-en': [
      ['out',  'Python 3.11.5 (main) on linux'],
      ['wait', 400],
      ['cmd',  'from clibrary_hub import router'],
      ['wait', 250],
      ['cmd',  'router.route("convert demo.mp4 to a 10-fps gif")'],
      ['wait', 700],
      ['res', [
        '{',
        '  <k>"action"</k>:     <s>"route"</s>,',
        '  <k>"cli"</k>:        <s>"video-to-gif"</s>,',
        '  <k>"params"</k>: {',
        '    <k>"input"</k>:  <s>"demo.mp4"</s>,',
        '    <k>"output"</k>: <s>"demo.gif"</s>,',
        '    <k>"fps"</k>:    <n>10</n>',
        '  },',
        '  <k>"confidence"</k>: <n>0.94</n>,',
        '  <k>"source"</k>:     <s>"A"</s>,',
        '  <k>"latency_ms"</k>: <n>36</n>',
        '}',
      ]],
      ['wait', 1100],
      ['note', '# One call. Run it directly.'],
      ['cmd',  'subprocess.run(["video-to-gif", "--input", "demo.mp4", "--output", "demo.gif", "--fps", "10"])'],
      ['wait', 600],
      ['res', [
        '<g>✓</g> demo.gif written  ·  1.2 MB  ·  75 frames',
      ]],
      ['wait', 2500],
      ['clear'],
      ['wait', 400],
    ],

    'agent-en': [
      ['out',  'Python 3.11.5 — running inside an LLM agent'],
      ['wait', 400],
      ['cmd',  'from clibrary_hub import router'],
      ['wait', 250],
      ['note', '# User says something vague:  "do something with this video"'],
      ['cmd',  'result = router.route("do something with this video")'],
      ['wait', 700],
      ['cmd',  'result'],
      ['wait', 350],
      ['res', [
        '{',
        '  <k>"action"</k>: <s>"clarify"</s>,',
        '  <k>"choices"</k>: [',
        '    { <k>"name"</k>: <s>"video-to-gif"</s>, <k>"description"</k>: <s>"Convert video to GIF"</s> },',
        '    { <k>"name"</k>: <s>"video-trim"</s>,   <k>"description"</k>: <s>"Cut out a segment"</s> },',
        '    { <k>"name"</k>: <s>"video-tag"</s>,    <k>"description"</k>: <s>"Read metadata tags"</s> }',
        '  ]',
        '}',
      ]],
      ['wait', 1300],
      ['note', '# The LLM reads chat context, picks ONE:'],
      ['cmd',  'picked = llm.choose(result["choices"], chat_history)'],
      ['wait', 500],
      ['cmd',  'picked'],
      ['wait', 250],
      ['res', [ "<s>'video-to-gif'</s>" ]],
      ['wait', 800],
      ['note', '# Re-route with the clearer intent and run it:'],
      ['cmd',  'plan = router.route(f"use {picked}: turn this video into a gif")'],
      ['wait', 600],
      ['cmd',  'subprocess.run([plan["cli"], "--input", "demo.mp4", "--output", "demo.gif"])'],
      ['wait', 600],
      ['res', [
        '<g>✓</g> demo.gif written  ·  agent reports back to the user',
      ]],
      ['wait', 2500],
      ['clear'],
      ['wait', 400],
    ],

    'human-zh': [
      ['out',  'Python 3.11.5 (main) on linux'],
      ['wait', 400],
      ['cmd',  'from clibrary_hub import router'],
      ['wait', 250],
      ['cmd',  'router.route("把 demo.mp4 轉成 10fps 的 gif")'],
      ['wait', 700],
      ['res', [
        '{',
        '  <k>"action"</k>:     <s>"route"</s>,',
        '  <k>"cli"</k>:        <s>"video-to-gif"</s>,',
        '  <k>"params"</k>: {',
        '    <k>"input"</k>:  <s>"demo.mp4"</s>,',
        '    <k>"output"</k>: <s>"demo.gif"</s>,',
        '    <k>"fps"</k>:    <n>10</n>',
        '  },',
        '  <k>"confidence"</k>: <n>0.94</n>,',
        '  <k>"source"</k>:     <s>"A"</s>,',
        '  <k>"latency_ms"</k>: <n>36</n>',
        '}',
      ]],
      ['wait', 1100],
      ['note', '# 一個 call，直接執行就好'],
      ['cmd',  'subprocess.run(["video-to-gif", "--input", "demo.mp4", "--output", "demo.gif", "--fps", "10"])'],
      ['wait', 600],
      ['res', [
        '<g>✓</g> demo.gif written  ·  1.2 MB  ·  75 frames',
      ]],
      ['wait', 2500],
      ['clear'],
      ['wait', 400],
    ],

    'agent-zh': [
      ['out',  'Python 3.11.5 — 跑在某個 LLM agent 內部'],
      ['wait', 400],
      ['cmd',  'from clibrary_hub import router'],
      ['wait', 250],
      ['note', '# 使用者說了一句模糊的話: 「這部影片幫我處理一下」'],
      ['cmd',  'result = router.route("這部影片幫我處理一下")'],
      ['wait', 700],
      ['cmd',  'result'],
      ['wait', 350],
      ['res', [
        '{',
        '  <k>"action"</k>: <s>"clarify"</s>,',
        '  <k>"choices"</k>: [',
        '    { <k>"name"</k>: <s>"video-to-gif"</s>, <k>"description"</k>: <s>"把影片轉成 GIF"</s> },',
        '    { <k>"name"</k>: <s>"video-trim"</s>,   <k>"description"</k>: <s>"剪一段影片"</s> },',
        '    { <k>"name"</k>: <s>"video-tag"</s>,    <k>"description"</k>: <s>"讀取影片 metadata"</s> }',
        '  ]',
        '}',
      ]],
      ['wait', 1300],
      ['note', '# LLM 看對話上下文，從 3 個裡挑 1 個:'],
      ['cmd',  'picked = llm.choose(result["choices"], chat_history)'],
      ['wait', 500],
      ['cmd',  'picked'],
      ['wait', 250],
      ['res', [ "<s>'video-to-gif'</s>" ]],
      ['wait', 800],
      ['note', '# 用更清楚的意圖重新 route，然後執行:'],
      ['cmd',  'plan = router.route(f"用 {picked}: 把影片轉成 gif")'],
      ['wait', 600],
      ['cmd',  'subprocess.run([plan["cli"], "--input", "demo.mp4", "--output", "demo.gif"])'],
      ['wait', 600],
      ['res', [
        '<g>✓</g> demo.gif written  ·  agent 把結果回報給使用者',
      ]],
      ['wait', 2500],
      ['clear'],
      ['wait', 400],
    ],
  };

  const CHAR_DELAY = 30;
  const RES_LINE_GAP = 60;

  function colorize(html) {
    return html
      .replaceAll('<k>', '<span class="t-key">').replaceAll('</k>', '</span>')
      .replaceAll('<s>', '<span class="t-val">').replaceAll('</s>', '</span>')
      .replaceAll('<n>', '<span class="t-num">').replaceAll('</n>', '</span>')
      .replaceAll('<g>', '<span class="t-good">').replaceAll('</g>', '</span>')
      .replaceAll('<m>', '<span class="t-muted">').replaceAll('</m>', '</span>');
  }
  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  function makeRunner(screen) {
    const seqKey = `${screen.dataset.seq || 'human'}-${screen.dataset.lang || 'en'}`;
    const sequence = SEQ[seqKey] || SEQ['human-en'];
    let running = true;

    function append(html, cls = '') {
      const div = document.createElement('div');
      div.className = 't-line ' + cls;
      div.innerHTML = html;
      screen.appendChild(div);
      screen.scrollTop = screen.scrollHeight;
      return div;
    }

    // Type into a fresh line: prefix is HTML (the >>> / ... part),
    // each character of `text` is appended as a real text node so we
    // never rewrite the line. Smooth, no flicker.
    async function typeLine(prefix, text) {
      const line = append(prefix);
      const cursor = document.createElement('span');
      cursor.className = 't-caret';
      line.appendChild(cursor);

      for (const ch of text) {
        if (!running) return;
        line.insertBefore(document.createTextNode(ch), cursor);
        screen.scrollTop = screen.scrollHeight;
        await delay(CHAR_DELAY + (Math.random() < 0.07 ? 90 : 0));
      }
      // Done with this line — drop the inline caret (the global one keeps blinking).
      cursor.remove();
    }

    async function play() {
      while (running) {
        for (const step of sequence) {
          if (!running) return;
          const [kind, payload] = step;

          if (kind === 'out')        append(colorize(payload));
          else if (kind === 'note')  append('<span class="t-note">' + escape(payload) + '</span>');
          else if (kind === 'cmd')   await typeLine(PROMPT, payload);
          else if (kind === 'cont')  await typeLine(CONT, payload);
          else if (kind === 'res') {
            for (const ln of payload) {
              if (!running) return;
              append(colorize(ln), 't-res');
              await delay(RES_LINE_GAP);
            }
          }
          else if (kind === 'wait')  await delay(payload);
          else if (kind === 'clear') screen.innerHTML = '';
        }
      }
    }

    return { start: () => { running = true; play(); }, stop: () => { running = false; } };
  }

  screens.forEach((screen, idx) => {
    const runner = makeRunner(screen);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible) runner.start(); else runner.stop();
      },
      { threshold: 0.15 }
    );
    observer.observe(screen);

    // Stagger the second terminal so they don't perfectly overlap
    if (idx === 0) runner.start();
    else setTimeout(() => runner.start(), 1500);
  });
})();
