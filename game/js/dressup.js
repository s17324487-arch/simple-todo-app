// きせかえ画面
const DressUp = {
  // opts（ほかの 画面から ひらく とき）: title・extra（もって いなくても きられる ふく。Meeときょれじゃ の こういしつの かしだし）・tag（extra の ふだ）・note（したの せつめい）
  //   info(だれ)（ステージの したの 1ぎょう。ファッションショーの おしゃれ レベル）・mark(ふく)（ふくの カードの ふだ。ショーの テーマに あう ふく）
  open(startWho, opts = {}) {
    if(["papa","mama"].includes(startWho))return ParentWardrobe.open(startWho);
    const extra = (opts.extra || []).filter(Boolean), extraIds = new Set(extra.map((it) => it.id));
    return new Promise((resolve) => {
      const d = Save.d;
      let who = startWho || d.order[0];
      let slot = "head";
      let view = "down";
      const before = JSON.stringify(Chara.IDS.map((id) => d.chars[id].outfit)) + d.chars.goji.color;
      const body = U.el("div");
      const wt = U.el("div", { class: "who-tabs" });
      const stage = U.el("div", { class: "dress-stage" });
      const tabs = U.el("div", { class: "tabs" });
      const grid = U.el("div", { class: "grid" });
      const tools = U.el("div", { class: "row wrap", style: "margin:10px 0 4px" });
      body.append(wt, stage, tabs, grid, tools);
      let frame = 0;
      const timer = setInterval(() => { frame ^= 1; drawStage(); }, 500);
      const m = UI.modal({
        title: opts.title || "きがえ", body, cls: "full" + (extra.length ? " dress-extra" : ""),
        onClose: () => {
          clearInterval(timer);
          const after = JSON.stringify(Chara.IDS.map((id) => d.chars[id].outfit)) + d.chars.goji.color;
          const changed = after !== before;
          if (changed) {
            const now = Date.now();
            if (!d.flags.lastDress || now - d.flags.lastDress > 20 * 60000) { Save.careAll({ mood: 6, bond: 1 }); d.flags.lastDress = now; }
            Save.mark();
          }
          resolve(changed);
        },
      });
      const drawWho = () => {
        wt.innerHTML = "";
        for (const id of d.order) {
          const c = d.chars[id];
          const b = U.el("button", { class: "who-tab" + (id === who ? " on" : ""), html: Chara.svg(id, { outfit: c.outfit, color: c.color }) + c.name });
          b.addEventListener("click", () => { who = id; Sound.voice(id); drawAll(); });
          wt.append(b);
        }
      };
      const drawChildren=drawWho;
      const drawFamily=()=>{drawChildren();if(extra.length)return;for(const id of ["papa","mama"]){const b=U.el("button",{class:"who-tab",html:ParentCare.svg(id,ParentCare.look(id))+ParentCare.name(id)});b.onclick=()=>{m.close();ParentWardrobe.open(id);};wt.append(b);}};
      const statLine = (id) => {
        const k = ["hp", "sp", "atk", "def", "spd"], nm = { hp: "HP", sp: "SP", atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ" };
        return k.map((s) => { const e = Stats.equip(id, s); return `${nm[s]} ${Stats.max(id, s)}${e ? `<span style="color:${e > 0 ? "#2e7d32" : "#c62828"}">(${e > 0 ? "+" : ""}${e})</span>` : ""}`; }).join("<br>");
      };
      const drawStage = () => {
        const c = d.chars[who];
        const perks = Object.values(c.outfit).map((x) => x && ITEM_INDEX[x] && ITEM_INDEX[x].perk).filter(Boolean);
        stage.innerHTML = `<div class="floor"></div><div class="who">${Chara.svg(who, { outfit: c.outfit, color: c.color, dir: view, pose: frame ? "idle_02" : "idle_01", face: "happy" })}</div>
          <div class="stats">${statLine(who)}</div>${perks.length ? `<div class="perk">${perks.map((p) => PERK_TEXT[p]).join("<br>")}</div>` : ""}${opts.info ? `<div class="dress-info">${opts.info(who)}</div>` : ""}`;
      };
      const drawTabs = () => {
        tabs.innerHTML = "";
        const T = Object.entries(SLOT_NAMES);
        if (who === "goji") T.push(["color", "からだのいろ"]);
        if (slot === "color" && who !== "goji") slot = "head";
        for (const [k, label] of T) {
          const b = U.el("button", { class: "tab" + (k === slot ? " on" : ""), text: label });
          b.addEventListener("click", () => { slot = k; view = k === "back" ? "up" : "down"; Sound.se("tap"); drawAll(); });
          tabs.append(b);
        }
      };
      const drawGrid = () => {
        grid.innerHTML = "";
        const c = d.chars[who];
        if (slot === "color") {
          for (const [k, label] of [["soft", "ふんわり グレー"], ["dark", "かっこいい ダーク"]]) {
            const b = U.el("button", { class: "card" + (c.color === k ? " on" : ""), html: `<div class="ico" style="width:60px;height:60px">${Chara.svg("goji", { color: k })}</div><div>${label}</div>` });
            b.addEventListener("click", () => { c.color = k; Sound.se("pop"); Save.mark(); drawAll(); });
            grid.append(b);
          }
          return;
        }
        const none = U.el("button", { class: "card" + (!c.outfit[slot] ? " on" : ""), html: `<div class="ico" style="width:44px;height:44px;font-size:26px">✕</div><div>なし</div>` });
        none.addEventListener("click", () => { c.outfit[slot] = null; Sound.se("tap"); Save.mark(); drawAll(); });
        grid.append(none);
        const owned = [...extra.filter((w) => w.slot === slot && !d.wardrobe[w.id]), ...WEAR_ITEMS.filter((w) => w.slot === slot && d.wardrobe[w.id])];
        for (const it of owned) {
          const lent = extraIds.has(it.id) && !d.wardrobe[it.id], on = c.outfit[slot] === it.id, mk = opts.mark ? opts.mark(it) : "";
          // 1こで 1人（js/wear-stock.js）: 2こ いじょう もって いれば かず、のこりが ない ときは つかって いる 人。かしだしは いくつでも
          const bd = lent ? null : WearStock.badge(it.id, who);
          const b = U.el("button", { class: "card" + (on ? " on" : "") + (lent ? " lent" : "") + (bd && bd.from ? " busy" : ""),
            html: `${lent ? `<span class="dress-tag">${opts.tag || ""}</span>` : ""}${mk ? `<span class="dress-mark">${mk}</span>` : ""}${bd && bd.n > 1 ? `<span class="cnt">×${bd.n}</span>` : ""}${UI.icon("wear", it.id, 44)}<div>${it.name}</div>${bd && bd.from ? `<small class="dress-who">${bd.text}</small>` : ""}` });
          b.addEventListener("click", async () => {
            if (on) c.outfit[slot] = null;
            else if (lent) c.outfit[slot] = it.id;
            else if (!(await WearStock.ask(who, slot, it))) return;
            Sound.se("pop");
            Save.mark();
            drawAll();
          });
          grid.append(b);
        }
        if (!owned.length) grid.append(U.el("div", { class: "note", text: "まだ もっていないよ。まちの ようふくやさんで かえるよ！" }));
      };
      const drawTools = () => {
        tools.innerHTML = "";
        tools.append(UI.btn("↻ まわる", () => { view = { down: "left", left: "up", up: "right", right: "down" }[view]; Sound.se("tap"); drawStage(); }, "small"));
        tools.append(UI.btn("みんな おそろい", () => {
          // 1こで 1人（js/wear-stock.js）: たりない 服は その 人の いまの ふくの まま（ほかの 人から とらない）。かしだしの いしょうは いくつでも
          const src = { ...d.chars[who].outfit }, short = [];
          for (const id of Chara.IDS) {
            if (id === who) continue;
            const o = d.chars[id].outfit;
            for (const [s, item] of Object.entries(src)) {
              if (!item || (extraIds.has(item) && !d.wardrobe[item])) { o[s] = item || null; continue; }
              if (o[s] === item) continue;
              if (WearStock.can(item, id)) WearStock.put(id, s, item); else if (!short.includes(item)) short.push(item);
            }
          }
          Sound.se(short.length ? "pop" : "sparkle"); Save.mark();
          if (short.length) UI.toast(`「${ITEM_INDEX[short[0]].name}」${short.length > 1 ? "など" : ""}が たりないよ。\n1こで ひとり。おみせで かうと おそろいに できるよ`);
          else UI.toast("3にん おそろいに したよ！", "good");
          drawAll();
        }, "small pink"));
        tools.append(UI.btn("ぜんぶ ぬぐ", () => { d.chars[who].outfit = { head: null, face: null, neck: null, body: null, back: null }; Sound.se("tap"); Save.mark(); drawAll(); }, "small"));
      };
      const drawAll = () => { drawFamily(); drawStage(); drawTabs(); drawGrid(); drawTools(); };
      if (opts.note) body.append(U.el("div", { class: "note dress-note", text: opts.note }));
      drawAll();
    });
  },
};
