/* 5.3 肥尾与黑天鹅 — 正态 vs 肥尾的尾部对照
   用标准化的学生 t 分布当「肥尾」的代表：自由度 ν 越小尾越厚，
   ν 很大时几乎与正态重合。两条密度曲线画在对数纵轴上——
   肥尾的差别全在尾巴上，线性纵轴根本看不见。
   下方表格把「几个标准差的事件」翻译成「多少年一遇」，这才是直觉能抓住的形式。 */
(function(){
  var svg = document.getElementById('tailChart');
  if(!svg) return;

  var TRADING = 252;    /* 一年的交易日 */
  var sNu = document.getElementById('sNu');

  function lgamma(x){   /* Lanczos 近似，够画图和算表用 */
    var g = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var xx = x, y = x, tmp = xx + 5.5;
    tmp -= (xx + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for(var j = 0; j < 6; j++) ser += g[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / xx);
  }

  /* 标准化后的 t 密度：方差缩放到 1，这样「几个标准差」才是可比的 */
  function tPdf(x, nu){
    var s = Math.sqrt(nu / (nu - 2));            /* 原始 t 的标准差 */
    var z = x * s;
    var c = Math.exp(lgamma((nu + 1) / 2) - lgamma(nu / 2)) / Math.sqrt(nu * Math.PI);
    return c * Math.pow(1 + z * z / nu, -(nu + 1) / 2) * s;
  }
  function nPdf(x){ return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }

  /* 双侧尾概率 P(|X| > k)，数值积分 */
  function tailP(k, nu){
    var hi = Math.max(k + 60, k * 8), n = 4000, h = (hi - k) / n, s = 0;
    for(var i = 0; i <= n; i++){
      var x = k + i * h;
      var w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      s += w * (nu ? tPdf(x, nu) : nPdf(x));
    }
    return 2 * s * h / 3;
  }

  function everyN(p){
    if(p <= 0) return '几乎不可能';
    var days = 1 / p, yrs = days / TRADING;
    if(yrs < 1) return Math.round(days) + ' 天一遇';
    if(yrs < 1e4) return Math.round(yrs).toLocaleString('en-US') + ' 年一遇';
    if(yrs < 1e9) return (yrs / 1e4).toFixed(0) + ' 万年一遇';
    if(yrs < 1e13) return (yrs / 1e8).toFixed(0) + ' 亿年一遇';
    return '10^' + Math.round(Math.log10(yrs)) + ' 年一遇';
  }

  var W = 600, H = 230, L = 58, R = 14, T = 14, B = 36;
  var XMAX = 6, YLO = -9;    /* 纵轴 log10 密度，画到 1e-9 */

  function render(){
    var nu = parseFloat(sNu.value);
    document.getElementById('vNu').textContent =
      nu >= 25 ? nu.toFixed(0) + '（几乎就是正态）' : nu.toFixed(1);

    function X(x){ return L + x / XMAX * (W - L - R); }
    function Y(d){
      var l = Math.log10(Math.max(d, 1e-12));
      return T + (0 - l) / (0 - YLO) * (H - T - B);
    }

    var nPts = [], tPts = [];
    for(var i = 0; i <= 240; i++){
      var x = i / 240 * XMAX;
      nPts.push(X(x).toFixed(1) + ',' + Y(nPdf(x)).toFixed(1));
      tPts.push(X(x).toFixed(1) + ',' + Y(tPdf(x, nu)).toFixed(1));
    }
    document.getElementById('normLine').setAttribute('points', nPts.join(' '));
    document.getElementById('fatLine').setAttribute('points', tPts.join(' '));

    var rows = ['<tr><th>事件规模</th><th>正态分布说</th><th>当前肥尾说</th><th>差多少倍</th></tr>'];
    [3, 4, 5, 6, 8].forEach(function(k){
      var pn = tailP(k, 0), pt = tailP(k, nu);
      rows.push('<tr><td>' + k + ' 个标准差</td><td>' + everyN(pn) + '</td><td class="s">' +
        everyN(pt) + '</td><td class="k">' + (pt / pn >= 1e4 ? (pt / pn).toExponential(0) :
          Math.round(pt / pn).toLocaleString('en-US')) + ' ×</td></tr>');
    });
    document.getElementById('tailTable').innerHTML = rows.join('');

    var p5n = tailP(5, 0), p5t = tailP(5, nu);
    document.getElementById('nNorm5').textContent = everyN(p5n);
    document.getElementById('nFat5').textContent = everyN(p5t);
    document.getElementById('nRatio5').textContent =
      (p5t / p5n >= 1e4 ? (p5t / p5n).toExponential(0) : Math.round(p5t / p5n).toLocaleString('en-US')) + ' 倍';

    document.getElementById('story').innerHTML =
      '两条曲线在中间几乎完全重合——<b>日常波动看不出任何区别</b>。' +
      '差别全在尾巴上：一次「5 个标准差」的事件，正态分布说 <b>' + everyN(p5n) +
      '</b>，当前肥尾说 <b>' + everyN(p5t) + '</b>，相差 <b>' +
      (p5t / p5n >= 1e4 ? (p5t / p5n).toExponential(0) : Math.round(p5t / p5n).toLocaleString('en-US')) +
      ' 倍</b>。<br><b>用正态分布去管理肥尾世界的风险，日常毫无破绽，出事时一次亏光。</b>';
  }

  sNu.addEventListener('input', render);
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ sNu.value = b.getAttribute('data-p'); render(); });
  });

  render();
})();
