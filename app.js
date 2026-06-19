// 路由：#/ → 年级；#/g/{grade} → 章节；#/q/{chapterId} → 答题
const app = document.getElementById('app');

const state = {
  problems: null,
  index: 0,
  correct: 0,
  wrong: 0,
  chapter: null,
  history: [], // {q, userAnswer, correct, expected}
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

function renderHome() {
  clear();
  app.appendChild(h('div', { class: 'page' },
    h('h1', { class: 'title' }, '小学数学题库'),
    h('p', { class: 'subtitle' }, '选择年级开始练习'),
    h('div', { class: 'grid' },
      ...CURRICULUM.map((g, i) => h('button', {
        class: 'card grade-card',
        onclick: () => go(`#/g/${i}`),
      },
        h('div', { class: 'card-num' }, `${i + 1}`),
        h('div', { class: 'card-name' }, g.name),
      )),
    ),
  ));
}

function renderGrade(gradeIdx) {
  const grade = CURRICULUM[gradeIdx];
  if (!grade) return go('#/');
  clear();
  app.appendChild(h('div', { class: 'page' },
    h('button', { class: 'back', onclick: () => go('#/') }, '← 返回年级'),
    h('h1', { class: 'title' }, grade.name),
    h('p', { class: 'subtitle' }, '选择一个章节，每章 100 道题'),
    h('div', { class: 'grid' },
      ...grade.chapters.map(c => h('button', {
        class: 'card chapter-card',
        onclick: () => go(`#/q/${c.id}`),
      },
        h('div', { class: 'card-name' }, c.name),
        h('div', { class: 'card-meta' }, '100 题'),
      )),
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
  state.chapter = found.chapter;
  state.gradeName = found.grade.name;
  state.problems = generateProblems(found.chapter, 100);
  state.index = 0;
  state.correct = 0;
  state.wrong = 0;
  state.history = [];
  renderQuestion();
}

function normalizeAnswer(s) {
  return String(s).trim().replace(/\s+/g, '').replace(/。$/, '');
}

function checkAnswer(input, expected) {
  const a = normalizeAnswer(input);
  const e = normalizeAnswer(expected);
  if (a === e) return true;
  // 数值答案：允许 0.5 == .5 == 0.50
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
      feedbackEl.textContent = '✓ 答对了！';
    } else {
      state.wrong++;
      feedbackEl.className = 'feedback bad';
      feedbackEl.textContent = `✗ 答错了，正确答案：${p.answer}`;
    }
    nextBtn.style.display = '';
    nextBtn.focus();
    if (inputEl && inputEl.tagName === 'INPUT') inputEl.disabled = true;
    if (choicesContainer) {
      [...choicesContainer.children].forEach(btn => {
        btn.disabled = true;
        const v = btn.dataset.value;
        if (checkAnswer(v, p.answer)) btn.classList.add('choice-correct');
        else if (v === String(userAnswer)) btn.classList.add('choice-wrong');
      });
    }
  }

  let choicesContainer = null;

  if (useChoices) {
    choicesContainer = h('div', { class: 'choices' },
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
      placeholder: '在此输入答案',
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
    renderQuestion();
  }

  const nextBtn = h('button', {
    class: 'btn-primary',
    onclick: next,
    style: 'display:none',
  }, i + 1 === total ? '查看结果 →' : '下一题 →');

  const submitBtn = inputEl ? h('button', {
    class: 'btn-primary',
    onclick: () => {
      if (inputEl.value.trim() === '') return;
      submit(inputEl.value);
    },
  }, '提交') : null;

  app.appendChild(h('div', { class: 'page quiz' },
    h('div', { class: 'quiz-header' },
      h('button', { class: 'back', onclick: () => {
        if (confirm('确定要退出本章节吗？当前进度不会保存。')) go(`#/`);
      } }, '← 退出'),
      h('div', { class: 'quiz-title' }, `${state.gradeName} · ${state.chapter.name}`),
    ),
    h('div', { class: 'progress' },
      h('div', { class: 'progress-bar', style: `width:${progressPct}%` }),
    ),
    h('div', { class: 'progress-text' },
      `第 ${i + 1} / ${total} 题　·　✓ ${state.correct}　·　✗ ${state.wrong}`,
    ),
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
  let comment = '';
  if (score === 100) comment = '太厉害啦！全对！🎉';
  else if (score >= 90) comment = '非常棒！';
  else if (score >= 75) comment = '不错的成绩！';
  else if (score >= 60) comment = '继续努力！';
  else comment = '多多练习就会有进步！';

  const wrongList = state.history.filter(x => !x.ok);

  app.appendChild(h('div', { class: 'page' },
    h('h1', { class: 'title' }, '本章完成'),
    h('div', { class: 'score-card' },
      h('div', { class: 'score-num' }, `${score}`),
      h('div', { class: 'score-meta' },
        `共 ${total} 题　·　答对 ${state.correct}　·　答错 ${state.wrong}`,
      ),
      h('div', { class: 'score-comment' }, comment),
    ),
    wrongList.length > 0 ? h('details', { class: 'wrong-list' },
      h('summary', {}, `查看错题（${wrongList.length}）`),
      ...wrongList.map(w => h('div', { class: 'wrong-item' },
        h('div', { class: 'wrong-q' }, w.q),
        h('div', { class: 'wrong-a' }, `你的答案：${w.userAnswer}　·　正确答案：${w.expected}`),
      )),
    ) : null,
    h('div', { class: 'actions' },
      h('button', { class: 'btn-primary', onclick: () => startChapter(state.chapter.id) }, '再来一次'),
      h('button', { class: 'btn-secondary', onclick: () => go('#/') }, '回到首页'),
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
