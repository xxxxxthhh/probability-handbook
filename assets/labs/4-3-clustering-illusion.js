/* 4.3 聚类错觉 — 撒点生成器
   甲乙两张点图，一张真随机、一张「均匀」（抖动网格——人以为随机长这样）。
   读者先用眼睛判断，再看格子计数：真随机那张必然出现空格和扎堆，
   而且计数分布贴合泊松分布。 */
(function(){
  var svgA = document.getElementById('dotsA');
  if(!svgA) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var SIDE = 24;              /* 24×24 = 576 格，对齐伦敦轰炸那份数据 */
  var CELLS = SIDE * SIDE;
  var SZ = 288;               /* SVG 边长 */
  var seed = 19440613;        /* V-1 首次落上伦敦的日期，纯属纪念 */
  var revealed = false, realIsA = true;

  var sN = document.getElementById('sPoints');

  function uniformPts(r, n){
    var p = [];
    for(var i = 0; i < n; i++) p.push([r() * SZ, r() * SZ]);
    return p;
  }
  /* 「均匀」：把点摊到网格上再小幅抖动——正是人手画随机时的做法 */
  function evenPts(r, n){
    var cols = Math.ceil(Math.sqrt(n));
    var step = SZ / cols, p = [];
    for(var i = 0; i < n; i++){
      var gx = i % cols, gy = Math.floor(i / cols);
      p.push([(gx + 0.5 + (r() - 0.5) * 0.75) * step,
              (gy + 0.5 + (r() - 0.5) * 0.75) * step]);
    }
    return p;
  }

  function counts(pts){
    var c = new Array(CELLS).fill(0);
    pts.forEach(function(q){
      var cx = Math.min(SIDE - 1, Math.floor(q[0] / SZ * SIDE));
      var cy = Math.min(SIDE - 1, Math.floor(q[1] / SZ * SIDE));
      c[cy * SIDE + cx]++;
    });
    return c;
  }
  function hist(c){
    var h = [0,0,0,0,0,0];
    c.forEach(function(v){ h[Math.min(v, 5)]++; });
    return h;
  }
  function poissonHist(n){
    var lam = n / CELLS, h = [], acc = 0, term = Math.exp(-lam);
    for(var k = 0; k < 5; k++){
      h.push(term * CELLS); acc += term * CELLS;
      term = term * lam / (k + 1);
    }
    h.push(Math.max(0, CELLS - acc));
    return h;
  }

  var A, B;

  function build(){
    var n = Math.round(parseFloat(sN.value));
    document.getElementById('vPoints').textContent = n + ' 个点';
    var r = rng(seed);
    var real = uniformPts(r, n), even = evenPts(r, n);
    realIsA = r() < 0.5;
    A = realIsA ? real : even;
    B = realIsA ? even : real;
    revealed = false;
    draw();
  }

  function paint(svg, pts){
    svg.innerHTML = pts.map(function(q){
      return '<circle class="dot s" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="2.4"/>';
    }).join('');
  }

  function draw(){
    paint(svgA, A);
    paint(document.getElementById('dotsB'), B);

    var real = realIsA ? A : B;
    var n = real.length;
    var obs = hist(counts(real));
    var evenObs = hist(counts(realIsA ? B : A));
    var exp = poissonHist(n);

    var rows = ['<tr><th>一格里落了几个点</th><th>真随机那张（实际）</th><th>泊松分布预测</th><th>「均匀」那张</th></tr>'];
    for(var k = 0; k <= 5; k++){
      rows.push('<tr><td>' + (k === 5 ? '5 个及以上' : k + ' 个') + '</td><td class="s">' +
        obs[k] + ' 格</td><td>' + exp[k].toFixed(1) + ' 格</td><td class="k">' +
        evenObs[k] + ' 格</td></tr>');
    }
    document.getElementById('histTable').innerHTML = rows.join('');

    var mx = Math.max.apply(null, counts(real));
    var empty = obs[0];
    document.getElementById('nEmpty').textContent = empty + ' 格';
    document.getElementById('nMax').textContent = mx + ' 个';
    document.getElementById('nLam').textContent = (n / CELLS).toFixed(2);

    var v = document.getElementById('verdict');
    if(!revealed){
      v.innerHTML = '两张图撒了同样多的点。<b>一张是真随机，另一张是「均匀」的。</b>先用眼睛判断，再点按钮揭晓——然后对照下面的格子计数表。';
    } else {
      v.innerHTML = '<b>答案：图' + (realIsA ? '甲' : '乙') + '是真随机的，图' + (realIsA ? '乙' : '甲') +
        '是「均匀」的。</b>真随机那张有明显的空白区和扎堆，格子计数几乎完美贴合泊松分布；' +
        '「均匀」那张几乎每格都有点、没有空洞——<b>而人眼觉得后者「更随机」。</b>' +
        '现实里那些「异常聚集」的报道，比较的往往正是后一种想象中的均匀。';
    }
  }

  document.getElementById('gA').addEventListener('click', function(){ revealed = true; draw(); });
  document.getElementById('gB').addEventListener('click', function(){ revealed = true; draw(); });
  document.getElementById('respread').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    build();
  });
  sN.addEventListener('input', build);
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ sN.value = b.getAttribute('data-p'); build(); });
  });

  build();
})();
