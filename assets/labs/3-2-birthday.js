/* 3.2 生日悖论 — 配对连线 + 概率曲线 + 千间房模拟
   连线图是本章的主角：把 n 个人摆成一圈，画出所有配对。
   人数一多，图会糊成一团——那团糊正是 n(n−1)/2 的样子。 */
(function(){
  var svgPairs = document.getElementById('pairSvg');
  if(!svgPairs) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var MAXLINES = 50;    /* 超过这个人数就不画线了——再画只是一坨墨 */
  var seed = 90210;
  var sN = document.getElementById('sPeople');

  function pAny(n){                    /* P(至少两人同一天) */
    var q = 1;
    for(var k = 0; k < n; k++) q *= (365 - k) / 365;
    return 1 - q;
  }
  function pMe(n){                     /* P(有人和「我」同一天) */
    return 1 - Math.pow(364 / 365, n - 1);
  }

  /* 概率曲线只需算一次 */
  (function drawCurve(){
    var W = 600, H = 170, L = 44, R = 12, T = 12, B = 30, MAX = 100;
    function x(n){ return L + n / MAX * (W - L - R); }
    function y(p){ return T + (1 - p) * (H - T - B); }
    var a = [], b = [];
    for(var n = 1; n <= MAX; n++){ a.push(x(n) + ',' + y(pAny(n))); b.push(x(n) + ',' + y(pMe(n))); }
    document.getElementById('curveAny').setAttribute('points', a.join(' '));
    document.getElementById('curveMe').setAttribute('points', b.join(' '));
    document.getElementById('curveMark').setAttribute('x1', x(23));
    document.getElementById('curveMark').setAttribute('x2', x(23));
  })();

  function simulate(n, rounds){
    var r = rng(seed), hit = 0;
    for(var i = 0; i < rounds; i++){
      var seen = {}, dup = false;
      for(var j = 0; j < n; j++){
        var d = Math.floor(r() * 365);
        if(seen[d]) { dup = true; break; }
        seen[d] = 1;
      }
      if(dup) hit++;
    }
    return hit;
  }

  function render(){
    var n = Math.round(parseFloat(sN.value));
    var pairs = n * (n - 1) / 2;

    document.getElementById('vPeople').textContent = n + ' 人';
    document.getElementById('nPairs').textContent = pairs.toLocaleString('en-US') + ' 对';
    document.getElementById('nAny').textContent = (pAny(n) * 100).toFixed(1) + '%';
    document.getElementById('nMe').textContent = (pMe(n) * 100).toFixed(1) + '%';

    /* 配对连线：n 个点摆一圈，两两连线 */
    var cx = 150, cy = 150, rad = 128;
    var parts = [];
    var pos = [];
    for(var i = 0; i < n; i++){
      var a = -Math.PI / 2 + i / n * Math.PI * 2;
      pos.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
    }
    if(n <= MAXLINES){
      for(var p = 0; p < n; p++)
        for(var q = p + 1; q < n; q++)
          parts.push('<line class="link" x1="' + pos[p][0].toFixed(1) + '" y1="' + pos[p][1].toFixed(1) +
                     '" x2="' + pos[q][0].toFixed(1) + '" y2="' + pos[q][1].toFixed(1) + '"/>');
    }
    for(var m = 0; m < n; m++)
      parts.push('<circle class="dot" cx="' + pos[m][0].toFixed(1) + '" cy="' + pos[m][1].toFixed(1) +
                 '" r="' + (n > 60 ? 3 : 5) + '"/>');
    svgPairs.innerHTML = parts.join('');

    document.getElementById('pairNote').textContent = n <= MAXLINES
      ? n + ' 个人之间有 ' + pairs.toLocaleString('en-US') + ' 条配对关系，每一条都是一次「撞上生日」的机会。'
      : n + ' 个人有 ' + pairs.toLocaleString('en-US') + ' 对——线太多已经糊成一团，索性不画了。这正是问题所在：配对数按人数的平方涨，而直觉是按人数线性估的。';

    var hit = simulate(n, 1000);
    document.getElementById('nSim').textContent = (hit / 10).toFixed(1) + '%';
    document.getElementById('nAny2').textContent = (pAny(n) * 100).toFixed(1) + '%';
    document.getElementById('simNote').innerHTML =
      '随机生成 <b>1000</b> 个 ' + n + ' 人的房间，其中 <b>' + hit +
      '</b> 间出现了同一天生日 → 实测 <b>' + (hit / 10).toFixed(1) +
      '%</b>，理论值 <b>' + (pAny(n) * 100).toFixed(1) + '%</b>。';
  }

  sN.addEventListener('input', render);

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      sN.value = b.getAttribute('data-p');
      render();
    });
  });

  document.getElementById('resim').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    render();
  });

  render();
})();
