// きせかえ画面
const DressUp = {
  open(startWho) {
    if(["papa","mama"].includes(startWho))return ParentWardrobe.open(startWho);
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
        title: "きがえ", body, cls: "full",
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
      const drawFamily=()=>{drawChildren();for(const id of ["papa","mama"]){const b=U.el("button",{class:"who-tab",html:ParentCare.svg(id,ParentCare.look(id))+ParentCare.name(id)});b.onclick=()=>{m.close();ParentWardrobe.open(id);};wt.append(b);}};
      const statLine = (id) => {
        const k = ["hp", "sp", "atk", "def", "spd"], nm = { hp: "HP", sp: "SP", atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ" };
        return k.map((s) => { const e = Stats.equip(id, s); return `${nm[s]} ${Stats.max(id, s)}${e ? `<span style="color:${e > 0 ? "#2e7d32" : "#c62828"}">(${e > 0 ? "+" : ""}${e})</span>` : ""}`; }).join("<br>");
      };
      const drawStage = () => {
        const c = d.chars[who];
        const perks = Object.values(c.outfit).map((x) => x && ITEM_INDEX[x] && ITEM_INDEX[x].perk).filter(Boolean);
        stage.innerHTML = `<div class="floor"></div><div class="who">${Chara.svg(who, { outfit: c.outfit, color: c.color, dir: view, pose: frame ? "idle_02" : "idle_01", face: "happy" })}</div>
          <div class="stats">${statLine(who)}</div>${perks.length ? `<div class="perk">${perks.map((p) => PERK_TEXT[p]).join("<br>")}</div>` : ""}`;
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
        const owned = WEAR_ITEMS.filter((w) => w.slot === slot && d.wardrobe[w.id]);
        for (const it of owned) {
          const b = U.el("button", { class: "card" + (c.outfit[slot] === it.id ? " on" : ""), html: `${UI.icon("wear", it.id, 44)}<div>${it.name}</div>` });
          b.addEventListener("click", () => {
            c.outfit[slot] = c.outfit[slot] === it.id ? null : it.id;
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
          const src = d.chars[who].outfit;
          for (const id of Chara.IDS) d.chars[id].outfit = { ...src };
          Sound.se("sparkle"); Save.mark(); UI.toast("3にん おそろいに したよ！", "good"); drawAll();
        }, "small pink"));
        tools.append(UI.btn("ぜんぶ ぬぐ", () => { d.chars[who].outfit = { head: null, face: null, neck: null, body: null, back: null }; Sound.se("tap"); Save.mark(); drawAll(); }, "small"));
      };
      const drawAll = () => { drawFamily(); drawStage(); drawTabs(); drawGrid(); drawTools(); };
      drawAll();
    });
  },
};
