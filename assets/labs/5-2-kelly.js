/* 5.2 凯利公式 — 同一胜率下不同仓位的路径模拟
   1000 条独立路径，每条走 200 轮。三档仓位并排：保守 / 凯利 / 激进。
   看的不是平均值，是中位数和破产率——你只活在一条路径上。 */
(function(){
  var svg = document.getElementById('pathLayer');
  if(!svg) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var PATHS = 1000, ROUNDS = 200, RUIN = 0.01;   /* 跌到本金的 1% 视为出局 */
  var seed = 195607;                              /* Kelly 论文发表的年月 */

  var W = 600, H = 260, L = 62, R = 14, T = 14, B = 34;

  var sF = document.getElementById('sFrac'),
      sP = document.getElementById('sWin'),
      sG = document.getElementById('sOdds');

  function kelly(p, b){ return Math.max(0, (p * (b + 1) - 1) / b); }

  function render(){
    var f = parseFloat(sF.value) / 100;
    var p = parseFloat(sP.value) / 100;
    var b = parseFloat(sG.value) / 100;   /* 赢一次的赔率：赚 b 倍本金 */

    var kf = kelly(p, b);
    document.getElementById('vFrac').textContent = (f * 100).toFixed(0) + '%';
    document.getElementById('vWin').textContent = (p * 100).toFixed(0) + '%';
    document.getElementById('vOdds').textContent = '赢了赚 ' + b.toFixed(2) + ' 倍';
    document.getElementById('nKelly').textContent = (kf * 100).toFixed(1) + '%';

    var r = rng(seed);
    var finals = [], ruined = 0;
    var sample = [];      /* 画出来的少数几条，避免糊成一片 */

    for(var i = 0; i < PATHS; i++){
      var w = 1, dead = false, track = (i < 40) ? [1] : null;
      for(var t = 0; t < ROUNDS; t++){
        if(!dead){
          w = r() < p ? w * (1 + b * f) : w * (1 - f);
          if(w <= RUIN){ w = 0; dead = true; }
        }
        if(track) track.push(w);
      }
      if(dead) ruined++;
      finals.push(w);
      if(track) sample.push(track);
    }

    finals.sort(function(a, c){ return a - c; });
    var median = finals[Math.floor(PATHS / 2)];
    var mean = finals.reduce(function(a, c){ return a + c; }, 0) / PATHS;

    /* 纵轴用对数刻度：财富跨好几个数量级，线性刻度什么也看不见 */
    var LOMIN = 0.01, LOMAX = Math.max(100, median * 20, 10);
    function Y(v){
      var q = Math.max(v, LOMIN);
      return T + (1 - (Math.log10(q) - Math.log10(LOMIN)) / (Math.log10(LOMAX) - Math.log10(LOMIN))) * (H - T - B);
    }
    function X(t){ return L + t / ROUNDS * (W - L - R); }

    svg.innerHTML = sample.map(function(tr){
      var pts = [];
      for(var t = 0; t <= ROUNDS; t += 2) pts.push(X(t) + ',' + Y(tr[t]).toFixed(1));
      var dead = tr[ROUNDS] === 0;
      return '<polyline class="line ' + (dead ? 's' : 'n') + '" style="stroke-width:1;opacity:' +
        (dead ? 0.5 : 0.35) + '" points="' + pts.join(' ') + '"/>';
    }).join('') +
      '<line class="ref" x1="' + L + '" y1="' + Y(1) + '" x2="' + (W - R) + '" y2="' + Y(1) + '"/>';

    document.getElementById('yTop').textContent = '×' + LOMAX.toFixed(0);
    document.getElementById('yMid').textContent = '×1';
    document.getElementById('yMid').setAttribute('y', Y(1) + 4);

    document.getElementById('nMedian').textContent = median < 0.01 ? '≈0' : '×' + median.toFixed(2);
    document.getElementById('nMean').textContent = '×' + (mean > 1000 ? mean.toExponential(1) : mean.toFixed(1));
    document.getElementById('nRuin').textContent = (ruined / PATHS * 100).toFixed(1) + '%';

    var verdict;
    if(f < kf * 0.75) verdict = '<b>下注偏保守</b>：不会出事，但增长慢于本可以达到的水平。';
    else if(f <= kf * 1.25) verdict = '<b style="color:var(--accent)">接近凯利比例</b>：长期增长率在这附近最大。';
    else if(f < kf * 2) verdict = '<b style="color:var(--fp)">超过凯利了</b>：波动大幅上升，长期增长率反而开始下降。';
    else verdict = '<b style="color:var(--sick)">远超凯利</b>：即便每一注的期望值都是正的，长期也几乎注定归零。';

    document.getElementById('story').innerHTML =
      '每轮押上本金的 <b>' + (f * 100).toFixed(0) + '%</b>，胜率 ' + (p * 100).toFixed(0) +
      '%，赢了赚 ' + b.toFixed(2) + ' 倍。跑 <b>1000 条</b>路径、每条 <b>200 轮</b>：<br>' +
      '中位数结局 <b>' + (median < 0.01 ? '几乎归零' : '×' + median.toFixed(2)) +
      '</b>，破产（跌破本金 1%）的路径占 <b>' + (ruined / PATHS * 100).toFixed(1) + '%</b>。<br>' + verdict;
  }

  [sF, sP, sG].forEach(function(s){ s.addEventListener('input', render); });
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sF.value = v[0]; sP.value = v[1]; sG.value = v[2];
      render();
    });
  });

  render();
})();
