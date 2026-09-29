// 店内でも町と同じ、触れた場所を中心にする移動スティック。
// 座標は画面の論理単位。部屋の拡大率・カメラ移動から独立させる。
const IndoorWalk = {
  blocked(sc) { return sc.closed || Game.inputLocked || sc.busy || sc.interacting || sc.lift > 0 || document.hidden; },
  down(sc, p) {
    if (this.blocked(sc) || sc.touch) return;
    sc.touch = { sx: p.x, sy: p.y, id: p.id };
  },
  move(sc, p) {
    if (this.blocked(sc)) { this.cancel(sc); return; }
    if (!sc.touch || sc.touch.id !== p.id) return;
    const dx = p.x - sc.touch.sx, dy = p.y - sc.touch.sy;
    if (!sc.joy && Math.hypot(dx, dy) > 12) {
      sc.joy = { bx: sc.touch.sx, by: sc.touch.sy, id: p.id };
      sc.path = []; sc.pending = null;
    }
    if (sc.joy) { sc.joy.x = p.x; sc.joy.y = p.y; }
  },
  // true のときだけ床・展示のタップを処理する。ドラッグ後に指を戻してもタップしない。
  release(sc, p, cancelled) {
    if (!sc.touch || sc.touch.id !== p.id) return false;
    const tap = !cancelled && !sc.joy && p.tap && !this.blocked(sc);
    this.cancel(sc); return tap;
  },
  cancel(sc) { sc.touch = null; sc.joy = null; },
  direction(sc) {
    if (sc.joy) {
      let dx = sc.joy.x - sc.joy.bx, dy = sc.joy.y - sc.joy.by;
      if (Math.hypot(dx, dy) < 10) return null;
      // 斜めの床の軸へ戻す。カメラの位置・ズームは方向に影響しない。
      if (sc.iso) { const p = IsoVenue.inv(dx, dy); dx = p.x; dy = p.y; }
      return dirOf(dx, dy);
    }
    return Object.keys(DIRS).find(d => G.keys[d]) || null;
  },
  render(sc, ctx) {
    if (!sc.joy || this.blocked(sc)) return;
    // 町と同じ見た目を画面座標で描く。
    WorldScene.prototype.renderJoy.call(sc, ctx);
  },
};
