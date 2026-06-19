// 课程大纲 + 题目生成器
// 题型：选择题（多选一）和判断题（对/错），通过 choices 数组渲染为按钮
// 1-4 年级：仅选择题 + 判断题
// 5-6 年级：以填空为主

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function makeChoices(answer, range) {
  const set = new Set([answer]);
  let safety = 50;
  while (set.size < 4 && safety-- > 0) {
    const delta = rand(-range, range);
    if (delta === 0) continue;
    const v = answer + delta;
    if (v < 0) continue;
    set.add(v);
  }
  return shuffle([...set]);
}

// ----- 题型工厂 -----
function mc(question, answer, distractors) {
  // 选择题：自动去重 + 洗牌
  const seen = new Set([String(answer)]);
  const out = [answer];
  for (const d of distractors) {
    const key = String(d);
    if (!seen.has(key)) { seen.add(key); out.push(d); }
  }
  return { question, answer, choices: shuffle(out) };
}

function mcn(question, answer, range = 5) {
  // 数值选择题：自动产生干扰项
  return { question, answer, choices: makeChoices(answer, range) };
}

function judge(question, isTrue) {
  // 判断题：保持「对」在左、「错」在右
  return { question, answer: isTrue ? '对' : '错', choices: ['对', '错'] };
}

// 给计算式构造一个判断题：random 决定显示对的还是错的结果
function judgeEq(left, op, right, jitter) {
  const correct = op === '+' ? left + right : op === '-' ? left - right : op === '×' ? left * right : left / right;
  const isTrue = Math.random() < 0.5;
  let shown = correct;
  if (!isTrue) {
    let safety = 30;
    do {
      shown = correct + rand(-jitter, jitter);
      safety--;
    } while ((shown === correct || shown < 0) && safety > 0);
    if (shown === correct) shown = correct + 1;
  }
  return judge(`${left} ${op} ${right} = ${shown}，对吗？`, isTrue);
}

// ============== 一年级 ==============
const grade1 = {
  name: '一年级',
  chapters: [
    {
      id: 'g1-c1',
      name: '10以内加法',
      generate() {
        const a = rand(0, 10), b = rand(0, 10 - a);
        if (Math.random() < 0.3) return judgeEq(a, '+', b, 3);
        return mcn(`${a} + ${b} = ?`, a + b, 5);
      },
    },
    {
      id: 'g1-c2',
      name: '10以内减法',
      generate() {
        const a = rand(1, 10), b = rand(0, a);
        if (Math.random() < 0.3) return judgeEq(a, '-', b, 3);
        return mcn(`${a} - ${b} = ?`, a - b, 5);
      },
    },
    {
      id: 'g1-c3',
      name: '20以内加减',
      generate() {
        const isAdd = Math.random() < 0.5;
        let a, b;
        if (isAdd) { a = rand(0, 20); b = rand(0, 20 - a); }
        else       { a = rand(1, 20); b = rand(0, a); }
        if (Math.random() < 0.3) return judgeEq(a, isAdd ? '+' : '-', b, 4);
        const ans = isAdd ? a + b : a - b;
        return mcn(`${a} ${isAdd ? '+' : '-'} ${b} = ?`, ans, 6);
      },
    },
    {
      id: 'g1-c4',
      name: '找规律 🔵🔴🔵🔴',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          // 两元素循环
          const pair = pick([['🔵', '🔴'], ['⭐', '🌙'], ['🍎', '🍌'], ['🐰', '🐱']]);
          const len = rand(5, 7);
          const seq = [];
          for (let i = 0; i < len; i++) seq.push(pair[i % 2]);
          const next = pair[len % 2];
          const wrong = pair[(len + 1) % 2];
          return mc(`接下来是哪个？\n${seq.join('')} ?`, next, [wrong, '🟡', '🟢']);
        }
        if (t === 1) {
          // 三元素循环
          const tri = pick([['⭐', '🌙', '☁️'], ['🐰', '🐱', '🐶'], ['🍎', '🍌', '🍇']]);
          const len = rand(6, 9);
          const seq = [];
          for (let i = 0; i < len; i++) seq.push(tri[i % 3]);
          const idx = len % 3;
          const wrongs = tri.filter((_, i) => i !== idx);
          return mc(`接下来是哪个？\n${seq.join('')} ?`, tri[idx], [...wrongs, '🌈']);
        }
        if (t === 2) {
          // 等差数列
          const start = rand(1, 5);
          const step = rand(1, 3);
          const seq = [start, start + step, start + 2 * step, start + 3 * step];
          return mcn(`找规律：${seq.join(', ')}, ?`, start + 4 * step, 4);
        }
        if (t === 3) {
          // 数一数
          const n = rand(2, 8);
          const emoji = pick(['🍎', '🌟', '🎈', '🐰', '🌸']);
          return mcn(`一共有几个 ${emoji}？\n${emoji.repeat(n)}`, n, 3);
        }
        // 比较大小
        const a = rand(0, 20), b = rand(0, 20);
        if (a === b) return this.generate();
        const bigger = Math.max(a, b);
        return mc(`${a} 和 ${b}，哪个更大？`, String(bigger), [String(Math.min(a, b)), '一样大', '不知道']);
      },
    },
    {
      id: 'g1-c5',
      name: '数学小百科 ✨',
      generate() {
        const t = rand(0, 7);
        if (t === 0) return mc('下面哪个数最大？', '100', ['10', '50', '99']);
        if (t === 1) return mc('数学里"无穷大"用什么符号表示？', '∞', ['π', 'Σ', 'Δ']);
        if (t === 2) return judge('比 100 大的数有很多很多，永远数不完。', true);
        if (t === 3) return mc('数学里"圆周率"用什么符号表示？', 'π', ['∞', '√', 'α']);
        if (t === 4) return mc('"一半"用分数怎么写？', '1/2', ['1/3', '1/4', '2/1']);
        if (t === 5) return judge('0 是最小的自然数。', true);
        if (t === 6) return mc('5、10、15、20，下一个数是？', '25', ['21', '30', '40']);
        return mc('一年有几个月？', '12 个月', ['10 个月', '24 个月', '7 个月']);
      },
    },
  ],
};

// ============== 二年级 ==============
const grade2 = {
  name: '二年级',
  chapters: [
    {
      id: 'g2-c1',
      name: '100以内加减',
      generate() {
        const isAdd = Math.random() < 0.5;
        let a, b;
        if (isAdd) { a = rand(10, 99); b = rand(1, Math.max(1, 99 - a)); }
        else       { a = rand(20, 99); b = rand(1, a - 1); }
        if (Math.random() < 0.3) return judgeEq(a, isAdd ? '+' : '-', b, 9);
        const ans = isAdd ? a + b : a - b;
        return mcn(`${a} ${isAdd ? '+' : '-'} ${b} = ?`, ans, 10);
      },
    },
    {
      id: 'g2-c2',
      name: '乘法口诀',
      generate() {
        const a = rand(2, 9), b = rand(1, 9);
        if (Math.random() < 0.3) return judgeEq(a, '×', b, 9);
        return mcn(`${a} × ${b} = ?`, a * b, 8);
      },
    },
    {
      id: 'g2-c3',
      name: '表内除法',
      generate() {
        const b = rand(2, 9), q = rand(1, 9);
        const a = b * q;
        if (Math.random() < 0.3) {
          const isTrue = Math.random() < 0.5;
          let shown = q;
          if (!isTrue) {
            let s = 30;
            do { shown = q + rand(-3, 3); s--; } while ((shown === q || shown <= 0) && s > 0);
            if (shown === q) shown = q + 1;
          }
          return judge(`${a} ÷ ${b} = ${shown}，对吗？`, isTrue);
        }
        return mcn(`${a} ÷ ${b} = ?`, q, 5);
      },
    },
    {
      id: 'g2-c4',
      name: '图形与规律 🔺',
      generate() {
        const t = rand(0, 5);
        if (t === 0) {
          // 兔子数列（不点名）
          const seqs = [[1, 1, 2, 3, 5], [1, 2, 3, 5, 8], [2, 3, 5, 8, 13]];
          const s = pick(seqs);
          const next = s[s.length - 1] + s[s.length - 2];
          return mcn(`小兔子数列（每一项是前两项的和）：${s.join(', ')}, ?`, next, 5);
        }
        if (t === 1) {
          // 平方数
          const start = rand(2, 5);
          const seq = [start * start, (start + 1) * (start + 1), (start + 2) * (start + 2)];
          return mcn(`正方形点阵的点数：${seq.join(', ')}, ?`, (start + 3) * (start + 3), 8);
        }
        if (t === 2) {
          // 倍增
          const start = rand(1, 3);
          const m = rand(2, 3);
          const seq = [start];
          for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * m);
          return mcn(`找规律（每一项是前一项的 ${m} 倍）：${seq.join(', ')}, ?`, seq[3] * m, 8);
        }
        if (t === 3) {
          // 三角形堆叠
          const n = rand(4, 7);
          return mcn(`小朋友摆三角形，第 1 行 1 个、第 2 行 2 个、第 3 行 3 个……第 ${n} 行有几个？`, n, 3);
        }
        if (t === 4) {
          // 形状识别
          return mc('下面哪个图形有 4 条相等的边？', '正方形 ⬛', ['长方形 ▭', '三角形 🔺', '圆形 ⚪']);
        }
        // 等差
        const start = rand(1, 10);
        const step = rand(2, 5);
        const seq = [start, start + step, start + 2 * step, start + 3 * step];
        return mcn(`找规律：${seq.join(', ')}, ?`, seq[3] + step, 5);
      },
    },
    {
      id: 'g2-c5',
      name: '数字奇趣 🎲',
      generate() {
        const t = rand(0, 7);
        if (t === 0) return mc('圆周率 π 大约等于以下哪个数？', '3.14', ['2.14', '3.41', '13.4']);
        if (t === 1) return judge('圆周率 π 是一个永远算不完的小数。', true);
        if (t === 2) return mc('一个数自己乘自己（比如 5 × 5），结果叫什么？', '平方数', ['立方数', '小数', '负数']);
        if (t === 3) return mcn('下面哪个数是 4 × 4？', 16, 6);
        if (t === 4) return mc('下面哪个数最大？', '∞（无穷大）', ['100', '10000', '一亿']);
        if (t === 5) return mc('1, 1, 2, 3, 5, 8 这种数列叫什么？', '斐波那契数列', ['平方数列', '奇数数列', '偶数数列']);
        if (t === 6) return judge('小数 0.5 写成分数就是 1/2。', true);
        return mc('下面哪个是双数（偶数）？', '8', ['3', '7', '11']);
      },
    },
  ],
};

// ============== 三年级 ==============
const grade3 = {
  name: '三年级',
  chapters: [
    {
      id: 'g3-c1',
      name: '万以内加减',
      generate() {
        const isAdd = Math.random() < 0.5;
        let a, b;
        if (isAdd) { a = rand(100, 9999); b = rand(100, 9999); }
        else       { a = rand(500, 9999); b = rand(100, a - 1); }
        if (Math.random() < 0.3) return judgeEq(a, isAdd ? '+' : '-', b, 50);
        const ans = isAdd ? a + b : a - b;
        return mcn(`${a} ${isAdd ? '+' : '-'} ${b} = ?`, ans, 50);
      },
    },
    {
      id: 'g3-c2',
      name: '多位数乘一位数',
      generate() {
        const a = rand(11, 999), b = rand(2, 9);
        if (Math.random() < 0.3) return judgeEq(a, '×', b, 50);
        return mcn(`${a} × ${b} = ?`, a * b, 30);
      },
    },
    {
      id: 'g3-c3',
      name: '一位数除法',
      generate() {
        const b = rand(2, 9), q = rand(11, 200);
        const a = b * q;
        if (Math.random() < 0.3) {
          const isTrue = Math.random() < 0.5;
          let shown = q;
          if (!isTrue) {
            let s = 30;
            do { shown = q + rand(-15, 15); s--; } while ((shown === q || shown <= 0) && s > 0);
            if (shown === q) shown = q + 1;
          }
          return judge(`${a} ÷ ${b} = ${shown}，对吗？`, isTrue);
        }
        return mcn(`${a} ÷ ${b} = ?`, q, 15);
      },
    },
    {
      id: 'g3-c4',
      name: '分数与小数',
      generate() {
        const t = rand(0, 7);
        if (t === 0) {
          const d = rand(3, 10);
          const a = rand(1, d - 1), b = rand(1, d - a);
          return mcn(`${a}/${d} + ${b}/${d} = ?/${d}（分子是？）`, a + b, 4);
        }
        if (t === 1) {
          const d = rand(3, 10);
          const big = rand(2, d - 1), small = rand(1, big - 1);
          return mcn(`${big}/${d} - ${small}/${d} = ?/${d}（分子是？）`, big - small, 4);
        }
        if (t === 2) {
          const d = rand(3, 10);
          const a = rand(1, d - 1), b = rand(1, d - 1);
          if (a === b) return this.generate();
          return mc(`${a}/${d} 和 ${b}/${d}，哪个大？`, `${Math.max(a, b)}/${d}`, [`${Math.min(a, b)}/${d}`, '一样大']);
        }
        if (t === 3) {
          const pairs = [['0.5', '1/2'], ['0.25', '1/4'], ['0.1', '1/10'], ['0.2', '1/5'], ['0.75', '3/4']];
          const p = pick(pairs);
          const others = pairs.filter(x => x !== p).map(x => x[1]);
          return mc(`${p[0]} 等于下面哪个分数？`, p[1], shuffle(others).slice(0, 3));
        }
        if (t === 4) {
          return mc('下面哪个小数最大？', '0.55', ['0.5', '0.45', '0.05']);
        }
        if (t === 5) {
          return mc('下面哪个分数最大？', '3/4', ['1/4', '1/2', '2/4']);
        }
        if (t === 6) {
          return judge('1/2 比 1/3 大。', true);
        }
        return judge('0.1 + 0.1 = 0.2。', true);
      },
    },
    {
      id: 'g3-c5',
      name: '数列奥秘 🔢',
      generate() {
        const t = rand(0, 6);
        if (t === 0) {
          const seqs = [[1, 1, 2, 3, 5, 8], [1, 1, 2, 3, 5, 8, 13], [2, 3, 5, 8, 13, 21]];
          const s = pick(seqs);
          const next = s[s.length - 1] + s[s.length - 2];
          return mcn(`斐波那契数列（每项 = 前两项之和）：${s.join(', ')}, ?`, next, 6);
        }
        if (t === 1) {
          const start = rand(3, 7);
          const seq = [start * start, (start + 1) * (start + 1), (start + 2) * (start + 2)];
          return mcn(`平方数列：${seq.join(', ')}, ?`, (start + 3) * (start + 3), 12);
        }
        if (t === 2) {
          const start = rand(1, 4);
          const m = rand(2, 4);
          const seq = [start];
          for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * m);
          return mcn(`找规律：${seq.join(', ')}, ?`, seq[3] * m, 10);
        }
        if (t === 3) {
          return mc('1, 1, 2, 3, 5, 8, 13, 21 这种数列叫什么？', '斐波那契数列', ['等差数列', '平方数列', '奇数数列']);
        }
        if (t === 4) {
          // 三角形数
          const n = rand(4, 7);
          const total = (n * (n + 1)) / 2;
          return mcn(`摆三角形：第 1 行 1 个、第 2 行 2 个……第 ${n} 行 ${n} 个，一共多少个？`, total, 5);
        }
        if (t === 5) {
          return mc('下面哪一组是奇数数列？', '1, 3, 5, 7, 9', ['2, 4, 6, 8', '1, 1, 2, 3, 5', '1, 4, 9, 16']);
        }
        return judge('数列 2, 4, 6, 8, 10 中相邻两项的差都是 2。', true);
      },
    },
  ],
};

// ============== 四年级 ==============
const grade4 = {
  name: '四年级',
  chapters: [
    {
      id: 'g4-c1',
      name: '大数运算',
      generate() {
        const a = rand(1000, 99999), b = rand(1000, 99999);
        const isAdd = Math.random() < 0.5;
        const big = Math.max(a, b), small = Math.min(a, b);
        if (Math.random() < 0.3) {
          return isAdd
            ? judgeEq(a, '+', b, 200)
            : judgeEq(big, '-', small, 200);
        }
        if (isAdd) return mcn(`${a} + ${b} = ?`, a + b, 200);
        return mcn(`${big} - ${small} = ?`, big - small, 200);
      },
    },
    {
      id: 'g4-c2',
      name: '三位数乘两位数',
      generate() {
        const a = rand(100, 999), b = rand(10, 99);
        if (Math.random() < 0.3) return judgeEq(a, '×', b, 300);
        return mcn(`${a} × ${b} = ?`, a * b, 300);
      },
    },
    {
      id: 'g4-c3',
      name: '两位数除法',
      generate() {
        const b = rand(11, 99), q = rand(2, 99);
        const a = b * q;
        if (Math.random() < 0.3) {
          const isTrue = Math.random() < 0.5;
          let shown = q;
          if (!isTrue) {
            let s = 30;
            do { shown = q + rand(-20, 20); s--; } while ((shown === q || shown <= 0) && s > 0);
            if (shown === q) shown = q + 1;
          }
          return judge(`${a} ÷ ${b} = ${shown}，对吗？`, isTrue);
        }
        return mcn(`${a} ÷ ${b} = ?`, q, 15);
      },
    },
    {
      id: 'g4-c4',
      name: '运算定律与图形',
      generate() {
        const t = rand(0, 6);
        if (t === 0) {
          const a = rand(10, 99), b = rand(2, 9), c = rand(2, 9);
          return mcn(`${a} × ${b} + ${a} × ${c} = ?（用乘法分配律）`, a * (b + c), 30);
        }
        if (t === 1) {
          const a = rand(10, 99), b = rand(10, 99), c = rand(10, 99);
          return mcn(`${a} + ${b} + ${c} = ?`, a + b + c, 20);
        }
        if (t === 2) return judge('a × b = b × a，这叫做乘法交换律。', true);
        if (t === 3) return judge('(a + b) + c = a + (b + c)，这叫做加法结合律。', true);
        if (t === 4) {
          const s = rand(2, 20);
          return mcn(`边长为 ${s} 的正方形，周长是？`, s * 4, 12);
        }
        if (t === 5) {
          const s = rand(2, 15);
          return mcn(`边长为 ${s} 的正方形，面积是？`, s * s, 15);
        }
        return mc('一个长方形的对边？', '相等', ['不相等', '只能竖着相等', '没有对边']);
      },
    },
    {
      id: 'g4-c5',
      name: '数学家的发现 🧠',
      generate() {
        const t = rand(0, 8);
        if (t === 0) return mc('圆周率 π 前 4 位小数是？', '3.1415', ['3.1456', '3.1234', '3.1416']);
        if (t === 1) return mc('黄金分割比约等于以下哪个数？', '1.618', ['1.414', '1.732', '2.000']);
        if (t === 2) return mc('斐波那契数列里下一项怎么算？', '前两项之和', ['前两项之差', '前两项之积', '前两项之商']);
        if (t === 3) return mcn('5 的平方（5²）等于？', 25, 8);
        if (t === 4) return mcn('9 的平方根（√9）等于？', 3, 4);
        if (t === 5) return judge('从 1 开始一个一个数下去，永远没有终点——自然数有无穷多个。', true);
        if (t === 6) return mc('下面哪个不是平方数？', '20', ['16', '25', '36']);
        if (t === 7) return mc('黄金分割经常出现在哪里？', '艺术与建筑（如蒙娜丽莎、帕特农神庙）', ['只在数学课本里', '只在动物身上', '只在天气预报里']);
        return mc('下面哪个数的平方是 49？', '7', ['6', '8', '14']);
      },
    },
  ],
};

// ============== 五年级（保留填空为主） ==============
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

// ============== 六年级（保留填空为主） ==============
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
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const type = rand(0, 1);
        if (type === 0) {
          const k = rand(2, 10);
          let a, b, safety = 30;
          do {
            a = rand(2, 9); b = rand(2, 9);
            safety--;
          } while ((a === b || gcd(a, b) !== 1) && safety > 0);
          if (a === b || gcd(a, b) !== 1) { a = 2; b = 3; }
          return { question: `化简比：${a * k} : ${b * k} = ? : ?（格式 a:b，最简整数比）`, answer: `${a}:${b}` };
        } else {
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
  let safety = count * 8;
  while (problems.length < count && safety-- > 0) {
    const p = chapter.generate();
    const key = p.question;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push(p);
  }
  while (problems.length < count) {
    problems.push(chapter.generate());
  }
  return problems;
}
