import assert from 'node:assert/strict';
import {gameContext} from './game-context.mjs';
const {SONGS,Sound,ModernMusic}=gameContext();
assert(Object.keys(SONGS).length>=30);
for(const [name,song] of Object.entries(SONGS)){
  assert(song.modern&&song.title,name);
  assert(song.bpm>=70&&song.bpm<=200);
  const instruments=new Set();
  for(const tr of song.tracks){
    assert(tr.vol>0&&tr.vol<=.3,name+' excessive track gain');
    const seq=Sound.parse(tr.notes);assert(seq.length>0);
    if(!song.once)assert.equal(tr.drum?8:64,seq.length,name+' incomplete phrase');
    if(!tr.drum){assert(ModernMusic.instruments[tr.instrument],name);instruments.add(tr.instrument);assert(!tr.wave,'raw pulse/square in modern BGM');}
  }
  if(!song.once){assert(instruments.size>=3);assert(song.tracks.some(tr=>tr.instrument==='bass'));assert(song.tracks.some(tr=>tr.notes.includes('+')));}
}
const cities=['town','city','heiwadai','harbor','airport','house'];
assert.equal(new Set(cities.map(id=>JSON.stringify(SONGS[id]))).size,cities.length);
console.log(`Music checks: ${Object.keys(SONGS).length} arrangements, instruments, chords, eight-bar loops and headroom OK`);
