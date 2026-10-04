// 日付は U.today()。月日が1桁でも正しく前後を比べ、時計を戻しても再配布しない。
const DailyPlay = {
  reward:150,
  dayIndex(day) {const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(day||'');if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3],date=new Date(Date.UTC(y,mo-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===mo-1&&date.getUTCDate()===d?date.getTime()/86400000:null;},
  featured(day=U.today()) {const shops=Object.keys(SHOPS).filter(id=>id!=='link'&&MG_TASKS[id]),n=this.dayIndex(day);return shops[((n||0)%shops.length+shops.length)%shops.length];},
  // ラッキー おみせ（うらない・まいにち スタンプに でる）の コインの ばいりつ。日づけで きまる 1.5〜3（0.1 きざみの 16とおりが おなじ 確率。オーナーの FB 2026-09-30・2026-10-04 に 1.2〜2 から ひろげた）
  MULS:[1.5,1.6,1.7,1.8,1.9,2,2.1,2.2,2.3,2.4,2.5,2.6,2.7,2.8,2.9,3],
  mul(day=U.today()) {let h=2166136261;for(const ch of 'ころころ'+String(day)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0;}h=Math.imul(h^(h>>>15),2246822507)>>>0;h=Math.imul(h^(h>>>13),3266489909)>>>0;h^=h>>>16;return this.MULS[(h>>>0)%this.MULS.length];},
  label(mul) {return (Number.isInteger(mul)?String(mul):mul.toFixed(1))+'ばい';},
  boost(shop,day=U.today()) {return shop===this.featured(day)?this.mul(day):1;},
  payout(pay,tip,boost) {const p=Math.round(pay*boost);return {pay:p,tip:Math.round((pay+tip)*boost)-p};},
  visit(day=U.today()) {const n=this.dayIndex(day),s=Save.d.daily,last=this.dayIndex(s.last);if(n===null||(last!==null&&n<=last))return false;
    s.last=day;s.total++;s.stamps=(s.total-1)%7+1;const prize=s.stamps===7;if(prize){s.cycles++;Save.addCoins(this.reward);Save.addBag('pudding',1);if(UI.hudCoins)UI.updateHud();}Save.mark();Save.write();return {prize,stamps:s.stamps,total:s.total};},
  open() {this.visit();const s=Save.d.daily,body=U.el('div',{class:'daily-play'}),shop=this.featured();body.append(U.el('p',{text:'あそびに きたら 1にち 1こ。7こで ごほうび！'}));const stamps=U.el('div',{class:'daily-stamps','aria-label':'7この スタンプ'});
    for(let i=1;i<=7;i++)stamps.append(U.el('div',{class:'daily-stamp'+(i<=s.stamps?' stamped':''),'aria-label':i+'こめ '+(i<=s.stamps?'もらった':'まだ'),text:(i<=s.stamps?'★':'☆')+' '+i}));
    body.append(stamps,U.el('p',{class:'note',text:'7こで '+this.reward+' コインと プリンの デザ。\nれんぞくで なくても だいじょうぶ！'}),U.el('h3',{text:'きょうの おすすめ'}),U.el('div',{class:'daily-featured',text:SHOPS[shop].name}),U.el('p',{text:'おてつだいの コインが '+this.label(this.mul())+'！（ひによって 1.5〜3ばい）'}));
    if(s.cycles)body.append(U.el('p',{class:'note',text:'ごほうびを '+s.cycles+'かい もらったよ。'}));UI.modal({title:'まいにち スタンプ',body});}
};
