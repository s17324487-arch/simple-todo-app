// 町のクイズ係。問題・選択肢・抽選は開始時に保存し、正解の確定と景品の受け取りを同時に保存する。
const TownQuiz = {
  LIMIT: 10,
  LEVELS: [null,
    { name: '初級', coins: 35, deza: 'deza_jelly', rare: .02, luxury: .003 },
    { name: '中級', coins: 65, deza: 'deza_ice', rare: .03, luxury: .005 },
    { name: '上級', coins: 100, deza: 'deza_tart', rare: .04, luxury: .008 },
  ],
  _panel: null,
  _mode: null,
  _context: null,
  _finish: null,
  _working: false,

  host(n) { return !!n && n.id === 'town_walker3'; },
  data() {
    if (!Save.d.townQuiz) Save.d.townQuiz = { active: null, history: {}, rotation: {}, last: null, plays: 0, correct: 0, daily: { day: '', attempts: 0 } };
    return Save.d.townQuiz;
  },
  _copy(value) { return JSON.parse(JSON.stringify(value)); },
  _token() { return `quiz-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`; },
  _shuffle(list) {
    list = list.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  },
  _commit(change, verify, expected = null) {
    const before = this._copy(Save.d), dirty = Save.dirty;
    let staleSave = null;
    try {
      // すでにほかの画面で確定した回答を二重に受け取らない。
      if (expected) {
        const saved = JSON.parse(localStorage.getItem(Save.KEY) || 'null');
        if (!saved || !saved.townQuiz || !saved.townQuiz.active || saved.townQuiz.active.token !== expected) {
          // 確定済みの新しい保存を採用する。古い保留状態に戻すと次の自動保存で回答が復活してしまう。
          if (saved && typeof saved === 'object' && !Array.isArray(saved) && Number.isFinite(saved.coins) && saved.chars && typeof saved.chars === 'object') staleSave = Save.migrate(saved);
          throw new Error('stale-quiz');
        }
      }
      change();
      Save.write();
      const saved = JSON.parse(localStorage.getItem(Save.KEY) || 'null');
      if (!saved || !verify(saved)) throw new Error('quiz-not-saved');
      if (UI.hudCoins) UI.updateHud();
      return true;
    } catch (error) {
      if (staleSave) {
        Save.d = staleSave;
        Save.dirty = false;
        if (UI.hudCoins) UI.updateHud();
        if (this.data().active) this._showQuestion();
        else if (this.data().last) this._showResult();
        else this._showMenu();
        if (UI.toastBox) UI.toast('保存済みの最新の問題と、ごほうびの受け取り記録を読み直したよ。');
        return false;
      }
      Save.d = before;
      Save.dirty = dirty;
      if (UI.toastBox) UI.toast('保存を確認できなかったよ。問題とごほうびはそのまま。もう一度ためしてね。');
      return false;
    }
  },
  _loot(level, eligible) {
    if (!eligible) return [];
    const rule = this.LEVELS[level];
    const loot = [Math.random() < .6 ? { coins: rule.coins } : { bag: rule.deza, n: 1 }];
    if (Math.random() < rule.rare) loot.push(QuizPrizes.rollRare(Math.random));
    if (Math.random() < rule.luxury) loot.push(QuizPrizes.rollLuxury(Math.random));
    return loot.filter(Boolean);
  },
  _next(level, data) {
    const ids = TOWN_QUIZ_DATA.filter((q) => q.level === level).map((q) => q.id);
    if (!ids.length) throw new Error('empty-quiz-level');
    let r = data.rotation[level];
    if (!r || !Array.isArray(r.remaining)) r = { remaining: [], last: null, round: 0 };
    r.remaining = [...new Set(r.remaining.filter((id) => ids.includes(id)))];
    if (!r.remaining.length) {
      r.remaining = this._shuffle(ids);
      if (r.remaining.length > 1 && r.remaining[0] === r.last) [r.remaining[0], r.remaining[1]] = [r.remaining[1], r.remaining[0]];
      r.round++;
    }
    const id = r.remaining.shift();
    r.last = id;
    data.rotation[level] = r;
    return TOWN_QUIZ_DATA.find((q) => q.id === id);
  },
  talk(n, scene, who = {}) {
    if (!this.host(n)) return Promise.resolve(false);
    Save.d.flags.talked[n.id] = true;
    Save.mark();
    this._context = { name: who.name || n.name || 'クイズ係', face: who.face || Art.npcSvg(n) };
    if (this._finish) this._finish(true);
    return new Promise((resolve) => {
      this._finish = resolve;
      if (this.data().active) this._showQuestion();
      else this._showMenu();
    });
  },
  start(level) {
    if (this._working || !this.LEVELS[level]) return false;
    if (this.data().active) { this._showQuestion(); return this.state().active; }
    this._working = true;
    const token = this._token(), day = U.today();
    const ok = this._commit(() => {
      const d = this.data();
      if (d.daily.day !== day) d.daily = { day, attempts: 0 };
      const q = this._next(level, d), eligible = d.daily.attempts < this.LIMIT;
      d.active = { token, id: q.id, level, day, slot: d.daily.attempts + 1, eligible,
        question: this._copy(q), order: this._shuffle(q.choices.map((_, i) => i)),
        loot: this._loot(level, eligible), started: Date.now() };
    }, (saved) => saved.townQuiz && saved.townQuiz.active && saved.townQuiz.active.token === token);
    this._working = false;
    if (!ok) return false;
    this._showQuestion();
    return this.state().active;
  },
  answer(index) {
    const active = this.data().active;
    if (this._working || !active || !Number.isInteger(index) || index < 0 || index >= active.order.length) return false;
    this._working = true;
    const correct = active.order[index] === active.question.answer;
    const ok = this._commit(() => {
      const d = this.data();
      if (!d.active || d.active.token !== active.token) throw new Error('stale-quiz');
      const h = d.history[active.id] || { answers: 0, correct: 0 };
      h.answers++; h.correct += correct ? 1 : 0; h.day = active.day;
      d.history[active.id] = h;
      d.plays++; d.correct += correct ? 1 : 0;
      // 日またぎで再開しても、開始日の回答枠として確定する。
      d.daily = { day: active.day, attempts: Math.max(d.daily.day === active.day ? d.daily.attempts : 0, active.slot) };
      const loot = correct && active.eligible ? this._copy(active.loot) : [];
      for (const item of loot) {
        if (item.coins) Save.addCoins(item.coins);
        else if (item.bag && BAG_INDEX[item.bag]) Save.addBag(item.bag, item.n || 1);
        else if (item.furn && FURN_INDEX[item.furn]) Save.d.furn[item.furn] = (Save.d.furn[item.furn] || 0) + 1;
        else throw new Error('unknown-quiz-prize');
      }
      d.last = { token: active.token, id: active.id, level: active.level, day: active.day,
        question: active.question, order: active.order, chosen: index, correct,
        eligible: active.eligible, loot, answered: Date.now() };
      d.active = null;
    }, (saved) => saved.townQuiz && !saved.townQuiz.active && saved.townQuiz.last && saved.townQuiz.last.token === active.token, active.token);
    this._working = false;
    if (!ok) return false;
    Sound.se(correct ? 'ok' : 'cancel');
    this._showResult();
    return this._copy(this.data().last);
  },
  cancel() {
    // 閉じても未回答の問題は保留。問題・選択肢・抽選の引き直しはしない。
    if (this._panel) this._panel.close();
    return true;
  },
  state() {
    const d = this.data(), a = d.active, day = U.today();
    const attempts = d.daily.day === day ? d.daily.attempts : 0;
    return { open: !!this._panel, mode: this._mode, host: 'town_walker3',
      active: a ? { token: a.token, id: a.id, level: a.level, day: a.day, slot: a.slot, eligible: a.eligible,
        prompt: a.question.prompt, choices: a.order.map((i) => a.question.choices[i]), correctIndex: a.order.indexOf(a.question.answer) } : null,
      last: d.last ? this._copy(d.last) : null, daily: { day, attempts, remaining: Math.max(0, this.LIMIT - attempts) },
      plays: d.plays, correct: d.correct, questionCount: TOWN_QUIZ_DATA.length };
  },
  _mount(mode, title) {
    this._mode = mode;
    if (!UI.root) return null; // データ検査ではDOMを使わず、保存と抽選を検証できる。
    if (!this._panel) this._panel = UI.modal({ title, cls: 'town-quiz', onClose: () => {
      this._panel = null; this._mode = null;
      const resolve = this._finish; this._finish = null;
      if (resolve) resolve(true);
    } });
    this._panel.setTitle(title);
    this._panel.body.replaceChildren();
    this._panel.body.scrollTop = 0;
    return this._panel.body;
  },
  _text(parent, text, cls = 'town-quiz-note') { parent.append(U.el('p', { class: cls, text })); },
  _button(parent, text, fn, cls = '') {
    const button = UI.btn('', fn, `town-quiz-choice ${cls}`);
    button.textContent = text;
    button.style.minHeight = '44px';
    parent.append(button);
    return button;
  },
  _portrait(parent) {
    if (!this._context) return;
    const row = U.el('div', { class: 'town-quiz-host' });
    if (this._context.face) row.append(U.el('div', { class: 'town-quiz-face', html: this._context.face }));
    row.append(U.el('strong', { text: this._context.name }));
    parent.append(row);
  },
  _showMenu() {
    const body = this._mount('menu', 'まちかど クイズ');
    if (!body) return;
    this._portrait(body);
    this._text(body, '世界のふしぎを、3人といっしょに考えよう。科学・歴史・芸術など、出典を調べた50問から出題するよ。');
    this._text(body, `今日のごほうび対象は、あと${this.state().daily.remaining}回答。正解・不正解にかかわらず最初の10回答までだよ。`, 'town-quiz-meta');
    const actions = U.el('div', { class: 'town-quiz-actions' });
    for (let level = 1; level <= 3; level++) {
      const rule = this.LEVELS[level];
      this._button(actions, `${rule.name} ／ ${rule.coins}コイン または デザ`, () => this.start(level), level === 2 ? 'yellow' : '');
    }
    body.append(actions);
    const rules = U.el('details', { class: 'town-quiz-rules' });
    rules.append(U.el('summary', { text: 'ごほうび・抽選のくわしいルール' }));
    this._text(rules, '参加は無料。報酬対象の問題に正解すると、60％で表示されたコイン、40％で難易度に応じたデザを1個もらえるよ。');
    this._text(rules, 'さらに、限定レア家具は初級2％・中級3％・上級4％、高級家具は0.3％・0.5％・0.8％で別々に抽選。どの難易度でも手に入るよ。');
    this._text(rules, '1日の11回答目からは、ごほうびなしの練習。問題は難易度ごとに一巡するまで重複しないよ。');
    this._text(rules, '途中で閉じても同じ問題から再開。日をまたいでも開始日の枠を使い、再読込で問題や景品の抽選は変わらないよ。');
    body.append(rules);
    if (this.data().last) this._button(body, '前の問題の解説を読む', () => this._showResult());
  },
  _showQuestion() {
    const a = this.data().active;
    if (!a) return this._showMenu();
    const body = this._mount('question', `まちかど クイズ ／ ${this.LEVELS[a.level].name}`);
    if (!body) return;
    this._portrait(body);
    this._text(body, `${a.question.topic} ・ ${a.eligible ? 'ごほうび対象' : '練習（ごほうびなし）'}`, 'town-quiz-meta');
    this._text(body, a.question.prompt, 'town-quiz-prompt');
    const actions = U.el('div', { class: 'town-quiz-actions', role: 'group', 'aria-label': 'クイズの回答' });
    a.order.forEach((choice, index) => {
      this._button(actions, a.question.choices[choice], () => {
        if (this._working || this.data().active?.token !== a.token) return;
        this.answer(index);
      });
    });
    body.append(actions);
    this._text(body, '時間制限はないよ。答えを1つ選んでね。閉じると、この問題を保留するよ。');
    if (a.day !== U.today()) this._text(body, `この問題は${a.day}に始めた分だよ。今日の枠は、この問題を終えてから使えるよ。`);
  },
  _lootLabel(item) {
    if (item.coins) return `${item.coins}コイン`;
    if (item.bag) return `${BAG_INDEX[item.bag].name} ×${item.n || 1}`;
    if (item.furn) return FURN_INDEX[item.furn].name;
    return '';
  },
  _showResult() {
    const last = this.data().last;
    if (!last) return this._showMenu();
    const body = this._mount('result', last.correct ? 'せいかい！' : 'なるほど、そうだったんだ');
    if (!body) return;
    this._text(body, last.question.prompt, 'town-quiz-prompt');
    this._text(body, `あなたの回答：${last.question.choices[last.order[last.chosen]]}`, 'town-quiz-meta');
    this._text(body, `正解：${last.question.choices[last.question.answer]}`, 'town-quiz-result');
    this._text(body, last.question.explanation);
    if (last.loot.length) {
      const prizes = U.el('div', { class: 'town-quiz-prizes' });
      for (const item of last.loot) {
        const row = U.el('div', { class: 'town-quiz-prize' });
        if (item.furn || item.bag) row.append(U.el('span', { html: UI.icon(item.furn ? 'furn' : 'bag', item.furn || item.bag, 56) }));
        row.append(U.el('strong', { text: this._lootLabel(item) }));
        prizes.append(row);
      }
      body.append(prizes);
      this._text(body, 'ごほうびは受け取り・保存済みだよ。家具はおうちの「もようがえ」、デザは「ごはん」で使えるよ。');
    } else this._text(body, last.eligible ? '今回はごほうびなし。また次の問題で考えてみよう。' : '今回は練習の問題。ごほうびは増えないけれど、記録は残るよ。');
    const kids = last.correct
      ? [['wanko', 'やったね！ みんなで答えを見つけたよ。'], ['gachan', '答えの理由までわかると、おもしろいね。'], ['goji', 'ガゥー！ 次もいっしょに考えよう。']]
      : [['wanko', 'そっか、そういう理由だったんだ。'], ['gachan', '次に同じ話を聞いたら、思い出せそう。'], ['goji', 'ガォー。ひとつ覚えたね。']];
    const chat = U.el('div', { class: 'town-quiz-chat' });
    for (const [id, text] of kids) this._text(chat, `${Save.d.chars[id].name}：${text}`);
    body.append(chat);
    const sources = U.el('details', { class: 'town-quiz-sources' });
    sources.append(U.el('summary', { text: `解説の出典（${last.question.sources.length}件）` }));
    for (const source of last.question.sources) {
      const entry = U.el('div');
      entry.append(U.el('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer', text: source.title }));
      this._text(entry, source.evidence);
      this._text(entry, `確認日：${source.checked}`, 'town-quiz-meta');
      sources.append(entry);
    }
    body.append(sources);
    const actions = U.el('div', { class: 'town-quiz-actions' });
    this._button(actions, '同じ難易度で次の問題', () => this.start(last.level), 'yellow');
    this._button(actions, '難易度を選びなおす', () => this._showMenu());
    this._button(actions, 'おさんぽにもどる', () => this.cancel());
    body.append(actions);
  },
};

// 既存の固有名と見た目を保ち、頭上の名前だけでクイズ係を見つけられるようにする。
(() => {
  for (const map of Object.values(MAP_DEFS)) for (const npc of map.npcs || []) {
    if (!TownQuiz.host(npc) || String(npc.name).startsWith('クイズずきの ')) continue;
    npc.name = `クイズずきの ${npc.name}`;
    npc.given = true;
  }
})();
