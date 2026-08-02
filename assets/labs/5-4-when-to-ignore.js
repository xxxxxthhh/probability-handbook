/* 5.4 遍历性 — 集合平均 vs 时间平均
   同一个赌局，两种看法：
   · 集合视角：1000 个人各赌一轮，把大家的钱加起来平均（期望值就是这个）
   · 时间视角：一个人连着赌很多轮，看他自己的钱怎么走（你实际经历的是这个）
   非遍历的赌局里，这两个数字可以一正一负。 */
(function(){
  var svg = document.getElementById('ergoLayer');
  if(!svg) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var PEOPLE = 1000, ROUNDS = 120, seed = 20190101;
  var W = 600, H = 250, L = 66, R = 14, T = 14, B = 36;

  var sUp = document.getElementById('sUp'),
      sDn = document.getElementById('sDn');

  function render(){
    var up = 1 + parseFloat(sUp.value) / 100;
    var dn = 1 - parseFloat(sDn.value) / 100;

    document.getElementById('vUp').textContent = '+' + parseFloat(sUp.value).toFixed(0) + '%';
    document.getElementById('vDn').textContent = '−' + parseFloat(sDn.value).toFixed(0) + '%';

    /* 理论值 */
    var ensRate = (0.5 * up + 0.5 * dn) - 1;                       /* 集合平均每轮增长 */
    var timeRate = Math.exp(0.5 * Math.log(up) + 0.5 * Math.log(dn)) - 1;  /* 时间平均每轮增长 */

    /* 模拟 */
    var r = rng(seed);
    var w = new Array(PEOPLE).fill(1);
    var meanTrack = [1], medTrack = [1];
    for(var t = 0; t < ROUNDS; t++){
      var sum = 0;
      for(var i = 0; i < PEOPLE; i++){
        w[i] *= (r() < 0.5 ? up : dn);
        sum += w[i];
      }
      meanTrack.push(sum / PEOPLE);
      var srt = w.slice().sort(function(a, b){ return a - b; });
      medTrack.push(srt[PEOPLE >> 1]);
    }

    var finalMean = meanTrack[ROUNDS], finalMed = medTrack[ROUNDS];
    var below = w.filter(function(v){ return v < 1; }).length;

    /* 对数纵轴 */
    var lo = Math.min(finalMed, 1, Math.min.apply(null, medTrack));
    var hi = Math.max(finalMean, 1, Math.max.apply(null, meanTrack));
    lo = Math.max(lo, 1e-6);
    var lLo = Math.log10(lo) - 0.3, lHi = Math.log10(hi) + 0.3;
    function Y(v){ return T + (lHi - Math.log10(Math.max(v, 1e-9))) / (lHi - lLo) * (H - T - B); }
    function X(t){ return L + t / ROUNDS * (W - L - R); }

    function path(a){ return a.map(function(v, i){ return X(i) + ',' + Y(v).toFixed(1); }).join(' '); }
    document.getElementById('meanLine').setAttribute('points', path(meanTrack));
    document.getElementById('medLine').setAttribute('points', path(medTrack));
    document.getElementById('oneRef').setAttribute('y1', Y(1));
    document.getElementById('oneRef').setAttribute('y2', Y(1));

    document.getElementById('yHi').textContent = fmt(Math.pow(10, lHi));
    document.getElementById('yOne').textContent = '×1';
    document.getElementById('yOne').setAttribute('y', Y(1) + 4);
    document.getElementById('yLo').textContent = fmt(Math.pow(10, lLo));

    document.getElementById('nEns').textContent = (ensRate >= 0 ? '+' : '−') + Math.abs(ensRate * 100).toFixed(1) + '%';
    document.getElementById('nEns').className = 'n' + (ensRate >= 0 ? '' : ' s');
    document.getElementById('nTime').textContent = (timeRate >= 0 ? '+' : '−') + Math.abs(timeRate * 100).toFixed(1) + '%';
    document.getElementById('nTime').className = 'n' + (timeRate >= 0 ? '' : ' s');
    document.getElementById('nMed').textContent = fmt(finalMed);
    document.getElementById('nMed').className = 'n' + (finalMed >= 1 ? '' : ' s');

    document.getElementById('story').innerHTML =
      '每轮各一半概率：赢了 <b>+' + parseFloat(sUp.value).toFixed(0) + '%</b>，输了 <b>−' +
      parseFloat(sDn.value).toFixed(0) + '%</b>。跑 1000 人 × ' + ROUNDS + ' 轮：<br>' +
      '<b>集合平均</b>每轮 ' + (ensRate >= 0 ? '+' : '−') + Math.abs(ensRate * 100).toFixed(1) +
      '%，' + ROUNDS + ' 轮后全体平均财富 <b>' + fmt(finalMean) + '</b>。<br>' +
      '<b>时间平均</b>每轮 ' + (timeRate >= 0 ? '+' : '−') + Math.abs(timeRate * 100).toFixed(1) +
      '%，中位数那个人只剩 <b>' + fmt(finalMed) + '</b>，' +
      '<b>' + (below / PEOPLE * 100).toFixed(1) + '%</b> 的人比开始时更穷。<br>' +
      (ensRate > 0 && timeRate < 0
        ? '<b style="color:var(--sick)">平均值在涨，而几乎每一个具体的人都在变穷——这个赌局不是遍历的。</b>'
        : '<b style="color:var(--accent)">两个视角方向一致，这个赌局对个人也是划算的。</b>');
  }

  function fmt(v){
    if(v >= 1e6) return '×' + v.toExponential(1);
    if(v >= 10) return '×' + v.toFixed(0);
    if(v >= 0.01) return '×' + v.toFixed(3);
    return '×' + v.toExponential(1);
  }

  [sUp, sDn].forEach(function(s){ s.addEventListener('input', render); });
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sUp.value = v[0]; sDn.value = v[1];
      render();
    });
  });

  render();
})();
