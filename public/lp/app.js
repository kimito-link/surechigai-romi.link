  (function(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement, body=document.body;

    /* reveal + 間のししおどし(音) */
    var obs = document.querySelectorAll('.reveal, .ma[data-koton]');
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in');
        if(e.target.hasAttribute('data-koton') && !e.target.dataset.rang){ e.target.dataset.rang='1'; setTimeout(function(){konk();}, 850); } } }); }, { threshold:.2 });
      obs.forEach(function(e){ io.observe(e); });
    } else { obs.forEach(function(e){ e.classList.add('in'); }); }

    function hex(h){ h=h.replace('#',''); return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)]; }
    function mix(a,b,t){ return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')'; }
    function lerp(a,b,t){ return a+(b-a)*t; }

    var KF = [
      { at:0.00, skyT:'#c2ccd3', skyB:'#dfe2de', tint:[150,170,185], tintA:.16, fuji:.05, clear:0,  kasumi:1.0, bliz:1.0, lx:82, lsp:48, lop:.30, lc:[214,228,240] },
      /* 雪国（トンネルを抜けた先）：吹雪が和らぎ、温泉の猿が見える静かな雪景色 */
      { at:0.14, skyT:'#cdd6dd', skyB:'#e4e2da', tint:[150,168,182], tintA:.12, fuji:.10, clear:.2, kasumi:.8, bliz:0.28, lx:78, lsp:54, lop:.34, lc:[224,234,242] },
      { at:0.30, skyT:'#e6e0e8', skyB:'#f0e8da', tint:[220,160,185], tintA:.07, fuji:.18, clear:.5, kasumi:.5, bliz:0.0, lx:62, lsp:70, lop:.42, lc:[255,244,236] },
      { at:0.58, skyT:'#d6e7ea', skyB:'#efe7d6', tint:[70,120,90],   tintA:.06, fuji:.26, clear:1,  kasumi:.15, bliz:0.0, lx:50, lsp:42, lop:.62, lc:[255,252,232] },
      { at:0.82, skyT:'#ecdfce', skyB:'#e8dcc6', tint:[168,87,47],   tintA:.09, fuji:.30, clear:1,  kasumi:.06, bliz:0.0, lx:24, lsp:64, lop:.5,  lc:[255,206,150] },
      { at:1.00, skyT:'#dfeaf0', skyB:'#ece1cd', tint:[120,150,170], tintA:.05, fuji:.40, clear:1,  kasumi:0.0, bliz:0.0, lx:34, lsp:72, lop:.38, lc:[255,234,206] }
    ];
    KF.forEach(function(k){ k._t=hex(k.skyT); k._b=hex(k.skyB); });
    function seg(p){ for(var i=0;i<KF.length-1;i++){ if(p<=KF[i+1].at){ var a=KF[i],b=KF[i+1],t=(p-a.at)/(b.at-a.at||1); return {a:a,b:b,t:Math.max(0,Math.min(1,t))}; } } return {a:KF[4],b:KF[4],t:0}; }

    var layers={ snow:document.getElementById('L-snow'), sakura:document.getElementById('L-sakura'), momiji:document.getElementById('L-momiji') }, built={};
    function build(id, kind){ if(reduce||built[id]) return; built[id]=true; var host=layers[id], n=(kind==='snow'?70:54);
      for(var i=0;i<n;i++){ var el=document.createElement('div'); el.className='flake '+kind; var dur=(kind==='snow'?7:9)+(i%9); var sc=0.6+((i*29)%100)/100*1.3;
        el.style.left=((i*37)%100)+'%'; el.style.setProperty('--dx',(((i*53)%280)-140)+'px'); el.style.setProperty('--rot',(kind==='snow'?(180+(i%3)*180):(540+(i%3)*360))+'deg');
        el.style.transform='scale('+sc.toFixed(2)+')'; el.style.opacity=(0.55+((i*17)%45)/100).toFixed(2); el.style.animation='drift '+dur+'s linear '+(-(i*0.7))+'s infinite'; host.appendChild(el); } }

    var els={ semi:'semi',furin:'furin',suika:'suika',kawa:'kawa',tsuri:'tsuri',uo:'uo',boushi:'boushi',
      yataiA:'yataiA',yataiB:'yataiB',hanabi:'hanabi',senko:'senko',kagerou:'kagerou',yakiimo:'yakiimo',
      tanbo:'tanbo',ayu:'ayu',suikawari:'suikawari',mato:'mato',nukegara:'nukegara',
      yuki:'yukimichi',onsen:'onsen',hikari:'hikari' };
    Object.keys(els).forEach(function(k){ els[k]=document.getElementById(els[k]); });
    var dots=[].slice.call(document.querySelectorAll('.kisetsu-bar .dot'));
    function win(p,c,h){ return Math.max(0,1-Math.abs(p-c)/h); }

    /* 物語化により背景の季節は「いま見えている章の data-scene」で決める。
       スクロール率pは空グラデの連続補間にだけ薄く使い、季節の出し分けはsceneで離散的に。
       seasonW[...] を IO が更新し、render() はそれを滑らかに反映する。 */
    var seasonW={ winter:1, spring:0, summer:0, autumn:0, clear:0 };  /* 現在の各季節の重み(0..1) */
    var seasonTarget='winter';                                       /* IOが決める目標季節 */
    var KFByScene={ winter:0, spring:1, summer:2, autumn:3, clear:4 };/* KF添字（seg補間の代わりに直接指定） */

    function setSeasonTarget(scene){
      seasonTarget=scene;
      /* dot（四季インジケータ）も季節で更新 */
      var order={winter:0,spring:1,summer:2,autumn:3,clear:3};
      var si=order[scene]!=null?order[scene]:0;
      dots.forEach(function(d,i){ d.classList.toggle('on', i===si); });
    }

    function render(p){
      /* 各季節の重みを目標へ滑らかに寄せる（フレームごとに緩和） */
      ['winter','spring','summer','autumn','clear'].forEach(function(k){
        var goal=(k===seasonTarget)?1:0;
        seasonW[k]+=(goal-seasonW[k])*0.08;
        if(seasonW[k]<0.001) seasonW[k]=0;
      });
      /* 空・光：目標季節のKFをそのまま使い、pでごく薄く前後フレームへ補間（質感ゆらぎ） */
      var k=KF[KFByScene[seasonTarget]] || KF[0];
      var kPrev=KF[Math.max(0,KFByScene[seasonTarget]-1)] || k;
      var tt=0.12; /* 前KFへの微かな寄せ（硬さを抜く） */
      root.style.setProperty('--sky-top', mix(k._t,kPrev._t,tt));
      root.style.setProperty('--sky-bottom', mix(k._b,kPrev._b,tt));
      root.style.setProperty('--season-tint','rgba('+k.tint[0]+','+k.tint[1]+','+k.tint[2]+','+k.tintA+')');
      root.style.setProperty('--fuji-opacity', k.fuji.toFixed(3));
      root.style.setProperty('--fuji-clear', k.clear.toFixed(3));
      root.style.setProperty('--kasumi', k.kasumi.toFixed(3));
      root.style.setProperty('--blizzard', k.bliz.toFixed(3));
      root.style.setProperty('--light-x', k.lx.toFixed(1)+'%');
      root.style.setProperty('--light-spread', k.lsp.toFixed(1)+'%');
      root.style.setProperty('--light-op', k.lop.toFixed(3));
      root.style.setProperty('--light-color','rgba('+k.lc[0]+','+k.lc[1]+','+k.lc[2]+',.9)');

      var wSnow=seasonW.winter, wSakura=seasonW.spring, wMomiji=seasonW.autumn, wNatsu=seasonW.summer, wYuki=seasonW.winter;
      if(wSnow>0.05) build('snow','snow'); if(wSakura>0.05) build('sakura','sakura'); if(wMomiji>0.05) build('momiji','momiji');
      layers.snow.style.opacity=wSnow; layers.sakura.style.opacity=wSakura; layers.momiji.style.opacity=wMomiji;
      els.kagerou.style.opacity=wNatsu*0.8;
      /* 夏：昼物も夜祭り物も、夏である限り両方しっかり出す。夜章では夜物を強調しつつ昼物も最低限残す。 */
      var sub=body.getAttribute('data-sub'); var night=(sub==='night');
      /* ===== 写真を主役にするため、季節ごとにベタ表示していたSVG装飾群は基本は隠す =====
         常時表示すると画面がゴチャつき写真の邪魔になるので非表示。ただし data-fx で「その文の演出」が
         発火している要素(fxShow)は、その間だけ表示して動かす（魚跳ね・鹿威し・線香花火など）。 */
      [els.semi,els.furin,els.suika,els.kawa,els.tsuri,els.tanbo,els.ayu,els.suikawari,els.mato,
       els.nukegara,els.yataiA,els.yataiB,els.senko,els.hanabi,els.yakiimo,els.onsen].forEach(function(e){
         if(!e) return; e.style.opacity = (e.dataset.fxShow==='1') ? 1 : 0;
       });
      els.yuki.style.opacity=0;
    }
    /* 演出のあいだだけ、その要素を表示する（render が尊重する）。durミリ秒後に隠す。 */
    function showFxEl(el, dur){ if(!el) return; el.dataset.fxShow='1';
      clearTimeout(el._fxT); el._fxT=setTimeout(function(){ el.dataset.fxShow=''; }, dur||4000); }
    /* ===== サウンドノベル：スクロール位置で「一文ずつ送る」 =====
       IntersectionObserver は環境によって発火が不安定なため、毎フレーム自前で位置を計算する確実な方式にする。
       ・各章(.story)が画面に入ったら lead-in（見出し・暗幕・罫を出す）＋ data-scene 適用＋一度きりトリガー
       ・各文(.ph)は、その中心が画面中央に近いほど濃く。中央を過ぎて上へ抜けたら薄く残す（gone）。 */
    var storyEls=[].slice.call(document.querySelectorAll('.story'));
    var sceneEls=[].slice.call(document.querySelectorAll('[data-scene]'));
    var phs=[].slice.call(document.querySelectorAll('.story .ph'));
    var mizuEl=document.querySelector('[data-mizu]'), mizuOn=false;  /* 結章の逆さ月・水面のトリガー文と状態 */
    var sasoEls=[].slice.call(document.querySelectorAll('.story .saso'));
    var activeScene=null;

    function updateNarrative(){
      var vh=window.innerHeight, mid=vh*0.5;

      /* いま画面中央にいちばん近い [data-scene] 要素を「現在の季節」にする */
      var best=null, bestDist=1e9;
      sceneEls.forEach(function(e){ var r=e.getBoundingClientRect();
        if(r.bottom>0 && r.top<vh){ var c=(r.top+r.bottom)/2, d=Math.abs(c-mid); if(d<bestDist){ bestDist=d; best=e; } }
      });
      var curNight=false;
      if(best){ var scene=best.getAttribute('data-scene');
        curNight = best.classList.contains('night') || best.getAttribute('data-sub')==='night';
        if(scene!==activeScene){ activeScene=scene;
          body.setAttribute('data-scene', scene);
          var sub=best.getAttribute('data-sub')||'day'; body.setAttribute('data-sub', sub);
          setSeasonTarget(scene); manageAmbient(scene, sub);
        }
      }
      /* トリガー（章ごとの一度きり演出）は、その章の「冒頭」が画面に入ったら発火。
         章は数画面ぶん縦に長いので“中央”を待つと演出が遅れる。章の上端が画面中央より上に来た時点
         （＝最初の文を読み始めるあたり）で鳴らす。best非依存の全章走査で取りこぼしも防ぐ。 */
      sceneEls.forEach(function(e){ var tg=e.getAttribute('data-trigger'); if(!tg||e.dataset.fired) return;
        var r=e.getBoundingClientRect();
        if(r.top<vh*0.55 && r.bottom>vh*0.3){ e.dataset.fired='1'; fireTrigger(tg); }
      });

      /* 章の見出し・暗幕・罫：章が画面に少しでも入ったら lead-in */
      storyEls.forEach(function(s){ var r=s.getBoundingClientRect();
        if(r.top<vh*0.85 && r.bottom>vh*0.15) s.classList.add('lead-in');
      });
      sasoEls.forEach(function(s){ var r=s.getBoundingClientRect(); if(r.top<vh*0.8 && r.bottom>0) s.classList.add('lit'); });

      /* 文：中心が画面中央±28%に入っていれば lit。中心が中央より上に抜けたら gone（薄く残る）。
         さらに「文ごとの情景」をここで適用する＝サウンドノベルの肝：
         - data-img: その文の情景写真へ背景を切替（最後に中央を通過した指定を採用）
         - data-fx : その文が中央に来た瞬間に一度だけ、動き＋効果音を発火 */
      var bandTop=vh*0.22, bandBottom=vh*0.78;
      var imgPick=null, imgPickDist=1e9, specialActive=null;
      phs.forEach(function(p){ var r=p.getBoundingClientRect(); var c=(r.top+r.bottom)/2;
        var inBand = (c>=bandTop && c<=bandBottom);
        if(inBand){ p.classList.add('lit'); p.classList.remove('gone'); }
        else if(c<bandTop){ if(p.classList.contains('lit')) p.classList.add('gone'); }

        /* 背景画像：中央(mid)に最も近い data-img 文を選ぶ。
           「中央より少しでも上に来た（読み始めた）」文まで候補にして、景色が文に先んじて出るように。 */
        var di=p.getAttribute('data-img');
        if(di && c<=bandBottom){ var d=Math.abs(c-mid); if(d<imgPickDist){ imgPickDist=d; imgPick=di; } }

        /* 特別シーン（data-special, 例: 麦わら帽子）：その文が画面の中央寄りに来たら専用演出を出す */
        var sp=p.getAttribute('data-special');
        if(sp && c<vh*0.9 && r.bottom>vh*0.1) specialActive=sp;

        /* 演出（data-fx）：中央バンドに入った瞬間に一度だけ。離れたらフラグを戻し、再訪で再発火可能に。 */
        var fx=p.getAttribute('data-fx');
        if(fx){ if(inBand){ if(!p.dataset.fxOn){ p.dataset.fxOn='1'; playFx(fx); } } else { if(c>bandBottom) p.dataset.fxOn=''; } }
      });
      /* 専用シーン on/off（麦わら帽子・鹿威し）。アクティブな間は通常写真ステージを消す */
      var hatOn = (specialActive==='hat'), sozuOn = (specialActive==='sozu');
      body.classList.toggle('hat-active', hatOn);
      body.classList.toggle('sozu-active', sozuOn);
      if(hatOn||sozuOn){ setPhoto(null, curNight); }
      else {
        /* 中央付近に data-img 文が無いとき(章の見出しだけ見えている等)は、
           前の章の写真を残さず、現在の章(best)の data-bg を背景にする。 */
        var fallbackBg = (best && best.getAttribute('data-bg')) || null;
        var pick = (imgPick!==null) ? imgPick : fallbackBg;
        if(pick!==null){ setPhoto(pick, curNight); }
      }

      /* 触れる水面（結章の逆さ月）: data-mizu 文が画面に十分入ったら Canvas を起動、
         外れたら停止。mizu は末尾で定義されるが DOMContentLoaded 後に代入済みなのでガードのみ。 */
      if(mizuEl){ var mr=mizuEl.getBoundingClientRect();
        var visible = (mr.top < vh*0.85 && mr.bottom > vh*0.15);
        if(visible && !mizuOn){ mizuOn=true; if(mizu&&mizu.start) mizu.start(); }
        else if(!visible && mizuOn){ mizuOn=false; if(mizu&&mizu.stop) mizu.stop(); }
      }
    }

    /* data-fx の名前 → 既存の演出関数/SVGアニメ＋効果音。
       SVGで見せる演出は showFxEl でその要素を一時表示してから動かす（写真の上に重ねる）。 */
    function playFx(name){
      switch(name){
        case 'whistle': whistle(); break;
        case 'clack': startClack(2600); break;
        case 'walk': showFxEl(els.yuki,7000); walkSnow(); break;   /* 雪道の足跡 */
        case 'footstep': showFxEl(els.yuki,7000); footstep(); break;
        case 'bird': birdsong(); break;
        case 'rikisha': { var r=document.getElementById('jinrikisha'); if(r){ r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); } break; }
        case 'konk': konk(); break;
        case 'semi': showFxEl(els.semi,6000); if(els.semi) els.semi.classList.add('show'); break;
        case 'fish': jumpFish(); playSample('river',0.45); playSample('fishSplash',0.7); break;   /* 川の写真(data-img=kawa)の上で魚SVGが跳ねる＋せせらぎ＋水面の跳ね音 */
        case 'furin': showFxEl(els.furin,6000); if(els.furin) els.furin.classList.add('show'); if(!playSample('furin',0.6)) chime(); break;
        case 'nukegara': showFxEl(els.nukegara,6000); if(els.nukegara) els.nukegara.classList.add('show'); break;
        case 'boom': showFxEl(els.hanabi,7000); if(!playSample('hanabi',0.7)) boom(); break;
        case 'senko': { showFxEl(els.senko,6000); var s=document.getElementById('senko'); if(s){ s.classList.add('show'); s.classList.remove('show'); void s.offsetWidth; s.classList.add('show'); } break; }
        case 'boushi': { var b=document.getElementById('boushi'); if(b){ showFxEl(b,4000); b.classList.remove('fly'); void b.offsetWidth; b.classList.add('fly'); } break; }
        case 'yakiimo': showFxEl(els.yakiimo,6000); break;
        case 'nagareboshi': shootStar(); break;
      }
    }

    /* 季節重みのアニメ＋語りの送りを常時回す */
    function tick(){ render(0); updateNarrative(); requestAnimationFrame(tick); }

    /* 一度きりの演出トリガー（章の data-trigger に対応） */
    function fireTrigger(tg){
      /* 一章：汽笛が鳴り、トンネルを抜ける（汽笛＋ガタゴト＋光の拡大） */
      if(tg==='kisha'){ var sc=document.getElementById('kishaScene');
        whistle(); startClack(5200);  /* 汽笛「ポオォ」＋ガタゴトを数秒走らせる */
        if(sc){ sc.classList.add('run');
          if(!reduce){ var t0=performance.now(), dur=4200;
            (function step(now){ var k=Math.min(1,(now-t0)/dur); sc.style.setProperty('--tunnel', k.toFixed(3));
              if(k<1){ requestAnimationFrame(step); } else { setTimeout(function(){ sc.classList.remove('run'); sc.style.opacity='0'; sc.style.setProperty('--tunnel','0'); }, 700); }
            })(t0); }
          else { sc.style.setProperty('--tunnel','1'); setTimeout(function(){ sc.classList.remove('run'); sc.style.opacity='0'; }, 800); }
        }
      }
      /* 二章：雪道をザッ・ザッと歩き、足跡を一つずつ刻む */
      if(tg==='yukimichi'){ setTimeout(walkSnow, 600); }
      /* 三章：人力車がからから、弥次喜多が少し遅れて街道をてくてく */
      if(tg==='rikisha'){ var r=document.getElementById('jinrikisha'); if(r){ r.classList.remove('go'); void r.offsetWidth; r.classList.add('go'); }
        var yk=document.getElementById('yajikita'); if(yk){ setTimeout(function(){ yk.classList.remove('go'); void yk.offsetWidth; yk.classList.add('go'); }, 2600); } }
      /* 五章：魚が跳ね、麦わら帽子が飛ぶ */
      if(tg==='natsu-hiru'){ jumpFish(); var b=document.getElementById('boushi'); if(b){ setTimeout(function(){ b.classList.remove('fly'); void b.offsetWidth; b.classList.add('fly'); }, 1400); } }
      /* 六章：花火が打ち上がる */
      if(tg==='natsu-yoru'){ boom(); }
      /* 八章：秋（焼き芋の湯気などは固定背景で自動） */
    }
    /* 四章：鹿威しが画面に入ったら、少し溜めて「コトン」。以降スクロール中も周期的に。 */
    (function(){ var stage=document.getElementById('shishiStage'); if(!stage||!('IntersectionObserver' in window)) return;
      var ring=null;
      var sObs=new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.isIntersecting){ if(!stage.dataset.rang){ stage.dataset.rang='1'; setTimeout(function(){ konk(); }, 1200); }
          if(!ring) ring=setInterval(function(){ if(body.getAttribute('data-scene')==='spring') konk(); }, 6000); }
        else { if(ring){ clearInterval(ring); ring=null; } }
      }); }, { threshold:0.4 });
      sObs.observe(stage);
    })();
    /* 雪道を「ザッ・ザッ・ザッ」と歩き、足跡を一つずつ刻む（消えずに残る＝一期一会を刻む） */
    function walkSnow(){
      var y=document.getElementById('yukimichi'); if(!y) return;
      var atos=[].slice.call(y.querySelectorAll('.ato')); if(!atos.length) return;
      atos.forEach(function(a){ a.classList.remove('step'); a.style.opacity='0'; });  /* 一旦リセット */
      atos.forEach(function(a,i){ setTimeout(function(){
        a.classList.add('step'); footstep();   /* 踏みしめる音「ザッ」 */
      }, 650 + i*620); });   /* 約0.62秒間隔のリズム＝ザッ・ザッ・ザッ */
    }
    function jumpFish(){ if(reduce) return; var u=document.getElementById('uo'); if(!u) return; u.classList.remove('jump'); void u.offsetWidth; u.classList.add('jump'); splash(); setTimeout(function(){ if(body.getAttribute('data-scene')==='summer'){ u.classList.remove('jump'); void u.offsetWidth; u.classList.add('jump'); splash(); } }, 4500); }
    function boom(){ var h=document.getElementById('hanabi'); if(!h||reduce) return;
      function fire(){ if(body.getAttribute('data-scene')!=='summer') return; h.innerHTML=''; var cx=20+Math.random()*60, cy=15+Math.random()*25, cols=['#e08b4c','#d15d88','#b08a3e','#e6dcc6'], col=cols[(Math.random()*cols.length)|0];
        for(var i=0;i<22;i++){ var a=i/22*Math.PI*2, r=60+Math.random()*30, b=document.createElement('div'); b.className='burst'; b.style.left=cx+'%'; b.style.top=cy+'%'; b.style.background=col; b.style.setProperty('--hx',Math.cos(a)*r+'px'); b.style.setProperty('--hy',Math.sin(a)*r+'px'); h.appendChild(b); }
        h.classList.remove('boom'); void h.offsetWidth; h.classList.add('boom'); boomSound(); }
      fire(); if(hanabiTimer) clearInterval(hanabiTimer); hanabiTimer=setInterval(fire, 5000);
    }
    var hanabiTimer=null;

    /* 実写背景ステージ：画面固定の2枚(pfA/pfB)を使い、章ごとに写真をクロスフェード差し替えする。 */
    var PHOTOS={ yukiguni:'img/yukiguni.png', kisha:'img/kisha.png', yukinohara:'img/yukinohara.png',
      yukimichi:'img/yukimichi.png', ashiato:'img/ashiato.png', 'onsen-saru':'img/onsen-saru.png',
      sakura:'img/sakura.png', rikisha:'img/rikisha.png', chashitsu:'img/chashitsu.png', niwa:'img/niwa.png',
      nyudogumo:'img/nyudogumo.png', kawa:'img/kawa.png', taki:'img/taki.png',
      mugiwara:'img/mugiwara.png',
      tekiya:'img/tekiya.png', takoyaki:'img/takoyaki.png', 'matsuri-hito':'img/matsuri-hito.png',
      hanabi:'img/hanabi.png', senkohanabi:'img/senkohanabi.png',
      'futari-ashiato':'img/futari-ashiato.png', yoake:'img/yoake.png',
      momiji:'img/momiji.png', yakiimo:'img/yakiimo.png', hitosuji:'img/hitosuji.png', kiseki:'img/kiseki.png',
      hosomichi:'img/hosomichi.png', fuji:'img/fuji.png', 'fuji-yoru':'img/fuji-yoru.png', 'tsuki-mizu':'img/tsuki-mizu.png',
      /* 終盤の固有映像（足跡・道の使い回し解消） */
      'sanjunichi-michi':'img/sanjunichi-michi.png', 'kasanaru-ashiato':'img/kasanaru-ashiato.png',
      'oshi-no-michi':'img/oshi-no-michi.png', 'toki-no-surechigai':'img/toki-no-surechigai.png',
      'kienai-ashiato-aki':'img/kienai-ashiato-aki.png', 'fumidasu-ashi':'img/fumidasu-ashi.png',
      'ichigo-ashiato':'img/ichigo-ashiato.png',
      /* 結章：雪道足跡＋星空夜道（山道で統一） */
      'yuki-ashiato':'img/yuki-ashiato.png',
      'hoshizora-michi-a':'img/hoshizora-michi-a.png', 'hoshizora-michi-b':'img/hoshizora-michi-b.png',
      'hoshizora-michi-c':'img/hoshizora-michi-c.png' };
    var pfStage=document.getElementById('photoStage'), pfA=document.getElementById('pfA'), pfB=document.getElementById('pfB');
    var pfFront=pfA, pfBack=pfB, curBg=null;
    /* 先読み（チラつき防止） */
    Object.keys(PHOTOS).forEach(function(k){ var im=new Image(); im.src=PHOTOS[k]; });
    function setPhoto(bg, night){
      if(pfStage){ pfStage.classList.toggle('night', !!night); }
      if(bg===curBg) return; curBg=bg;
      if(!bg || !PHOTOS[bg]){ if(pfFront) pfFront.classList.remove('on'); if(pfBack) pfBack.classList.remove('on'); if(pfStage) pfStage.classList.remove('has-photo'); body.classList.remove('photo-active'); return; }
      if(pfStage) pfStage.classList.add('has-photo'); body.classList.add('photo-active');
      /* 裏面に次の写真を入れてフェードイン、表を裏に */
      if(pfBack){ pfBack.style.backgroundImage="url('"+PHOTOS[bg]+"')"; pfBack.classList.add('on'); }
      if(pfFront){ pfFront.classList.remove('on'); }
      var t=pfFront; pfFront=pfBack; pfBack=t;
    }

    /* 夜の章（.story.night）に、控えめなかまいたちの刃を仕込む（本文の背後でたまに一閃）。
       序章・雪道・夏夜など暗い章で、ふっと風の刃が走り「かまいたちの夜」の質感を添える。 */
    if(!reduce){
      document.querySelectorAll('.story.night').forEach(function(s){
        if(s.querySelector('.kama')) return;
        var kama=document.createElement('div'); kama.className='kama'; kama.setAttribute('aria-hidden','true');
        kama.innerHTML='<div class="ha"></div><div class="ha"></div><div class="ha"></div><div class="flash"></div>';
        s.insertBefore(kama, s.firstChild);
      });
    }

    body.setAttribute('data-scene','winter'); body.setAttribute('data-sub','day');
    setSeasonTarget('winter');
    if(reduce){
      /* モーション控えめ：アニメや送りはせず、語りを全部読める状態で静止表示 */
      render(0);
      phs.forEach(function(p){ p.classList.add('lit'); });
      storyEls.forEach(function(s){ s.classList.add('lead-in'); });
      sasoEls.forEach(function(s){ s.classList.add('lit'); });
    } else {
      tick();           /* 季節重みの緩和＋語りの送りを毎フレーム */
      updateNarrative(); /* 初回即時反映（最初の文をすぐ灯す） */
    }

    /* ===== 音（Web Audio合成・最初のふれあいで灯る） ===== */
    var AC=window.AudioContext||window.webkitAudioContext, actx=null, master=null, soundOn=false, armed=false;
    var otoBtn=document.getElementById('oto'), otoHint=document.getElementById('otoHint');
    var reverb=null, masterDry=null, masterWet=null;
    /* 残響(リバーブ)用のインパルス応答を合成：指数減衰のステレオノイズ。空間の広がりを与える。 */
    function makeImpulse(seconds, decay){
      var rate=actx.sampleRate, len=Math.floor(rate*seconds), buf=actx.createBuffer(2,len,rate);
      for(var ch=0;ch<2;ch++){ var d=buf.getChannelData(ch);
        for(var i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len, decay); } }
      return buf;
    }
    function ensureCtx(){ if(actx||!AC) return; actx=new AC();
      master=actx.createGain(); master.gain.value=0;
      /* master → (dry + reverb wet) → compressor → destination。
         コンプで音を整え、リバーブで“しょぼさ”を消して空間に溶かす。 */
      var comp=actx.createDynamicsCompressor();
      comp.threshold.value=-18; comp.knee.value=24; comp.ratio.value=3; comp.attack.value=0.005; comp.release.value=0.25;
      comp.connect(actx.destination);
      masterDry=actx.createGain(); masterDry.gain.value=0.82; master.connect(masterDry); masterDry.connect(comp);
      try{
        reverb=actx.createConvolver(); reverb.buffer=makeImpulse(2.6, 2.4);
        masterWet=actx.createGain(); masterWet.gain.value=0.34;
        master.connect(reverb); reverb.connect(masterWet); masterWet.connect(comp);
      }catch(e){ /* Convolver非対応環境はdryのみ */ }
    }
    /* iOS/Safari アンロック：ユーザー操作の同期フレーム内で「無音を1回 start」して AudioContext を解錠する。
       これをやらないと、touchstartで resume しても実際の音が鳴らない端末がある。 */
    function unlockIOS(){ if(!actx) return;
      try{
        var b=actx.createBuffer(1,1,22050), s=actx.createBufferSource(); s.buffer=b; s.connect(actx.destination); s.start(0);
        if(actx.resume) actx.resume();
      }catch(e){}
    }
    function setOn(on){ soundOn=on; if(otoBtn) otoBtn.classList.toggle('muted', !on); if(master) master.gain.setTargetAtTime(on?0.72:0, actx.currentTime, .05);
      /* HTMLAudio のループ素材は master を通らないので、ミュート時は明示的に止める */
      if(!on){ Object.keys(sampleAmb).forEach(stopSampleAmb); curBgmKey=null; }
      manageAmbient(body.getAttribute('data-scene'), body.getAttribute('data-sub')); }
    /* 効果音ファイル（本物の素材）。存在すれば合成音より優先して鳴らす。
       sounds/ に置いた mp3 を HTMLAudio でプリロードし、soundOn のときだけ再生。
       読み込み失敗(ファイル未配置)時は false を返し、各関数が合成音にフォールバックする。 */
    var SAMPLES={ whistle:'sounds/kisha-whistle.mp3', clack:'sounds/train-clack.mp3',
                  depart:'sounds/kisha-depart.mp3', idle:'sounds/kisha-idle.mp3',
                  sozu:'sounds/sozu.mp3', sozuEcho:'sounds/sozu-echo.mp3',
                  river:'sounds/river.mp3', fishSplash:'sounds/fish-splash.mp3', fishCatch:'sounds/fish-catch.mp3',
                  hanabi:'sounds/hanabi.mp3', hanabiFes:'sounds/hanabi-fes.mp3',
                  furin:'sounds/furin.mp3', furin2:'sounds/furin2.mp3',
                  /* 四季BGM（Audiostock 定額制の和風BGMを sounds/bgm/ に配置）。
                     素材が未配置なら sampleOk が false になり BGM は鳴らない（環境音・効果音はそのまま動く）。
                     差し替え運用: 同名で mp3 を置くだけ。冬→春→夏→秋→結 の順に data-scene と対応。 */
                  bgmWinter:'sounds/bgm/winter.mp3',  /* 冬・雪国：尺八の静かな旅立ち */
                  bgmSpring:'sounds/bgm/spring.mp3',  /* 春・桜：箏のあたたかな道 */
                  bgmSummer:'sounds/bgm/summer.mp3',  /* 夏・祭：太鼓と篠笛の賑わい */
                  bgmAutumn:'sounds/bgm/autumn.mp3',  /* 秋・紅葉：篠笛の細道 */
                  bgmClear:'sounds/bgm/clear.mp3' };  /* 結・夜富士：弦のフィナーレ */
    var sampleCache={}, sampleOk={};
    Object.keys(SAMPLES).forEach(function(k){
      try{ var a=new Audio(); a.preload='auto'; a.src=SAMPLES[k];
        a.addEventListener('canplaythrough', function(){ sampleOk[k]=true; }, {once:true});
        a.addEventListener('error', function(){ sampleOk[k]=false; });
        sampleCache[k]=a;
      }catch(e){ sampleOk[k]=false; }
    });
    function playSample(name, vol, loop){
      if(!soundOn) return false;
      var a=sampleCache[name]; if(!a || sampleOk[name]===false) return false;
      try{ var node = loop ? a : (a.cloneNode ? a.cloneNode() : a);
        node.loop=!!loop; node.volume=(vol==null?0.8:vol); node.currentTime=0;
        var p=node.play(); if(p&&p.catch) p.catch(function(){});
        return node;
      }catch(e){ return false; }
    }
    function tone(freq, type, dur, peak, t0){ if(!soundOn||!actx) return; var t=t0||actx.currentTime, o=actx.createOscillator(), g=actx.createGain(); o.type=type||'sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak||0.3,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05); return o; }
    function chime(){ if(!soundOn) return; var b=1200+Math.random()*500; [1,2.76,5.4].forEach(function(m,i){ tone(b*m,'sine',2.6+i*0.4,(i===0?0.4:0.14)/(i+1)); }); }
    /* 春の小鳥のさえずり：細かく上下する笛のような囀り。さえずりを2〜3節、ランダムに。 */
    function chirp(t0, base){ if(!actx) return; var o=actx.createOscillator(), g=actx.createGain(); o.type='sine';
      var t=t0; o.frequency.setValueAtTime(base,t);
      // 細かく上下（鳥のさえずり特有の節）
      for(var i=0;i<5;i++){ var tt=t+0.04+i*0.05; o.frequency.exponentialRampToValueAtTime(base*(1+(i%2?0.5:-0.18)),tt); }
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.10,t+0.02); g.gain.setValueAtTime(0.10,t+0.22); g.gain.exponentialRampToValueAtTime(0.0001,t+0.33);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+0.4); }
    function birdsong(){ if(!soundOn||!actx) return; var t=actx.currentTime;
      var n=2+((Math.random()*2)|0);
      for(var i=0;i<n;i++){ chirp(t + i*(0.35+Math.random()*0.25), 2400+Math.random()*900); }
    }
    /* 流れ星「ヒュー…」：高めから滑り落ちる細い音 */
    function shootStarSound(){ if(!soundOn||!actx) return; var t=actx.currentTime, o=actx.createOscillator(), g=actx.createGain();
      o.type='sine'; o.frequency.setValueAtTime(2200,t); o.frequency.exponentialRampToValueAtTime(700,t+1.0);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.1); g.gain.exponentialRampToValueAtTime(0.0001,t+1.1);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+1.2); }
    /* 結章の扉に流れ星を1本走らせ、音も鳴らす */
    function shootStar(){ shootStarSound();
      var nv=document.querySelector('.story[data-veil="dusk"][data-scene="clear"]') || document.querySelector('.novel');
      if(!nv||reduce) return; var s=document.createElement('span'); s.className='nagareboshi';
      s.style.left=(40+Math.random()*30)+'%'; s.style.top=(10+Math.random()*20)+'%'; nv.appendChild(s);
      void s.offsetWidth; s.classList.add('go'); setTimeout(function(){ s.remove(); },1500); }
    /* ししおどし「スコーン！」: 竹が石を打つ鋭いアタック＋木胴の共鳴＋抜ける高い余韻＋ひと反響 */
    function konk(){ if(!soundOn) return; if(playSample('sozu',0.8)) return; if(!actx) return; var t=actx.currentTime;
      // 木胴の共鳴（低め・コッ）
      var o=actx.createOscillator(), g=actx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(200,t); o.frequency.exponentialRampToValueAtTime(85,t+0.16);
      g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.5,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+0.45); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.55);
      // 抜ける高い余韻（コーン…）
      var o2=actx.createOscillator(), g2=actx.createGain(); o2.type='sine'; o2.frequency.setValueAtTime(820,t); o2.frequency.exponentialRampToValueAtTime(540,t+0.5);
      g2.gain.setValueAtTime(0.0001,t+0.005); g2.gain.linearRampToValueAtTime(0.18,t+0.02); g2.gain.exponentialRampToValueAtTime(0.0001,t+0.8); o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t+0.9);
      // 打撃のアタック（カッ）
      var n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.04,actx.sampleRate), ch=bf.getChannelData(0); for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2); n.buffer=bf;
      var nf=actx.createBiquadFilter(); nf.type='highpass'; nf.frequency.value=1200; var ng=actx.createGain(); ng.gain.value=0.28; n.connect(nf); nf.connect(ng); ng.connect(master); n.start(t);
      // 軽い反響（庭の静けさ）
      var o3=actx.createOscillator(), g3=actx.createGain(); o3.type='sine'; o3.frequency.setValueAtTime(540,t+0.18); o3.frequency.exponentialRampToValueAtTime(440,t+0.6);
      g3.gain.setValueAtTime(0.0001,t+0.18); g3.gain.linearRampToValueAtTime(0.06,t+0.2); g3.gain.exponentialRampToValueAtTime(0.0001,t+0.7); o3.connect(g3); g3.connect(master); o3.start(t+0.18); o3.stop(t+0.75); }
    /* 蒸気機関車の汽笛「ポオオォォ〜」：複数倍音の和音＋ビブラート＋蒸気のノイズ。立ち上がりは速く、尾を長く引く。 */
    function whistle(){ if(!soundOn) return; if(playSample('whistle',0.85)) return; if(!actx) return; var t=actx.currentTime, dur=2.4;
      // 汽笛は単音でなく不協和な複数管の和音。倍率を少しずらして「ボォ〜」の厚みを出す
      var partials=[ {f:330,a:0.22}, {f:392,a:0.18}, {f:494,a:0.14}, {f:660,a:0.08} ];
      // 共通のビブラート（蒸気のゆらぎ）
      var lfo=actx.createOscillator(), lg=actx.createGain(); lfo.type='sine'; lfo.frequency.value=5.2; lg.gain.value=4.5; lfo.connect(lg); lfo.start(t); lfo.stop(t+dur+0.3);
      partials.forEach(function(p){
        var o=actx.createOscillator(), g=actx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(p.f*1.02,t); o.frequency.linearRampToValueAtTime(p.f,t+0.5); o.frequency.setValueAtTime(p.f,t+dur-0.5); o.frequency.linearRampToValueAtTime(p.f*0.96,t+dur);
        lg.connect(o.frequency);  // ビブラート付与
        var lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1600;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(p.a,t+0.18); g.gain.setValueAtTime(p.a,t+dur-0.8); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
        o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05);
      });
      // 蒸気の抜ける息（フィルタしたノイズ）
      var n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*dur,actx.sampleRate), ch=bf.getChannelData(0);
      for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1); n.buffer=bf;
      var bp=actx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=0.8;
      var ng=actx.createGain(); ng.gain.setValueAtTime(0,t); ng.gain.linearRampToValueAtTime(0.05,t+0.2); ng.gain.setValueAtTime(0.05,t+dur-0.6); ng.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t); n.stop(t+dur); }

    /* 機関車のガタゴト：「ガタン・ゴトン」を一定リズムで ms 間刻む。レール継ぎ目の二連打＋蒸気のシュッ。 */
    var clackTimer=null, clackAudio=null;
    function clack(t0){ if(!soundOn||!actx) return; var t=t0||actx.currentTime;
      // 一回の継ぎ目は二連打（ガタン・ゴトン）。低い打撃音×2
      [0,0.16].forEach(function(dt,idx){
        var n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.08,actx.sampleRate), ch=bf.getChannelData(0);
        for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2.5); n.buffer=bf;
        var lp=actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=idx?170:220;
        var g=actx.createGain(); g.gain.setValueAtTime(0.0001,t+dt); g.gain.linearRampToValueAtTime(idx?0.16:0.22,t+dt+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+dt+0.18);
        n.connect(lp); lp.connect(g); g.connect(master); n.start(t+dt);
        // 低い胴鳴り
        var o=actx.createOscillator(), og=actx.createGain(); o.type='sine'; o.frequency.setValueAtTime(idx?70:90,t+dt); o.frequency.exponentialRampToValueAtTime(idx?45:55,t+dt+0.12);
        og.gain.setValueAtTime(0.0001,t+dt); og.gain.linearRampToValueAtTime(0.14,t+dt+0.006); og.gain.exponentialRampToValueAtTime(0.0001,t+dt+0.2); o.connect(og); og.connect(master); o.start(t+dt); o.stop(t+dt+0.25);
      });
      // 蒸気のシュッ（時々）
      if(Math.random()<0.5){ var sn=actx.createBufferSource(), sbf=actx.createBuffer(1,actx.sampleRate*0.18,actx.sampleRate), sc=sbf.getChannelData(0);
        for(var k=0;k<sc.length;k++) sc[k]=(Math.random()*2-1)*Math.pow(1-k/sc.length,1.5); sn.buffer=sbf;
        var hp=actx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3000; var sg=actx.createGain(); sg.gain.setValueAtTime(0.0001,t); sg.gain.linearRampToValueAtTime(0.04,t+0.02); sg.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
        sn.connect(hp); hp.connect(sg); sg.connect(master); sn.start(t); sn.stop(t+0.2); }
    }
    /* dur(ms) のあいだ、ガタゴトを周期的に鳴らす（だんだん速く→一定、で疾走感） */
    function startClack(dur){ if(!soundOn||reduce){ return; }
      /* 本物の走行音ファイルがあればループ再生し、dur 後に停止（合成音より優先）。 */
      var node=playSample('clack',0.55,true);
      if(node){ if(clackAudio){ try{clackAudio.pause();}catch(e){} } clackAudio=node;
        setTimeout(function(){ if(clackAudio===node){ try{node.pause();}catch(e){} clackAudio=null; } }, dur);
        return; }
      if(!actx) return; if(clackTimer) clearInterval(clackTimer);
      var beat=0.72, count=0, max=Math.ceil((dur/1000)/beat)+2;
      function step(){ if(!soundOn){ stopClack(); return; } clack(); count++;
        if(count>=max){ stopClack(); return; }
        // 加速：最初はゆっくり、徐々に詰める
        beat=Math.max(0.34, beat*0.94);
        clearInterval(clackTimer); clackTimer=setTimeout(step, beat*1000);
      }
      step();
    }
    function stopClack(){ if(clackTimer){ clearTimeout(clackTimer); clearInterval(clackTimer); clackTimer=null; } if(clackAudio){ try{clackAudio.pause();}catch(e){} clackAudio=null; } }
    /* 花火「ドオォン → パチパチパチ」。爆発音の後に小さな破裂が散発的に弾ける。 */
    function boomSound(){ if(!soundOn||!actx) return; var t=actx.currentTime;
      // ① ドオォン（低音の爆発＋胴鳴り）
      var n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.9,actx.sampleRate), ch=bf.getChannelData(0);
      for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2.2); n.buffer=bf;
      var f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(120,t+0.5);
      var g=actx.createGain(); g.gain.setValueAtTime(0.7,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.9);
      n.connect(f); f.connect(g); g.connect(master); n.start(t);
      // 低い余韻（ズーン）
      var o=actx.createOscillator(), og=actx.createGain(); o.type='sine'; o.frequency.setValueAtTime(80,t); o.frequency.exponentialRampToValueAtTime(40,t+0.5);
      og.gain.setValueAtTime(0.4,t); og.gain.exponentialRampToValueAtTime(0.0001,t+0.6); o.connect(og); og.connect(master); o.start(t); o.stop(t+0.7);
      // 破裂音を1つ鳴らす小関数（dt=遅延, amp=音量, freq=中心周波数）
      function crack(dt, amp, freq){
        var cn=actx.createBufferSource(), cbf=actx.createBuffer(1,actx.sampleRate*0.05,actx.sampleRate), cc=cbf.getChannelData(0);
        for(var m=0;m<cc.length;m++) cc[m]=(Math.random()*2-1)*Math.pow(1-m/cc.length,3); cn.buffer=cbf;
        var cf=actx.createBiquadFilter(); cf.type='bandpass'; cf.frequency.value=freq; cf.Q.value=3;
        var cg=actx.createGain(); cg.gain.setValueAtTime(0.0001,t+dt); cg.gain.linearRampToValueAtTime(amp,t+dt+0.004); cg.gain.exponentialRampToValueAtTime(0.0001,t+dt+0.06);
        cn.connect(cf); cf.connect(cg); cg.connect(master); cn.start(t+dt);
      }
      // ② 「パ」… 一拍おいて、大きめの破裂がひとつ
      crack(0.55, 0.26, 2200);
      // ③ 「パラパラパラ」… その直後から細かい破裂が連続して散る
      var n2=18+((Math.random()*8)|0);
      for(var k=0;k<n2;k++){
        var dt=0.62 + k*0.035 + Math.random()*0.04;   // 0.62秒あたりから次々と
        crack(dt, 0.08+Math.random()*0.1, 2800+Math.random()*3000);
      }
    }
    /* 雪を踏みしめる「ザッ」：短く詰まったノイズ（中域）＋わずかな沈み込み */
    function footstep(){ if(!soundOn||!actx) return; var t=actx.currentTime, n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.12,actx.sampleRate), ch=bf.getChannelData(0);
      for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,1.6); n.buffer=bf;
      var f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=900; f.Q.value=0.8; var g=actx.createGain(); g.gain.setValueAtTime(0.22,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.13);
      n.connect(f); f.connect(g); g.connect(master); n.start(t); }
    function splash(){ if(!soundOn||!actx) return; var t=actx.currentTime, n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.15,actx.sampleRate), ch=bf.getChannelData(0);
      for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*(1-i/ch.length); n.buffer=bf; var f=actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=1800; var g=actx.createGain(); g.gain.value=0.18; n.connect(f); f.connect(g); g.connect(master); n.start(t); }

    /* 環境音（ループ）：冬の風ゴオォ、夏の蝉ジー＋せせらぎ。シーンで出し入れ */
    var amb={ wind:null, semi:null, kawa:null };
    /* 本物の素材を環境音としてループ再生する（HTMLAudio）。amb とは別枠で管理。
       シーンに入ったら start、離れたら stop（フェードアウトしてから pause）。 */
    var sampleAmb={};
    function startSampleAmb(key, name, vol){
      if(sampleAmb[key]||!soundOn) return;
      var node=playSample(name, 0, true);   /* loop=true で開始、まず無音から */
      if(!node){ return; }
      sampleAmb[key]=node;
      try{ var target=(vol==null?0.5:vol), steps=8, i=0;
        node._fade=setInterval(function(){ i++; try{ node.volume=Math.min(target, target*i/steps); }catch(e){} if(i>=steps){ clearInterval(node._fade); node._fade=null; } }, 80);
      }catch(e){ try{ node.volume=(vol==null?0.5:vol); }catch(e2){} }
    }
    function stopSampleAmb(key){
      var node=sampleAmb[key]; if(!node) return; sampleAmb[key]=null;
      try{ if(node._fade){ clearInterval(node._fade); node._fade=null; }
        var v=node.volume, steps=6, i=0;
        var fo=setInterval(function(){ i++; try{ node.volume=Math.max(0, v*(1-i/steps)); }catch(e){} if(i>=steps){ clearInterval(fo); try{ node.pause(); }catch(e){} } }, 70);
      }catch(e){ try{ node.pause(); }catch(e2){} }
    }
    function noiseSource(){ var bf=actx.createBuffer(1,actx.sampleRate*2,actx.sampleRate), ch=bf.getChannelData(0); for(var i=0;i<ch.length;i++) ch[i]=Math.random()*2-1; var s=actx.createBufferSource(); s.buffer=bf; s.loop=true; return s; }
    function startWind(){ if(amb.wind||!soundOn||!actx) return; var t=actx.currentTime;
      // 低い唸り（ゴオォ）
      var s=noiseSource(), f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380; f.Q.value=0.7;
      var g=actx.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start(); g.gain.setTargetAtTime(0.2,t,0.8);
      // 高い擦過音（ヒュウゥ）を薄く重ねて吹雪の鋭さを出す
      var s2=noiseSource(), hf=actx.createBiquadFilter(); hf.type='bandpass'; hf.frequency.value=1600; hf.Q.value=0.9;
      var g2=actx.createGain(); g2.gain.value=0; s2.connect(hf); hf.connect(g2); g2.connect(master); s2.start(); g2.gain.setTargetAtTime(0.05,t,1.0);
      amb.wind={s:s,g:g,s2:s2,g2:g2};
      // うねり：ゴオォ…と強弱（フィルタ周波数も動かして“風が吹き寄せる”感じ）
      amb.wind.lfo=setInterval(function(){ if(amb.wind){ var v=0.12+Math.random()*0.16; amb.wind.g.gain.setTargetAtTime(v, actx.currentTime, 0.7); if(amb.wind.g2) amb.wind.g2.gain.setTargetAtTime(0.02+Math.random()*0.06, actx.currentTime, 0.7); try{ f.frequency.setTargetAtTime(300+Math.random()*260, actx.currentTime, 0.8); }catch(e){} } }, 1500); }
    function startSemi(){ if(amb.semi||!soundOn||!actx) return;
      var t=actx.currentTime;
      // アブラゼミの「ジリジリジリ」：高域ノイズを、速いトレモロ(振幅変調)で刻む
      var s=noiseSource(), f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=5200; f.Q.value=6;
      var f2=actx.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=7400; f2.Q.value=9;
      var g=actx.createGain(); g.gain.value=0.001; s.connect(f); f.connect(f2); f2.connect(g); g.connect(master); s.start();
      // 速いトレモロ＝「ジリジリ」の正体。LFO(約60Hz相当を擬似)で振幅を細かく刻む
      var trem=actx.createOscillator(), tg=actx.createGain(); trem.type='sawtooth'; trem.frequency.value=58; tg.gain.value=0.05;
      trem.connect(tg); tg.connect(g.gain); trem.start(t);
      g.gain.setTargetAtTime(0.12,t,1.2);
      // ミンミンゼミ的な、もう一声（少し低い帯・ゆっくりうねる）を重ねて“蝉時雨”の層を作る
      var s2=noiseSource(), mf=actx.createBiquadFilter(); mf.type='bandpass'; mf.frequency.value=3400; mf.Q.value=7;
      var g2=actx.createGain(); g2.gain.value=0; s2.connect(mf); mf.connect(g2); g2.connect(master); s2.start();
      var minmin=actx.createOscillator(), mg=actx.createGain(); minmin.type='sine'; minmin.frequency.value=6.5; mg.gain.value=0.045;
      minmin.connect(mg); mg.connect(g2.gain); minmin.start(t); g2.gain.setTargetAtTime(0.05,t,1.5);
      // 全体のうねり（鳴いては止む蝉時雨）
      var lfo=setInterval(function(){ if(amb.semi){ amb.semi.g.gain.setTargetAtTime(0.08+Math.random()*0.08, actx.currentTime, 0.5); } }, 900);
      amb.semi={s:s,g:g,s2:s2,trem:trem,minmin:minmin,lfo:lfo}; }
    function startKawa(){ if(amb.kawa||!soundOn||!actx) return; var s=noiseSource(), f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2400; f.Q.value=1.2; var g=actx.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start(); g.gain.setTargetAtTime(0.05,actx.currentTime,0.8); amb.kawa={s:s,g:g}; }
    function stopAmb(key){ if(amb[key]){ try{ amb[key].g.gain.setTargetAtTime(0,actx.currentTime,0.4); if(amb[key].g2) amb[key].g2.gain.setTargetAtTime(0,actx.currentTime,0.4); var a=amb[key]; setTimeout(function(){ ['s','s2','trem','minmin'].forEach(function(k){ try{ if(a[k]) a[k].stop(); }catch(e){} }); }, 800); if(a.lfo) clearInterval(a.lfo); }catch(e){} amb[key]=null; } }
    var chimeTimer=null, birdTimer=null;
    function manageAmbient(scene, sub){
      if(!soundOn||!actx){ return; }
      // 冬の風
      if(scene==='winter'){ startWind(); } else { stopAmb('wind'); }
      // 春：小鳥のさえずりを時々（環境音）
      if(scene==='spring'){ if(!birdTimer){ setTimeout(birdsong,400); birdTimer=setInterval(function(){ if(body.getAttribute('data-scene')==='spring') birdsong(); }, 4200+Math.random()*1500); } }
      else { if(birdTimer){ clearInterval(birdTimer); birdTimer=null; } }
      // 夏（昼）蝉＋川＋風鈴。風鈴は本物の素材(furin2)をループ。素材が無ければ合成chimeにフォールバック。
      if(scene==='summer' && sub!=='night'){ startSemi(); startKawa();
        if(sampleOk.furin2!==false){ startSampleAmb('furin','furin2',0.45); if(chimeTimer){ clearInterval(chimeTimer); chimeTimer=null; } }
        else if(!chimeTimer){ chime(); chimeTimer=setInterval(function(){ if(body.getAttribute('data-scene')==='summer'&&body.getAttribute('data-sub')!=='night') chime(); }, 5000); } }
      else { stopAmb('semi'); stopAmb('kawa'); stopSampleAmb('furin'); if(chimeTimer){ clearInterval(chimeTimer); chimeTimer=null; } }
      // 夏（夜）祭り囃子＝屋台のざわめき。夜祭りの場にいる間ずっと流す。
      if(scene==='summer' && sub==='night'){ startSampleAmb('matsuri','hanabiFes',0.4); }
      else { stopSampleAmb('matsuri'); }
      // 四季BGM（Audiostock）。いま見えている章の data-scene に対応する1曲だけをクロスフェードで流す。
      // 素材が sounds/bgm/ に無ければ playSample が false を返し、何も鳴らない（環境音・効果音は上記のまま動く）。
      // 環境音より控えめの音量（0.28）で下敷きにし、汽笛・鹿威し・花火などの効果音を邪魔しない。
      manageBgm(scene);
    }
    /* 現在のシーンに対応するBGMキー。clear（結章・夜富士）はフィナーレの弦。 */
    var BGM_FOR_SCENE={ winter:'bgmWinter', spring:'bgmSpring', summer:'bgmSummer', autumn:'bgmAutumn', clear:'bgmClear' };
    var curBgmKey=null;
    function manageBgm(scene){
      var want=BGM_FOR_SCENE[scene]||null;
      if(want===curBgmKey) return;              /* 同じ季節の間は流しっぱなし */
      if(curBgmKey){ stopSampleAmb('bgm'); }     /* 前の季節のBGMをフェードアウト */
      curBgmKey=want;
      if(want && sampleOk[want]!==false){ startSampleAmb('bgm', want, 0.28); }  /* 新しい季節をフェードイン */
    }

    function arm(){ if(armed) return; armed=true; ensureCtx(); unlockIOS(); if(actx&&actx.state==='suspended') actx.resume(); setOn(true); if(otoHint) otoHint.classList.remove('show');
      window.removeEventListener('pointerdown',arm); window.removeEventListener('touchstart',arm); window.removeEventListener('touchend',arm); window.removeEventListener('click',arm); window.removeEventListener('keydown',arm); }
    /* スマホは touchend / click も拾う（touchstart だけだとスクロール開始と誤判定されアンロックしない端末がある） */
    if(AC && !reduce){ window.addEventListener('pointerdown',arm,{passive:true}); window.addEventListener('touchstart',arm,{passive:true}); window.addEventListener('touchend',arm,{passive:true}); window.addEventListener('click',arm); window.addEventListener('keydown',arm);
      if(otoHint) setTimeout(function(){ if(!armed) otoHint.classList.add('show'); },1200); }
    if(otoBtn) otoBtn.addEventListener('click', function(ev){ ev.stopPropagation(); ensureCtx(); unlockIOS(); if(actx&&actx.state==='suspended') actx.resume(); if(!armed){ armed=true; setOn(true); if(otoHint) otoHint.classList.remove('show'); return; } setOn(!soundOn); });
    /* タブ復帰でiOSがcontextをsuspendに戻すことがある。戻ったら鳴らせるよう resume する保険。 */
    document.addEventListener('visibilitychange', function(){ if(!document.hidden && soundOn && actx && actx.state==='suspended') actx.resume(); });

    /* サウンドノベルの扉に瞬く星を散りばめる */
    (function(){ var novels=document.querySelectorAll('.novel'); novels.forEach(function(nv){ var n=reduce?0:40;
      for(var i=0;i<n;i++){ var h=document.createElement('span'); h.className='hoshi';
        h.style.left=((i*53)%100)+'%'; h.style.top=((i*29)%70)+'%';
        h.style.animationDelay=(-(i*0.37))+'s'; h.style.transform='scale('+(0.6+((i*13)%100)/100*1.2).toFixed(2)+')'; nv.appendChild(h); } }); })();

    /* 流れ星：扉が見えている間、時々スーッと流れて消える。
       ときどき2つが交差して出会う＝「君とリンク」(人と人が繋がる)演出。 */
    (function(){
      if(reduce) return;
      var novels=document.querySelectorAll('.novel'); if(!novels.length) return;
      function shoot(nv, x, y, pair){
        var s=document.createElement('span'); s.className='nagareboshi';
        s.style.left=x+'%'; s.style.top=y+'%'; nv.appendChild(s);
        void s.offsetWidth; s.classList.add('go');
        setTimeout(function(){ s.remove(); }, 1500);
        if(pair){ /* もう一つを逆向き気味に流して交差させる */
          var s2=document.createElement('span'); s2.className='nagareboshi';
          s2.style.left=(x-18)+'%'; s2.style.top=(y+10)+'%'; s2.style.setProperty('--rev','1');
          nv.appendChild(s2); void s2.offsetWidth; s2.classList.add('go');
          setTimeout(function(){ s2.remove(); }, 1500);
        }
      }
      var active=null;
      var io2=new IntersectionObserver(function(es){ es.forEach(function(e){ active = e.isIntersecting ? e.target : (active===e.target?null:active); }); }, { threshold:.3 });
      novels.forEach(function(nv){ io2.observe(nv); });
      var tick=0;
      setInterval(function(){
        if(!active) return;
        tick++;
        var x=55+Math.random()*35, y=8+Math.random()*30;
        shoot(active, x, y, tick%3===0);   /* 3回に1回は2つ交差(出会い) */
      }, 2600);
    })();

    /* 竹林生成 */
    (function(){ var c=document.getElementById('chikurin'); if(!c) return; var n=reduce?9:16;
      for(var i=0;i<n;i++){ var t=document.createElement('div'); t.className='take'; var left=(i/(n-1))*100, edge=Math.abs(left-50)/50, h=40+edge*55;
        t.style.left=left+'%'; t.style.height=h+'%'; t.style.opacity=String(0.5+edge*0.45); t.style.transform='translateX(-50%)'; c.appendChild(t); } })();

    /* ===== KV 胡粉のにじみ（§4.2）: 序・扉に触れると白い指あとがにじむ ===== */
    (function(){
      if(reduce) return;
      var door=document.querySelector('.novel'); if(!door) return;
      var gofunList=[], maxGofun=5;
      door.addEventListener('pointerdown',function(e){
        var r=door.getBoundingClientRect();
        var x=e.clientX-r.left, y=e.clientY-r.top;
        var s=document.createElement('span'); s.className='gofun';
        s.style.left=x+'px'; s.style.top=y+'px';
        door.appendChild(s);
        requestAnimationFrame(function(){ s.classList.add('bloom'); });
        gofunList.push(s);
        if(gofunList.length>maxGofun){
          var old=gofunList.shift();
          old.style.transition='opacity .6s ease'; old.style.opacity='0';
          setTimeout(function(){ if(old.parentNode) old.remove(); },600);
        }
        setTimeout(function(){ if(s.parentNode){ s.style.transition='opacity 1.2s ease'; s.style.opacity='0'; setTimeout(function(){ if(s.parentNode) s.remove(); },1200); } },12000);
      },{passive:true});
    })();

    /* ===== 結章：触れる水面 — height-field 2バッファ方式（§2-§3） =====
       前回失敗（横スライス＋fixed＝柱＋見切れ）を、会議確定の正しい技術解で作り直す。
       ・月ディスクを完全な円でオフスクリーンに → 勾配ベースの屈折変位でサンプリング（円が崩れない）
       ・高さ場の離散波動方程式 O(GW×GH) で60fps
       ・sticky ホルダーでsection内に留まる（fixed禁止）
       ・touch-action:pan-y + passive リスナー（スクロール殺し禁止） */
    var mizu=(function(){
      var cv=document.getElementById('mizuCanvas'); if(!cv||reduce) return { start:function(){}, stop:function(){} };
      var ctx=cv.getContext('2d'), W=0,H=0, DPR=Math.min(2,window.devicePixelRatio||1);
      var running=false, raf=0, frame=0;

      /* --- 調整パラメータ（§2.10） --- */
      var GW=176, GH=64, DAMP=0.985, REFRACT=14, SPARK=0.9, SPARK_MAX=0.35;
      var prev=new Float32Array(GW*GH), cur=new Float32Array(GW*GH);

      /* --- 構図（§2.3） --- */
      var moonX,moonY,moonR,horizon,reflX,reflY;
      var stars=[];
      var fujiPath=null;

      /* --- オフスクリーン月ディスク（§2.5） --- */
      var moonBuf=null, moonBufCtx=null, moonPix=null, MB=0;

      /* --- 合成バッファ（§2.5） --- */
      var cv2=null, ctx2=null, CW=0, CH=0, CS=0, waterData=null;

      /* --- 状態 --- */
      var E=0, isNagi=false, nagiFrames=0, touchCaused=false;
      var lastShizukuT=0, lastTsukigotoT=0, lastPokeT=0, lastPokeX=0, lastPokeY=0;
      var hintShown=false, hintEl=document.getElementById('mizuHint');
      var idleDropTimer=0, welcomeDropDone=false;

      function size(){
        W=cv.clientWidth; H=cv.clientHeight;
        cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
        moonR=Math.max(22, Math.min(Math.min(W,H)*0.055, 48));
        moonX=W*0.68; moonY=H*0.18; horizon=H*0.56;
        reflX=moonX; reflY=horizon+(horizon-moonY)*0.62;
        /* 星（§2.3）: horizon上のみ */
        if(!stars.length){ for(var i=0;i<60;i++) stars.push({x:Math.random(),y:Math.random()*0.54,s:Math.random()*1.2+0.4,tw:Math.random()*6.28}); }
        /* 富士の稜線シルエット（§2.3）*/
        fujiPath=new Path2D();
        fujiPath.moveTo(0,horizon);
        fujiPath.lineTo(0,horizon-H*0.08);
        fujiPath.quadraticCurveTo(W*0.375,horizon-H*0.22, W*0.5,horizon-H*0.23);
        fujiPath.quadraticCurveTo(W*0.625,horizon-H*0.22, W,horizon-H*0.08);
        fujiPath.lineTo(W,horizon);
        fujiPath.closePath();
        /* 月バッファ（§2.5） */
        MB=Math.ceil(moonR*1.6);
        moonBuf=document.createElement('canvas'); moonBuf.width=MB*2; moonBuf.height=MB*2;
        moonBufCtx=moonBuf.getContext('2d');
        var mg=moonBufCtx.createRadialGradient(MB,MB,0,MB,MB,MB);
        mg.addColorStop(0,'rgba(253,246,227,1)'); mg.addColorStop(0.6,'rgba(240,230,200,0.85)');
        mg.addColorStop(1,'rgba(217,203,160,0)');
        moonBufCtx.fillStyle=mg; moonBufCtx.beginPath(); moonBufCtx.arc(MB,MB,MB,0,6.2832); moonBufCtx.fill();
        moonPix=moonBufCtx.getImageData(0,0,MB*2,MB*2);
        /* 合成バッファ（§2.5） */
        CS=(W<=480)?0.5:(1/3);
        CW=Math.max(1,(W*CS)|0); CH=Math.max(1,((H-horizon)*CS)|0);
        cv2=document.createElement('canvas'); cv2.width=CW; cv2.height=CH;
        ctx2=cv2.getContext('2d');
        waterData=ctx2.createImageData(CW,CH);
      }

      /* --- 波動方程式（§2.4） --- */
      function stepWave(){
        for(var y=1;y<GH-1;y++){
          for(var x=1;x<GW-1;x++){
            var i=y*GW+x;
            var v=(cur[i-1]+cur[i+1]+cur[i-GW]+cur[i+GW])*0.5-prev[i];
            prev[i]=v*DAMP;
          }
        }
        var t=prev; prev=cur; cur=t;
      }

      /* --- 注入（§2.4） --- */
      function poke(nx,ny,strength){
        var gx=(nx*GW)|0, gy=(ny*GH)|0;
        for(var dy=-2;dy<=2;dy++){
          for(var dx=-2;dx<=2;dx++){
            var x2=gx+dx, y2=gy+dy;
            if(x2<1||x2>=GW-1||y2<1||y2>=GH-1) continue;
            var d=Math.sqrt(dx*dx+dy*dy); if(d>2.4) continue;
            cur[y2*GW+x2]+=strength*3.2*(1-d/2.4);
          }
        }
      }

      /* --- 月の道（§2.5b） --- */
      function glade(wx,wy){
        if(wy<reflY) return 0;
        var half=moonR*1.6*(1+(wy-reflY)/(H-reflY)*0.8);
        var t2=1-Math.min(1,Math.abs(wx-reflX)/half);
        return t2*t2;
      }

      /* --- エネルギー計測 --- */
      function calcEnergy(){
        var sum=0;
        for(var i=0;i<GW*GH;i++) sum+=Math.abs(cur[i]);
        return sum/(GW*GH);
      }

      /* --- 水面描画（§2.5） --- */
      function renderWater(){
        var d=waterData.data;
        for(var py=0;py<CH;py++){
          for(var px=0;px<CW;px++){
            var gx=(px*GW/CW)|0, gy=(py*GH/CH)|0;
            if(gx<1) gx=1; if(gx>=GW-1) gx=GW-2;
            if(gy<1) gy=1; if(gy>=GH-1) gy=GH-2;
            var idx=gy*GW+gx;
            var ddx=cur[idx+1]-cur[idx-1], ddy=cur[idx+GW]-cur[idx-GW];
            /* 月の鏡像サンプル */
            var wx=px/CS, wy=horizon+py/CS;
            var u=(wx-reflX)+ddx*REFRACT;
            var v=(reflY-wy)*1.0+ddy*REFRACT;
            var mu=(MB+u)|0, mv=(MB+v)|0;
            var moonA=0;
            if(mu>=0&&mu<MB*2&&mv>=0&&mv<MB*2){
              moonA=moonPix.data[(mv*MB*2+mu)*4+3]/255;
            }
            /* 水の地色 */
            var depth=py/CH;
            var r=8+6*(1-depth), g=18+8*(1-depth), b=38+14*(1-depth);
            r+=moonA*225; g+=moonA*212; b+=moonA*168;
            /* 月の道（§2.5b） */
            var sparkVal=Math.max(0,ddy)*SPARK*glade(wx,wy);
            if(sparkVal>SPARK_MAX) sparkVal=SPARK_MAX;
            r+=sparkVal*120; g+=sparkVal*118; b+=sparkVal*96;
            /* クランプ */
            if(r>255) r=255; if(g>255) g=255; if(b>255) b=255;
            var o=(py*CW+px)*4;
            d[o]=r; d[o+1]=g; d[o+2]=b; d[o+3]=255;
          }
        }
        ctx2.putImageData(waterData,0,0);
        ctx.imageSmoothingEnabled=true;
        ctx.drawImage(cv2,0,0,CW,CH, 0,horizon, W,H-horizon);
      }

      /* --- 空＋月（空側）描画 --- */
      function renderSky(){
        /* 空グラデ */
        var sg=ctx.createLinearGradient(0,0,0,H);
        sg.addColorStop(0,'#0a1730'); sg.addColorStop(0.48,'#0c1b34');
        sg.addColorStop(0.52,'#08152b'); sg.addColorStop(1,'#040c1c');
        ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
        /* 星 */
        for(var i=0;i<stars.length;i++){
          var s=stars[i];
          if(s.y*H>horizon*0.97) continue;
          var a=0.4+0.4*Math.sin(frame*0.025+s.tw);
          ctx.fillStyle='rgba(234,243,255,'+(a*0.7)+')';
          ctx.fillRect(s.x*W,s.y*H,s.s,s.s);
        }
        /* 富士の稜線 */
        ctx.fillStyle='#0a1626'; ctx.fill(fujiPath);
        /* 月 */
        var mg2=ctx.createRadialGradient(moonX-moonR*0.3,moonY-moonR*0.3,moonR*0.2,moonX,moonY,moonR);
        mg2.addColorStop(0,'#fdf6e3'); mg2.addColorStop(0.6,'#f0e6c8'); mg2.addColorStop(1,'#d9cba0');
        ctx.save(); ctx.shadowColor='rgba(253,246,227,.5)'; ctx.shadowBlur=30;
        ctx.beginPath(); ctx.arc(moonX,moonY,moonR,0,6.2832); ctx.fillStyle=mg2; ctx.fill(); ctx.restore();
      }

      /* --- 雫音（§3.1） --- */
      function shizuku(strength, vol){
        if(!soundOn||!actx) return;
        var now=performance.now(); if(now-lastShizukuT<160) return; lastShizukuT=now;
        var t=actx.currentTime;
        var f0=(420+Math.random()*140)*(1.15-0.3*strength);
        var o=actx.createOscillator(), g=actx.createGain();
        o.type='sine';
        o.frequency.setValueAtTime(f0*1.6,t);
        o.frequency.exponentialRampToValueAtTime(f0*0.55,t+0.28);
        g.gain.setValueAtTime(0.0001,t);
        g.gain.linearRampToValueAtTime((vol||0.3)*(0.5+strength*0.5),t+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001,t+0.5);
        o.connect(g); g.connect(master); o.start(t); o.stop(t+0.55);
        /* 「ちゃ」: 短い高域ノイズ */
        var n=actx.createBufferSource(), bf=actx.createBuffer(1,actx.sampleRate*0.03|0||1,actx.sampleRate),
            ch=bf.getChannelData(0);
        for(var i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2);
        n.buffer=bf;
        var ff=actx.createBiquadFilter(); ff.type='bandpass'; ff.frequency.value=2600; ff.Q.value=1.2;
        var ng=actx.createGain(); ng.gain.value=0.08*strength;
        n.connect(ff); ff.connect(ng); ng.connect(master); n.start(t);
      }

      /* --- 月の琴（§3.2） --- */
      function tsukigoto(){
        if(!soundOn||!actx) return;
        var t=actx.currentTime;
        [[293.66,0.09,0],[587.33,0.035,0],[440.0,0.05,0.09]].forEach(function(p){
          var o=actx.createOscillator(), g=actx.createGain();
          o.type='triangle'; o.frequency.value=p[0];
          g.gain.setValueAtTime(0.0001,t+p[2]);
          g.gain.linearRampToValueAtTime(p[1],t+p[2]+0.015);
          g.gain.exponentialRampToValueAtTime(0.0001,t+p[2]+1.5);
          o.connect(g); g.connect(master); o.start(t+p[2]); o.stop(t+p[2]+1.6);
        });
      }

      /* --- 凪→月の息（§2.5c） --- */
      var moonBreathPhase=0, moonBreathActive=false;
      function moonBreath(){
        if(!moonBreathActive) return;
        moonBreathPhase+=0.008;
        if(moonBreathPhase>1){ moonBreathActive=false; moonBreathPhase=0; return; }
        /* 月暈を +12% 膨らませて戻す（sin半波） */
        var extra=Math.sin(moonBreathPhase*Math.PI)*0.12;
        /* 空の月にほのかな暈 */
        var hr=moonR*(1+extra)*1.5;
        var hg=ctx.createRadialGradient(moonX,moonY,moonR*0.8,moonX,moonY,hr);
        hg.addColorStop(0,'rgba(253,246,227,'+(0.12*extra/0.12)+')');
        hg.addColorStop(1,'rgba(253,246,227,0)');
        ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(moonX,moonY,hr,0,6.2832); ctx.fill();
      }

      /* --- ヒント（§2.8） --- */
      var hintUsed=false;
      function showHint(){ if(hintUsed||!hintEl) return; hintEl.classList.add('show'); hintShown=true; setTimeout(function(){ hideHint(); }, 4000); }
      function hideHint(){ if(!hintShown||!hintEl) return; hintEl.classList.remove('show'); hintShown=false; hintUsed=true; }

      /* --- 入力（§2.7） --- */
      var swipeLastT=0, swipeLastX=0, swipeLastY=0, swipeSoundT=0;
      cv.addEventListener('pointerdown',function(e){
        if(!running) return;
        hideHint();
        var r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
        if(y<horizon) return;
        poke(x/W,(y-horizon)/(H-horizon),1.0);
        touchCaused=true; nagiFrames=0; isNagi=false;
        shizuku(1.0,0.3);
      },{passive:true});
      cv.addEventListener('pointermove',function(e){
        if(!running) return;
        if(!e.pressure&&e.pointerType==='mouse'&&e.buttons===0) return;
        var now=performance.now();
        var r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
        if(y<horizon) return;
        var dx2=x-swipeLastX, dy2=y-swipeLastY, dist=Math.sqrt(dx2*dx2+dy2*dy2);
        if(now-swipeLastT>90&&dist>24){
          poke(x/W,(y-horizon)/(H-horizon),0.4);
          touchCaused=true; nagiFrames=0; isNagi=false;
          swipeLastT=now; swipeLastX=x; swipeLastY=y;
          if(now-swipeSoundT>340){ shizuku(0.4,0.3*0.35); swipeSoundT=now; }
        }
      },{passive:true});

      /* --- メインループ --- */
      function tick(){
        if(!running) return;
        frame++;
        stepWave();

        /* 呼吸のさざなみ（§2.5c） */
        if(frame%30===0) poke(Math.random(),Math.random(),0.02);

        /* エネルギー */
        if(frame%30===0) E=calcEnergy();

        /* 凪検知（§2.5c） */
        if(touchCaused){
          if(E<0.012){ nagiFrames++; if(nagiFrames>=60){ isNagi=true; touchCaused=false; moonBreathActive=true; moonBreathPhase=0; } }
          else { nagiFrames=0; }
        }

        /* 月の琴（§3.2）: 逆さ月中心セルの |h| > 0.35 */
        var reflGx=(reflX/W*GW)|0, reflGy=((reflY-horizon)/(H-horizon)*GH)|0;
        if(reflGx>=1&&reflGx<GW-1&&reflGy>=1&&reflGy<GH-1){
          var refCell=Math.abs(cur[reflGy*GW+reflGx]);
          if(refCell>0.35&&performance.now()-lastTsukigotoT>6000){
            lastTsukigotoT=performance.now(); tsukigoto();
          }
        }

        /* 待機の一滴（§2.1）: 9-15s毎 */
        idleDropTimer++;
        var idleInterval=540+Math.random()*360;
        if(idleDropTimer>idleInterval){ idleDropTimer=0; poke(Math.random(),Math.random(),0.15); shizuku(0.15,0.12); }

        /* 描画 */
        renderSky();
        renderWater();
        moonBreath();

        raf=requestAnimationFrame(tick);
      }

      /* QAフック（§7）: クロージャ内で直接設定 */
      window.__mizu={
        energy:function(){ return E; },
        poke:function(nx,ny,s){ poke(nx,ny,s); },
        state:function(){ return { running:running, nagi:isNagi }; }
      };

      /* ResizeObserver or resize fallback */
      if(window.ResizeObserver){
        new ResizeObserver(function(){ if(running) size(); }).observe(cv);
      } else {
        window.addEventListener('resize',function(){ if(running) size(); });
      }

      return {
        start:function(){
          if(running) return; running=true; frame=0;
          size();
          /* バッファゼロクリア */
          prev.fill(0); cur.fill(0);
          E=0; isNagi=false; nagiFrames=0; touchCaused=false; idleDropTimer=0; welcomeDropDone=false;
          cv.classList.add('on'); body.classList.add('mizu-active');
          /* 迎えの一滴（§2.1） */
          setTimeout(function(){
            if(!running) return;
            poke(0.72,0.35,0.35); shizuku(0.35,0.25); welcomeDropDone=true;
          },900);
          /* ヒント（§2.8） */
          setTimeout(function(){
            if(!running||hintUsed) return; showHint();
          },3000);
          tick();
        },
        stop:function(){
          if(!running) return; running=false;
          cv.classList.remove('on'); body.classList.remove('mizu-active');
          hideHint();
          if(raf) cancelAnimationFrame(raf);
        }
      };
    })();

  })();
