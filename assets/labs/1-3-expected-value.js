/* 1.3 期望值 — 钱包曲线模拟器
   每注 2 元，中奖概率 1/N，中了拿 M 元。跑上万注，把钱包余额画出来，
   和期望值直线并排比：realized 曲线怎么围着理论直线抖，抖多大。
   默认固定种子，保证正文与打印版里的数字就是读者看到的数字。 */
(function(){
  var svg = document.getElementById('walletChart');
  if(!svg) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var W = 600, H = 250, L = 62, R = 12, T = 12, B = 30;
  var COST = 2;                 /* 每注票价，固定 */
  /* 选这个种子是有意的：它给出 12 次中奖，于是「绝对公平」预设的实际终值是
     +4000 而不是恰好 0——期望值为零不等于结果为零，正文要讲的就是这件事。 */
  var seed = 39595;

  var sOdds = document.getElementById('sOdds'),
      sPrize = document.getElementById('sPrize'),
      sDraws = document.getElementById('sDraws');

  var line = document.getElementById('walletLine'),
      evLine = document.getElementById('evLine'),
      zero = document.getElementById('zeroLine'),
      yTop = document.getElementById('yTop'),
      yMid = document.getElementById('yMid'),
      yBot = document.getElementById('yBot');

  function fmt(v){
    var a = Math.abs(v);
    if(a >= 10000) return (v/10000).toFixed(1) + ' 万';
    return Math.round(v).toLocaleString('en-US');
  }

  function run(){
    var N = Math.round(parseFloat(sOdds.value));      /* 中奖概率 = 1/N */
    var M = Math.round(parseFloat(sPrize.value));     /* 奖金 */
    var n = Math.round(parseFloat(sDraws.value));

    document.getElementById('vOdds').textContent = '1 / ' + N.toLocaleString('en-US');
    document.getElementById('vPrize').textContent = M.toLocaleString('en-US') + ' 元';
    document.getElementById('vDraws').textContent = n.toLocaleString('en-US') + ' 注';

    var ev = M / N - COST;                            /* 每注期望值 */
    var rand = rng(seed), bal = 0, wins = 0, pts = [], mn = 0, mx = 0;
    var vals = new Array(n + 1);
    vals[0] = 0;
    for(var i = 1; i <= n; i++){
      bal -= COST;
      if(rand() < 1 / N){ bal += M; wins++; }
      vals[i] = bal;
      if(bal < mn) mn = bal;
      if(bal > mx) mx = bal;
    }
    var evEnd = ev * n;
    mn = Math.min(mn, evEnd, 0); mx = Math.max(mx, evEnd, 0);
    var pad = (mx - mn) * 0.08 || 1;
    mn -= pad; mx += pad;

    function y(v){ return T + (mx - v) / (mx - mn) * (H - T - B); }
    function x(i){ return L + i / n * (W - L - R); }

    var stride = Math.max(1, Math.floor(n / 700));
    for(var j = 0; j <= n; j += stride) pts.push(x(j) + ',' + y(vals[j]));
    pts.push(x(n) + ',' + y(vals[n]));
    line.setAttribute('points', pts.join(' '));

    evLine.setAttribute('x1', L); evLine.setAttribute('y1', y(0));
    evLine.setAttribute('x2', x(n)); evLine.setAttribute('y2', y(evEnd));
    zero.setAttribute('x1', L); zero.setAttribute('y1', y(0));
    zero.setAttribute('x2', W - R); zero.setAttribute('y2', y(0));

    yTop.textContent = fmt(mx); yTop.setAttribute('y', y(mx) + 4);
    yMid.textContent = fmt((mx + mn) / 2); yMid.setAttribute('y', y((mx + mn) / 2) + 4);
    yBot.textContent = fmt(mn); yBot.setAttribute('y', y(mn) + 4);

    document.getElementById('nEv').textContent = (ev >= 0 ? '+' : '−') + Math.abs(ev).toFixed(2) + ' 元';
    document.getElementById('nEv').className = 'n' + (ev >= 0 ? ' ' : ' s');
    document.getElementById('nTheory').textContent = fmt(evEnd) + ' 元';
    document.getElementById('nReal').textContent = fmt(vals[n]) + ' 元';
    document.getElementById('nReal').className = 'n' + (vals[n] >= 0 ? '' : ' s');
    document.getElementById('nWins').textContent = wins + ' 次';
    document.getElementById('nPayback').textContent = (M / N / COST * 100).toFixed(0) + '%';
  }

  [sOdds, sPrize, sDraws].forEach(function(s){ s.addEventListener('input', run); });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sOdds.value = v[0]; sPrize.value = v[1]; sDraws.value = v[2];
      run();
    });
  });

  document.getElementById('replay').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    run();
  });

  run();
})();
