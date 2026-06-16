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
      tanbo:'tanbo',ayu:'ayu',suikawari:'suikawari',mato:'mato',nukegara:'nukegara',kakigori:'kakigori',
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
      var dayW=wNatsu*(night?0.45:1), nightW=wNatsu*(night?1:0.6);
      [els.semi,els.furin,els.suika,els.kawa,els.tsuri,els.tanbo,els.ayu,els.suikawari,els.mato,els.nukegara,els.kakigori].forEach(function(e){ if(e) e.style.opacity=dayW; });
      if(els.semi) els.semi.classList.toggle('show', wNatsu>0.1); if(els.furin) els.furin.classList.toggle('show', wNatsu>0.1); if(els.nukegara) els.nukegara.classList.toggle('show', wNatsu>0.1);
      [els.yataiA,els.yataiB,els.senko].forEach(function(e){ if(e) e.style.opacity=nightW; });
      if(els.senko) els.senko.classList.toggle('show', wNatsu>0.1);
      if(els.hanabi) els.hanabi.style.opacity=(wNatsu>0.1&&night?1:0);  /* 花火は夜章でのみ */
      els.yakiimo.style.opacity=wMomiji; els.yuki.style.opacity=wYuki;
      /* 温泉の猿は雪国（winter）でしっかり見せる。 */
      els.onsen.style.opacity=wSnow;
    }
    /* ===== サウンドノベル：スクロール位置で「一文ずつ送る」 =====
       IntersectionObserver は環境によって発火が不安定なため、毎フレーム自前で位置を計算する確実な方式にする。
       ・各章(.story)が画面に入ったら lead-in（見出し・暗幕・罫を出す）＋ data-scene 適用＋一度きりトリガー
       ・各文(.ph)は、その中心が画面中央に近いほど濃く。中央を過ぎて上へ抜けたら薄く残す（gone）。 */
    var storyEls=[].slice.call(document.querySelectorAll('.story'));
    var sceneEls=[].slice.call(document.querySelectorAll('[data-scene]'));
    var phs=[].slice.call(document.querySelectorAll('.story .ph'));
    var sasoEls=[].slice.call(document.querySelectorAll('.story .saso'));
    var activeScene=null;

    function updateNarrative(){
      var vh=window.innerHeight, mid=vh*0.5;

      /* いま画面中央にいちばん近い [data-scene] 要素を「現在の季節」にする */
      var best=null, bestDist=1e9;
      sceneEls.forEach(function(e){ var r=e.getBoundingClientRect();
        if(r.bottom>0 && r.top<vh){ var c=(r.top+r.bottom)/2, d=Math.abs(c-mid); if(d<bestDist){ bestDist=d; best=e; } }
      });
      if(best){ var scene=best.getAttribute('data-scene');
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

      /* 文：中心が画面中央±28%に入っていれば lit。中心が中央より上に抜けたら gone（薄く残る）。 */
      var bandTop=vh*0.22, bandBottom=vh*0.78;
      phs.forEach(function(p){ var r=p.getBoundingClientRect(); var c=(r.top+r.bottom)/2;
        if(c>=bandTop && c<=bandBottom){ p.classList.add('lit'); p.classList.remove('gone'); }
        else if(c<bandTop){ if(p.classList.contains('lit')) p.classList.add('gone'); }
        else { /* まだ下：何もしない（初期の伏せた状態のまま） */ }
      });
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
    function ensureCtx(){ if(actx||!AC) return; actx=new AC(); master=actx.createGain(); master.gain.value=0; master.connect(actx.destination); }
    function setOn(on){ soundOn=on; if(otoBtn) otoBtn.classList.toggle('muted', !on); if(master) master.gain.setTargetAtTime(on?0.5:0, actx.currentTime, .05); manageAmbient(body.getAttribute('data-scene'), body.getAttribute('data-sub')); }
    function tone(freq, type, dur, peak, t0){ if(!soundOn||!actx) return; var t=t0||actx.currentTime, o=actx.createOscillator(), g=actx.createGain(); o.type=type||'sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak||0.3,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05); return o; }
    function chime(){ if(!soundOn) return; var b=1200+Math.random()*500; [1,2.76,5.4].forEach(function(m,i){ tone(b*m,'sine',2.6+i*0.4,(i===0?0.4:0.14)/(i+1)); }); }
    /* ししおどし「スコーン！」: 竹が石を打つ鋭いアタック＋木胴の共鳴＋抜ける高い余韻＋ひと反響 */
    function konk(){ if(!soundOn||!actx) return; var t=actx.currentTime;
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
    function whistle(){ if(!soundOn||!actx) return; var t=actx.currentTime, dur=2.4;
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
    var clackTimer=null;
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
    function startClack(dur){ if(!soundOn||!actx||reduce){ return; } if(clackTimer) clearInterval(clackTimer);
      var beat=0.72, count=0, max=Math.ceil((dur/1000)/beat)+2;
      function step(){ if(!soundOn){ stopClack(); return; } clack(); count++;
        if(count>=max){ stopClack(); return; }
        // 加速：最初はゆっくり、徐々に詰める
        beat=Math.max(0.34, beat*0.94);
        clearInterval(clackTimer); clackTimer=setTimeout(step, beat*1000);
      }
      step();
    }
    function stopClack(){ if(clackTimer){ clearTimeout(clackTimer); clearInterval(clackTimer); clackTimer=null; } }
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
    function noiseSource(){ var bf=actx.createBuffer(1,actx.sampleRate*2,actx.sampleRate), ch=bf.getChannelData(0); for(var i=0;i<ch.length;i++) ch[i]=Math.random()*2-1; var s=actx.createBufferSource(); s.buffer=bf; s.loop=true; return s; }
    function startWind(){ if(amb.wind||!soundOn||!actx) return; var s=noiseSource(), f=actx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; var g=actx.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start(); g.gain.setTargetAtTime(0.16,actx.currentTime,0.6); amb.wind={s:s,g:g};
      // ゆらぎ
      amb.wind.lfo=setInterval(function(){ if(amb.wind) amb.wind.g.gain.setTargetAtTime(0.09+Math.random()*0.12, actx.currentTime, 0.5); }, 1800); }
    function startSemi(){ if(amb.semi||!soundOn||!actx) return;
      var s=noiseSource(), f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=4800; f.Q.value=8;
      var f2=actx.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=6800; f2.Q.value=10;  // 倍音帯でジリジリ感
      var g=actx.createGain(); g.gain.value=0; s.connect(f); f.connect(f2); f2.connect(g); g.connect(master); s.start();
      g.gain.setTargetAtTime(0.07,actx.currentTime,0.8);
      // 「ジー…ジー…」と波打つ蝉らしい音量ゆらぎ
      var lfo=setInterval(function(){ if(amb.semi){ amb.semi.g.gain.setTargetAtTime(0.03+Math.random()*0.06, actx.currentTime, 0.18); } }, 420);
      amb.semi={s:s,g:g,lfo:lfo}; }
    function startKawa(){ if(amb.kawa||!soundOn||!actx) return; var s=noiseSource(), f=actx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2400; f.Q.value=1.2; var g=actx.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start(); g.gain.setTargetAtTime(0.05,actx.currentTime,0.8); amb.kawa={s:s,g:g}; }
    function stopAmb(key){ if(amb[key]){ try{ amb[key].g.gain.setTargetAtTime(0,actx.currentTime,0.4); var a=amb[key]; setTimeout(function(){ try{a.s.stop();}catch(e){} }, 800); if(a.lfo) clearInterval(a.lfo); }catch(e){} amb[key]=null; } }
    var chimeTimer=null;
    function manageAmbient(scene, sub){
      if(!soundOn||!actx){ return; }
      // 冬の風
      if(scene==='winter'){ startWind(); } else { stopAmb('wind'); }
      // 夏（昼）蝉＋川＋風鈴
      if(scene==='summer' && sub!=='night'){ startSemi(); startKawa(); if(!chimeTimer){ chime(); chimeTimer=setInterval(function(){ if(body.getAttribute('data-scene')==='summer'&&body.getAttribute('data-sub')!=='night') chime(); }, 5000); } }
      else { stopAmb('semi'); stopAmb('kawa'); if(chimeTimer){ clearInterval(chimeTimer); chimeTimer=null; } }
    }

    function arm(){ if(armed) return; armed=true; ensureCtx(); if(actx&&actx.state==='suspended') actx.resume(); setOn(true); if(otoHint) otoHint.classList.remove('show');
      window.removeEventListener('pointerdown',arm); window.removeEventListener('touchstart',arm); window.removeEventListener('keydown',arm); }
    if(AC && !reduce){ window.addEventListener('pointerdown',arm,{passive:true}); window.addEventListener('touchstart',arm,{passive:true}); window.addEventListener('keydown',arm);
      if(otoHint) setTimeout(function(){ if(!armed) otoHint.classList.add('show'); },1200); }
    if(otoBtn) otoBtn.addEventListener('click', function(ev){ ev.stopPropagation(); if(!armed){ arm(); return; } ensureCtx(); if(actx&&actx.state==='suspended') actx.resume(); setOn(!soundOn); });

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
  })();
