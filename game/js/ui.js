// DOMのUI（会話・選択肢・モーダル・トースト・HUD）
const UI = {
  root: null,
  layers: 0, // 開いているモーダル等の数（>0 のあいだ シーンの操作を止める）

  init() {
    this.root = document.getElementById("ui");
    this.hud = U.el("div", { class: "hud hidden" });
    this.hudCoins = U.el("div", { class: "pill coins" });
    this.hudPlace = U.el("div", { class: "pill place" });
    this.hudMenu = U.el("button", { class: "btn round menu-btn", "aria-label": "メニュー", html: "<span></span><span></span><span></span>" });
    this.hudMenu.addEventListener("click", () => { Sound.se("tap"); Game.openMenu(); });
    this.hud.append(this.hudCoins, this.hudPlace, this.hudMenu);
    this.root.append(this.hud);
    this.toastBox = U.el("div", { class: "toasts" });
    this.root.append(this.toastBox);
  },
  get busy() { return this.layers > 0; },

  showHud(on, place) {
    this.hud.classList.toggle("hidden", !on);
    if (place !== undefined) this.hudPlace.textContent = place;
    this.hudPlace.classList.toggle("hidden", !place);
    this.updateHud();
  },
  updateHud() {
    if (!Save.d) return;
    const c = U.fmt(Save.d.coins);
    if (this.hudCoins.dataset.v !== c) {
      this.hudCoins.innerHTML = `<i class="coin-ico"></i>${c}`;
      this.hudCoins.dataset.v = c;
    }
  },

  toast(msg, cls = "") {
    const t = U.el("div", { class: "toast " + cls, html: msg });
    this.toastBox.append(t);
    setTimeout(() => t.classList.add("out"), 1900);
    setTimeout(() => t.remove(), 2400);
  },

  // 会話ウィンドウ。lines: 文字列 or {name, text, who}
  say(lines, opts = {}) {
    lines = [].concat(lines);
    return new Promise((resolve) => {
      this.layers++;
      const box = U.el("div", { class: "dialog" });
      const face = U.el("div", { class: "dlg-face" });
      const name = U.el("div", { class: "dlg-name" });
      const text = U.el("div", { class: "dlg-text" });
      const next = U.el("div", { class: "dlg-next" });
      box.append(face, name, text, next);
      const shade = U.el("div", { class: "dlg-shade" }, box);
      this.root.append(shade);
      let i = 0, typing = null, full = "";
      const show = () => {
        let ln = lines[i];
        if (typeof ln === "string") ln = { text: ln };
        const who = ln.who || opts.who;
        const nm = ln.name || opts.name || (who && Chara.PROFILE[who] ? Save.d.chars[who].name : "");
        name.textContent = nm || "";
        name.classList.toggle("hidden", !nm);
        const svg = ln.face || opts.face || (who && Chara.PROFILE[who] ? Chara.svg(who, { face: ln.emo || "normal", color: Save.d.chars[who].color, outfit: Save.d.chars[who].outfit }) : null);
        face.innerHTML = svg || "";
        face.classList.toggle("hidden", !svg);
        box.classList.toggle("with-face", !!svg);
        full = ln.text;
        text.textContent = "";
        next.classList.add("hidden");
        let k = 0;
        clearInterval(typing);
        typing = setInterval(() => {
          k += 2;
          text.textContent = full.slice(0, k);
          if (k % 6 === 0) Sound.se("tap");
          if (k >= full.length) { clearInterval(typing); typing = null; next.classList.remove("hidden"); }
        }, 28);
        if (who && ln.voice !== false && i === 0) Sound.voice(who);
      };
      const adv = (e) => {
        e.preventDefault();
        if (typing) { clearInterval(typing); typing = null; text.textContent = full; next.classList.remove("hidden"); return; }
        i++;
        if (i >= lines.length) {
          shade.remove();
          this.layers--;
          resolve();
          return;
        }
        show();
      };
      shade.addEventListener("pointerup", adv);
      show();
    });
  },

  // 選択肢。options: 文字列の配列。キャンセル時は -1
  ask(text, options, { cancel = true, who = null } = {}) {
    return new Promise((resolve) => {
      this.layers++;
      const shade = U.el("div", { class: "dlg-shade ask" });
      const box = U.el("div", { class: "dialog" });
      if (who) {
        box.classList.add("with-face");
        box.append(U.el("div", { class: "dlg-face", html: Chara.svg(who, { color: Save.d.chars[who].color, outfit: Save.d.chars[who].outfit }) }));
      }
      box.append(U.el("div", { class: "dlg-text", text }));
      const list = U.el("div", { class: "choices" });
      const done = (i) => {
        shade.remove();
        this.layers--;
        resolve(i);
      };
      options.forEach((o, i) => {
        const b = U.el("button", { class: "btn choice", html: o });
        b.addEventListener("click", () => { Sound.se(i === options.length - 1 && cancel ? "cancel" : "ok"); done(i); });
        list.append(b);
      });
      shade.append(list, box);
      if (cancel) shade.addEventListener("pointerup", (e) => { if (e.target === shade) { Sound.se("cancel"); done(-1); } });
      this.root.append(shade);
    });
  },
  confirm(text, yes = "はい", no = "いいえ") {
    return this.ask(text, [yes, no]).then((i) => i === 0);
  },

  // 画面いっぱいのパネル
  modal({ title = "", body, cls = "", onClose = null, closable = true, footer = null }) {
    this.layers++;
    const panel = U.el("div", { class: "panel " + cls });
    const head = U.el("div", { class: "panel-head" }, U.el("div", { class: "panel-title", html: title }));
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      wrap.classList.add("out");
      setTimeout(() => wrap.remove(), 180);
      this.layers--;
      if (onClose) onClose();
    };
    if (closable) {
      const x = U.el("button", { class: "btn round close", "aria-label": "とじる", html: "✕" });
      x.addEventListener("click", () => { Sound.se("cancel"); close(); });
      head.append(x);
    }
    const content = U.el("div", { class: "panel-body" });
    if (body) content.append(body);
    panel.append(head, content);
    if (footer) panel.append(U.el("div", { class: "panel-foot" }, footer));
    const wrap = U.el("div", { class: "modal-wrap" }, panel);
    this.root.append(wrap);
    return { el: panel, body: content, close, setTitle: (t) => (head.firstChild.innerHTML = t) };
  },

  btn(label, onClick, cls = "") {
    const b = U.el("button", { class: "btn " + cls, html: label });
    b.addEventListener("click", (e) => { onClick(e); });
    return b;
  },

  // ステータスのメーター（ハート）
  meter(v, max = 100, cls = "") {
    const pct = U.clamp(v / max, 0, 1) * 100;
    return `<div class="meter ${cls}"><div class="meter-fill" style="width:${pct.toFixed(0)}%"></div></div>`;
  },

  // アイテムのアイコン（SVG文字列）
  icon(kind, id, size = 44) {
    return `<div class="ico" style="width:${size}px;height:${size}px">${Art.iconSvg(kind, id)}</div>`;
  },

  // 「わーい」みたいな吹き出しをキャラの上に出すDOMは使わず、canvas側で描く
};
