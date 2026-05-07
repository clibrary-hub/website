// Animated terminal demo on the homepage.
//
// Two scenarios run in parallel:
//
//   LEFT  — HUMAN — process view
//     Two stacked terminal panes, played by ONE coordinated sequence:
//       .term-pane[data-pane="input"]    : where the user types code
//       .term-pane[data-pane="output"]   : where JSON comes back
//
//   RIGHT — LLM AGENT — effect view
//     One terminal that speaks in plain language: status + options + progress.
//     No JSON shown.

(function () {
  // Tunables
  const CHAR_DELAY = 30;
  const RES_LINE_GAP = 60;
  const PROMPT = '<span class="t-prompt">&gt;&gt;&gt; </span>';

  // ── Helpers ─────────────────────────────────────────────────────────────
  function colorize(html) {
    return html
      .replaceAll('<k>', '<span class="t-key">').replaceAll('</k>', '</span>')
      .replaceAll('<s>', '<span class="t-val">').replaceAll('</s>', '</span>')
      .replaceAll('<n>', '<span class="t-num">').replaceAll('</n>', '</span>')
      .replaceAll('<g>', '<span class="t-good">').replaceAll('</g>', '</span>')
      .replaceAll('<m>', '<span class="t-muted">').replaceAll('</m>', '</span>')
      .replaceAll('<b>', '<span class="t-blue">').replaceAll('</b>', '</span>');
  }
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function appendTo(screen, html, cls = '') {
    const div = document.createElement('div');
    div.className = 't-line ' + cls;
    div.innerHTML = html;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
    return div;
  }

  async function typeIntoLine(screen, prefixHtml, text, runningRef) {
    const line = appendTo(screen, prefixHtml);
    const caret = document.createElement('span');
    caret.className = 't-caret';
    line.appendChild(caret);

    for (const ch of text) {
      if (!runningRef.value) return;
      line.insertBefore(document.createTextNode(ch), caret);
      screen.scrollTop = screen.scrollHeight;
      await delay(CHAR_DELAY + (Math.random() < 0.07 ? 90 : 0));
    }
    caret.remove();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HUMAN scenario — coordinated input + output panes
  // ─────────────────────────────────────────────────────────────────────────

  function humanSequence(lang) {
    const intent = lang === 'zh'
      ? '把 demo.mp4 轉成 10fps 的 gif'
      : 'convert demo.mp4 to a 10-fps gif';

    const banner = lang === 'zh' ? 'Python 3.11.5 — 一般使用者 REPL' : 'Python 3.11.5 — REPL';

    const jsonLines = [
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
    ];

    return [
      { pane: 'input',  kind: 'out',   text: banner },
      { pane: 'input',  kind: 'wait',  ms: 500 },
      { pane: 'input',  kind: 'cmd',   text: 'from clibrary_hub import router' },
      { pane: 'input',  kind: 'wait',  ms: 350 },
      { pane: 'input',  kind: 'cmd',   text: `router.route("${intent}")` },
      { pane: 'input',  kind: 'wait',  ms: 600 },
      { pane: 'output', kind: 'res',   lines: jsonLines },
      { pane: 'both',   kind: 'wait',  ms: 3500 },
      { pane: 'both',   kind: 'clear' },
      { pane: 'both',   kind: 'wait',  ms: 500 },
    ];
  }

  function startHumanRunner(col) {
    const inputScreen  = col.querySelector('.term-pane[data-pane="input"]');
    const outputScreen = col.querySelector('.term-pane[data-pane="output"]');
    const lang = col.dataset.lang || 'en';
    const sequence = humanSequence(lang);
    const running = { value: true };

    async function play() {
      while (running.value) {
        for (const step of sequence) {
          if (!running.value) return;
          const targets = step.pane === 'both' ? [inputScreen, outputScreen]
                       : step.pane === 'input' ? [inputScreen]
                       : [outputScreen];

          if (step.kind === 'out') {
            for (const s of targets) appendTo(s, colorize(step.text));
          } else if (step.kind === 'cmd') {
            for (const s of targets) await typeIntoLine(s, PROMPT, step.text, running);
          } else if (step.kind === 'res') {
            for (const ln of step.lines) {
              if (!running.value) return;
              for (const s of targets) appendTo(s, colorize(ln), 't-res');
              await delay(RES_LINE_GAP);
            }
          } else if (step.kind === 'wait') {
            await delay(step.ms);
          } else if (step.kind === 'clear') {
            for (const s of targets) s.innerHTML = '';
          }
        }
      }
    }

    return { start: () => { running.value = true; play(); }, stop: () => { running.value = false; } };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LLM AGENT scenario — single pane, plain language, no JSON
  // ─────────────────────────────────────────────────────────────────────────

  function agentSequence(lang) {
    const T = lang === 'zh' ? {
      banner:     'agent runtime',
      userLabel:  '使用者',
      agentLabel: 'agent',
      userMsg:    '把這部影片做成 gif 吧',
      thinking:   '呼叫 router 中…',
      foundN:     '找到 3 個可能的工具：',
      tools: [
        ['video-to-gif', '把影片轉成 GIF 動圖'],
        ['video-trim',   '剪一段影片'],
        ['video-tag',    '讀取影片 metadata'],
      ],
      pickPrompt: '上下文偏向「轉成動圖分享」→ 選 ①',
      picked:     '已選擇 video-to-gif',
      processing: '轉檔中  demo.mp4 → demo.gif',
      doneLine:   '✓ 完成  demo.gif  ·  1.2 MB  ·  75 frames',
      report:     'Agent → 使用者：「轉好了，這是 demo.gif」',
    } : {
      banner:     'agent runtime',
      userLabel:  'user',
      agentLabel: 'agent',
      userMsg:    'turn this video into a gif',
      thinking:   'calling router…',
      foundN:     'Found 3 candidate tools:',
      tools: [
        ['video-to-gif', 'Convert video to a GIF animation'],
        ['video-trim',   'Cut out a segment of a video'],
        ['video-tag',    'Read metadata tags from a video'],
      ],
      pickPrompt: 'Context says "share as gif" → pick ①',
      picked:     'Selected video-to-gif',
      processing: 'processing  demo.mp4 → demo.gif',
      doneLine:   '✓ done  demo.gif  ·  1.2 MB  ·  75 frames',
      report:     'Agent → user: "All done, here\'s demo.gif"',
    };
    return T;
  }

  function startAgentRunner(col) {
    const screen = col.querySelector('.term-pane');
    const lang = col.dataset.lang || 'en';
    const T = agentSequence(lang);
    const running = { value: true };

    function chatLine(label, text, kind) {
      const cls = kind === 'user' ? 't-chat-user' : 't-chat-agent';
      const labelHtml = `<span class="t-chat-label ${cls}">${label}</span>`;
      appendTo(screen, `${labelHtml}<span class="t-chat-text">${text}</span>`);
    }
    function status(text)  { appendTo(screen, `<span class="t-status">▸ ${text}</span>`); }
    function spinnerStart() {
      const div = appendTo(screen, `<span class="t-spinner">⠋</span> <span class="t-status-dim">${T.thinking}</span>`);
      const span = div.querySelector('.t-spinner');
      const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
      let i = 0;
      const id = setInterval(() => { span.textContent = frames[++i % frames.length]; }, 80);
      return { stop: () => { clearInterval(id); div.remove(); } };
    }
    function progressBar() {
      const div = appendTo(screen, `<span class="t-status">▸ ${T.processing}</span>`);
      const bar = appendTo(screen, `<span class="t-progress"><span class="t-progress-fill" style="width:0%"></span></span> <span class="t-progress-pct">0%</span>`);
      const fill = bar.querySelector('.t-progress-fill');
      const pct  = bar.querySelector('.t-progress-pct');
      return {
        async run() {
          for (let p = 0; p <= 100; p += 5) {
            if (!running.value) return;
            fill.style.width = p + '%';
            pct.textContent = p + '%';
            await delay(80);
          }
        }
      };
    }
    function toolList() {
      appendTo(screen, `<span class="t-status">▸ ${T.foundN}</span>`);
      T.tools.forEach(([name, desc], idx) => {
        const num = ['①','②','③'][idx];
        appendTo(screen,
          `<span class="t-tool"><span class="t-tool-num">${num}</span><span class="t-tool-name">${name}</span><span class="t-tool-desc">— ${desc}</span></span>`,
          'is-tool'
        );
      });
    }
    function highlightFirstTool() {
      const tools = screen.querySelectorAll('.t-tool');
      if (tools[0]) tools[0].classList.add('picked');
    }

    async function play() {
      while (running.value) {
        screen.innerHTML = '';

        chatLine(T.userLabel, T.userMsg, 'user');
        await delay(900);
        if (!running.value) return;

        const s = spinnerStart();
        await delay(900);
        s.stop();

        toolList();
        await delay(1400);
        if (!running.value) return;

        appendTo(screen, `<span class="t-status-dim">${T.pickPrompt}</span>`);
        await delay(700);
        highlightFirstTool();
        await delay(500);
        status(T.picked);
        await delay(700);

        const pb = progressBar();
        await pb.run();
        await delay(300);

        appendTo(screen, `<span class="t-good">${T.doneLine}</span>`);
        await delay(500);
        chatLine(T.agentLabel, T.report, 'agent');

        await delay(3500);
      }
    }

    return { start: () => { running.value = true; play(); }, stop: () => { running.value = false; } };
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  const humanCol = document.querySelector('.flow-col.human');
  const agentCol = document.querySelector('.flow-col.agent');

  if (humanCol) {
    const r = startHumanRunner(humanCol);
    new IntersectionObserver(
      (es) => { es[0]?.isIntersecting ? r.start() : r.stop(); },
      { threshold: 0.15 }
    ).observe(humanCol);
  }
  if (agentCol) {
    const r = startAgentRunner(agentCol);
    new IntersectionObserver(
      (es) => { es[0]?.isIntersecting ? r.start() : r.stop(); },
      { threshold: 0.15 }
    ).observe(agentCol);
  }
})();
