// 地名だけを変更し、保存済み map / station / shop ID は引き継ぐ。
const DistrictTravel = {
  install() {
    MAP_DEFS.town.name='ネリカスタウン'; MAP_DEFS.city.name='池袋';
    Transit.stops.town_station.label='ネリカスえき';Transit.stops.city_station.label='池袋えき';
    const town=MAP_DEFS.town.warps.find(w=>w.to==='city');
    Object.assign(town,{to:'heiwadai',tx:22,ty:66,dir:'up'});
    const home=MAP_DEFS.heiwadai.warps.find(w=>w.to==='city');
    Object.assign(home,{to:'town',w:3,tx:46,ty:11,dir:'left'});
    MAP_DEFS.heiwadai.warps.push({x:24,y:67,w:3,h:1,to:'coast',tx:1,ty:9,dir:'right'});
    Object.assign(MAP_DEFS.coast.warps.find(w=>w.to==='city'),{to:'heiwadai',tx:25,ty:66,dir:'up'});
    MAP_DEFS.city.warps=[];
    Object.assign(AtlasArt.places.town,{lines:['ネリカスタウン'],desc:'しずかな じゅうたくがい。みんなの おうちと がっこうの まち。'});
    Object.assign(AtlasArt.places.city,{x:443,y:159,lines:['池袋','いけぶくろ'],desc:'でんしゃで 500コイン。おおきな おみせと とくべつな しなもの。かえりは むりょう。'});
    Object.assign(AtlasArt.places.heiwadai,{x:450,y:358});
    AtlasArt.roads=AtlasArt.roads.filter(([a,b])=>a!=='city'&&b!=='city'&&!(a==='heiwadai'&&b==='airport'));
    AtlasArt.roads.push(['town','heiwadai','M252 265 C310 255 367 328 450 358'],['heiwadai','coast','M450 358 C540 333 544 447 655 426'],['heiwadai','airport','M450 358 C548 320 549 237 626 206']);
    for(const s of MAP_DEFS.town.signs)if(s.text.includes('シティ'))s.text='ひがしは 平和台。池袋へは えきから でんしゃで いこう。';
  },
};
DistrictTravel.install();
