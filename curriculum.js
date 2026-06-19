// 课程大纲 + 题目生成器
// 1-4 年级：选择题 + 判断题；5-6 年级：以填空为主

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

// 难一些的干扰项：靠近答案 + 相对误差小
function makeChoices(answer, tightRange) {
  const set = new Set([answer]);
  // 一半干扰项贴得近，一半远一点
  const closeR = Math.max(1, Math.floor(tightRange * 0.4));
  let safety = 60;
  while (set.size < 4 && safety-- > 0) {
    const r = set.size <= 2 ? closeR : tightRange;
    const delta = rand(-r, r);
    if (delta === 0) continue;
    const v = answer + delta;
    if (v < 0) continue;
    set.add(v);
  }
  // 不足 4 个再补一些远的
  let big = answer + tightRange + 1;
  while (set.size < 4) { set.add(big); big += rand(2, 5); }
  return shuffle([...set]);
}

function mc(question, answer, distractors) {
  const seen = new Set([String(answer)]);
  const out = [answer];
  for (const d of distractors) {
    const key = String(d);
    if (!seen.has(key)) { seen.add(key); out.push(d); }
  }
  return { question, answer, choices: shuffle(out) };
}

function mcn(question, answer, range = 5) {
  return { question, answer, choices: makeChoices(answer, range) };
}

function judge(question, isTrue) {
  return { question, answer: isTrue ? '对' : '错', choices: ['对', '错'] };
}

function judgeEq(left, op, right, jitter) {
  const correct = op === '+' ? left + right : op === '-' ? left - right : op === '×' ? left * right : left / right;
  const isTrue = Math.random() < 0.5;
  let shown = correct;
  if (!isTrue) {
    let safety = 30;
    do {
      // 偏移更小，蒙错更困难
      const r = Math.max(1, Math.floor(jitter * 0.5));
      shown = correct + (Math.random() < 0.5 ? rand(-r, -1) : rand(1, r));
      safety--;
    } while (shown < 0 && safety > 0);
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
        // 偏向更难的加法（结果接近 10）
        const a = rand(1, 9);
        const b = rand(Math.max(1, 10 - a - 2), 10 - a);
        if (Math.random() < 0.3) return judgeEq(a, '+', b, 3);
        // 逆向题：__ + b = c
        if (Math.random() < 0.25) {
          const ans = a;
          return mcn(`?  +  ${b}  =  ${a + b}`, ans, 4);
        }
        return mcn(`${a} + ${b} = ?`, a + b, 4);
      },
    },
    {
      id: 'g1-c2',
      name: '10以内减法',
      generate() {
        const a = rand(5, 10), b = rand(2, a - 1);
        if (Math.random() < 0.3) return judgeEq(a, '-', b, 3);
        // 逆向题
        if (Math.random() < 0.25) {
          return mcn(`${a}  -  ?  =  ${a - b}`, b, 4);
        }
        return mcn(`${a} - ${b} = ?`, a - b, 4);
      },
    },
    {
      id: 'g1-c3',
      name: '20以内进退位',
      generate() {
        // 强制进位/退位
        const isAdd = Math.random() < 0.5;
        let a, b;
        if (isAdd) {
          // 个位 + 个位 ≥ 10
          do { a = rand(3, 9); b = rand(11 - a, 9); } while (a + b < 11 || a + b > 18);
        } else {
          // 退位减
          do { a = rand(11, 18); b = rand(2, 9); } while (a - b < 0 || (a % 10) >= b);
        }
        if (Math.random() < 0.25) return judgeEq(a, isAdd ? '+' : '-', b, 4);
        if (Math.random() < 0.25) {
          // 三个数加减
          const c = rand(2, 8);
          if (isAdd) return mcn(`${a} + ${b} - ${c} = ?`, a + b - c, 5);
          return mcn(`${a} - ${b} + ${c} = ?`, a - b + c, 5);
        }
        const ans = isAdd ? a + b : a - b;
        return mcn(`${a} ${isAdd ? '+' : '-'} ${b} = ?`, ans, 5);
      },
    },
    {
      id: 'g1-c4',
      name: '找规律 🔵🔴🔵🔴',
      generate() {
        const t = rand(0, 5);
        if (t === 0) {
          // ABBA 类型循环
          const tri = pick([['⭐', '🌙', '☁️'], ['🐰', '🐱', '🐶'], ['🍎', '🍌', '🍇'], ['🔵', '🔴', '🟡']]);
          const len = rand(7, 10);
          const seq = [];
          for (let i = 0; i < len; i++) seq.push(tri[i % 3]);
          const idx = len % 3;
          const wrongs = tri.filter((_, i) => i !== idx);
          return mc(`接下来是哪个？\n${seq.join('')} ?`, tri[idx], [...wrongs, '🌈']);
        }
        if (t === 1) {
          // 等差数列：差增加
          const start = rand(2, 8);
          const step = rand(2, 5);
          const seq = [start, start + step, start + 2 * step, start + 3 * step];
          return mcn(`找规律：${seq.join(', ')}, ?`, start + 4 * step, 4);
        }
        if (t === 2) {
          // 数差为递增
          const start = rand(1, 5);
          const seq = [start, start + 1, start + 3, start + 6];
          return mcn(`找规律（差越来越大 +1, +2, +3...）：${seq.join(', ')}, ?`, start + 10, 4);
        }
        if (t === 3) {
          // 数一数（更多）
          const n = rand(8, 16);
          const emoji = pick(['🍎', '🌟', '🎈', '🐰', '🌸']);
          return mcn(`一共有几个 ${emoji}？\n${emoji.repeat(n)}`, n, 4);
        }
        if (t === 4) {
          // 比较多个数
          const nums = shuffle([rand(0, 20), rand(0, 20), rand(0, 20), rand(0, 20)]);
          const max = Math.max(...nums);
          if (nums.filter(x => x === max).length > 1) return this.generate();
          return mc(`下面哪个数最大？`, String(max), nums.filter(x => x !== max).map(String));
        }
        // 倍增（×2）
        const start = rand(1, 3);
        const seq = [start, start * 2, start * 4, start * 8];
        return mcn(`找规律（每次乘 2）：${seq.join(', ')}, ?`, start * 16, 6);
      },
    },
    {
      id: 'g1-c5',
      name: '应用题挑战 🎯',
      generate() {
        const t = rand(0, 6);
        if (t === 0) {
          const a = rand(3, 9), b = rand(2, 7);
          return mcn(`小明有 ${a} 个苹果，妈妈又给了他 ${b} 个，他现在有几个？`, a + b, 4);
        }
        if (t === 1) {
          const a = rand(8, 18), b = rand(3, 7);
          return mcn(`妈妈做了 ${a} 块饼干，小红吃了 ${b} 块，还剩几块？`, a - b, 4);
        }
        if (t === 2) {
          const a = rand(3, 8), b = rand(2, 6);
          return mcn(`小猫钓了 ${a} 条鱼，小狗钓了 ${b} 条，他们一共钓了几条？`, a + b, 4);
        }
        if (t === 3) {
          const total = rand(10, 20), eaten = rand(3, total - 3);
          return mcn(`果园里有 ${total} 棵树，砍了 ${eaten} 棵，还剩几棵？`, total - eaten, 5);
        }
        if (t === 4) {
          // 比多比少
          const a = rand(5, 15), diff = rand(2, 6);
          return mcn(`小华有 ${a} 颗糖，小丽比小华多 ${diff} 颗，小丽有几颗？`, a + diff, 4);
        }
        if (t === 5) {
          const a = rand(5, 15), diff = rand(2, 5);
          return mcn(`小华有 ${a} 颗糖，小丽比小华少 ${diff} 颗，小丽有几颗？`, a - diff, 4);
        }
        // 等差求和（小）：1+2+...+n
        const n = rand(4, 6);
        const sum = (n * (n + 1)) / 2;
        return mcn(`小蚂蚁第 1 天搬 1 粒米、第 2 天 2 粒、第 3 天 3 粒……一直到第 ${n} 天，一共搬了多少粒？`, sum, 5);
      },
    },
    {
      id: 'g1-c6',
      name: '数学小百科 ✨',
      generate() {
        const t = rand(0, 9);
        if (t === 0) return mc('数学里"无穷大"用什么符号表示？', '∞', ['π', 'Σ', 'Δ']);
        if (t === 1) return judge('比 100 大的数有很多很多，永远数不完。', true);
        if (t === 2) return mc('数学里"圆周率"用什么符号表示？', 'π', ['∞', '√', 'α']);
        if (t === 3) return mc('"一半"用分数怎么写？', '1/2', ['1/3', '1/4', '2/1']);
        if (t === 4) return judge('0 是最小的自然数。', true);
        if (t === 5) return mcn('5、10、15、20、25，下一个数是？', 30, 5);
        if (t === 6) return mc('一年有几个月？', '12 个月', ['10 个月', '24 个月', '7 个月']);
        if (t === 7) return mc('一星期有几天？', '7 天', ['5 天', '10 天', '12 天']);
        if (t === 8) return judge('1 + 2 + 3 + 4 = 10。', true);
        return mc('下面哪个数比 50 大、比 60 小？', '57', ['49', '60', '62']);
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
      name: '100以内进退位',
      generate() {
        const isAdd = Math.random() < 0.5;
        let a, b;
        if (isAdd) {
          // 强制进位
          do { a = rand(15, 89); b = rand(15, 89); } while ((a % 10) + (b % 10) < 10);
        } else {
          // 强制退位
          do { a = rand(20, 99); b = rand(11, a - 1); } while ((a % 10) >= (b % 10));
        }
        if (Math.random() < 0.25) return judgeEq(a, isAdd ? '+' : '-', b, 9);
        if (Math.random() < 0.25) {
          // 三数运算
          const c = rand(10, 30);
          if (isAdd) return mcn(`${a} + ${b} - ${c} = ?`, a + b - c, 12);
          return mcn(`${a} - ${b} + ${c} = ?`, a - b + c, 12);
        }
        const ans = isAdd ? a + b : a - b;
        return mcn(`${a} ${isAdd ? '+' : '-'} ${b} = ?`, ans, 8);
      },
    },
    {
      id: 'g2-c2',
      name: '乘法口诀',
      generate() {
        const a = rand(2, 9), b = rand(2, 9);
        if (Math.random() < 0.25) return judgeEq(a, '×', b, 9);
        if (Math.random() < 0.3) {
          // 逆向：?? × b = a*b
          return mcn(`?  ×  ${b}  =  ${a * b}`, a, 5);
        }
        return mcn(`${a} × ${b} = ?`, a * b, 7);
      },
    },
    {
      id: 'g2-c3',
      name: '除法与余数',
      generate() {
        const t = rand(0, 3);
        if (t === 0) {
          // 整除
          const b = rand(2, 9), q = rand(2, 9);
          return mcn(`${b * q} ÷ ${b} = ?`, q, 5);
        }
        if (t === 1) {
          // 有余数
          const b = rand(3, 9), q = rand(2, 9), r = rand(1, b - 1);
          return mcn(`${b * q + r} ÷ ${b} = ${q} 余 ?`, r, 4);
        }
        if (t === 2) {
          // 应用：分组
          const b = rand(3, 9), q = rand(3, 8);
          return mcn(`把 ${b * q} 颗糖平均分给 ${b} 个小朋友，每人能分到几颗？`, q, 5);
        }
        // 判断
        const b = rand(2, 9), q = rand(2, 9);
        const isTrue = Math.random() < 0.5;
        let shown = q;
        if (!isTrue) shown = q + (Math.random() < 0.5 ? -rand(1, 3) : rand(1, 3));
        if (shown <= 0) shown = q + 1;
        return judge(`${b * q} ÷ ${b} = ${shown}，对吗？`, isTrue && shown === q);
      },
    },
    {
      id: 'g2-c4',
      name: '混合运算',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          // 乘加
          const a = rand(2, 9), b = rand(2, 9), c = rand(5, 30);
          return mcn(`${a} × ${b} + ${c} = ?`, a * b + c, 10);
        }
        if (t === 1) {
          // 乘减
          const a = rand(3, 9), b = rand(3, 9), c = rand(2, 20);
          return mcn(`${a} × ${b} - ${c} = ?`, a * b - c, 10);
        }
        if (t === 2) {
          // 加除
          const b = rand(2, 9), q = rand(2, 9), c = rand(5, 30);
          return mcn(`${b * q} ÷ ${b} + ${c} = ?`, q + c, 10);
        }
        if (t === 3) {
          // 括号
          const a = rand(5, 20), b = rand(3, 9), c = rand(2, 9);
          return mcn(`(${a} + ${b}) × ${c} = ?`, (a + b) * c, 20);
        }
        // 应用题
        const boxes = rand(3, 8), each = rand(3, 8), gift = rand(2, 6);
        return mcn(`${boxes} 个盒子里每个有 ${each} 块巧克力，再加 ${gift} 块零散的，一共多少块？`, boxes * each + gift, 8);
      },
    },
    {
      id: 'g2-c5',
      name: '图形与规律 🔺',
      generate() {
        const t = rand(0, 6);
        if (t === 0) {
          // 斐波那契
          const seqs = [[1, 1, 2, 3, 5, 8], [1, 2, 3, 5, 8, 13], [2, 3, 5, 8, 13, 21]];
          const s = pick(seqs);
          const next = s[s.length - 1] + s[s.length - 2];
          return mcn(`小兔子数列（每项=前两项之和）：${s.join(', ')}, ?`, next, 6);
        }
        if (t === 1) {
          // 平方数列
          const start = rand(2, 6);
          const seq = [start * start, (start + 1) * (start + 1), (start + 2) * (start + 2)];
          return mcn(`正方形点阵：${seq.join(', ')}, ?`, (start + 3) * (start + 3), 10);
        }
        if (t === 2) {
          // 倍增 / 递推
          const start = rand(1, 3);
          const m = rand(2, 4);
          const seq = [start];
          for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * m);
          return mcn(`找规律（每一项是前一项的 ${m} 倍）：${seq.join(', ')}, ?`, seq[3] * m, 12);
        }
        if (t === 3) {
          // 三角形数总和
          const n = rand(5, 9);
          const total = (n * (n + 1)) / 2;
          return mcn(`摆三角形：第 1 行 1 个、第 2 行 2 个……第 ${n} 行 ${n} 个，一共多少个？`, total, 6);
        }
        if (t === 4) {
          // 形状识别
          const opts = [
            { q: '下面哪个图形有 4 条相等的边？', a: '正方形 ⬛', d: ['长方形 ▭', '三角形 🔺', '圆形 ⚪'] },
            { q: '下面哪个图形没有顶点？', a: '圆形 ⚪', d: ['长方形 ▭', '三角形 🔺', '正方形 ⬛'] },
            { q: '下面哪个图形有 3 个角？', a: '三角形 🔺', d: ['正方形 ⬛', '长方形 ▭', '圆形 ⚪'] },
          ];
          const o = pick(opts);
          return mc(o.q, o.a, o.d);
        }
        if (t === 5) {
          // 数图形
          return mc('一个长方形里画一条对角线，能数出几个三角形？', '2 个', ['1 个', '3 个', '4 个']);
        }
        // 等差
        const start = rand(2, 12);
        const step = rand(3, 7);
        const seq = [start, start + step, start + 2 * step, start + 3 * step];
        return mcn(`找规律：${seq.join(', ')}, ?`, seq[3] + step, 7);
      },
    },
    {
      id: 'g2-c6',
      name: '数字奇趣 🎲',
      generate() {
        const t = rand(0, 9);
        if (t === 0) return mc('圆周率 π 大约等于以下哪个数？', '3.14', ['2.14', '3.41', '3.04']);
        if (t === 1) return judge('圆周率 π 是一个永远算不完的小数。', true);
        if (t === 2) return mc('一个数自己乘自己（如 5 × 5 = 25），25 叫做？', '5 的平方数', ['5 的两倍', '5 的小数', '5 的负数']);
        if (t === 3) return mcn('6 × 6 等于？', 36, 8);
        if (t === 4) return mc('下面哪个数最大？', '∞（无穷大）', ['100', '一万', '一亿']);
        if (t === 5) return mc('1, 1, 2, 3, 5, 8 这种数列叫什么？', '斐波那契数列', ['平方数列', '奇数数列', '偶数数列']);
        if (t === 6) return judge('小数 0.5 写成分数就是 1/2。', true);
        if (t === 7) return mcn('1 + 2 + 3 + 4 + 5 = ?', 15, 5);
        if (t === 8) return mc('1, 4, 9, 16 这一组数叫什么？', '平方数列', ['偶数数列', '斐波那契数列', '奇数数列']);
        return judge('任何数 × 0 都等于 0。', true);
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
        if (isAdd) { a = rand(500, 9999); b = rand(500, 9999); }
        else       { a = rand(2000, 9999); b = rand(500, a - 1); }
        if (Math.random() < 0.25) return judgeEq(a, isAdd ? '+' : '-', b, 30);
        if (Math.random() < 0.25) {
          // 三数
          const c = rand(100, 999);
          if (isAdd) return mcn(`${a} + ${b} - ${c} = ?`, a + b - c, 60);
          return mcn(`${a} - ${b} + ${c} = ?`, a - b + c, 60);
        }
        const ans = isAdd ? a + b : a - b;
        return mcn(`${a} ${isAdd ? '+' : '-'} ${b} = ?`, ans, 30);
      },
    },
    {
      id: 'g3-c2',
      name: '多位数乘一位数',
      generate() {
        const a = rand(20, 999), b = rand(3, 9);
        if (Math.random() < 0.25) return judgeEq(a, '×', b, 30);
        if (Math.random() < 0.25) {
          // 逆向
          return mcn(`?  ×  ${b}  =  ${a * b}`, a, 20);
        }
        // 加大 a 的位数倾向，减少简单 0 末尾
        return mcn(`${a} × ${b} = ?`, a * b, 20);
      },
    },
    {
      id: 'g3-c3',
      name: '除法（含余数）',
      generate() {
        const t = rand(0, 3);
        if (t === 0) {
          const b = rand(2, 9), q = rand(20, 200);
          return mcn(`${b * q} ÷ ${b} = ?`, q, 12);
        }
        if (t === 1) {
          const b = rand(3, 9), q = rand(15, 100), r = rand(1, b - 1);
          return mcn(`${b * q + r} ÷ ${b} = ${q} 余 ?`, r, 3);
        }
        if (t === 2) {
          const b = rand(3, 9), q = rand(15, 100), r = rand(1, b - 1);
          return mcn(`${b * q + r} ÷ ${b}，商是？`, q, 10);
        }
        // 应用
        const b = rand(3, 8), q = rand(8, 30), r = rand(1, b - 1);
        return mcn(`把 ${b * q + r} 块糖平均装到 ${b} 个袋子里，每袋装 ${q} 块，还剩几块？`, r, 3);
      },
    },
    {
      id: 'g3-c4',
      name: '分数与小数',
      generate() {
        const t = rand(0, 9);
        if (t === 0) {
          const d = rand(4, 12);
          const a = rand(1, d - 2), b = rand(1, d - a);
          return mcn(`${a}/${d} + ${b}/${d} = ?/${d}（分子）`, a + b, 4);
        }
        if (t === 1) {
          const d = rand(4, 12);
          const big = rand(3, d - 1), small = rand(1, big - 1);
          return mcn(`${big}/${d} - ${small}/${d} = ?/${d}（分子）`, big - small, 4);
        }
        if (t === 2) {
          // 比较
          const d = rand(3, 12);
          const a = rand(1, d - 1), b = rand(1, d - 1);
          if (a === b) return this.generate();
          return mc(`${a}/${d} 和 ${b}/${d}，哪个大？`, `${Math.max(a, b)}/${d}`, [`${Math.min(a, b)}/${d}`, '一样大']);
        }
        if (t === 3) {
          const pairs = [['0.5', '1/2'], ['0.25', '1/4'], ['0.1', '1/10'], ['0.2', '1/5'], ['0.75', '3/4'], ['0.4', '2/5'], ['0.6', '3/5']];
          const p = pick(pairs);
          const others = pairs.filter(x => x !== p).map(x => x[1]);
          return mc(`${p[0]} 等于下面哪个分数？`, p[1], shuffle(others).slice(0, 3));
        }
        if (t === 4) {
          // 4 个小数比较
          const nums = shuffle(['0.5', '0.45', '0.55', '0.05', '0.65', '0.6', '0.4']).slice(0, 4);
          const max = nums.reduce((a, b) => parseFloat(a) > parseFloat(b) ? a : b);
          return mc('下面哪个小数最大？', max, nums.filter(x => x !== max));
        }
        if (t === 5) {
          // 4 个分数比较（同分母）
          const d = rand(5, 10);
          const opts = shuffle([1, 2, 3, 4]).slice(0, 3).concat([d - 1]);
          const max = `${d - 1}/${d}`;
          return mc(`下面哪个分数最大？`, max, opts.filter(n => n !== d - 1).map(n => `${n}/${d}`));
        }
        if (t === 6) {
          // 小数加
          const a = rand(1, 9) / 10, b = rand(1, 9) / 10;
          const ans = +(a + b).toFixed(1);
          return mcn(`${a} + ${b} = ?`, ans, 1);
        }
        if (t === 7) {
          return judge('1/2 + 1/2 = 1。', true);
        }
        if (t === 8) {
          return judge('0.3 + 0.4 = 0.7。', true);
        }
        // 谁更大：分数 vs 小数
        return mc('1/2 和 0.4，哪个大？', '1/2', ['0.4', '一样大']);
      },
    },
    {
      id: 'g3-c5',
      name: '应用题挑战 🎯',
      generate() {
        const t = rand(0, 5);
        if (t === 0) {
          const total = rand(50, 200), a = rand(10, total / 2), b = rand(10, total - a);
          return mcn(`图书馆有 ${total} 本书，星期一借出 ${a} 本，星期二借出 ${b} 本，还剩多少本？`, total - a - b, 15);
        }
        if (t === 1) {
          // 单价 × 数量
          const price = rand(3, 12), qty = rand(4, 9);
          return mcn(`一支铅笔 ${price} 元，买 ${qty} 支共需多少元？`, price * qty, 8);
        }
        if (t === 2) {
          // 找零
          const price = rand(3, 9), qty = rand(3, 8), pay = price * qty + rand(5, 30);
          return mcn(`一本本子 ${price} 元，买 ${qty} 本付了 ${pay} 元，应找回多少元？`, pay - price * qty, 6);
        }
        if (t === 3) {
          // 平均分
          const each = rand(4, 12), groups = rand(3, 6);
          return mcn(`${each * groups} 个橘子平均分给 ${groups} 个班级，每个班分到几个？`, each, 5);
        }
        if (t === 4) {
          // 速度
          const speed = rand(20, 80), time = rand(2, 6);
          return mcn(`小汽车每小时跑 ${speed} 千米，跑 ${time} 小时能跑多少千米？`, speed * time, 25);
        }
        // 比较
        const a = rand(20, 80), more = rand(5, 25);
        return mcn(`小华读了 ${a} 页书，小明比小华多读 ${more} 页，他们一共读了多少页？`, a + (a + more), 12);
      },
    },
    {
      id: 'g3-c6',
      name: '数列奥秘 🔢',
      generate() {
        const t = rand(0, 7);
        if (t === 0) {
          const seqs = [[1, 1, 2, 3, 5, 8], [1, 1, 2, 3, 5, 8, 13], [2, 3, 5, 8, 13, 21], [3, 4, 7, 11, 18]];
          const s = pick(seqs);
          const next = s[s.length - 1] + s[s.length - 2];
          return mcn(`找规律（每项=前两项之和）：${s.join(', ')}, ?`, next, 6);
        }
        if (t === 1) {
          const start = rand(4, 9);
          const seq = [start * start, (start + 1) * (start + 1), (start + 2) * (start + 2)];
          return mcn(`平方数列：${seq.join(', ')}, ?`, (start + 3) * (start + 3), 18);
        }
        if (t === 2) {
          // 立方数
          const start = rand(2, 4);
          const seq = [start ** 3, (start + 1) ** 3, (start + 2) ** 3];
          return mcn(`立方数列：${seq.join(', ')}, ?`, (start + 3) ** 3, 30);
        }
        if (t === 3) {
          // 跳跃倍增
          const start = rand(1, 4);
          const m = rand(2, 4);
          const seq = [start];
          for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * m);
          return mcn(`找规律：${seq.join(', ')}, ?`, seq[3] * m, 15);
        }
        if (t === 4) {
          return mc('1, 1, 2, 3, 5, 8, 13, 21 这种数列叫什么？', '斐波那契数列', ['等差数列', '平方数列', '奇数数列']);
        }
        if (t === 5) {
          const n = rand(6, 10);
          const total = (n * (n + 1)) / 2;
          return mcn(`1 + 2 + 3 + ... + ${n} = ?`, total, 5);
        }
        if (t === 6) {
          return mc('下面哪一组是奇数数列？', '1, 3, 5, 7, 9', ['2, 4, 6, 8', '1, 1, 2, 3, 5', '1, 4, 9, 16']);
        }
        return judge('数列 1, 4, 9, 16, 25 中的每一项都是某个数的平方。', true);
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
      name: '大数与连算',
      generate() {
        const t = rand(0, 2);
        if (t === 0) {
          const a = rand(10000, 99999), b = rand(10000, 99999);
          const isAdd = Math.random() < 0.5;
          const big = Math.max(a, b), small = Math.min(a, b);
          if (Math.random() < 0.25) {
            return isAdd ? judgeEq(a, '+', b, 200) : judgeEq(big, '-', small, 200);
          }
          return isAdd ? mcn(`${a} + ${b} = ?`, a + b, 150) : mcn(`${big} - ${small} = ?`, big - small, 150);
        }
        if (t === 1) {
          // 连加连减
          const a = rand(1000, 9999), b = rand(1000, 9999), c = rand(1000, 9999);
          return mcn(`${a} + ${b} - ${c} = ?`, a + b - c, 150);
        }
        // 估算
        const a = rand(100, 999), b = rand(100, 999);
        const exact = a + b;
        const rounded = Math.round((a + b) / 100) * 100;
        return mc(`${a} + ${b} 大约等于（百位）？`, String(rounded), [String(rounded - 100), String(rounded + 100), String(rounded - 200)]);
      },
    },
    {
      id: 'g4-c2',
      name: '三位数乘两位数',
      generate() {
        const a = rand(120, 999), b = rand(15, 99);
        if (Math.random() < 0.25) return judgeEq(a, '×', b, 250);
        if (Math.random() < 0.2) {
          // 逆向
          return mcn(`?  ×  ${b}  =  ${a * b}`, a, 80);
        }
        return mcn(`${a} × ${b} = ?`, a * b, 250);
      },
    },
    {
      id: 'g4-c3',
      name: '两位数除法',
      generate() {
        const t = rand(0, 2);
        if (t === 0) {
          const b = rand(15, 99), q = rand(5, 99);
          return mcn(`${b * q} ÷ ${b} = ?`, q, 15);
        }
        if (t === 1) {
          // 有余数
          const b = rand(13, 50), q = rand(8, 50), r = rand(1, b - 1);
          return mcn(`${b * q + r} ÷ ${b}，商是？`, q, 12);
        }
        // 应用
        const b = rand(15, 30), q = rand(5, 15);
        return mcn(`${b * q} 个学生平均分成 ${b} 个小组，每组多少人？`, q, 8);
      },
    },
    {
      id: 'g4-c4',
      name: '运算定律与简便运算',
      generate() {
        const t = rand(0, 6);
        if (t === 0) {
          // 乘法分配律：a × b + a × c
          const a = rand(15, 99), b = rand(3, 9), c = rand(3, 9);
          return mcn(`${a} × ${b} + ${a} × ${c} = ?（提示：用乘法分配律）`, a * (b + c), 50);
        }
        if (t === 1) {
          // 凑整：125 × 8、25 × 4
          const opts = [
            { a: 125, b: 8, factor: rand(2, 9) },
            { a: 25, b: 4, factor: rand(2, 9) },
            { a: 50, b: 2, factor: rand(3, 19) },
          ];
          const o = pick(opts);
          return mcn(`${o.a} × ${o.factor} × ${o.b} = ?（提示：先凑整）`, o.a * o.b * o.factor, 80);
        }
        if (t === 2) {
          // 凑十凑百加法
          const a = rand(20, 80), b = (100 - a) + rand(-3, 3), c = rand(10, 50);
          return mcn(`${a} + ${b} + ${c} = ?`, a + b + c, 25);
        }
        if (t === 3) return judge('a × b = b × a，这叫做乘法交换律。', true);
        if (t === 4) return judge('(a × b) × c = a × (b × c)，这叫做乘法结合律。', true);
        if (t === 5) {
          const a = rand(3, 15);
          return mcn(`边长为 ${a} 的正方形，周长是？`, a * 4, 12);
        }
        const a = rand(3, 15), b = rand(3, 15);
        return mcn(`长 ${a}、宽 ${b} 的长方形，周长是？`, (a + b) * 2, 15);
      },
    },
    {
      id: 'g4-c5',
      name: '面积与几何 📐',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          const a = rand(3, 20);
          return mcn(`边长为 ${a} 的正方形，面积是？`, a * a, 30);
        }
        if (t === 1) {
          const a = rand(4, 20), b = rand(3, 15);
          if (a === b) return this.generate();
          return mcn(`长 ${a}、宽 ${b} 的长方形，面积是？`, a * b, 25);
        }
        if (t === 2) {
          // 反求
          const a = rand(3, 15);
          const area = a * a;
          return mcn(`一个正方形的面积是 ${area}，它的边长是？`, a, 4);
        }
        if (t === 3) {
          // 复合：周长求边
          const a = rand(3, 25);
          return mcn(`一个正方形的周长是 ${a * 4}，它的边长是？`, a, 5);
        }
        // 单位换算
        return mc('1 平方米 = 多少平方分米？', '100 平方分米', ['10 平方分米', '1000 平方分米', '20 平方分米']);
      },
    },
    {
      id: 'g4-c6',
      name: '数学家的发现 🧠',
      generate() {
        const t = rand(0, 11);
        if (t === 0) return mc('圆周率 π 前 5 位是？', '3.1415', ['3.1416', '3.1456', '3.1234']);
        if (t === 1) return mc('黄金分割比约等于？', '1.618', ['1.414', '1.732', '2.000']);
        if (t === 2) return mc('√2（2 的平方根）约等于？', '1.414', ['1.732', '2.236', '1.618']);
        if (t === 3) return mc('√3（3 的平方根）约等于？', '1.732', ['1.414', '2.236', '1.618']);
        if (t === 4) return mcn('11 的平方（11²）等于？', 121, 15);
        if (t === 5) return mcn('12 的平方（12²）等于？', 144, 18);
        if (t === 6) return mcn('√64 = ?', 8, 4);
        if (t === 7) return mcn('√100 = ?', 10, 4);
        if (t === 8) return judge('从 1 开始一直数下去，自然数有无穷多个，永远没有最大的。', true);
        if (t === 9) return mc('下面哪个不是平方数？', '50', ['49', '64', '81']);
        if (t === 10) return mc('斐波那契数列的特点是？', '每一项 = 前两项之和', ['每一项 = 前一项 × 2', '每一项 = 前一项 + 1', '每一项 = 前一项的平方']);
        return mc('黄金分割比常出现在？', '艺术、建筑、植物（向日葵种子）', ['只在数学课本里', '只在动物身上', '只在天气预报里']);
      },
    },
  ],
};

// ============== 五年级 ==============
const grade5 = {
  name: '五年级',
  chapters: [
    {
      id: 'g5-c1',
      name: '小数加减乘除',
      generate() {
        const t = rand(0, 3);
        if (t === 0) {
          const a = rand(100, 9999) / 100;
          const b = rand(100, 9999) / 100;
          const answer = +(a + b).toFixed(2);
          return { question: `${a} + ${b} = ?（保留两位小数）`, answer };
        }
        if (t === 1) {
          const a = rand(100, 9999) / 100;
          const b = rand(100, 9999) / 100;
          const big = Math.max(a, b), small = Math.min(a, b);
          const answer = +(big - small).toFixed(2);
          return { question: `${big} - ${small} = ?（保留两位小数）`, answer };
        }
        if (t === 2) {
          const a = rand(15, 999) / 10;
          const b = rand(2, 12);
          const answer = +(a * b).toFixed(2);
          return { question: `${a} × ${b} = ?（保留两位小数）`, answer };
        }
        const b = rand(2, 9);
        const q = rand(15, 999) / 10;
        const a = +(b * q).toFixed(2);
        return { question: `${a} ÷ ${b} = ?（保留一位小数）`, answer: +q.toFixed(1) };
      },
    },
    {
      id: 'g5-c2',
      name: '因数与倍数',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          // 是不是因数
          const a = rand(2, 12), b = rand(2, 12);
          const product = a * b + (Math.random() < 0.5 ? 0 : rand(1, a - 1));
          return judge(`${a} 是 ${product} 的因数。`, product % a === 0);
        }
        if (t === 1) {
          // 求因数个数
          const small = pick([12, 18, 24, 30, 36]);
          const map = { 12: 6, 18: 6, 24: 8, 30: 8, 36: 9 };
          return { question: `${small} 一共有多少个因数？（包括 1 和它自己）`, answer: map[small] };
        }
        if (t === 2) {
          // 最大公约数
          const opts = [[12, 18, 6], [24, 36, 12], [15, 20, 5], [16, 24, 8], [9, 12, 3]];
          const [a, b, ans] = pick(opts);
          return { question: `${a} 和 ${b} 的最大公约数是？`, answer: ans };
        }
        if (t === 3) {
          // 最小公倍数
          const opts = [[4, 6, 12], [3, 5, 15], [6, 8, 24], [4, 10, 20], [3, 4, 12]];
          const [a, b, ans] = pick(opts);
          return { question: `${a} 和 ${b} 的最小公倍数是？`, answer: ans };
        }
        // 质数判断（填 是/否）
        const primes = [2, 3, 5, 7, 11, 13, 17, 19];
        const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21];
        const all = primes.concat(composites);
        const n = pick(all);
        return judge(`${n} 是质数。`, primes.includes(n));
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
        }
        const v1 = n1 / d1, v2 = n2 / d2;
        const [bigN, bigD, smallN, smallD] = v1 >= v2 ? [n1, d1, n2, d2] : [n2, d2, n1, d1];
        const num = bigN * smallD - smallN * bigD;
        const den = bigD * smallD;
        if (num === 0) return this.generate();
        const [rn, rd] = reduce(num, den);
        return { question: `${bigN}/${bigD} - ${smallN}/${smallD} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
      },
    },
    {
      id: 'g5-c4',
      name: '简易方程',
      generate() {
        const t = rand(0, 4);
        const x = rand(3, 80);
        if (t === 0) {
          const a = rand(5, 50);
          return { question: `解方程：x + ${a} = ${x + a}，x = ?`, answer: x };
        }
        if (t === 1) {
          const a = rand(2, 15);
          return { question: `解方程：${a}x = ${a * x}，x = ?`, answer: x };
        }
        if (t === 2) {
          const a = rand(2, 12), c = rand(5, 30);
          return { question: `解方程：${a}x + ${c} = ${a * x + c}，x = ?`, answer: x };
        }
        if (t === 3) {
          // 含括号
          const a = rand(2, 9), b = rand(2, 15);
          return { question: `解方程：${a}(x + ${b}) = ${a * (x + b)}，x = ?`, answer: x };
        }
        // 两边变量
        const a = rand(3, 9), b = rand(2, a - 1), c = rand(5, 50);
        // ax + 0 = bx + (a-b)x... 简化为 ax = bx + c => (a-b)x = c => x = c/(a-b)
        const xx = rand(3, 30);
        const cc = (a - b) * xx;
        return { question: `解方程：${a}x = ${b}x + ${cc}，x = ?`, answer: xx };
      },
    },
    {
      id: 'g5-c5',
      name: '应用题挑战 🎯',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          // 行程：相遇
          const sa = rand(40, 80), sb = rand(30, 70), time = rand(2, 5);
          return { question: `甲乙两车从两地相向而行，甲每小时 ${sa} 千米，乙每小时 ${sb} 千米，${time} 小时相遇。两地相距多少千米？`, answer: (sa + sb) * time };
        }
        if (t === 1) {
          // 行程：追及
          const fast = rand(60, 90), slow = rand(30, fast - 10), gap = rand(20, 100);
          if ((gap) % (fast - slow) !== 0) return this.generate();
          return { question: `小明骑车每小时 ${fast} 千米，小华骑车每小时 ${slow} 千米，小华先出发并领先 ${gap} 千米。小明几小时后追上小华？`, answer: gap / (fast - slow) };
        }
        if (t === 2) {
          // 平均数
          const arr = [rand(70, 100), rand(70, 100), rand(70, 100), rand(70, 100)];
          const sum = arr.reduce((a, b) => a + b, 0);
          if (sum % arr.length !== 0) return this.generate();
          return { question: `小明四次考试成绩分别是 ${arr.join('、')} 分，平均分是？`, answer: sum / arr.length };
        }
        if (t === 3) {
          // 鸡兔同笼
          const heads = rand(8, 20), legs = rand(heads * 2 + 4, heads * 4 - 2);
          if (legs % 2 !== 0) return this.generate();
          const rabbits = (legs - 2 * heads) / 2;
          if (rabbits < 0 || rabbits > heads) return this.generate();
          return { question: `鸡兔同笼，共 ${heads} 个头，${legs} 只脚。兔子有几只？`, answer: rabbits };
        }
        // 工程
        const days = rand(6, 20);
        return { question: `一项工程，甲单独做要 ${days} 天，他每天完成这项工程的几分之一？（格式 a/b 或整数）`, answer: `1/${days}` };
      },
    },
  ],
};

// ============== 六年级 ==============
const grade6 = {
  name: '六年级',
  chapters: [
    {
      id: 'g6-c1',
      name: '分数乘除法',
      generate() {
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const reduce = (n, d) => { const g = gcd(Math.abs(n), d); return [n / g, d / g]; };
        const t = rand(0, 2);
        if (t === 0) {
          const n1 = rand(1, 9), d1 = rand(2, 10);
          const n2 = rand(1, 9), d2 = rand(2, 10);
          const [rn, rd] = reduce(n1 * n2, d1 * d2);
          return { question: `${n1}/${d1} × ${n2}/${d2} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
        }
        if (t === 1) {
          const n1 = rand(1, 9), d1 = rand(2, 10);
          const n2 = rand(1, 9), d2 = rand(2, 10);
          const [rn, rd] = reduce(n1 * d2, d1 * n2);
          return { question: `${n1}/${d1} ÷ ${n2}/${d2} = ?（化为最简分数，格式 a/b 或整数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
        }
        // 混合运算：a/b + c/d × e/f
        const n1 = rand(1, 5), d1 = rand(2, 8);
        const n2 = rand(1, 5), d2 = rand(2, 8);
        const n3 = rand(1, 5), d3 = rand(2, 8);
        // a/b + c/d × e/f = a/b + (c*e)/(d*f) = (a*d*f + c*e*b) / (b*d*f)
        const num = n1 * d2 * d3 + n2 * n3 * d1;
        const den = d1 * d2 * d3;
        const [rn, rd] = reduce(num, den);
        return { question: `${n1}/${d1} + ${n2}/${d2} × ${n3}/${d3} = ?（化为最简分数）`, answer: rd === 1 ? `${rn}` : `${rn}/${rd}` };
      },
    },
    {
      id: 'g6-c2',
      name: '百分数与应用',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          const total = rand(20, 200), part = rand(1, total);
          const answer = +(part / total * 100).toFixed(0);
          return { question: `${part} 是 ${total} 的百分之几？（填整数百分数，如 25 表示 25%）`, answer };
        }
        if (t === 1) {
          const total = rand(50, 500);
          const pct = pick([10, 20, 25, 40, 50, 60, 75, 80]);
          const answer = total * pct / 100;
          if (!Number.isInteger(answer)) return this.generate();
          return { question: `${total} 的 ${pct}% 是多少？`, answer };
        }
        if (t === 2) {
          const part = rand(20, 200);
          const pct = pick([10, 20, 25, 40, 50]);
          const total = part / (pct / 100);
          if (!Number.isInteger(total)) return this.generate();
          return { question: `一个数的 ${pct}% 是 ${part}，这个数是多少？`, answer: total };
        }
        if (t === 3) {
          // 折扣
          const orig = rand(50, 500);
          const disc = pick([8, 7, 6, 9]);  // 八折 / 七折等
          const ans = orig * disc / 10;
          if (!Number.isInteger(ans)) return this.generate();
          return { question: `一件商品原价 ${orig} 元，打 ${disc} 折后是多少元？`, answer: ans };
        }
        // 增长 / 减少
        const orig = rand(100, 500);
        const pct = pick([10, 20, 25, 50]);
        const ans = orig * (1 + pct / 100);
        if (!Number.isInteger(ans)) return this.generate();
        return { question: `去年产值是 ${orig} 万元，今年比去年增长 ${pct}%，今年是多少万元？`, answer: ans };
      },
    },
    {
      id: 'g6-c3',
      name: '比和比例',
      generate() {
        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const t = rand(0, 3);
        if (t === 0) {
          const k = rand(2, 12);
          let a, b, safety = 30;
          do {
            a = rand(2, 9); b = rand(2, 9);
            safety--;
          } while ((a === b || gcd(a, b) !== 1) && safety > 0);
          if (a === b || gcd(a, b) !== 1) { a = 2; b = 3; }
          return { question: `化简比：${a * k} : ${b * k} = ? : ?（最简整数比，格式 a:b）`, answer: `${a}:${b}` };
        }
        if (t === 1) {
          const a = rand(2, 9), b = rand(2, 9), k = rand(2, 9);
          return { question: `已知 ${a} : ${b} = x : ${b * k}，求 x`, answer: a * k };
        }
        if (t === 2) {
          // 按比分配
          const a = rand(2, 5), b = rand(2, 5);
          const total = (a + b) * rand(3, 10);
          return { question: `把 ${total} 元按 ${a} : ${b} 分配，第一份得多少元？`, answer: total * a / (a + b) };
        }
        // 比例求第三项
        const a = rand(2, 9), b = rand(2, 9), c = rand(2, 9);
        const d = (b * c) / a;
        if (!Number.isInteger(d)) return this.generate();
        return { question: `已知 ${a} : ${b} = ${c} : x，求 x`, answer: d };
      },
    },
    {
      id: 'g6-c4',
      name: '圆与圆柱',
      generate() {
        const PI = 3.14;
        const t = rand(0, 4);
        const r = rand(1, 20);
        if (t === 0) {
          return { question: `半径 ${r} cm 的圆，周长是多少 cm？（π 取 3.14）`, answer: +(2 * PI * r).toFixed(2) };
        }
        if (t === 1) {
          return { question: `半径 ${r} cm 的圆，面积是多少 cm²？（π 取 3.14）`, answer: +(PI * r * r).toFixed(2) };
        }
        if (t === 2) {
          const d = r * 2;
          return { question: `直径 ${d} cm 的圆，周长是多少 cm？（π 取 3.14）`, answer: +(PI * d).toFixed(2) };
        }
        if (t === 3) {
          // 圆柱体积
          const h = rand(3, 15);
          return { question: `底面半径 ${r} cm、高 ${h} cm 的圆柱，体积是多少 cm³？（π 取 3.14）`, answer: +(PI * r * r * h).toFixed(2) };
        }
        // 圆柱侧面积
        const h = rand(3, 15);
        return { question: `底面半径 ${r} cm、高 ${h} cm 的圆柱，侧面积是多少 cm²？（π 取 3.14）`, answer: +(2 * PI * r * h).toFixed(2) };
      },
    },
    {
      id: 'g6-c5',
      name: '应用题挑战 🎯',
      generate() {
        const t = rand(0, 4);
        if (t === 0) {
          // 工程问题
          const a = rand(8, 20), b = rand(8, 20);
          if (a === b) return this.generate();
          const lcm = (a * b) / gcd(a, b);
          function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
          // 合作天数
          const ab = (a * b) / (a + b);
          if (!Number.isInteger(ab)) return this.generate();
          return { question: `一项工程，甲单独做需要 ${a} 天，乙单独做需要 ${b} 天。两人合作需要多少天？`, answer: ab };
        }
        if (t === 1) {
          // 浓度
          const water = rand(80, 200), salt = rand(10, 40);
          const total = water + salt;
          const pct = +(salt / total * 100).toFixed(1);
          return { question: `用 ${salt} 克盐和 ${water} 克水配成盐水，盐水的浓度是百分之几？（保留一位小数）`, answer: pct };
        }
        if (t === 2) {
          // 利润
          const cost = rand(80, 300);
          const pct = pick([10, 20, 25, 30, 50]);
          const profit = cost * pct / 100;
          if (!Number.isInteger(profit)) return this.generate();
          return { question: `一件商品成本 ${cost} 元，按成本的 ${pct}% 加价出售，售价是多少元？`, answer: cost + profit };
        }
        if (t === 3) {
          // 路程：火车过桥
          const speed = rand(15, 30); // 米/秒
          const trainLen = rand(150, 400);
          const bridgeLen = rand(400, 1200);
          const total = trainLen + bridgeLen;
          if (total % speed !== 0) return this.generate();
          return { question: `一列火车长 ${trainLen} 米，每秒行 ${speed} 米，全部通过一座 ${bridgeLen} 米的桥需要多少秒？`, answer: total / speed };
        }
        // 流水
        const still = rand(15, 25);
        const flow = rand(2, 6);
        const dist = (still + flow) * rand(2, 6);
        if (dist % (still + flow) !== 0) return this.generate();
        return { question: `船在静水中速度 ${still} km/h，水流速度 ${flow} km/h。船顺水行驶 ${dist} km 需要几小时？`, answer: dist / (still + flow) };
      },
    },
    {
      id: 'g6-c6',
      name: '数学之美 🌌',
      generate() {
        const t = rand(0, 9);
        if (t === 0) return mc('黄金分割比的精确值是？', '(√5 − 1) / 2 ≈ 0.618', ['1/2 = 0.5', '√2 ≈ 1.414', '3/4 = 0.75']);
        if (t === 1) return mc('斐波那契数列前面的项相除（如 8/5、13/8）会越来越接近？', '黄金分割比 1.618', ['圆周率 π', '√2', '2.5']);
        if (t === 2) return mc('π 是什么样的数？', '无理数（无限不循环小数）', ['整数', '有理数', '负数']);
        if (t === 3) return mc('√2 是什么样的数？', '无理数', ['整数', '分数', '虚数']);
        if (t === 4) return mc('1 + 2 + 3 + ... + 100 = ?', '5050', ['5500', '4950', '6000']);
        if (t === 5) return judge('在 0 到 1 之间，有无穷多个小数（如 0.1、0.01、0.001 ...）。', true);
        if (t === 6) return mc('"完全平方数"指的是？', '某个整数的平方（如 1, 4, 9, 16, 25）', ['偶数', '质数', '奇数']);
        if (t === 7) return mc('莫比乌斯环（Möbius strip）有几个面？', '只有 1 个面', ['2 个面', '3 个面', '0 个面']);
        if (t === 8) return mc('下面哪个不是质数？', '15', ['7', '13', '17']);
        return mc('一千万 = 多少？', '10,000,000', ['1,000,000', '100,000,000', '1,000,000,000']);
      },
    },
  ],
};

const CURRICULUM = [grade1, grade2, grade3, grade4, grade5, grade6];

function generateProblems(chapter, count = 100) {
  const problems = [];
  const seen = new Set();
  let safety = count * 10;
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
