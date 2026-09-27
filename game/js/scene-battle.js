// バトル（3にんパーティのターン制）
const ALLY_SIZE = 100, FOE_SIZE = 118, BOSS_SIZE = 214;

class BattleScene {
  async enter(p) {
    this.p = p;
    this.area = p.area || "meadow";
    this.boss = !!p.boss;
    this.difficulty = Save.d.settings.difficulty;
    this.tweens = []; this.pops = []; this.parts = [];
    this.gauge = Math.min(40, Save.avg("bond") * 0.4);
    this.round = 0;
    this.allies = Save.d.order.map((id, i) => {
      const c = Save.d.chars[id];
      return { side: "ally", id, i, name: c.name, alive: c.hp > 0, buffs: {}, guard: false, sleep: 0, ox: 0, oy: 0, shake: 0, flash: 0, emo: null, pose: null, hungry: c.hunger < 20 };
    });
    this.foes = p.foes.map((f, i) => {
      const e = ENEMIES[f.kind];
      const k = 1 + 0.13 * (f.lv - e.lv);
      const hp = Math.round(e.hp * (1 + 0.16 * (f.lv - e.lv)));
      return { side: "foe", kind: f.kind, lv: f.lv, e, i, name: e.name, hp, mhp: hp, atk: Math.max(1, Math.round(e.atk * k * GameEconomy.mode(this.difficulty).enemy)), def: Math.round(e.def * k), spd: Math.round(e.spd * (1 + 0.06 * (f.lv - e.lv))), alive: true, buffs: {}, sleep: 0, scared: false, ox: 0, oy: 0, shake: 0, flash: 0, alpha: 0, emo: "normal" };
    });
    // 同じ名前には A B C
    const cnt = {};
    this.foes.forEach((f) => (cnt[f.name] = (cnt[f.name] || 0) + 1));
    const seen = {};
    this.foes.forEach((f) => { if (cnt[f.name] > 1) { seen[f.name] = (seen[f.name] || 0) + 1; f.name += "ABC"[seen[f.name] - 1]; } });
    for (const f of this.foes) { const d = (Save.d.dex[f.kind] = Save.d.dex[f.kind] || { seen: 0, won: 0 }); d.seen++; }
    Save.d.stats.battles++;
    Save.mark();
    this.layout();
    await this.preload();
    this.buildUI();
    this.homeBtn = UI.btn("おうちへ", () => {
      if (UI.busy || Game.trans || this.homeRequested) return;
      this.homeRequested = true; this.homeBtn.disabled = true;
      if (this.commandResolve) this.commandResolve({ type: "home" });
      else UI.toast("この こうどうが おわったら かえるよ");
    }, "home-shortcut small");
    document.getElementById("ui").append(this.homeBtn);
    Sound.bgm(this.boss ? "boss" : "battle");
    this.run().catch((e) => { console.error(e); UI.toast("バトルで エラーが おきました"); this.leave(); });
  }
  exit() { this.closed = true; this.homeBtn?.remove(); this.layoutObserver?.disconnect(); if (this.ui) this.ui.remove(); }
  layout() {
    const W = G.W, H = G.H;
    // 画面の高さに合わせて大きさを決める（下のコマンド欄と重ならないように）
    const panelTop = this.ui ? (this.ui.getBoundingClientRect().top - G.canvas.getBoundingClientRect().top) / G.cssPerUnit : H - 250;
    this.allyY = panelTop - 70;
    this.bs = Math.min(1.05, (this.allyY - 32) / (this.boss ? 490 : 360));
    this.AS = ALLY_SIZE * this.bs; this.FS = (this.boss ? BOSS_SIZE : FOE_SIZE) * this.bs;
    this.foeY = this.allyY - (this.boss ? 262 : 228) * this.bs;
    const n = this.foes.length;
    const fx = n === 1 ? [0] : n === 2 ? [-72, 72] : [-114, 0, 114];
    this.foes.forEach((f, i) => { f.x = W / 2 + fx[i]; f.y = this.foeY + (n === 3 && i === 1 ? -8 : 0); });
    this.allies.forEach((a, i) => { a.x = W / 2 + (i - 1) * 114; a.y = this.allyY; });
  }
  resize() { this.layout(); }
  async preload() {
    const list = [];
    for (const a of this.allies) {
      const c = Save.d.chars[a.id];
      for (const [pose, face] of [["idle_01", "normal"], ["idle_02", "normal"], ["jump_01", "angry"], ["land_01", "angry"], ["idle_01", "sad"], ["idle_01", "surprise"], ["jump_01", "happy"], ["idle_01", "happy"], ["idle_02", "happy"]]) list.push([a.id, { pose, face, outfit: c.outfit, color: c.color }]);
    }
    const jobs = [Chara.preload(list, this.AS)];
    for (const f of this.foes) for (const emo of ["normal", "hurt", "sleep"]) jobs.push(this.foeCanvas(f, emo, true));
    await Promise.all(jobs);
  }
  foeCanvas(f, emo, ensure) {
    const size = this.FS;
    const key = "bfoe:" + f.kind + ":" + emo;
    const pw = Chara.pxSize(size), ph = Math.round((pw * VB.h) / VB.w);
    const fn = () => Art.enemySvg(f.e.art, f.e.col, emo);
    return ensure ? SvgCache.ensure(key, fn, pw, ph) : SvgCache.get(key, fn, pw, ph);
  }

  // ---- ステータス ----
  stat(u, k) {
    let v = u.side === "ally" ? Stats.max(u.id, k) : u[k];
    if (u.buffs[k]) v *= u.buffs[k].m;
    if (u.side === "ally" && k === "atk" && u.hungry) v *= 0.8;
    return v;
  }
  hp(u) { return u.side === "ally" ? Save.d.chars[u.id].hp : u.hp; }
  mhp(u) { return u.side === "ally" ? Stats.max(u.id, "hp") : u.mhp; }
  setHp(u, v) {
    v = Math.round(U.clamp(v, 0, this.mhp(u)));
    if (u.side === "ally") Save.d.chars[u.id].hp = v; else u.hp = v;
    u.alive = v > 0;
  }

  // ---- UI ----
  buildUI() {
    this.ui = U.el("div", { class: "battle-ui" });
    this.msgBox = U.el("div", { class: "battle-msg" });
    this.cmd = U.el("div");
    this.ui.append(this.msgBox, this.cmd);
    document.getElementById("ui").append(this.ui);
    this.layoutObserver = new ResizeObserver(() => this.layout());
    this.layoutObserver.observe(this.ui);
    this.layout();
  }
  msg(text, wait = 750) {
    this.msgBox.textContent = text;
    return new Promise((res) => { this.skipWait = res; setTimeout(res, wait); });
  }
  // コマンド選択。Promise で結果を返す
  chooseCommand(u) {
    return new Promise((resolve) => {
      this.commandResolve = resolve;
      const c = Save.d.chars[u.id];
      const main = () => {
        this.cmd.innerHTML = "";
        const head = U.el("div", { class: "cmd-head", html: `<span class="who">${c.name}</span><span>どうする？</span>` });
        const grid = U.el("div", { class: "cmd-grid" });
        const B = (label, fn, cls = "") => { const b = UI.btn(label, () => { Sound.se("tap"); fn(); }, cls); grid.append(b); return b; };
        B("たたかう", () => this.pickTarget("enemy", u).then((t) => (t ? resolve({ type: "attack", target: t }) : main())), "pink");
        B("とくぎ", () => skills(), "blue");
        B("どうぐ", () => items(), "yellow");
        B("ぼうぎょ", () => resolve({ type: "guard" }));
        const row = U.el("div", { class: "cmd-grid", style: "grid-template-columns:1fr 1fr" });
        const flee = UI.btn(this.boss ? "にげられない！" : "にげる", () => { Sound.se("tap"); resolve({ type: "flee" }); }, "small");
        if (this.boss) flee.disabled = true;
        row.append(flee);
        const trio = UI.btn(`なかよしトリオアタック ${this.gauge >= 100 ? "OK!" : Math.floor(this.gauge) + "%"}`, () => { Sound.se("ok"); resolve({ type: "trio" }); }, "small pink");
        const allAlive = this.allies.every((a) => a.alive);
        if (this.gauge < 100 || !allAlive) trio.disabled = true;
        row.append(trio);
        this.cmd.append(head, grid, row);
      };
      const skills = () => {
        this.cmd.innerHTML = "";
        const list = U.el("div", { class: "skill-list" });
        for (const sk of Stats.skills(u.id)) {
          const S = SKILLS[sk];
          const b = UI.btn(`<span>${S.name}<small>${S.desc}</small></span><span class="sp">SP ${S.sp}</span>`, async () => {
            if (c.sp < S.sp) { Sound.se("bad"); UI.toast("SPが たりないよ"); return; }
            if (S.target === "fallen" && !this.allies.some((a) => !a.alive)) { UI.toast("たおれている なかまが いないよ"); return; }
            Sound.se("tap");
            const t = await this.pickTarget(S.target, u);
            if (t === null) return skills();
            resolve({ type: "skill", skill: sk, target: t });
          });
          if (c.sp < S.sp) b.style.opacity = 0.5;
          list.append(b);
        }
        list.append(UI.btn("もどる", () => { Sound.se("cancel"); main(); }, "small"));
        this.cmd.append(list);
      };
      const items = () => {
        this.cmd.innerHTML = "";
        const list = U.el("div", { class: "skill-list" });
        const ids = Object.keys(Save.d.bag).filter((k) => Save.d.bag[k] > 0 && BAG_INDEX[k] && (BAG_INDEX[k].hp || BAG_INDEX[k].sp || BAG_INDEX[k].revive || BAG_INDEX[k].escape));
        if (!ids.length) list.append(U.el("div", { class: "note", text: "つかえる どうぐが ないよ" }));
        for (const k of ids) {
          const it = BAG_INDEX[k];
          const eff = [it.hp ? `HP+${it.hp}` : "", it.sp ? `SP+${it.sp}` : "", it.revive ? "ふっかつ" : "", it.escape ? "にげる" : ""].filter(Boolean).join(" ");
          list.append(UI.btn(`<span>${it.name} ×${Save.d.bag[k]}<small>${eff}</small></span>`, async () => {
            Sound.se("tap");
            if (it.escape) { if (this.boss) { UI.toast("ボスからは にげられない！"); return; } resolve({ type: "item", item: k }); return; }
            const t = await this.pickTarget(it.revive ? "fallen" : "ally", u);
            if (t === null) return items();
            resolve({ type: "item", item: k, target: t });
          }));
        }
        list.append(UI.btn("もどる", () => { Sound.se("cancel"); main(); }, "small"));
        this.cmd.append(list);
      };
      main();
    });
  }
  pickTarget(kind, u) {
    if (kind === "enemies" || kind === "party" || kind === "self") return Promise.resolve(kind);
    const cands = kind === "enemy" ? this.foes.filter((f) => f.alive) : kind === "fallen" ? this.allies.filter((a) => !a.alive) : this.allies.filter((a) => a.alive);
    if (cands.length === 1 && kind === "enemy") return Promise.resolve(cands[0]);
    if (!cands.length) return Promise.resolve(null);
    return new Promise((resolve) => {
      this.cmd.innerHTML = "";
      const list = U.el("div", { class: "cmd-grid" });
      for (const t of cands) {
        const hpTxt = t.side === "ally" ? ` ${Math.max(0, this.hp(t))}/${this.mhp(t)}` : "";
        list.append(UI.btn(t.name + hpTxt, () => { Sound.se("tap"); this.targeting = null; resolve(t); }, t.side === "foe" ? "pink" : "green"));
      }
      list.append(UI.btn("もどる", () => { Sound.se("cancel"); this.targeting = null; resolve(null); }, "small"));
      this.cmd.append(U.el("div", { class: "cmd-head", html: "<span>だれに？（タップでも えらべるよ）</span>" }), list);
      this.targeting = { cands, resolve: (t) => { this.targeting = null; resolve(t); } };
    });
  }
  up(p) {
    if (this.skipWait) { const s = this.skipWait; this.skipWait = null; s(); }
    if (!this.targeting || !p.tap) return;
    for (const t of this.targeting.cands) {
      const size = t.side === "foe" ? this.FS : this.AS;
      if (Math.abs(p.x - t.x) < size * 0.42 && p.y < t.y + 10 && p.y > t.y - size * 0.95) { Sound.se("tap"); this.targeting.resolve(t); return; }
    }
  }

  // ---- 進行 ----
  async run() {
    await this.tween(0.5, (k) => this.foes.forEach((f) => (f.alpha = k)));
    const names = [...new Set(this.foes.map((f) => f.e.name))];
    await this.msg(this.boss ? `${names[0]}が たちはだかった！` : `${names.join("と ")}${this.foes.length > 1 ? "たち" : ""}が あらわれた！`, 1000);
    const hungry = this.allies.filter((a) => a.hungry);
    if (hungry.length) await this.msg(`${hungry.map((a) => a.name).join("と")}は おなかが すいて ちからが でない……`, 900);
    for (;;) {
      if (this.closed) return;
      if (this.homeRequested) { Game.goto("house"); return; }
      this.round++;
      const order = [...this.allies, ...this.foes].filter((u) => u.alive).map((u) => ({ u, s: this.stat(u, "spd") * U.rand(0.85, 1.15) })).sort((a, b) => b.s - a.s).map((x) => x.u);
      for (const u of order) {
        if (this.isOver()) break;
        if (!u.alive) continue;
        if (u.side === "ally") await this.allyTurn(u); else await this.foeTurn(u);
        if (this.closed) return;
        if (this.homeRequested) { Game.goto("house"); return; }
        if (this.fled) return this.endFlee();
      }
      if (this.isOver()) break;
      for (const u of [...this.allies, ...this.foes]) for (const k in u.buffs) if (--u.buffs[k].t <= 0) delete u.buffs[k];
    }
    if (this.foes.every((f) => !f.alive)) await this.victory(); else await this.defeat();
  }
  isOver() { return this.foes.every((f) => !f.alive) || this.allies.every((a) => !a.alive); }

  async allyTurn(u) {
    const c = Save.d.chars[u.id];
    u.guard = false;
    if (u.sleep > 0) {
      u.sleep--;
      await this.msg(u.sleep > 0 ? `${u.name}は ぐうぐう ねむっている……` : `${u.name}は めを さました！`, 800);
      return;
    }
    this.active = u;
    this.msgBox.textContent = `${u.name}の ばん！`;
    const cmd = await this.chooseCommand(u);
    this.commandResolve = null;
    this.cmd.innerHTML = "";
    if (cmd.type === "home" || this.closed) return;
    await this.execute(u, cmd);
    this.active = null;
  }
  async execute(u, cmd) {
    const c = Save.d.chars[u.id];
    switch (cmd.type) {
      case "attack": {
        await this.msg(`${u.name}の こうげき！`, 380);
        await this.lunge(u, cmd.target);
        await this.hit(u, cmd.target, 1, { canMiss: true });
        break;
      }
      case "skill": {
        const S = SKILLS[cmd.skill];
        c.sp -= S.sp;
        Save.mark();
        Sound.voice(u.id);
        await this.msg(`${u.name}の ${S.name}！`, 500);
        await this.useSkill(u, S, cmd.target);
        break;
      }
      case "item": {
        const it = BAG_INDEX[cmd.item];
        if (it.escape) { Save.addBag(cmd.item, -1); await this.msg(`${u.name}は ${it.name}を なげた！ けむりが もくもく……`, 800); this.fled = true; return; }
        const t = cmd.target;
        await this.msg(`${u.name}は ${it.name}を つかった！`, 500);
        const beforeHp = Save.d.chars[t.id].hp;
        const r = Care.feed(t.id, cmd.item);
        const after = Save.d.chars[t.id].hp;
        t.alive = after > 0;
        Sound.se("heal");
        this.sparkle(t, "#8FE388");
        if (after > beforeHp) this.pop(t, `+${after - beforeHp}`, "#2E7D32");
        if (r) await this.msg(`${t.name}: ${r.text.replace(/\n/g, "、")}`, 900);
        break;
      }
      case "guard":
        u.guard = true;
        c.sp = Math.min(Stats.max(u.id, "sp"), c.sp + 2);
        Sound.se("buff");
        await this.msg(`${u.name}は みを まもっている。（SP+2）`, 700);
        break;
      case "flee": {
        const as = this.allies.filter((a) => a.alive).reduce((s, a) => s + this.stat(a, "spd"), 0) / Math.max(1, this.allies.filter((a) => a.alive).length);
        const fs = this.foes.filter((f) => f.alive).reduce((s, f) => s + f.spd, 0) / Math.max(1, this.foes.filter((f) => f.alive).length);
        const ok = Math.random() < U.clamp(0.6 + (as - fs) * 0.03, 0.3, 0.95);
        await this.msg("みんなで にげだした！", 500);
        if (ok) { Sound.se("whoosh"); this.fled = true; }
        else { Sound.se("bad"); await this.msg("しかし まわりこまれてしまった！", 800); }
        break;
      }
      case "trio": await this.trioAttack(); break;
    }
  }
  async useSkill(u, S, target) {
    const alive = this.foes.filter((f) => f.alive);
    if (S.power) {
      const targets = S.target === "enemies" ? alive : [target];
      if (S.fx === "fire" || S.fx === "wind" || S.fx === "roar" || S.fx === "bone") this.burst(S.fx, targets);
      await this.lunge(u, targets.length === 1 ? targets[0] : null);
      for (const t of targets) {
        await this.hit(u, t, S.power, { fx: S.fx, quick: targets.length > 1 });
        if (S.scare && t.alive && Math.random() < S.scare) { t.scared = true; await this.msg(`${t.name}は びくっと すくんだ！`, 500); }
      }
    }
    if (S.heal) {
      const targets = S.target === "party" ? this.allies.filter((a) => a.alive) : [target];
      Sound.se("heal");
      for (const t of targets) {
        const amt = Math.round(this.mhp(t) * S.heal * U.rand(0.95, 1.1));
        this.setHp(t, this.hp(t) + amt);
        this.pop(t, `+${amt}`, "#2E7D32");
        this.sparkle(t, "#8FE388");
      }
      await this.msg(targets.length > 1 ? "みんなの HPが かいふくした！" : `${targets[0].name}の HPが かいふくした！`, 700);
    }
    if (S.buff) {
      const targets = S.target === "party" ? this.allies.filter((a) => a.alive) : [u];
      Sound.se("buff");
      for (const t of targets) for (const k in S.buff) { t.buffs[k] = { m: S.buff[k], t: S.turns || 3 }; this.sparkle(t, k === "atk" ? "#FF8A65" : "#7EC8F0"); }
      if (S.taunt) u.taunt = 3;
      const nm = Object.keys(S.buff).map((k) => ({ atk: "こうげき", def: "ぼうぎょ" }[k])).join("と");
      await this.msg(`${targets.length > 1 ? "みんな" : u.name}の ${nm}が あがった！${S.taunt ? "\nてきは ごじに むかってくる！" : ""}`, 800);
    }
    if (S.revive) {
      const t = target;
      this.setHp(t, Math.round(this.mhp(t) * S.revive));
      Sound.se("heal");
      this.sparkle(t, "#FFE066");
      await this.msg(`${t.name}が げんきに なった！`, 800);
    }
  }
  async trioAttack() {
    this.gauge = 0;
    Sound.se("fanfare");
    await this.msg("なかよしトリオアタック！！", 600);
    for (const a of this.allies) { a.pose = "jump_01"; a.emo = "angry"; await this.tween(0.18, (k) => (a.oy = -Math.sin(k * Math.PI) * 60)); a.pose = null; Sound.voice(a.id); }
    const atk = this.allies.reduce((s, a) => s + this.stat(a, "atk"), 0);
    this.burst("star", this.foes.filter((f) => f.alive));
    await U.wait(300);
    for (const f of this.foes.filter((f) => f.alive)) {
      const dmg = Math.max(1, Math.round(atk * 1.15 * (100 / (100 + f.def * 2.2)) * U.rand(0.95, 1.1)));
      await this.applyDamage(f, dmg, true);
    }
    this.allies.forEach((a) => (a.emo = null));
  }
  async foeTurn(f) {
    if (f.scared) { f.scared = false; await this.msg(`${f.name}は すくんで うごけない！`, 700); return; }
    if (f.sleep > 0) { f.sleep--; await this.msg(f.sleep > 0 ? `${f.name}は ねむっている……` : `${f.name}は めを さました！`, 700); return; }
    const live = this.allies.filter((a) => a.alive);
    if (!live.length) return;
    let skills = f.e.skills.map((k) => SKILLS[k]);
    if (f.hp > f.mhp * 0.5) skills = skills.filter((s) => !s.heal);
    if (!skills.length) skills = [SKILLS.e_tackle];
    const S = U.pick(skills);
    const goji = this.allies.find((a) => a.id === "goji" && a.alive && a.taunt > 0);
    let target = goji && Math.random() < 0.8 ? goji : U.pick(live);
    if (goji) goji.taunt--;
    await this.msg(`${f.name}の ${S.name}！`, 450);
    if (S.heal) {
      const amt = Math.round(f.mhp * S.heal);
      f.hp = Math.min(f.mhp, f.hp + amt);
      Sound.se("heal"); this.sparkle(f, "#8FE388"); this.pop(f, `+${amt}`, "#2E7D32");
      await this.msg(`${f.name}は げんきを とりもどした！`, 600);
      return;
    }
    if (S.sleep) {
      await this.lunge(f, target);
      if (Math.random() < S.sleep) {
        target.sleep = U.randi(1, 2);
        Sound.se("sleep");
        this.sparkle(target, "#C5B3FF");
        await this.msg(`${target.name}は ねむってしまった！`, 700);
      } else await this.msg(`${target.name}は ねむらなかった！`, 600);
      return;
    }
    const targets = S.all ? live : [target];
    if (S.all) this.burst(S.fx === "rock" ? "rock" : S.fx === "star" ? "star" : "wind", targets);
    await this.lunge(f, targets.length === 1 ? target : null);
    for (const t of targets) await this.hit(f, t, S.power, { quick: targets.length > 1, canMiss: !S.all });
  }

  // ダメージ
  calc(a, d, power) {
    const atk = this.stat(a, "atk"), def = this.stat(d, "def");
    let dmg = atk * power * (100 / (100 + def * 2.2)) * U.rand(0.88, 1.08);
    let crit = false;
    const critRate = 0.06 + (a.side === "ally" && Save.d.chars[a.id].mood > 80 ? 0.05 : 0);
    if (Math.random() < critRate) { dmg *= 1.6; crit = true; }
    if (d.side === "ally" && d.guard) dmg *= 0.5;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }
  async hit(a, d, power, { fx = "punch", quick = false, canMiss = false } = {}) {
    if (!d.alive) return;
    if (canMiss && Math.random() < 0.04) {
      Sound.se("miss");
      this.pop(d, "ミス", "#8A7D6A");
      await this.msg(`${d.name}は ひらりと かわした！`, 600);
      return;
    }
    const { dmg, crit } = this.calc(a, d, power);
    if (crit) await this.msg("かいしんの いちげき！", 350);
    this.impact(d, fx);
    await this.applyDamage(d, dmg, crit, quick);
    if (a.side === "ally") this.gauge = Math.min(100, this.gauge + 7 * (0.6 + Save.avg("bond") / 100));
  }
  async applyDamage(d, dmg, crit, quick) {
    Sound.se(crit ? "crit" : "hit");
    d.shake = 0.4; d.flash = 0.25;
    this.pop(d, String(dmg), d.side === "ally" ? "#E8262A" : "#1F1D1B", crit);
    const before = this.hp(d);
    this.setHp(d, before - dmg);
    if (d.side === "ally") {
      d.emo = "sad";
      this.gauge = Math.min(100, this.gauge + 5 * (0.6 + Save.avg("bond") / 100));
      if (d.sleep && d.alive && Math.random() < 0.5) { d.sleep = 0; }
      setTimeout(() => { if (d.alive) d.emo = null; }, 700);
    } else d.emo = "hurt";
    await U.wait(quick ? 260 : 420);
    if (d.side === "foe") d.emo = d.alive ? "normal" : "hurt";
    if (!d.alive) {
      if (d.side === "foe") {
        await this.tween(0.35, (k) => (d.alpha = 1 - k));
        await this.msg(`${d.name}を やっつけた！`, 500);
      } else {
        d.emo = "sad";
        await this.msg(`${d.name}は たおれてしまった……`, 800);
      }
    }
  }

  // ---- 演出 ----
  tween(dur, fn) { return new Promise((res) => this.tweens.push({ t: 0, dur, fn, res })); }
  async lunge(u, target) {
    const dir = u.side === "ally" ? -1 : 1;
    const tx = target ? (target.x - u.x) * 0.25 : 0;
    u.pose = "jump_01"; u.emo = u.side === "ally" ? "angry" : "angry";
    Sound.se("jump");
    await this.tween(0.16, (k) => { u.oy = dir * 34 * k; u.ox = tx * k; });
    await this.tween(0.12, (k) => { u.oy = dir * 34 * (1 - k); u.ox = tx * (1 - k); });
    u.pose = null; u.emo = u.side === "ally" ? null : "normal";
  }
  pop(u, text, color, big) { this.pops.push({ x: u.x + U.rand(-10, 10), y: u.y - (u.side === "foe" ? this.FS * 0.72 : this.AS * 0.8), text, color, big, t: 0 }); }
  sparkle(u, color) { for (let i = 0; i < 10; i++) this.parts.push({ kind: "spark", x: u.x + U.rand(-30, 30), y: u.y - U.rand(10, 80), vx: U.rand(-20, 20), vy: U.rand(-70, -30), t: 0, dur: U.rand(0.6, 1), color }); }
  impact(u, fx) {
    const y = u.y - (u.side === "foe" ? this.FS * 0.46 : this.AS * 0.5);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      this.parts.push({ kind: fx === "fire" ? "fire" : "star", x: u.x, y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, t: 0, dur: 0.4, color: fx === "wind" ? "#B3E5FC" : "#FFE066" });
    }
  }
  burst(kind, targets) {
    for (const t of targets) for (let i = 0; i < 14; i++) {
      this.parts.push({ kind: kind === "fire" ? "fire" : kind === "wind" ? "wind" : kind === "rock" ? "rock" : kind === "bone" ? "bone" : "star", x: t.x + U.rand(-40, 40), y: t.y - U.rand(0, 90), vx: U.rand(-60, 60), vy: U.rand(-90, 20), t: -Math.random() * 0.25, dur: 0.7, color: kind === "roar" ? "#FFFFFF" : "#FFE066" });
    }
  }

  // ---- 結果 ----
  async victory() {
    Sound.stopBgm();
    Sound.jingle("victory");
    for (const a of this.allies) if (a.alive) { a.emo = "happy"; }
    this.cheer = true;
    await this.msg("やったー！ バトルに かった！", 900);
    let exp = 0, coins = 0;
    const drops = [];
    for (const f of this.foes) {
      const k = 1 + 0.15 * (f.lv - f.e.lv);
      exp += Math.round(f.e.exp * k);
      coins += Math.round(U.randi(f.e.coin[0], f.e.coin[1]) * k);
      Save.d.dex[f.kind].won = (Save.d.dex[f.kind].won || 0) + 1;
      const tbl = { meadow: ["apple", "candy", "bandaid", "milk"], forest: ["corn", "drink", "juice", "bandaid"], cave: ["bigbandaid", "feather", "drink", "fish"], coast: ["deza_ice", "bigbandaid", "fish"] }[this.area] || ["bandaid"];
      if (!f.e.boss && Math.random() < 0.22) drops.push({ bag: U.pick(tbl) });
      if (f.kind === "koumori" && Math.random() < 0.05 && !Save.d.wardrobe.batwings) drops.push({ wear: "batwings" });
    }
    const lines = [];
    if (this.boss) {
      if (!Save.d.flags.boss) {
        Save.d.flags.boss = true;
        drops.push({ wear: "crown" }, { furn: "trophy" });
        coins = 500;
      } else coins = 300;
      Save.d.flags.bossDay = U.today();
    }
    coins = GameEconomy.battle(coins, this.difficulty, this.foes.length);
    Save.addCoins(coins);
    Save.d.stats.wins++;
    const ups = [];
    for (const a of this.allies) {
      const got = a.alive ? exp : Math.ceil(exp / 2);
      for (const u of Stats.gainExp(a.id, got)) ups.push({ a, u });
      if (!a.alive) this.setHp(a, 1);
    }
    Save.careAll({ hunger: -2, mood: 2, bond: 0.5 });
    const dropMsgs = drops.map((d) => Loot.give(d));
    Save.mark();
    Sound.se("coin");
    // 結果パネル
    const body = U.el("div");
    body.append(U.el("div", { class: "result-big", text: this.boss ? "キングプルンを たおした！" : "しょうり！" }));
    const rows = U.el("div", { class: "result-rows" });
    rows.innerHTML = `<div class="r"><span>けいけんち</span><span>+${exp}</span></div><div class="r"><span>コイン</span><span>+${coins}</span></div>` +
      dropMsgs.map((m) => `<div class="r"><span>${m.split("\n")[0]}</span></div>`).join("");
    body.append(rows);
    for (const { a, u } of ups) {
      const nm = { hp: "HP", sp: "SP", atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ" };
      body.append(U.el("div", { class: "note", html: `<b>${a.name}は レベル${u.lv}に あがった！</b><br>${Object.entries(u.diff).filter(([, v]) => v).map(([k, v]) => `${nm[k]}+${v}`).join(" ")}${u.learned.length ? `<br>あたらしい とくぎ「${u.learned.join("・")}」を おぼえた！` : ""}` }));
    }
    if (ups.length) Sound.jingle("jingle_lv");
    await new Promise((res) => {
      const m = UI.modal({ title: "バトル けっか", body, closable: false, footer: UI.btn("つづける", () => { Sound.se("ok"); m.close(); res(); }, "yellow wide") });
    });
    if (this.boss && dropMsgs.length > 1) {
      await UI.say([
        { name: "キングプルン", text: "ぷるる……まいった！ おまえたち、つよいのう。\nこの おうかんを やろう。たまには また あそびに こい！" },
        { who: "wanko", emo: "happy", text: "やったね！ 3にん いっしょなら むてきだ！" },
      ]);
    }
    FieldMemory.defeated.add(this.p.spawnIdx);
    this.leave();
  }
  async defeat() {
    Sound.stopBgm();
    Sound.se("bad");
    await this.msg("めのまえが まっくらに なった……", 1400);
    Save.healAll();
    Save.careAll({ mood: -10 });
    Save.d.world = { map: "town", x: 4, y: 6, dir: "down" };
    Save.mark();
    Game.goto("house", { msg: "おうちで ひとやすみ……。みんな げんきに なった。" }, "fade");
  }
  endFlee() {
    FieldMemory.fled = this.p.spawnIdx;
    Game.goto("world", { ...this.p.back, grace: 2.5 }, "fade");
  }
  leave() { Game.goto("world", { ...this.p.back, grace: 1.5 }, "fade"); }

  // ---- 更新・描画 ----
  update(dt) {
    for (const tw of this.tweens) { tw.t += dt; tw.fn(Math.min(1, tw.t / tw.dur)); if (tw.t >= tw.dur) tw.res(); }
    this.tweens = this.tweens.filter((tw) => tw.t < tw.dur);
    for (const u of [...this.allies, ...this.foes]) { if (u.shake > 0) u.shake -= dt; if (u.flash > 0) u.flash -= dt; }
    this.pops = this.pops.filter((p) => (p.t += dt) < 1.1);
    for (const p of this.parts) { p.t += dt; if (p.t > 0) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; } }
    this.parts = this.parts.filter((p) => p.t < p.dur);
  }
  render(ctx) {
    this.drawBg(ctx);
    const t = G.t;
    // てき
    for (const f of this.foes) {
      if (f.alpha <= 0.01) continue;
      const size = this.FS;
      const emo = f.sleep > 0 ? "sleep" : f.emo;
      const c = this.foeCanvas(f, emo, false) || this.foeCanvas(f, "normal", false);
      const sx = f.shake > 0 ? Math.sin(f.shake * 60) * 6 : 0;
      const bob = Math.sin(t * 2.4 + f.i) * 3;
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = "rgba(31,29,27,0.16)";
      ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, size * 0.3, size * 0.07, 0, 0, 7); ctx.fill();
      if (c) {
        const w = size, h = (size * VB.h) / VB.w;
        const sq = 1 + Math.sin(t * 3 + f.i) * 0.025;
        ctx.translate(f.x + sx + f.ox, f.y + f.oy);
        ctx.scale(sq, 1 / sq);
        ctx.drawImage(c, -w * ((FOOT.x - VB.x) / VB.w), -h * ((FOOT.y - VB.y) / VB.h) - bob, w, h);
        if (f.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = f.flash * 2; ctx.drawImage(c, -w * ((FOOT.x - VB.x) / VB.w), -h * ((FOOT.y - VB.y) / VB.h) - bob, w, h); }
      }
      ctx.restore();
      if (f.alive) this.drawFoeBar(ctx, f, size);
    }
    this.drawGauge(ctx);
    // なかま
    for (const a of this.allies) {
      const c = Save.d.chars[a.id];
      let pose = a.pose || (Math.floor((t + a.i * 0.2) / 0.5) % 2 ? "idle_02" : "idle_01");
      let face = a.emo || (a.sleep > 0 ? "sleep" : !a.alive ? "sad" : c.hp < this.mhp(a) * 0.3 ? "sad" : "normal");
      let oy = a.oy;
      if (this.cheer && a.alive) { const k = (t * 1.6 + a.i * 0.33) % 1; pose = k < 0.5 ? "jump_01" : "idle_01"; oy = -Math.max(0, Math.sin(k * Math.PI * 2)) * 26; face = "happy"; }
      const sx = a.shake > 0 ? Math.sin(a.shake * 60) * 6 : 0;
      ctx.fillStyle = "rgba(31,29,27,0.16)";
      ctx.beginPath(); ctx.ellipse(a.x, a.y + 2, 30, 8, 0, 0, 7); ctx.fill();
      ctx.save();
      if (!a.alive) { ctx.globalAlpha = 0.55; }
      Chara.draw(ctx, a.id, { pose, face, outfit: c.outfit, color: c.color }, a.x + sx + a.ox, a.y + oy + (a.alive ? 0 : 6), this.AS);
      if (a.flash > 0) { ctx.globalAlpha = a.flash * 2; ctx.globalCompositeOperation = "lighter"; Chara.draw(ctx, a.id, { pose, face, outfit: c.outfit, color: c.color }, a.x + sx + a.ox, a.y + oy, this.AS); }
      ctx.restore();
      const top = this.AS * 1.2;
      if (a.sleep > 0) this.zz(ctx, a.x + 26, a.y - top * 0.78);
      if (a.guard) FX.star(ctx, a.x - 34, a.y - top * 0.7, 8, "#7EC8F0");
      if (this.active === a) { const b = Math.sin(t * 6) * 3; ctx.fillStyle = "#F29A1F"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x - 8, a.y - top + b); ctx.lineTo(a.x + 8, a.y - top + b); ctx.lineTo(a.x, a.y - top + 12 + b); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      this.drawAllyCard(ctx, a);
    }
    if (this.targeting) for (const tg of this.targeting.cands) {
      const size = tg.side === "foe" ? this.FS : this.AS;
      const b = Math.sin(t * 7) * 4;
      ctx.fillStyle = "#F06292"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      const y = tg.y - size * 0.95 + b;
      ctx.beginPath(); ctx.moveTo(tg.x - 10, y - 14); ctx.lineTo(tg.x + 10, y - 14); ctx.lineTo(tg.x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // こうか
    for (const p of this.parts) {
      if (p.t < 0) continue;
      const k = p.t / p.dur;
      ctx.save(); ctx.globalAlpha = 1 - k;
      if (p.kind === "star") FX.star(ctx, p.x, p.y, 7 * (1 - k * 0.5), p.color);
      else if (p.kind === "spark") FX.star(ctx, p.x, p.y, 4.5, p.color);
      else if (p.kind === "fire") { ctx.fillStyle = k < 0.4 ? "#FFE066" : "#FF8A3D"; ctx.beginPath(); ctx.arc(p.x, p.y, 9 * (1 - k), 0, 7); ctx.fill(); }
      else if (p.kind === "wind") { ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 10 + k * 10, 0, 4); ctx.stroke(); }
      else if (p.kind === "rock") { ctx.fillStyle = "#A8A29A"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x - 6, p.y + 5); ctx.lineTo(p.x - 3, p.y - 6); ctx.lineTo(p.x + 6, p.y - 3); ctx.lineTo(p.x + 5, p.y + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (p.kind === "bone") { ctx.translate(p.x, p.y); ctx.rotate(p.t * 12); ctx.fillStyle = "#F6E3BF"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; U.rr(ctx, -9, -3, 18, 6, 3); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    for (const p of this.pops) {
      const k = p.t / 1.1;
      const y = p.y - Math.sin(Math.min(1, k * 2.2) * Math.PI) * 26 - k * 10;
      ctx.save(); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      ctx.font = `900 ${p.big ? 30 : 23}px 'M PLUS Rounded 1c', sans-serif`;
      ctx.textAlign = "center"; ctx.lineJoin = "round"; ctx.lineWidth = 6; ctx.strokeStyle = "#FFFFFF";
      ctx.strokeText(p.text, p.x, y); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, y);
      ctx.restore();
    }
  }
  zz(ctx, x, y) {
    ctx.save(); ctx.font = "900 15px 'M PLUS Rounded 1c', sans-serif"; ctx.fillStyle = "#FFF"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    const k = (G.t * 0.8) % 1; ctx.globalAlpha = 1 - k; ctx.strokeText("Z", x + k * 10, y - k * 16); ctx.fillText("Z", x + k * 10, y - k * 16); ctx.restore();
  }
  drawFoeBar(ctx, f, size) {
    const w = this.boss ? 150 : Math.min(84, this.FS * 0.75), x = f.x - w / 2, y = f.y + 10;
    ctx.save();
    ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = INK;
    ctx.lineWidth = 3; ctx.strokeStyle = "#FFFDF6"; ctx.strokeText(`${f.name} Lv${f.lv}`, f.x, y + 11); ctx.fillText(`${f.name} Lv${f.lv}`, f.x, y + 11);
    U.rr(ctx, x, y + 16, w, 8, 4); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    const k = f.hp / f.mhp;
    if (k > 0) { U.rr(ctx, x + 1.5, y + 17.5, (w - 3) * k, 5, 2.5); ctx.fillStyle = k > 0.5 ? "#6FCF6A" : k > 0.2 ? "#FFC23D" : "#F0605D"; ctx.fill(); }
    if (f.scared) { ctx.fillText("すくみ", f.x, y + 38); }
    ctx.restore();
  }
  drawAllyCard(ctx, a) {
    const c = Save.d.chars[a.id];
    const w = 104, h = 48, x = a.x - w / 2, y = a.y + 10;
    ctx.save();
    U.rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = this.active === a ? "#FFF3C4" : "rgba(255,253,246,0.95)"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(`${c.name}`, x + 7, y + 10);
    ctx.textAlign = "right"; ctx.fillText(`Lv${c.lv}`, x + w - 7, y + 10);
    const bar = (yy, v, mx, col, label) => {
      ctx.textAlign = "left"; ctx.font = "800 9px 'M PLUS Rounded 1c', sans-serif"; ctx.fillStyle = INK; ctx.fillText(label, x + 6, yy + 3);
      U.rr(ctx, x + 22, yy, w - 30, 7, 3.5); ctx.fillStyle = "#FFF"; ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
      const k = U.clamp(v / mx, 0, 1);
      if (k > 0) { U.rr(ctx, x + 23, yy + 1, (w - 32) * k, 5, 2.5); ctx.fillStyle = col; ctx.fill(); }
    };
    const mhp = this.mhp(a), msp = Stats.max(a.id, "sp");
    bar(y + 20, Math.max(0, c.hp), mhp, c.hp / mhp > 0.3 ? "#6FCF6A" : "#F0605D", "HP");
    bar(y + 33, c.sp, msp, "#7EC8F0", "SP");
    ctx.font = "800 8px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = INK;
    ctx.fillText(`${Math.max(0, c.hp)}/${mhp}`, x + w - 8, y + 44);
    ctx.restore();
  }
  drawGauge(ctx) {
    const w = 170, x = G.W / 2 - w / 2, y = Math.max(this.foeY + 52, (this.foeY + this.allyY) / 2 - 40);
    ctx.save();
    ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = INK;
    ctx.lineWidth = 3; ctx.strokeStyle = "#FFFDF6";
    ctx.strokeText("なかよしゲージ", G.W / 2, y - 5); ctx.fillText("なかよしゲージ", G.W / 2, y - 5);
    U.rr(ctx, x, y, w, 10, 5); ctx.fillStyle = "#FFF"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    const k = this.gauge / 100;
    if (k > 0) { U.rr(ctx, x + 1.5, y + 1.5, (w - 3) * k, 7, 3.5); ctx.fillStyle = k >= 1 ? `hsl(${(G.t * 200) % 360},90%,65%)` : "#F48FB1"; ctx.fill(); }
    FX.heart(ctx, x - 8, y + 5, 7);
    ctx.restore();
  }
  drawBg(ctx) {
    const W = G.W, H = G.H, a = this.area;
    const sky = a === "cave" ? ["#2A2230", "#4A3E48"] : a === "forest" ? ["#BFE3C4", "#EAF6DD"] : ["#A8DBFF", "#E6F6FF"];
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const hy = H * 0.24;
    if (a === "meadow") {
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 3; i++) { const x = ((i * 150 + G.t * 6) % (W + 120)) - 60, y = 50 + i * 26; ctx.beginPath(); ctx.ellipse(x, y, 30, 11, 0, 0, 7); ctx.ellipse(x + 16, y - 6, 16, 11, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#9FD27F"; ctx.beginPath(); ctx.moveTo(0, hy + 20); ctx.quadraticCurveTo(W * 0.3, hy - 16, W * 0.6, hy + 10); ctx.quadraticCurveTo(W * 0.85, hy - 10, W, hy + 14); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    } else if (a === "forest") {
      for (let i = 0; i < 9; i++) {
        const x = (i / 8) * W, h = 70 + (i % 3) * 22;
        ctx.fillStyle = i % 2 ? "#5E9E62" : "#4E8F56";
        ctx.beginPath(); ctx.moveTo(x - 26, hy + 30); ctx.lineTo(x, hy + 30 - h); ctx.lineTo(x + 26, hy + 30); ctx.fill();
      }
    } else {
      ctx.fillStyle = "#3A2F36";
      for (let i = 0; i < 10; i++) { const x = (i / 9) * W; ctx.beginPath(); ctx.moveTo(x - 16, 0); ctx.lineTo(x, 30 + (i % 3) * 22); ctx.lineTo(x + 16, 0); ctx.fill(); }
      for (let i = 0; i < 6; i++) { const x = 30 + i * 60, y = hy + 10 + (i % 2) * 14; ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(G.t * 2 + i) * 0.3; FX.star(ctx, x, y, 4, "#8FD3F4"); ctx.restore(); }
    }
    const gy = H * 0.26;
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    const gc = a === "coast" ? ["#F7DBA8", "#E7BD82"] : a === "cave" ? ["#6E6259", "#5A4E45"] : a === "forest" ? ["#86C46A", "#6FAE55"] : ["#A6D883", "#8CC56C"];
    gg.addColorStop(0, gc[0]); gg.addColorStop(1, gc[1]);
    ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
    if (a === "coast") {
      ctx.fillStyle = "#A9DFF1"; ctx.fillRect(0, 0, W, gy * 0.65);
      ctx.fillStyle = "#72BED3"; ctx.fillRect(0, gy * 0.65, W, gy * 0.6);
      ctx.strokeStyle = "#F5FAE8"; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { const yy=gy*.78+i*8; ctx.beginPath(); ctx.moveTo(0,yy); ctx.bezierCurveTo(W*.3,yy-5,W*.7,yy+5,W,yy); ctx.stroke(); }
    }
    // ステージの だえん
    const plat = (x, y, rx, ry) => {
      ctx.fillStyle = a === "coast" ? "#F8E3BC" : a === "cave" ? "#8E8175" : a === "forest" ? "#9CD27D" : "#B9E39A";
      ctx.strokeStyle = "rgba(31,29,27,0.25)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
    };
    plat(W / 2, this.foeY + 4, this.boss ? 150 * this.bs : Math.min(W * 0.46, 60 + this.foes.length * 55), this.boss ? 30 : 22);
    plat(W / 2, this.allyY + 4, W * 0.47, 26);
  }
}
SCENES.battle = BattleScene;
