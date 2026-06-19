// 课程大纲 + 题目生成器
// 每个章节的 generate() 返回 { question: string, answer: number, choices?: number[] }
// 难度按年级递进

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function makeChoices(answer, range) {
  const set = new Set([answer]);
  while (set.size < 4) {
    const delta = rand(-range, range);
    if (delta === 0) continue;
    const v = answer + delta;
    if (v < 0) continue;
    set.add(v);
  }
  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========== 一年级 ==========
const grade1 = {
  name: '一年级',
  chapters: [
    {
      id: 'g1-c1',
      name: '10以内加法',
      generate() {
        const a = rand(0, 10), b = rand(0, 10 - a);
        const answer = a + b;
        return { question: `${a} + ${b} = ?`, answer, choices: makeChoices(answer, 5) };
      },
    },
    {
      id: 'g1-c2',
      name: '10以内减法',
      generate() {
        const a = rand(1, 10), b = rand(0, a);
        const answer = a - b;
        return { question: `${a} - ${b} = ?`, answer, choices: makeChoices(answer, 5) };
      },
    },
    {
      id: 'g1-c3',
      name: '20以内加减法',
      generate() {
        if (Math.random() < 0.5) {
          const a = rand(0, 20), b = rand(0, 20 - a);
          const answer = a + b;
          return { question: `${a} + ${b} = ?`, answer, choices: makeChoices(answer, 6) };
        } else {
          const a = rand(1, 20), b = rand(0, a);
          const answer = a - b;
          return { question: `${a} - ${b} = ?`, answer, choices: makeChoices(answer, 6) };
        }
      },
    },
    {
      id: 'g1-c4',
      name: '认识100以内的数',
      generate() {
        const type = rand(0, 2);
        if (type === 0) {
          const a = rand(10, 100), b = rand(10, 100);
          if (a === b) return this.generate();
          const answer = Math.max(a, b);
          return { question: `${a} 和 ${b}，哪个更大？`, answer, choices: [a, b].sort(() => Math.random() - 0.5).concat([0, 0]).slice(0, 2).concat([a, b]).slice(0, 4) };
        } else if (type === 1) {
          const tens = rand(1, 9), ones = rand(0, 9);
          const answer = tens * 10 + ones;
          return { question: `${tens}个十 和 ${ones}个一 合起来是多少？`, answer, choices: makeChoices(answer, 8) };
        } else {
          const n = rand(10, 99);
          const answer = n + 1;
          return { question: `${n} 后面的数是？`, answer, choices: makeChoices(answer, 4) };
        }
      },
    },
  ],
};

// ========== 二年级 ==========
const grade2 = {
  name: '二年级',
  chapters: [
    {
      id: 'g2-c1',
      name: '100以内加减法',
      generate() {
        if (Math.random() < 0.5) {
          const a = rand(10, 99), b = rand(10, 99 - a < 1 ? 1 : 99 - a);
          const answer = a + b;
          return { question: `${a} + ${b} = ?`, answer, choices: makeChoices(answer, 10) };
        } else {
          const a = rand(20, 99), b = rand(1, a);
          const answer = a - b;
          return { question: `${a} - ${b} = ?`, answer, choices: makeChoices(answer, 10) };
        }
      },
    },
    {
      id: 'g2-c2',
      name: '乘法口诀（2-9）',
      generate() {
        const a = rand(2, 9), b = rand(1, 9);
        const answer = a * b;
        return { question: `${a} × ${b} = ?`, answer, choices: makeChoices(answer, 8) };
      },
    },
    {
      id: 'g2-c3',
      name: '表内除法',
      generate() {
        const b = rand(2, 9), q = rand(1, 9);
        const a = b * q;
        return { question: `${a} ÷ ${b} = ?`, answer: q, choices: makeChoices(q, 5) };
      },
    },
    {
      id: 'g2-c4',
      name: '混合运算',
      generate() {
        const a = rand(2, 9), b = rand(2, 9), c = rand(1, 20);
        if (Math.random() < 0.5) {
          const answer = a * b + c;
          return { question: `${a} × ${b} + ${c} = ?`, answer, choices: makeChoices(answer, 8) };
        } else {
          const m = a * b;
          const sub = rand(1, m);
          const answer = m - sub;
          return { question: `${a} × ${b} - ${sub} = ?`, answer, choices: makeChoices(answer, 8) };
        }
      },
    },
  ],
};

// ========== 三年级 ==========
const grade3 = {
  name: '三年级',
  chapters: [
    {
      id: 'g3-c1',
      name: '万以内加减法',
      generate() {
        if (Math.random() < 0.5) {
          const a = rand(100, 9999), b = rand(100, 9999);
          const answer = a + b;
          return { question: `${a} + ${b} = ?`, answer };
        } else {
          const a = rand(500, 9999), b = rand(100, a - 1);
          const answer = a - b;
          return { question: `${a} - ${b} = ?`, answer };
        }
      },
    },
    {
      id: 'g3-c2',
      name: '多位数乘一位数',
      generate() {
        const a = rand(11, 999), b = rand(2, 9);
        const answer = a * b;
        return { question: `${a} × ${b} = ?`, answer };
      },
    },
    {
      id: 'g3-c3',
      name: '除数是一位数的除法',
      generate() {
        const b = rand(2, 9), q = rand(11, 200);
        const r = rand(0, b - 1);
        const a = b * q + r;
        if (r === 0) {
          return { question: `${a} ÷ ${b} = ?`, answer: q };
        } else {
          return { question: `${a} ÷ ${b} = ? （只填商，不要余数）`, answer: q };
        }
      },
    },
    {
      id: 'g3-c4',
      name: '分数的初步认识',
      generate() {
        const type = rand(0, 1);
        if (type === 0) {
          // 同分母分数加减
          const d = rand(3, 10);
          const a = rand(1, d - 1), b = rand(1, d - a);
          if (Math.random() < 0.5) {
            return { question: `${a}/${d} + ${b}/${d} = ?/${d}（填分子）`, answer: a + b, choices: makeChoices(a + b, 4) };
          } else {
            const big = rand(2, d - 1), small = rand(1, big - 1);
            return { question: `${big}/${d} - ${small}/${d} = ?/${d}（填分子）`, answer: big - small, choices: makeChoices(big - small, 4) };
          }
        } else {
          // 比较分数大小
          const d = rand(3, 10);
          const a = rand(1, d - 1), b = rand(1, d - 1);
          if (a === b) return this.generate();
          const answer = Math.max(a, b);
          return { question: `${a}/${d} 和 ${b}/${d}，分子哪个更大？`, answer, choices: [a, b, a + 1, b + 1].slice(0, 4) };
        }
      },
    },
  ],
};

// ========== 四年级 ==========
const grade4 = {
  name: '四年级',
  chapters: [
    {
      id: 'g4-c1',
      name: '大数的认识与运算',
      generate() {
        const a = rand(1000, 99999), b = rand(1000, 99999);
        if (Math.random() < 0.5) {
          return { question: `${a} + ${b} = ?`, answer: a + b };
        } else {
          const big = Math.max(a, b), small = Math.min(a, b);
          return { question: `${big} - ${small} = ?`, answer: big - small };
        }
      },
    },
    {
      id: 'g4-c2',
      name: '三位数乘两位数',
      generate() {
        const a = rand(100, 999), b = rand(10, 99);
        return { question: `${a} × ${b} = ?`, answer: a * b };
      },
    },
    {
      id: 'g4-c3',
      name: '除数是两位数的除法',
      generate() {
        const b = rand(11, 99), q = rand(2, 99);
        const a = b * q;
        return { question: `${a} ÷ ${b} = ?`, answer: q };
      },
    },
    {
      id: 'g4-c4',
      name: '运算定律与简便运算',
      generate() {
        const type = rand(0, 2);
        if (type === 0) {
          // 乘法分配律
          const a = rand(10, 99), b = rand(2, 9), c = rand(2, 9);
          return { question: `${a} × ${b} + ${a} × ${c} = ?`, answer: a * (b + c) };
        } else if (type === 1) {
          // 加法结合律
          const a = rand(10, 99), b = rand(10, 99), c = rand(10, 99);
          return { question: `${a} + ${b} + ${c} = ?`, answer: a + b + c };
        } else {
          // 减法性质
          const a = rand(100, 999), b = rand(10, 99), c = rand(10, 99);
          return { question: `${a} - ${b} - ${c} = ?`, answer: a - b - c };
        }
      },
    },
  ],
};

// ========== 五年级 ==========
const grade5 = {
  name: '五年级',
  chapters: [
    {
      id: 'g5-c1',
      name: '小数加减法',
      generate() {
        const a = rand(10, 9999) / 100;
        const b = rand(10, 9999) / 100;
        if (Math.random() < 0.5) {
          const answer = +(a + b).toFixed(2);
          return { question: `${a} + ${b} = ?（保留两位小数）`, answer };
        } else {
          const big = Math.max(a, b), small = Math.min(a, b);
          const answer = +(big - small).toFixed(2);
          return { question: `${big} - ${small} = ?（保留两位小数）`, answer };
        }
      },
    },
    {
      id: 'g5-c2',
      name: '小数乘除法',
      generate() {
        if (Math.random() < 0.5) {
          const a = rand(10, 999) / 10;
          const b = rand(2, 9);
          const answer = +(a * b).toFixed(2);
          return { question: `${a} × ${b} = ?（保留两位小数）`, answer };
        } else {
          const b = rand(2, 9);
          const q = rand(10, 999) / 10;
          const a = +(b * q).toFixed(2);
          return { question: `${a} ÷ ${b} = ?（保留一位小数）`, answer: +q.toFixed(1) };
        }
      },
    },
    {
      id: 'g5-c3',
      name: '分数加减法（异分母）',
      generate() {
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const reduce = (n, d) => { const g = gcd(Math.abs(n), d); return [n / g, d / g]; };
        const d1 = rand(2, 12), d2 = rand(2, 12);
        if (d1 === d2) return this.generate();
        const n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1);
        if (Math.random() < 0.5) {
          const num = n1 * d2 + n2 * d1;
          const den = d1 * d2;
          const [rn, rd] = reduce(num, den);
          return { question: `${n1}/${d1} + ${n2}/${d2} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
        } else {
          // 保证结果非负
          const v1 = n1 / d1, v2 = n2 / d2;
          const [bigN, bigD, smallN, smallD] = v1 >= v2 ? [n1, d1, n2, d2] : [n2, d2, n1, d1];
          const num = bigN * smallD - smallN * bigD;
          const den = bigD * smallD;
          if (num === 0) return this.generate();
          const [rn, rd] = reduce(num, den);
          return { question: `${bigN}/${bigD} - ${smallN}/${smallD} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
        }
      },
    },
    {
      id: 'g5-c4',
      name: '简易方程',
      generate() {
        const type = rand(0, 2);
        const x = rand(2, 50);
        if (type === 0) {
          const a = rand(2, 20);
          const b = x + a;
          return { question: `解方程：x + ${a} = ${b}，x = ?`, answer: x };
        } else if (type === 1) {
          const a = rand(2, 9);
          const b = x * a;
          return { question: `解方程：${a}x = ${b}，x = ?`, answer: x };
        } else {
          const a = rand(2, 9), c = rand(1, 20);
          const b = a * x + c;
          return { question: `解方程：${a}x + ${c} = ${b}，x = ?`, answer: x };
        }
      },
    },
  ],
};

// ========== 六年级 ==========
const grade6 = {
  name: '六年级',
  chapters: [
    {
      id: 'g6-c1',
      name: '分数乘除法',
      generate() {
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const reduce = (n, d) => { const g = gcd(Math.abs(n), d); return [n / g, d / g]; };
        const n1 = rand(1, 9), d1 = rand(2, 10);
        const n2 = rand(1, 9), d2 = rand(2, 10);
        if (Math.random() < 0.5) {
          const [rn, rd] = reduce(n1 * n2, d1 * d2);
          return { question: `${n1}/${d1} × ${n2}/${d2} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
        } else {
          const [rn, rd] = reduce(n1 * d2, d1 * n2);
          return { question: `${n1}/${d1} ÷ ${n2}/${d2} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
        }
      },
    },
    {
      id: 'g6-c2',
      name: '百分数',
      generate() {
        const type = rand(0, 2);
        if (type === 0) {
          const total = rand(20, 200), part = rand(1, total);
          const answer = +(part / total * 100).toFixed(0);
          return { question: `${part} 是 ${total} 的百分之几？（填整数百分数，例如 25 表示 25%）`, answer };
        } else if (type === 1) {
          const total = rand(50, 500);
          const pct = pick([10, 20, 25, 40, 50, 60, 75, 80]);
          const answer = total * pct / 100;
          if (!Number.isInteger(answer)) return this.generate();
          return { question: `${total} 的 ${pct}% 是多少？`, answer };
        } else {
          const part = rand(10, 100);
          const pct = pick([10, 20, 25, 40, 50]);
          const total = part / (pct / 100);
          if (!Number.isInteger(total)) return this.generate();
          return { question: `一个数的 ${pct}% 是 ${part}，这个数是多少？`, answer: total };
        }
      },
    },
    {
      id: 'g6-c3',
      name: '比和比例',
      generate() {
        const type = rand(0, 1);
        if (type === 0) {
          // 化简比
          const k = rand(2, 10);
          const a = rand(2, 9), b = rand(2, 9);
          if (a === b) return this.generate();
          return { question: `化简比：${a * k} : ${b * k} = ? : ?（格式 a:b，最简整数比）`, answer: `${a}:${b}` };
        } else {
          // 比例求未知项
          const a = rand(2, 9), b = rand(2, 9), k = rand(2, 9);
          return { question: `已知 ${a} : ${b} = x : ${b * k}，求 x`, answer: a * k };
        }
      },
    },
    {
      id: 'g6-c4',
      name: '圆的周长与面积',
      generate() {
        const PI = 3.14;
        const r = rand(1, 20);
        const type = rand(0, 2);
        if (type === 0) {
          return { question: `半径 ${r} cm 的圆，周长是多少 cm？（π 取 3.14）`, answer: +(2 * PI * r).toFixed(2) };
        } else if (type === 1) {
          return { question: `半径 ${r} cm 的圆，面积是多少 cm²？（π 取 3.14）`, answer: +(PI * r * r).toFixed(2) };
        } else {
          const d = r * 2;
          return { question: `直径 ${d} cm 的圆，周长是多少 cm？（π 取 3.14）`, answer: +(PI * d).toFixed(2) };
        }
      },
    },
  ],
};

const CURRICULUM = [grade1, grade2, grade3, grade4, grade5, grade6];

// 生成一个章节的 100 题
function generateProblems(chapter, count = 100) {
  const problems = [];
  const seen = new Set();
  let safety = count * 5;
  while (problems.length < count && safety-- > 0) {
    const p = chapter.generate();
    const key = p.question;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push(p);
  }
  // 题型不够多的章节，允许重复填满
  while (problems.length < count) {
    problems.push(chapter.generate());
  }
  return problems;
}
