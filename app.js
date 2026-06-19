// 路由：#/ → 年级；#/g/{grade} → 章节；#/q/{chapterId} → 答题
const app = document.getElementById('app');

// ----- localStorage 存档 -----
const STORAGE_KEY = 'dundunmath:v1';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: {}, best: {} };
    const obj = JSON.parse(raw);
    return { progress: obj.progress || {}, best: obj.best || {} };
  } catch {
    return { progress: {}, best: {} };
  }
}
function saveStore(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}
const store = loadStore();

function saveProgress() {
  if (!state.chapter) return;
  store.progress[state.chapter.id] = {
    problems: state.problems,
    index: state.index,
    correct: state.correct,
    wrong: state.wrong,
    history: state.history,
    gradeName: state.gradeName,
    savedAt: Date.now(),
  };
  saveStore(store);
}
function clearProgress(chapterId) {
  delete store.progress[chapterId];
  saveStore(store);
}
function recordBest(chapterId, score) {
  const prev = store.best[chapterId] || 0;
  if (score > prev) {
    store.best[chapterId] = score;
    saveStore(store);
  }
}

// ----- 状态 -----
const state = {
  problems: null,
  index: 0,
  correct: 0,
  wrong: 0,
  chapter: null,
  history: [],
  gradeName: '',
};

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

function clear() { app.innerHTML = ''; }
function go(hash) { location.hash = hash; }

const SPARK_EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💖', '🌈', '🦄'];
function celebrate() {
  const layer = h('div', { class: 'celebrate' });
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 140 + Math.random() * 100;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const rot = (Math.random() * 720 - 360) + 'deg';
    const e = pick(SPARK_EMOJIS);
    const sp = h('div', { class: 'spark' }, e);
    sp.style.setProperty('--dx', dx + 'px');
    sp.style.setProperty('--dy', dy + 'px');
    sp.style.setProperty('--rot', rot);
    layer.appendChild(sp);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 800);
}

const GRADE_EMOJI = ['🐣', '🐤', '🐰', '🦊', '🐯', '🦁'];
const CHAPTER_EMOJI_POOL = ['🍎','🍌','🍇','🍉','🍓','🍪','🧁','🎈','🎨','🚀','⭐','🌈','🦄','🐳','🌸','🍀','🎲','🎁','🪁','🎀','🍭','🌟'];
function chapterEmoji(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CHAPTER_EMOJI_POOL[h % CHAPTER_EMOJI_POOL.length];
}

// 找出最近一次有进度的章节（按 savedAt 降序）
function latestUnfinished() {
  const entries = Object.entries(store.progress);
  if (entries.length === 0) return null;
  entries.sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0));
  for (const [id, p] of entries) {
    if (p.problems && p.index < p.problems.length) {
      const found = findChapter(id);
      if (found) return { id, progress: p, ...found };
    }
  }
  return null;
}

function renderHome() {
  clear();
  const last = latestUnfinished();
  const totalDone = Object.keys(store.best).length;
  const totalProgress = Object.keys(store.progress).filter(id => {
    const p = store.progress[id];
    return p && p.problems && p.index < p.problems.length;
  }).length;
  const hasAnyData = totalDone > 0 || totalProgress > 0;

  app.appendChild(h('div', { class: 'page' },
    h('h1', { class: 'title' }, '🌈 盹盹的数学乐园 ✨'),
    h('p', { class: 'subtitle' }, '选一个年级，开启你的闯关之旅吧～'),
    last ? h('div', { class: 'resume-card', onclick: () => go(`#/q/${last.id}`) },
      h('div', { class: 'resume-emoji' }, '⏯️'),
      h('div', { class: 'resume-text' },
        h('div', { class: 'resume-title' }, '继续上次的练习'),
        h('div', { class: 'resume-sub' },
          `${last.grade.name} · ${last.chapter.name} · 已答 ${last.progress.index} / ${last.progress.problems.length}`,
        ),
      ),
      h('div', { class: 'resume-arrow' }, '→'),
    ) : null,
    h('div', { class: 'grid' },
      ...CURRICULUM.map((g, i) => h('button', {
        class: `card grade-card g${i}`,
        onclick: () => go(`#/g/${i}`),
      },
        h('div', { class: 'card-emoji' }, GRADE_EMOJI[i] || '⭐'),
        h('div', { class: 'card-name' }, g.name),
        h('div', { class: 'card-meta' }, `${g.chapters.length} 个章节`),
      )),
    ),
    hasAnyData ? h('div', { class: 'home-footer' },
      h('span', { class: 'footer-stat' },
        totalProgress > 0 ? `🔖 ${totalProgress} 个进行中` : null,
        totalProgress > 0 && totalDone > 0 ? '　·　' : null,
        totalDone > 0 ? `🏅 ${totalDone} 个已完成` : null,
      ),
      h('div', { class: 'footer-actions' },
        totalProgress > 0 ? h('button', {
          class: 'link-btn',
          onclick: () => {
            if (confirm(`确定要清空 ${totalProgress} 个进行中章节的进度吗？\n（最高分记录会保留）`)) {
              store.progress = {};
              saveStore(store);
              location.reload();
            }
          },
        }, '🗑️ 清空进度') : null,
        h('button', {
          class: 'link-btn danger',
          onclick: () => {
            if (confirm('⚠️ 确定要清空所有进度和最高分记录吗？\n这个操作不能撤销。')) {
              localStorage.removeItem(STORAGE_KEY);
              location.reload();
            }
          },
        }, '⚠️ 清空全部记录'),
      ),
    ) : null,
  ));
}

function renderGrade(gradeIdx) {
  const grade = CURRICULUM[gradeIdx];
  if (!grade) return go('#/');
  clear();
  app.appendChild(h('div', { class: 'page' },
    h('button', { class: 'back', onclick: () => go('#/') }, '← 回到年级'),
    h('h1', { class: 'title' }, `${GRADE_EMOJI[gradeIdx] || '⭐'} ${grade.name}`),
    h('p', { class: 'subtitle' }, '点一个章节，开始挑战 100 道题！'),
    h('div', { class: 'grid' },
      ...grade.chapters.map(c => {
        const best = store.best[c.id];
        const prog = store.progress[c.id];
        const inProgress = prog && prog.problems && prog.index < prog.problems.length;
        const meta = inProgress
          ? `▶ 已答 ${prog.index}/${prog.problems.length}`
          : '100 题';
        const card = h('button', {
          class: 'card chapter-card' + (inProgress ? ' has-progress' : ''),
          onclick: () => go(`#/q/${c.id}`),
        },
          best != null ? h('div', { class: 'best-badge' }, `🏅 ${best}分`) : null,
          inProgress ? h('div', {
            class: 'clear-x',
            title: '清空这一章进度',
            onclick: (e) => {
              e.stopPropagation();
              if (confirm(`清空「${c.name}」的进度（已答 ${prog.index} 题）？\n下次会重新随机出题。`)) {
                clearProgress(c.id);
                renderGrade(gradeIdx);
              }
            },
          }, '✕') : null,
          h('div', { class: 'card-emoji' }, chapterEmoji(c.id)),
          h('div', { class: 'card-name' }, c.name),
          h('div', { class: 'card-meta' }, meta),
        );
        return card;
      }),
    ),
  ));
}

function findChapter(id) {
  for (const g of CURRICULUM) {
    const c = g.chapters.find(c => c.id === id);
    if (c) return { grade: g, chapter: c };
  }
  return null;
}

function startChapter(chapterId) {
  const found = findChapter(chapterId);
  if (!found) return go('#/');

  // 有进度则恢复
  const saved = store.progress[chapterId];
  if (saved && saved.problems && saved.index < saved.problems.length) {
    state.chapter = found.chapter;
    state.gradeName = found.grade.name;
    state.problems = saved.problems;
    state.index = saved.index;
    state.correct = saved.correct || 0;
    state.wrong = saved.wrong || 0;
    state.history = saved.history || [];
    renderQuestion();
    return;
  }

  state.chapter = found.chapter;
  state.gradeName = found.grade.name;
  state.problems = generateProblems(found.chapter, 100);
  state.index = 0;
  state.correct = 0;
  state.wrong = 0;
  state.history = [];
  saveProgress();
  renderQuestion();
}

function restartChapter(chapterId) {
  const found = findChapter(chapterId);
  if (!found) return go('#/');
  clearProgress(chapterId);
  state.chapter = found.chapter;
  state.gradeName = found.grade.name;
  state.problems = generateProblems(found.chapter, 100);
  state.index = 0;
  state.correct = 0;
  state.wrong = 0;
  state.history = [];
  saveProgress();
  renderQuestion();
}

function normalizeAnswer(s) {
  return String(s).trim().replace(/\s+/g, '').replace(/。$/, '');
}

function checkAnswer(input, expected) {
  const a = normalizeAnswer(input);
  const e = normalizeAnswer(expected);
  if (a === e) return true;
  const na = Number(a), ne = Number(e);
  if (!Number.isNaN(na) && !Number.isNaN(ne)) {
    return Math.abs(na - ne) < 1e-6;
  }
  return false;
}

function renderQuestion() {
  clear();
  const total = state.problems.length;
  const i = state.index;

  if (i >= total) return renderResult();

  const p = state.problems[i];
  const progressPct = Math.round((i / total) * 100);

  const useChoices = Array.isArray(p.choices) && p.choices.length >= 2;

  let inputEl;
  let feedbackEl = h('div', { class: 'feedback' });
  let submitted = false;

  function submit(userAnswer) {
    if (submitted) return;
    submitted = true;
    const ok = checkAnswer(userAnswer, p.answer);
    state.history.push({ q: p.question, userAnswer, expected: p.answer, ok });
    if (ok) {
      state.correct++;
      feedbackEl.className = 'feedback ok';
      feedbackEl.textContent = pick(['🎉 答对啦！', '⭐ 太棒了！', '🌟 真厉害！', '🦄 全对！', '✨ 好聪明！']);
      celebrate();
    } else {
      state.wrong++;
      feedbackEl.className = 'feedback bad';
      feedbackEl.textContent = `🙈 再想想～ 正确答案是 ${p.answer}`;
    }
    if (inputEl && inputEl.tagName === 'INPUT') inputEl.disabled = true;
    if (choicesContainer) {
      [...choicesContainer.children].forEach(btn => {
        btn.disabled = true;
        const v = btn.dataset.value;
        if (checkAnswer(v, p.answer)) btn.classList.add('choice-correct');
        else if (v === String(userAnswer)) btn.classList.add('choice-wrong');
      });
    }
    if (ok) {
      // 答对：短暂展示后自动下一题
      nextBtn.style.display = 'none';
      setTimeout(() => {
        if (state.index === i) next();  // 防止用户已手动跳走
      }, 700);
    } else {
      // 答错：显示「下一题」按钮，由用户主动确认
      nextBtn.style.display = '';
      nextBtn.focus();
    }
  }

  let choicesContainer = null;

  if (useChoices) {
    const isJudge = p.choices.length === 2 && p.choices.every(c => c === '对' || c === '错');
    const isLong = p.choices.some(c => String(c).length >= 6);
    const cls = 'choices' + (isJudge ? ' judge' : '') + (isLong ? ' long' : '');
    choicesContainer = h('div', { class: cls },
      ...p.choices.map(c => h('button', {
        class: 'choice',
        'data-value': String(c),
        onclick: () => submit(c),
      }, String(c))),
    );
    inputEl = null;
  } else {
    inputEl = h('input', {
      class: 'answer-input',
      type: 'text',
      placeholder: '在这里写答案～',
      autocomplete: 'off',
      autofocus: 'true',
    });
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!submitted) {
          if (inputEl.value.trim() === '') return;
          submit(inputEl.value);
        } else {
          next();
        }
      }
    });
  }

  function next() {
    state.index++;
    saveProgress();
    renderQuestion();
  }

  const nextBtn = h('button', {
    class: 'btn-primary',
    onclick: next,
    style: 'display:none',
  }, i + 1 === total ? '🎯 看看成绩 →' : '下一题 →');

  const submitBtn = inputEl ? h('button', {
    class: 'btn-primary',
    onclick: () => {
      if (inputEl.value.trim() === '') return;
      submit(inputEl.value);
    },
  }, '✅ 提交') : null;

  app.appendChild(h('div', { class: 'page quiz' },
    h('div', { class: 'quiz-header' },
      h('button', { class: 'back', onclick: () => {
        // 自动保存进度，无需确认
        saveProgress();
        go(`#/`);
      } }, '← 退出（自动保存）'),
      h('div', { class: 'quiz-title' }, `${state.gradeName} · ${state.chapter.name}`),
    ),
    h('div', { class: 'progress' },
      h('div', { class: 'progress-bar', style: `width:${progressPct}%` }),
    ),
    h('div', { class: 'progress-text', html:
      `第 <b>${i + 1}</b> / ${total} 题　·　<span class="stat-ok">✓ ${state.correct}</span>　·　<span class="stat-bad">✗ ${state.wrong}</span>`,
    }),
    h('div', { class: 'question' }, p.question),
    useChoices ? choicesContainer : h('div', { class: 'input-row' }, inputEl, submitBtn),
    feedbackEl,
    nextBtn,
  ));

  if (inputEl) setTimeout(() => inputEl.focus(), 0);
}

function renderResult() {
  clear();
  const total = state.problems.length;
  const score = Math.round((state.correct / total) * 100);

  // 完成 → 记录最高分，清空进度
  recordBest(state.chapter.id, score);
  clearProgress(state.chapter.id);

  const best = store.best[state.chapter.id];
  const isNewBest = score === best;

  let comment = '';
  let emoji = '';
  if (score === 100)      { emoji = '🏆'; comment = '太厉害啦！全对！'; }
  else if (score >= 90)   { emoji = '🌟'; comment = '非常棒！'; }
  else if (score >= 75)   { emoji = '🎉'; comment = '不错的成绩！'; }
  else if (score >= 60)   { emoji = '🐣'; comment = '继续努力！'; }
  else                    { emoji = '🌱'; comment = '多多练习就会有进步！'; }

  const wrongList = state.history.filter(x => !x.ok);

  app.appendChild(h('div', { class: 'page' },
    h('h1', { class: 'title' }, '🎊 本章完成 🎊'),
    h('div', { class: 'score-card' },
      h('div', { class: 'score-emoji' }, emoji),
      h('div', { class: 'score-num' }, `${score}`),
      h('div', { class: 'score-meta' },
        `共 ${total} 题　·　答对 ${state.correct}　·　答错 ${state.wrong}`,
      ),
      h('div', { class: 'score-comment' }, comment),
      isNewBest && score > 0 ? h('div', { class: 'new-best' }, '🎖️ 新纪录！') : null,
    ),
    wrongList.length > 0 ? h('details', { class: 'wrong-list' },
      h('summary', {}, `📒 看看错题（${wrongList.length}）`),
      ...wrongList.map(w => h('div', { class: 'wrong-item' },
        h('div', { class: 'wrong-q' }, w.q),
        h('div', { class: 'wrong-a' }, `你的答案：${w.userAnswer}　·　正确答案：${w.expected}`),
      )),
    ) : null,
    h('div', { class: 'actions' },
      h('button', { class: 'btn-primary', onclick: () => restartChapter(state.chapter.id) }, '🔄 再来一次'),
      h('button', { class: 'btn-secondary', onclick: () => go('#/') }, '🏠 回到首页'),
    ),
  ));
}

function route() {
  const hash = location.hash || '#/';
  const m1 = hash.match(/^#\/g\/(\d+)$/);
  const m2 = hash.match(/^#\/q\/(.+)$/);
  if (m1) return renderGrade(Number(m1[1]));
  if (m2) return startChapter(m2[1]);
  return renderHome();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
