// 全体地図のためのオリジナル地形。世界座標は800×850、乱数・外部画像は使わない。
const AtlasArt = {
  serial: 0,
  places: {
    town: { x:252, y:265, lines:["ネリカスタウン"], kind:"house", color:"#EAAE80", desc:"おうちと おみせが ならぶ、かわぞいの まち。" },
    city: { x:450, y:358, lines:["池袋"], kind:"city", color:"#A5BDCE", desc:"たかい ビルと デパート。ふんすいの ひろばで ひとやすみ。" },
    heiwadai: { x:443, y:159, lines:["平和台", "へいわだい"], kind:"train", color:"#A7C5A6", desc:"えきまえの ななめの おおどおりから、ろじや こうえんへ。" },
    airport: { x:626, y:206, lines:["そらいろ", "くうこう"], kind:"plane", color:"#BCCDD8", desc:"おおきな ひこうきと かんせいとう。そらの たびの いりぐち。" },
    coast: { x:655, y:426, lines:["しおかぜビーチ"], kind:"palm", color:"#E9D79C", desc:"しろい すなはま、やしのき、きらきらの うみ。つよい てきに きをつけて。" },
    harbor: { x:634, y:635, lines:["あおぞらポート"], kind:"boat", color:"#A5CBC6", desc:"とうだいと さんばし。ふねと すいじょうきが まっているよ。" },
    meadow: { x:237, y:446, lines:["ぽかぽかはらっぱ"], kind:"mill", color:"#C9D99D", desc:"はなばたけと ふうしゃの さんぽみち。はじめての ぼうけんに。" },
    forest: { x:185, y:613, lines:["どんぐりのもり"], kind:"tree", color:"#91BA91", desc:"ふかい みどりに かくれた こみち。いずみと すいしゃを さがそう。" },
    cave: { x:360, y:710, lines:["きらきらどうくつ"], kind:"crystal", color:"#C0AFA2", desc:"やまの ふもとの どうくつ。ひかる いしの おくには ボスも。" },
  },
  roads: [
    ["town","city","M252 265 C310 255 367 328 450 358"],
    ["town","meadow","M252 265 C218 310 292 368 237 446"],
    ["meadow","forest","M237 446 C172 490 237 545 185 613"],
    ["forest","cave","M185 613 C185 698 286 651 360 710"],
    ["city","heiwadai","M450 358 C463 286 400 256 443 159"],
    ["heiwadai","airport","M443 159 C490 169 570 185 626 206"],
    ["city","coast","M450 358 C540 333 544 447 655 426"],
    ["coast","harbor","M655 426 C610 508 681 560 634 635"],
  ],
  icon(kind) {
    const icons = {
      house:'<path fill="#FFF2D4" d="M-18 0H18V22H-18Z"/><path fill="#DB987C" d="M-23 0L0-20 23 0Z"/><path fill="#88B2B9" d="M-11 6H-3V14H-11ZM5 7H13V22H5Z"/>',
      city:'<path fill="#8EA9BB" d="M-22 20V-10H-8V20M-5 20V-24H12V20M16 20V-3H26V20"/><path stroke="#F7E8B0" stroke-width="4" d="M-16-3V12M2-17V-9M2-3V5M2 11V16M20 3V13"/>',
      train:'<rect x="-20" y="-22" width="40" height="42" rx="10" fill="#F6F3DC"/><path stroke="#649F91" stroke-width="6" d="M-19 8H19"/><rect x="-13" y="-13" width="26" height="15" rx="3" fill="#8ABACB"/><path d="M-12 20L-18 26M12 20L18 26"/><circle cx="-12" cy="13" r="2"/><circle cx="12" cy="13" r="2"/>',
      plane:'<path fill="#FFFBEF" d="M-3-26Q0-32 3-26L5-7 27 8V13L5 6 4 21 12 27V30L0 27-12 30V27L-4 21-5 6-27 13V8L-5-7Z"/>',
      boat:'<path fill="#EFF4E3" d="M-24 8H25L15 24H-14Z"/><path fill="#D69B7E" d="M-13 8V-2H14V8Z"/><path fill="#A2C8D8" d="M-2-5V-26L20-5Z"/><path d="M-2-25V8M-27 28Q-18 22-9 28T9 28T27 28" fill="none"/>',
      palm:'<path d="M-6 25Q4 3 0-13" stroke="#B79565" stroke-width="7" fill="none"/><path d="M0-13Q-15-29-26-6Q-8-15 0-13Q16-29 28-8Q12-15 0-13Q-9-7-18 6Q-20-9 0-13Q15-9 20 8Q25-9 0-13" fill="#79AE87"/>',
      mill:'<path fill="#F5E5C2" d="M-13 26L-8-12H8L13 26Z"/><path fill="#CF9F83" d="M-15-12L0-25 15-12Z"/><path d="M0-10L-24-24M0-10L24 4M0-10L-14 14M0-10L14-34" stroke="#FAF7E2" stroke-width="7"/><circle cy="-10" r="4" fill="#B7896C"/>',
      tree:'<path d="M0 2V27" stroke="#956C54" stroke-width="7"/><path fill="#6A9E76" d="M-24 13L-12-6H-20L-7-21H-12L0-36 12-21H7L20-6H12L24 13Z"/>',
      crystal:'<path fill="#B099C8" d="M-21 9L-12-9-3 5-1 22ZM-2 22L-8-17 4-29 15-12 8 22ZM10 22L15-3 27 0 24 14Z"/><path d="M4-29L3 18M15-3L18 16" stroke="#F1E5FA"/>',
    };
    return `<g stroke="#1F1D1B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icons[kind] || icons.house}</g>`;
  },
  svg() {
    const uid=`atlas-art-${++this.serial}`;
    const shore="M123 168Q60 133 117 84Q180 32 263 65Q312 24 362 66Q417 30 453 78Q518 51 560 88Q626 55 673 118Q740 130 714 221Q761 277 704 319Q777 356 742 413Q788 450 734 491Q714 522 740 565Q752 634 700 666Q682 720 617 706Q570 767 506 745Q442 814 361 769Q325 823 241 770Q153 788 135 722Q78 703 49 655Q59 600 51 536Q57 490 40 470Q29 413 60 383Q36 340 94 296Q47 278 91 252Q116 217 123 168Z";
    const path=(d,fill,stroke="none",w=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    let h=`<svg class="atlas-svg" viewBox="0 0 800 850" role="group" aria-label="ぽかぽかの せかいの ちず" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${uid}-land"><path d="${shore}"/></clipPath><pattern id="${uid}-sea" width="65" height="60" patternUnits="userSpaceOnUse"><path d="M6 20q7 5 14 0m20 26q7 5 14 0" fill="none" stroke="#D4EEF0" stroke-width="2" opacity=".25"/></pattern></defs>`;
    h+='<rect x="-800" y="-850" width="2400" height="2550" fill="#74ACB8"/>';
    h+=`<rect width="800" height="850" fill="url(#${uid}-sea)"/>`;
    h+=path(shore,"#B6D0BC","#97C6C8",30)+path(shore,"#CCD8A3","#EFE1BA",12);
    h+=`<g clip-path="url(#${uid}-land)">`;
    // 起伏を色と等高線で重ねる。色の境目はエリアの境界ではない。
    h+=path("M60 187Q30 87 204 36Q343 5 384 107L331 219 236 192 179 225Z","#C4B68C");
    h+=path("M88 145Q107 63 234 82T336 136L285 168 224 144 153 176Z","#ACAA84");
    h+=path("M95 342Q176 312 301 366Q345 438 284 524L232 583 85 563 33 424Z","#CADC9D");
    h+=path("M72 508Q131 472 169 538Q209 480 286 532L310 652 239 720 101 696 38 618Z","#89B28A");
    h+=path("M134 550Q203 513 249 568L267 635 220 672 104 643Z","#75A384");
    h+=path("M239 699Q255 614 331 610Q390 577 435 660L499 740 418 812 257 781Z","#C7B18D");
    h+=path("M285 693Q286 628 353 634Q406 617 419 690L447 739 365 768 299 742Z","#AB9D82");
    h+=path("M532 274Q578 272 650 304L761 335 778 582 734 700 671 685Q709 598 677 536Q718 463 699 422Q735 356 659 340Z","#EED7A3");
    h+=path("M347 96Q400 66 463 110L529 172 475 246 378 220Z","#C1D0AE");
    h+=path("M375 282Q451 260 526 328L557 393 490 438 379 393Z","#D8D4B4");
    h+=path("M552 124L670 143 695 220 634 270 551 236Z","#D6D8BE");
    for(const [x,y,rx,ry] of [[218,119,92,37],[244,113,62,22],[349,690,73,47],[351,680,49,27],[268,391,41,24],[564,538,48,26],[506,108,29,18]]) {
      h+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#978B67" stroke-width="2" opacity=".4"/>`;
    }
    // 一定数の草・岩・林。拡大しても模様が変わらない。
    for(let i=0;i<310;i++) {
      const x=45+U.hash(i,1,72)*700,y=70+U.hash(i,2,72)*700;
      h+=path(`M${x.toFixed(1)} ${y.toFixed(1)}q4-5 9 0m-4 3 7-1`,"none",i%3?"#92B581":"#E3DCA5",2.4);
    }
    for(let i=0;i<92;i++) {
      const x=78+U.hash(i,3,25)*216,y=500+U.hash(i,4,25)*193;
      h+=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><ellipse cy="7" rx="9" ry="4" fill="#628776" opacity=".35"/><path d="M0 0v9" stroke="#806D52" stroke-width="3"/><path d="M-9 3L-4-5H-7L0-15 7-5H4L9 3Z" fill="${i%2?"#5F9973":"#A0BF89"}" stroke="#648C6F" stroke-width="1"/></g>`;
    }
    for(const [x,y,s] of [[135,127,1],[181,100,.8],[244,130,1.2],[293,107,.7],[306,689,.9],[350,654,1.3],[399,685,1]]) {
      h+=`<g transform="translate(${x} ${y}) scale(${s})">${path("M-26 20L-7-16 2-8 10-29 36 20Z","#BCA67F","#8F8C70",2)}${path("M-7-16L2-8 10-29 15-16 8-18 3 0Z","#E9DEBC")}${path("M10-29L14 9 36 20Z","#9F9A7C")}</g>`;
    }
    // 川・湖。道と交差する位置に橋を置く。
    const river="M337 83Q365 173 347 221Q333 275 367 309Q402 362 365 425Q348 472 419 500Q499 524 488 585Q470 653 544 754";
    h+=path(river,"none","#EDF0C9",19)+path(river,"none","#80B8C4",13);
    h+=path("M376 495Q428 460 476 491Q521 500 511 550Q494 579 455 567Q428 590 395 559Q368 544 376 495Z","#80B8C4","#EAE8BF",5);
    h+=path("M406 501Q441 482 480 506M409 548Q449 568 486 547","none","#B3D6D5",2);
    // 細い白線はエリアの境界。
    for(const d of ["M103 212Q204 214 291 215T385 228Q403 234 412 273", "M354 68Q343 197 412 273Q510 264 551 285T709 308", "M550 91Q523 173 551 285", "M72 358Q176 334 276 346T376 351", "M376 351Q380 416 331 507Q309 553 302 609", "M547 284Q520 362 556 417T591 499", "M53 528Q156 475 249 519Q291 520 331 507", "M591 499Q654 510 731 496", "M131 722Q239 710 302 609Q398 602 491 624T719 655"]) h+=path(d,"none","#FFF9E4",3);
    // 小さい街区・家・畑。メインの道とは別の細い生活路。
    for(const [cx,cy,n,col] of [[250,267,21,"#DCAC90"],[443,159,25,"#A8B7BC"],[450,358,23,"#B8B4A4"],[633,619,12,"#C8B6A0"]]) {
      h+=path(`M${cx-56} ${cy-43}l109 37m-118 19 117 24m-89-94-27 99m82-82-30 103`,"none","#F4EDCD",6);
      for(let i=0;i<n;i++) {
        const x=cx-55+U.hash(i,cx,14)*109,y=cy-42+U.hash(i,cy,24)*84;
        h+=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(-16)"><rect width="${i%3+8}" height="${i%4+10}" rx="1" fill="${col}" stroke="#8D9688" stroke-width="1"/><path d="M0 2h8" stroke="#FFF2D6" stroke-width="2"/></g>`;
      }
    }
    for(const [x,y] of [[143,369],[178,405],[278,537]]) h+=`<g transform="translate(${x} ${y}) rotate(15)"><rect width="34" height="25" rx="3" fill="#B4BE83"/><path d="M5 3V22M13 3V22M21 3V22M29 3V22" stroke="#E2D7A0" stroke-width="3"/></g>`;
    for(const [, ,d] of this.roads) h+=path(d,"none","#B2A27E",11)+path(d,"none","#FFF0C8",7);
    h+=path("M348 300L379 327","none","#987D62",19)+path("M348 300L379 327","none","#EAD2AD",12);
    h+=`<g transform="translate(618 173) rotate(16)"><rect x="-48" y="-12" width="96" height="24" rx="4" fill="#8D9D9D"/><path d="M-40 0H40" stroke="#F5F0D9" stroke-width="2" stroke-dasharray="8 5"/><path d="M-39-8V8M39-8V8" stroke="#F5F0D9" stroke-width="3"/></g>`;
    h+=path("M678 596H718V604H678M680 626H725V634H680M705 596V650","none","#AA997C",7);
    h+='</g>';
    h+=path(shore,"none","#FFF6DC",3);
    // 沖の小島・航路。実際の交通のみを描く。
    h+=path("M744 702q19-20 27 5l-8 21-21-5Z","#C2D4A0","#E6D9AA",5)+path("M57 209q-19-9-20 9l14 9Z","#B9C69A","#DFD7B0",4);
    h+='<g class="atlas-transit" fill="none" stroke-linecap="round">';
    h+='<path d="M252 265C304 236 375 319 450 358C484 283 431 245 443 159Q537 155 626 206" stroke="#FFF9EA" stroke-width="7"/><path d="M252 265C304 236 375 319 450 358C484 283 431 245 443 159Q537 155 626 206" stroke="#5D797C" stroke-width="4" stroke-dasharray="9 6"/>';
    h+='<path d="M655 426C768 467 770 591 634 635" stroke="#F4F7DF" stroke-width="7"/><path d="M655 426C768 467 770 591 634 635" stroke="#477F9B" stroke-width="4" stroke-dasharray="3 9"/>';
    h+='<path d="M626 206C805 286 822 539 634 635" stroke="#FAF2F8" stroke-width="6"/><path d="M626 206C805 286 822 539 634 635" stroke="#9578A0" stroke-width="3" stroke-dasharray="12 8"/></g>';
    h+='<g fill="#E9F4EF" font-size="18" font-weight="700" letter-spacing="3"><text x="36" y="808">ぽかぽかの せかい</text><text x="537" y="805" font-size="16">しおかぜの うみ</text></g>';
    h+='<g transform="translate(744 71)" fill="#F4ECD8" stroke="#EAF1DB" stroke-width="2"><path d="M0-23L-10 12 0 6 10 12Z"/><path d="M0 6V25M-17 0H17"/><text x="0" y="-32" text-anchor="middle" font-size="17" stroke="none">きた</text></g>';
    // 地点を選ぶための透明な108px四方（375px端末でも44px以上）。
    for(const [id,p] of Object.entries(this.places)) {
      h+=`<g class="atlas-marker" data-area="${id}" role="button" tabindex="0" aria-label="${typeof MAP_DEFS!=="undefined"?MAP_DEFS[id].name:p.lines.join("")}" aria-pressed="false" transform="translate(${p.x} ${p.y})"><rect class="atlas-hit" x="-54" y="-54" width="108" height="108" fill="transparent"/><circle class="atlas-selection" r="40" fill="none" stroke="#FFF3A3" stroke-width="6" visibility="hidden"/><circle cy="3" r="30" fill="#476D66" opacity=".28"/><circle class="atlas-pin" r="30" fill="#FFF6DE" stroke="#606F60" stroke-width="3"/><g transform="scale(.72)">${this.icon(p.kind)}</g>`;
      h+=`<g class="atlas-here" visibility="hidden"><path d="M-34-37H34Q40-37 40-43V-61Q40-67 34-67H-34Q-40-67-40-61V-43Q-40-37-34-37M-8-37L0-29 8-37" fill="#FBE19D" stroke="#745C41" stroke-width="2"/><text y="-47" text-anchor="middle" font-size="16" font-weight="800" fill="#463E30">いま ここ</text></g>`;
      h+=`<text class="atlas-place-label" text-anchor="middle" font-size="24" font-weight="800" fill="#334D41" stroke="#FFF9E6" stroke-width="6" paint-order="stroke" stroke-linejoin="round">${p.lines.map((line,i)=>`<tspan x="0" y="${52+i*25}"${i?' font-size="19"':""}>${line}</tspan>`).join("")}</text></g>`;
    }
    return h+'</svg>';
  },
};
