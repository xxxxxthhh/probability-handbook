/* 1.2 条件概率与独立性 — 条件概率翻转器
   用三个滑块锁定一个 2×2 表：P(B)、P(A|B)、P(A|¬B)。
   这三个量互相不冲突，所以拖到任何位置都是一个合法的世界——
   然后把 P(A|B) 和 P(B|A) 并排放出来，看方向一反数值差多少。 */
(function(){
  var grid = document.getElementById('cGrid');
  if(!grid) return;

  var N = 1000;
  var cells = [];
  for(var i=0;i<N;i++){ var e=document.createElement('i'); grid.appendChild(e); cells.push(e); }

  var SC = {
    flu: {
      B:'得流感', A:'发烧',
      lb:'人群中得流感的比例', l1:'流感患者里发烧的比例', l2:'没得流感的人里发烧的比例',
      pB:5, pAB:80, pAnB:8
    },
    alarm: {
      B:'真有入侵', A:'警报响',
      lb:'真的发生入侵的比例', l1:'入侵时警报响的比例', l2:'没入侵时警报也响的比例',
      pB:0.5, pAB:95, pAnB:5
    },
    rain: {
      B:'下过雨', A:'地面是湿的',
      lb:'下过雨的时段比例', l1:'下过雨时地面湿的比例', l2:'没下雨时地面也湿的比例',
      pB:30, pAB:100, pAnB:10
    }
  };

  var s = SC.flu;
  var sB   = document.getElementById('sB'),
      sAB  = document.getElementById('sAB'),
      sAnB = document.getElementById('sAnB');

  function txt(id, v){ document.getElementById(id).textContent = v; }

  function update(){
    var pB = parseFloat(sB.value) / 100,
        pAB = parseFloat(sAB.value) / 100,
        pAnB = parseFloat(sAnB.value) / 100;

    txt('vB',   (pB*100).toFixed(1) + '%');
    txt('vAB',  (pAB*100).toFixed(0) + '%');
    txt('vAnB', (pAnB*100).toFixed(1) + '%');

    var nB   = Math.round(N * pB);          /* 有 B 的人 */
    var nBA  = Math.round(nB * pAB);        /* 有 B 且出现 A */
    var nBnA = nB - nBA;
    var nnB  = N - nB;
    var nnBA = Math.round(nnB * pAnB);      /* 没 B 却出现 A */
    var nA   = nBA + nnBA;

    for(var i=0;i<N;i++){
      cells[i].className = i < nBA ? 's'
                         : i < nBA + nBnA ? 's dim'
                         : i < nBA + nBnA + nnBA ? 'a' : '';
    }

    var pBA = nA > 0 ? nBA / nA : 0;        /* 反方向：P(B|A) */

    txt('nFwd', (pAB*100).toFixed(0) + '%');
    txt('nBwd', (pBA*100).toFixed(1) + '%');
    txt('nRatio', pBA > 0 ? (pAB / pBA).toFixed(1) + '×' : '—');

    txt('lFwd', 'P(' + s.A + ' | ' + s.B + ')');
    txt('lBwd', 'P(' + s.B + ' | ' + s.A + ')');
    txt('legS', s.B + '，且' + s.A);
    txt('legD', s.B + '，但没' + s.A);
    txt('legA', '没' + s.B + '，却' + s.A);

    document.getElementById('story').innerHTML =
      '1000 个人里，<b>' + nB + ' 人</b>' + s.B + '，其中 <b>' + nBA + ' 人</b>' + s.A +
      '；另外 <b>' + nnB + ' 人</b>没' + s.B + '，其中 <b>' + nnBA + ' 人</b>也' + s.A +
      '。<br>所以「' + s.A + '」的一共 ' + nBA + ' + ' + nnBA + ' = <b>' + nA + ' 人</b>，' +
      '其中真的' + s.B + '的只有 <b>' + nBA + ' 人</b> → ' + nBA + ' ÷ ' + nA +
      ' ≈ <b>' + (pBA*100).toFixed(1) + '%</b>。';
  }

  function applyScenario(key){
    s = SC[key];
    sB.value = s.pB; sAB.value = s.pAB; sAnB.value = s.pAnB;
    txt('lB', s.lb); txt('l1', s.l1); txt('l2', s.l2);
    update();
  }

  [sB, sAB, sAnB].forEach(function(x){ x.addEventListener('input', update); });
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ applyScenario(b.getAttribute('data-p')); });
  });

  applyScenario('flu');
})();
