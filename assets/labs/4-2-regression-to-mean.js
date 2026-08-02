/* 4.2 回归均值 — 技能 + 运气的两轮散点
   每个人有固定的真实技能，每轮再加一份全新的运气。
   把第一轮最好的一批人圈出来，看他们第二轮的平均分退到哪儿——
   没有任何人变差，退步却必然发生。 */
(function(){
  var svg = document.getElementById('scatterLayer');
  if(!svg) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(r){  /* Box–Muller */
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var N = 240, seed = 5150;
  var W = 600, H = 320, L = 54, R = 14, T = 14, B = 42;
  var LO = 20, HI = 100;   /* 分数范围，纯粹为了好读 */

  var sLuck = document.getElementById('sLuck');

  function x(v){ return L + (v - LO) / (HI - LO) * (W - L - R); }
  function y(v){ return T + (1 - (v - LO) / (HI - LO)) * (H - T - B); }

  function render(){
    var lw = parseFloat(sLuck.value) / 100;         /* 运气占比 */
    document.getElementById('vLuck').textContent =
      (lw * 100).toFixed(0) + '%　技能 ' + ((1 - lw) * 100).toFixed(0) + '%';

    var r = rng(seed);
    var people = [];
    for(var i = 0; i < N; i++){
      var skill = normal(r);
      var l1 = normal(r), l2 = normal(r);
      /* 归一化让两轮分数的总方差不随滑块变化，否则图会整体缩放，看不出重点 */
      var k = Math.sqrt((1 - lw) * (1 - lw) + lw * lw);
      var s1 = 60 + 13 * ((1 - lw) * skill + lw * l1) / k;
      var s2 = 60 + 13 * ((1 - lw) * skill + lw * l2) / k;
      people.push({a:s1, b:s2});
    }

    /* 第一轮前 10% */
    var sorted = people.slice().sort(function(p, q){ return q.a - p.a; });
    var topN = Math.round(N * 0.1);
    var top = sorted.slice(0, topN);
    var mark = top[topN - 1].a;

    var m1 = top.reduce(function(s, p){ return s + p.a; }, 0) / topN;
    var m2 = top.reduce(function(s, p){ return s + p.b; }, 0) / topN;
    var allMean = people.reduce(function(s, p){ return s + p.a; }, 0) / N;

    var parts = [];
    parts.push('<line class="ref" x1="' + x(LO) + '" y1="' + y(LO) + '" x2="' + x(HI) + '" y2="' + y(HI) + '"/>');
    /* 前 10% 的门槛线 */
    parts.push('<line class="gridline" x1="' + x(mark) + '" y1="' + T + '" x2="' + x(mark) + '" y2="' + (H - B) + '"/>');
    people.forEach(function(p){
      var hot = p.a >= mark;
      parts.push('<circle class="dot' + (hot ? ' s' : ' n') + '" cx="' + x(p.a).toFixed(1) +
                 '" cy="' + y(p.b).toFixed(1) + '" r="' + (hot ? 4 : 2.6) + '"/>');
    });
    /* 两条水平参考线：这批人两轮的平均 */
    parts.push('<line class="ref" x1="' + x(mark) + '" y1="' + y(m2) + '" x2="' + x(HI) + '" y2="' + y(m2) + '"/>');
    svg.innerHTML = parts.join('');

    document.getElementById('nM1').textContent = m1.toFixed(1);
    document.getElementById('nM2').textContent = m2.toFixed(1);
    /* 纯技能时差值是 -0.0000…，直接拼负号会印出「−0.0」这种怪东西 */
    var drop = m1 - m2;
    document.getElementById('nDrop').textContent =
      Math.abs(drop) < 0.05 ? '0.0' : '−' + drop.toFixed(1);

    var worse = top.filter(function(p){ return p.b < p.a; }).length;
    document.getElementById('story').innerHTML =
      '第一轮得分最高的 <b>' + topN + '</b> 人（门槛 ' + mark.toFixed(1) + ' 分），第一轮平均 <b>' +
      m1.toFixed(1) + '</b> 分；到了第二轮，同一批人平均只剩 <b>' + m2.toFixed(1) +
      '</b> 分，退了 <b>' + (m1 - m2).toFixed(1) + '</b> 分（全体平均 ' + allMean.toFixed(1) +
      ' 分）。<br>其中 <b>' + worse + ' / ' + topN + '</b> 人第二轮分数下降——' +
      '<b>而他们的技能一分没变，中间也没有任何人骂过他们。</b>';
  }

  sLuck.addEventListener('input', render);
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ sLuck.value = b.getAttribute('data-p'); render(); });
  });
  document.getElementById('reroll').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    render();
  });

  render();
})();
