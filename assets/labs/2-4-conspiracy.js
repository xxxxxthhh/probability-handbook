/* 2.4 先验封闭 — 免疫力模拟器
   同一串反驳证据，喂给两个人：一个照实采纳，一个每条都「解释掉」。
   防御性折扣 d 把真实似然比 LR 改写成 LR^(1-d)：
     d = 0   → 照单全收
     d = 1   → LR 变成 1，证据彻底失去信息量
     d > 1   → LR 翻到 1 以上，反驳证据反而加强信念（「他们越否认越可疑」）
   这一条指数正是「不可证伪」在算术上的样子。 */
(function(){
  var list = document.getElementById('evStream');
  if(!list) return;

  var LR = 0.25;   /* 每条反驳证据的真实似然比：把赔率砍到四分之一 */

  var ITEMS = [
    ['官方公开了完整原始数据',        '数据是他们自己造的'],
    ['独立第三方机构复核，结论一致',  '那家机构也被收买了'],
    ['当年的内部人士公开否认',        '他被威胁了，只能这么说'],
    ['一位「关键证人」承认自己编造',  '他是被买通来打击我们的'],
    ['预言的日期过去了，什么也没发生','日期算错了，其实是下个月'],
    ['申请信息公开，拿到了全部文件',  '真正要紧的那份没给'],
    ['多国研究者独立得到相同结果',    '整个学术界都在同一条船上'],
    ['提出者本人承认当初弄错了',      '他被收编了']
  ];

  var sPrior = document.getElementById('sPrior2'),
      sDisc = document.getElementById('sDisc'),
      sCount = document.getElementById('sCount');

  var W = 600, H = 200, L = 46, R = 12, T = 14, B = 34;

  function render(){
    var prior = parseFloat(sPrior.value) / 100;
    var d = parseFloat(sDisc.value);
    var n = Math.round(parseFloat(sCount.value));

    var lrEff = Math.pow(LR, 1 - d);

    document.getElementById('vPrior2').textContent = (prior * 100).toFixed(0) + '%';
    document.getElementById('vCount').textContent = n + ' 条';
    document.getElementById('vDisc').textContent =
      d === 0 ? '0（照单全收）'
      : Math.abs(d - 1) < 0.001 ? '1.00（证据完全失效）'
      : d > 1 ? d.toFixed(2) + '（反证反而加强信念）'
      : d.toFixed(2);
    document.getElementById('vLrEff').textContent = lrEff.toFixed(2) + '×';

    function trace(ratio){
      var odds = prior / (1 - prior), pts = [odds / (1 + odds)];
      for(var i = 0; i < n; i++){ odds *= ratio; pts.push(odds / (1 + odds)); }
      return pts;
    }
    var open = trace(LR), closed = trace(lrEff);

    function x(i){ return L + (n === 0 ? 0 : i / n) * (W - L - R); }
    function y(p){ return T + (1 - p) * (H - T - B); }
    function path(a){ return a.map(function(p, i){ return x(i) + ',' + y(p); }).join(' '); }

    document.getElementById('openLine').setAttribute('points', path(open));
    document.getElementById('closedLine').setAttribute('points', path(closed));

    document.getElementById('nOpen').textContent = fmtP(open[n]);
    document.getElementById('nClosed').textContent = fmtP(closed[n]);

    /* 证据流：每条显示它被打折之后还剩多少力度 */
    list.innerHTML = '';
    for(var j = 0; j < n; j++){
      var li = document.createElement('div');
      li.className = 'evrow';
      li.innerHTML = '<span class="ev">' + ITEMS[j % ITEMS.length][0] + '</span>' +
        '<span class="ex">「' + ITEMS[j % ITEMS.length][1] + '」</span>' +
        '<span class="lrv">' + lrEff.toFixed(2) + '×</span>';
      list.appendChild(li);
    }
  }

  function fmtP(p){
    var v = p * 100;
    if(v < 0.00001) return v.toExponential(1) + '%';
    /* 0.0023% 比 2.3e-3% 好读，而这一档正是「诚实更新」落点所在 */
    if(v < 0.1) return v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '%';
    return v.toFixed(1) + '%';
  }

  [sPrior, sDisc, sCount].forEach(function(s){ s.addEventListener('input', render); });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sPrior.value = v[0]; sDisc.value = v[1]; sCount.value = v[2];
      render();
    });
  });

  render();
})();
