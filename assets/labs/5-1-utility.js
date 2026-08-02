/* 5.1 期望值 ≠ 好决策 — 线性效用 vs 对数效用
   同一个赌局，用两把尺子量：
   · 线性（期望值）：只看平均能赚多少，和你有多少身家无关
   · 对数（期望效用）：看财富的相对变化，输光对应负无穷，因此天然厌恶破产
   曲线画的是「下注比例 → 对数效用下的确定性等价」，它有个峰——那个峰就是 5.2 的凯利比例。 */
(function(){
  var svg = document.getElementById('ceCurve');
  if(!svg) return;

  var sW = document.getElementById('sWealth'),
      sF = document.getElementById('sFrac'),
      sP = document.getElementById('sProb');

  var W = 600, H = 220, L = 66, R = 14, T = 14, B = 40;
  var GAIN = 1.5;   /* 赢了拿回本金再加 1.5 倍 */

  function money(v){
    var a = Math.abs(v);
    if(a >= 1e8) return (v/1e8).toFixed(2) + ' 亿';
    if(a >= 1e4) return (v/1e4).toFixed(a >= 1e6 ? 0 : 1) + ' 万';
    return Math.round(v).toLocaleString('en-US');
  }

  /* 对数效用下的确定性等价：让你无差别的那个「确定拿到手的钱」 */
  function ce(w, f, p){
    var up = w * (1 + GAIN * f), dn = w * (1 - f);
    if(dn <= 0) return -w;                      /* 全押且输 → 归零，对数发散 */
    return Math.exp(p * Math.log(up) + (1 - p) * Math.log(dn)) - w;
  }

  function render(){
    var w = Math.round(Math.pow(10, parseFloat(sW.value)));
    var f = parseFloat(sF.value) / 100;
    var p = parseFloat(sP.value) / 100;

    document.getElementById('vWealth').textContent = money(w) + ' 元';
    document.getElementById('vFrac').textContent = (f * 100).toFixed(0) + '%（' + money(w * f) + ' 元）';
    document.getElementById('vProb').textContent = (p * 100).toFixed(0) + '%';

    var stake = w * f;
    var ev = p * GAIN * stake - (1 - p) * stake;   /* 线性期望值 */
    var c = ce(w, f, p);

    document.getElementById('nEv').textContent = (ev >= 0 ? '+' : '−') + money(Math.abs(ev)) + ' 元';
    document.getElementById('nEv').className = 'n' + (ev >= 0 ? '' : ' s');
    document.getElementById('nCe').textContent = (c >= 0 ? '+' : '−') + money(Math.abs(c)) + ' 元';
    document.getElementById('nCe').className = 'n' + (c >= 0 ? '' : ' s');

    /* 凯利最优比例：f* = p − (1−p)/GAIN，见 5.2 */
    var kel = Math.max(0, p - (1 - p) / GAIN);
    document.getElementById('nKelly').textContent = (kel * 100).toFixed(1) + '%';

    document.getElementById('advEv').textContent = ev > 0 ? '接受' : ev < 0 ? '拒绝' : '无所谓';
    document.getElementById('advEv').className = 'n' + (ev > 0 ? '' : ' s');
    document.getElementById('advCe').textContent = c > 0 ? '接受' : '拒绝';
    document.getElementById('advCe').className = 'n' + (c > 0 ? '' : ' s');

    /* 曲线：下注比例 0→100% 时的确定性等价 */
    var vals = [], mx = 0, mn = 0;
    for(var i = 0; i <= 100; i++){
      var v = ce(w, i / 100, p);
      vals.push(v);
      if(v > mx) mx = v;
      if(v < mn) mn = v;
    }
    if(mn === 0 && mx === 0) mx = 1;
    var pad = (mx - mn) * 0.1 || 1;
    var hi = mx + pad, lo = mn - pad;
    function X(i){ return L + i / 100 * (W - L - R); }
    function Y(v){ return T + (hi - v) / (hi - lo) * (H - T - B); }

    document.getElementById('ceLine').setAttribute('points',
      vals.map(function(v, i){ return X(i) + ',' + Y(v); }).join(' '));
    document.getElementById('zeroRef').setAttribute('y1', Y(0));
    document.getElementById('zeroRef').setAttribute('y2', Y(0));
    var kx = X(kel * 100);
    document.getElementById('kellyRef').setAttribute('x1', kx);
    document.getElementById('kellyRef').setAttribute('x2', kx);
    document.getElementById('nowDot').setAttribute('cx', X(f * 100));
    document.getElementById('nowDot').setAttribute('cy', Y(c));
    document.getElementById('yHi').textContent = money(hi);
    document.getElementById('yLo').textContent = money(lo);

    document.getElementById('story').innerHTML =
      '身家 <b>' + money(w) + ' 元</b>，押上其中 <b>' + (f * 100).toFixed(0) + '%（' + money(stake) +
      ' 元）</b>：赢了（' + (p * 100).toFixed(0) + '%）赚 ' + money(GAIN * stake) +
      ' 元，输了（' + ((1 - p) * 100).toFixed(0) + '%）亏 ' + money(stake) + ' 元。<br>' +
      '<b>期望值说：</b>平均每次 ' + (ev >= 0 ? '赚 ' : '亏 ') + money(Math.abs(ev)) + ' 元，' +
      (ev > 0 ? '所以该赌。' : '所以别赌。') +
      '<br><b>对数效用说：</b>这个赌局值 ' + (c >= 0 ? '' : '负 ') + money(Math.abs(c)) + ' 元，' +
      (c > 0 ? '可以接受。' : '<b style="color:var(--sick)">不该接受——即便期望值是正的。</b>');
  }

  [sW, sF, sP].forEach(function(s){ s.addEventListener('input', render); });
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sW.value = v[0]; sF.value = v[1]; sP.value = v[2];
      render();
    });
  });

  render();
})();
