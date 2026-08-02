/* 1.1 概率是什么 — 抛硬币收敛模拟器
   横轴对数刻度：短序列的剧烈摆动与长序列的收敛能同框看到。
   默认用固定种子渲染，保证正文/打印版里写的数字与页面一致；
   「再抛一轮」换种子，让读者看到收敛是规律、不是这一轮的巧合。 */
(function(){
  var svg = document.getElementById('convChart');
  if(!svg) return;

  /* mulberry32：可复现的伪随机数，只为让默认画面稳定 */
  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var W = 600, H = 230, L = 42, R = 10, T = 12, B = 30;
  var MAXN = 10000;
  var seed = 20260803;          /* 默认种子 */
  var n = 1000;

  var sl = document.getElementById('nFlips');
  var poly = document.getElementById('convLine');
  var seqBox = document.getElementById('seqStrip');

  function x(i){ /* i 从 1 起，log10 映射到 [L, W-R] */
    return L + (Math.log10(i) / Math.log10(MAXN)) * (W - L - R);
  }
  function y(f){ return T + (1 - f) * (H - T - B); }

  function run(){
    var rand = rng(seed);
    var heads = 0, pts = [], flips = [];
    var next = 1, step;
    for(var i = 1; i <= n; i++){
      var h = rand() < 0.5;
      if(h) heads++;
      if(i <= 60) flips.push(h);
      /* 前 100 次全画，之后按对数抽稀，避免上万个点 */
      if(i <= 100 || i >= next){
        pts.push(x(i) + ',' + y(heads / i));
        step = Math.max(1, Math.floor(i * 0.02));
        next = i + step;
      }
    }
    pts.push(x(n) + ',' + y(heads / n));

    poly.setAttribute('points', pts.join(' '));

    var freq = heads / n;
    document.getElementById('nHeads').textContent = heads;
    document.getElementById('nFreq').textContent = (freq * 100).toFixed(1) + '%';
    document.getElementById('nDev').textContent =
      (freq >= 0.5 ? '+' : '−') + (Math.abs(freq - 0.5) * 100).toFixed(1);

    seqBox.innerHTML = '';
    flips.forEach(function(h){
      var e = document.createElement('i');
      e.className = h ? 'h' : 't';
      e.textContent = h ? '正' : '反';
      seqBox.appendChild(e);
    });

    document.getElementById('vN').textContent = n + ' 次';
  }

  sl.addEventListener('input', function(){
    /* 滑块走 1..40，映射到 10..10000 的对数刻度，低端才有足够分辨率 */
    var v = parseFloat(sl.value);
    n = Math.round(Math.pow(10, 1 + (v - 1) / 39 * 3));
    run();
  });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      n = parseInt(b.getAttribute('data-p'), 10);
      sl.value = 1 + (Math.log10(n) - 1) / 3 * 39;
      run();
    });
  });

  document.getElementById('reflip').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    run();
  });

  run();
})();
