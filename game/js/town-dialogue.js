// 話題と返事をひとまとまりで選ぶ。相談の途中・結末は旧セーブへ追加して保存する。
const TownDialogue = {
  data() { return TOWN_DIALOGUE_DATA; },
  state() { return Save.d.conversations; },
  story(npc) { return this.data().stories.find(s => s.npc === npc); },
  lines(lines, who) { return lines.map(l => l.speaker === "npc" ? { ...who, text: l.text } : { who: l.speaker, text: l.text }); },
  pick(n) {
    const role = TownFolk.role(n.id), context = TownFolk.context(n.id);
    const pool = this.data().exchanges.filter(e => (e.npcs || []).includes(n.id) || (e.npcs || []).includes("*") || (e.roles || []).includes(role));
    const recent = this.state().recent[n.id] || [], selected = U.condPick(pool, context, recent);
    if (!selected) return null;
    this.state().recent[n.id] = [...recent.filter(id => id !== selected.id), selected.id].slice(-8);
    Save.mark();
    return selected;
  },
  describe(id, npc) {
    const e = this.data().exchanges.find(e => e.id === id);
    return e ? { ...e, npc: TownFolk.role(npc) || npc, text: e.lines[0].text } : null;
  },
  async talk(n, who) {
    const e = this.pick(n);
    if (!e) return false;
    const story = this.story(n.id), st = story && this.state().stories[story.id];
    TownFolk.last.line = e.id;
    const action = story ? st && st.ending ? "そのごの はなし" : st && st.node ? "そうだんの つづき" : "そうだんを きく" : null;
    const chosen = await UI.say(this.lines(e.lines, who), { action });
    if (chosen && story) await this.consult(story, who);
    return true;
  },
  choose(text, choices, who) {
    // 話を中断するボタンも常に見える。長い選択肢はパネル内でスクロールする。
    return new Promise(resolve => {
      let settled = false;
      const body = U.el("div", { class: "town-story-body" });
      body.append(U.el("div", { class: "town-story-person", html: who.face }), U.el("p", { text }));
      const buttons = U.el("div", { class: "town-story-choices" });
      const done = value => { if (settled) return; settled = true; panel.close(); resolve(value); };
      choices.forEach((c, i) => buttons.append(UI.btn(c.label, () => done(i), "wide town-story-choice")));
      buttons.append(UI.btn("また あとで（つづきは おぼえているよ）", () => done(-1), "wide town-story-pause"));
      body.append(buttons);
      const panel = UI.modal({ title: who.name + " の そうだん", body, cls: "town-story", onClose: () => done(-1) });
    });
  },
  async consult(story, who) {
    let saved = this.state().stories[story.id];
    if (saved && saved.ending) {
      await UI.say(this.lines(story.followup[saved.ending], who));
      const replay = await this.choose("あのときの はなしを ふりかえる？", [{ label: "もういちど そうだんを きく" }], who);
      if (replay !== 0) return;
      saved = null;
    }
    if (!saved) { saved = this.state().stories[story.id] = { node: story.start, path: [], ending: null }; Save.mark(); Save.write(); }
    for (let guard = 0; guard < 20; guard++) {
      const node = story.nodes[saved.node];
      if (!node) return;
      await UI.say(this.lines(node.lines, who));
      if (node.ending) {
        saved.ending = node.ending; saved.completed = U.today(); Save.mark(); Save.write();
        return;
      }
      const chosen = await this.choose("どんな ことばを かけよう？", node.choices, who);
      if (chosen < 0) return;
      saved.path.push({ node: saved.node, choice: chosen }); saved.node = node.choices[chosen].to;
      Save.mark(); Save.write();
    }
  },
};
