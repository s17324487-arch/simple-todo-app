// 現実の端末時刻。見た目やお世話の履歴は勤務で変更しない。
const MamaSchedule={
  working(){const h=U.hourNow();return h>=9&&h<18;},
  sync(sc){const mama=sc.parents.find(p=>p.id==='mama');if(!mama)return;const away=this.working();if(away&&!mama.hidden){mama.queue=[];mama.target=null;mama.state='idle';}mama.hidden=away;},
  install(){
    const init=ParentCare.init,update=ParentCare.update,draw=ParentCare.draw,request=ParentCare.request;
    ParentCare.init=function(sc){init.call(this,sc);MamaSchedule.sync(sc);};
    ParentCare.update=function(sc,dt){MamaSchedule.sync(sc);update.call(this,sc,dt);};
    ParentCare.draw=function(sc,ctx,p){if(!p.hidden)draw.call(this,sc,ctx,p);};
    ParentCare.request=function(sc,id,...args){if(id==='mama'&&MamaSchedule.working()){if(!args[1])UI.toast('ままは 池袋で おしごと中（9:00〜18:00）');return;}return request.call(this,sc,id,...args);};
    const talk=HomeLife.playTalk;HomeLife.playTalk=function(sc,t){if(MamaSchedule.working()&&t?.turns.some(t=>t.who==='mama'))return false;return talk.call(this,sc,t);};
    const def=VenueHalls.defs.office;
    def.update=sc=>{sc.fixtures.find(f=>f.kind==='parent').hidden=!this.working();};
    def.arrive=sc=>{def.update(sc);if(this.working())UI.say([{who:Save.d.order[0],emo:'love',text:'あいにきたよー♡'}]);else UI.toast('ままは おうちに かえったよ。おしごとは 9:00〜18:00。');};
  },
};
MamaSchedule.install();
