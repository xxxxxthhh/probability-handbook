/* 3.3 辛普森悖论 — 气泡图，聚合 / 分组两视角
   横轴 = 这个「格子」（院系 / 病情分组）整体有多好过，纵轴 = 该组在格子里的成功率。
   气泡面积 ∝ 样本量。分组视角看到 12 个气泡，聚合视角塌缩成 2 个——
   两个气泡的上下关系会翻过来，而那 12 个一个没动。 */
(function(){
  var svg = document.getElementById('bubbleSvg');
  if(!svg) return;

  /* 伯克利 1973 年秋季，六个最大院系（Bickel, Hammel & O'Connell, Science 1975）
     数值即 R 语言 UCBAdmissions 数据集 */
  var BERK = {
    title:'加州大学伯克利分校 1973 年研究生录取 · 六个最大院系',
    xlab:'该院系整体录取率（越靠右越好进）',
    unitA:'男性申请者', unitB:'女性申请者',
    cell:'院系',
    rows:[
      {n:'A', aT:825, aY:512, bT:108, bY:89},
      {n:'B', aT:560, aY:353, bT:25,  bY:17},
      {n:'C', aT:325, aY:120, bT:593, bY:202},
      {n:'D', aT:417, aY:138, bT:375, bY:131},
      {n:'E', aT:191, aY:53,  bT:393, bY:94},
      {n:'F', aT:373, aY:22,  bT:341, bY:24}
    ]
  };

  /* 肾结石：开放手术 vs 经皮肾镜（Charig 等, BMJ 1986） */
  var STONE = {
    title:'肾结石两种疗法的成功率 · 按结石大小分组',
    xlab:'该组整体成功率（越靠右越好治）',
    unitA:'开放手术', unitB:'经皮肾镜取石',
    cell:'结石',
    rows:[
      {n:'小结石', aT:87,  aY:81,  bT:270, bY:234},
      {n:'大结石', aT:263, aY:192, bT:80,  bY:55}
    ]
  };

  /* 反事实：保持伯克利每个院系的女性录取率不变，
     只把女性的申请分布换成和男性一样 —— 悖论应当消失 */
  var COUNTER = (function(){
    var r = BERK.rows.map(function(d){
      var rate = d.bY / d.bT;
      return {n:d.n, aT:d.aT, aY:d.aY, bT:d.aT, bY:Math.round(d.aT * rate)};
    });
    return {
      title:'反事实：女性各系录取率不变，但改为和男性投一样的系',
      xlab:'该院系整体录取率（越靠右越好进）',
      unitA:'男性申请者', unitB:'女性申请者（重新分配）',
      cell:'院系', rows:r
    };
  })();

  var DATA = {berkeley:BERK, stone:STONE, counter:COUNTER};
  var cur = BERK, mode = 'grouped';

  var W = 600, H = 330, L = 52, R = 16, T = 16, B = 46;
  function x(p){ return L + p * (W - L - R); }
  function y(p){ return T + (1 - p) * (H - T - B); }

  function render(){
    var rows = cur.rows;
    var aT = 0, aY = 0, bT = 0, bY = 0;
    rows.forEach(function(d){ aT += d.aT; aY += d.aY; bT += d.bT; bY += d.bY; });

    var maxN = 0;
    rows.forEach(function(d){ maxN = Math.max(maxN, d.aT, d.bT); });
    function rad(n){ return 5 + 26 * Math.sqrt(n / maxN); }

    var parts = [];
    /* 对角线：气泡在线上方 = 该组比这个格子的平均水平更好 */
    parts.push('<line class="ref" x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(1) + '" y2="' + y(1) + '"/>');

    if(mode === 'grouped'){
      rows.forEach(function(d){
        var cellRate = (d.aY + d.bY) / (d.aT + d.bT);
        var ra = d.aY / d.aT, rb = d.bY / d.bT;
        parts.push('<line class="gridline" x1="' + x(cellRate) + '" y1="' + y(ra) +
                   '" x2="' + x(cellRate) + '" y2="' + y(rb) + '"/>');
        parts.push('<circle class="bubble k" cx="' + x(cellRate) + '" cy="' + y(ra) + '" r="' + rad(d.aT) + '"/>');
        parts.push('<circle class="bubble s" cx="' + x(cellRate) + '" cy="' + y(rb) + '" r="' + rad(d.bT) + '"/>');
        parts.push('<text class="strong" x="' + x(cellRate) + '" y="' + (H - B + 18) +
                   '" text-anchor="middle">' + d.n + '</text>');
      });
    } else {
      var all = (aY + bY) / (aT + bT);
      var maxT = Math.max(aT, bT);
      var ra2 = aY / aT, rb2 = bY / bT;
      parts.push('<line class="gridline" x1="' + x(all) + '" y1="' + y(ra2) +
                 '" x2="' + x(all) + '" y2="' + y(rb2) + '"/>');
      parts.push('<circle class="bubble k" cx="' + x(all) + '" cy="' + y(ra2) + '" r="' + (5 + 26 * Math.sqrt(aT / maxT)) + '"/>');
      parts.push('<circle class="bubble s" cx="' + x(all) + '" cy="' + y(rb2) + '" r="' + (5 + 26 * Math.sqrt(bT / maxT)) + '"/>');
      parts.push('<text class="strong" x="' + x(all) + '" y="' + (H - B + 18) + '" text-anchor="middle">全部合并</text>');
    }
    document.getElementById('bubbleLayer').innerHTML = parts.join('');

    /* 读数 */
    var rA = aY / aT * 100, rB = bY / bT * 100;
    document.getElementById('nA').textContent = rA.toFixed(1) + '%';
    document.getElementById('nB').textContent = rB.toFixed(1) + '%';
    document.getElementById('lA').textContent = cur.unitA + '（合计）';
    document.getElementById('lB').textContent = cur.unitB + '（合计）';
    document.getElementById('labUnitA').textContent = cur.unitA;
    document.getElementById('labUnitB').textContent = cur.unitB;
    document.getElementById('xlab').textContent = cur.xlab;
    document.getElementById('caseTitle').textContent = cur.title;

    /* 分组里各自占优的格子数 */
    var winB = rows.filter(function(d){ return d.bY / d.bT > d.aY / d.aT; }).length;
    var winA = rows.filter(function(d){ return d.aY / d.aT > d.bY / d.bT; }).length;
    document.getElementById('nSplit').textContent = winA + ' : ' + winB;

    /* 表格（同时充当打印回退） */
    var t = ['<tr><th>' + cur.cell + '</th><th>' + cur.unitA + '</th><th>录取/成功率</th><th>' +
             cur.unitB + '</th><th>录取/成功率</th></tr>'];
    rows.forEach(function(d){
      var ra = d.aY / d.aT * 100, rb = d.bY / d.bT * 100;
      t.push('<tr><td>' + d.n + '</td><td>' + d.aY + ' / ' + d.aT + '</td><td' +
             (ra > rb ? ' class="k"' : '') + '>' + ra.toFixed(1) + '%</td><td>' +
             d.bY + ' / ' + d.bT + '</td><td' + (rb > ra ? ' class="s"' : '') + '>' +
             rb.toFixed(1) + '%</td></tr>');
    });
    t.push('<tr class="total"><td>合计</td><td>' + aY + ' / ' + aT + '</td><td' +
           (rA > rB ? ' class="k"' : '') + '>' + rA.toFixed(1) + '%</td><td>' + bY + ' / ' + bT +
           '</td><td' + (rB > rA ? ' class="s"' : '') + '>' + rB.toFixed(1) + '%</td></tr>');
    document.getElementById('dataTable').innerHTML = t.join('');

    /* 翻转要双向判定：伯克利是「分组占优方在合并里输了」，
       肾结石是反过来的同一件事。只判一个方向会漏掉一半的悖论。 */
    var groupWinner = winA > winB ? 'A' : winB > winA ? 'B' : null;
    var aggWinner = rA > rB ? 'A' : rB > rA ? 'B' : null;
    var flipped = groupWinner && aggWinner && groupWinner !== aggWinner;
    var gName = groupWinner === 'A' ? cur.unitA : cur.unitB;

    document.getElementById('verdict').innerHTML =
      '<b>分组看：</b>' + (groupWinner
        ? gName + ' 在 <b>' + Math.max(winA, winB) + ' / ' + rows.length + '</b> 个' + cur.cell + '里更高'
        : '两边各有胜负') +
      '。　<b>合并看：</b>' + cur.unitA + ' <b>' + rA.toFixed(1) + '%</b> vs ' +
      cur.unitB + ' <b>' + rB.toFixed(1) + '%</b>——' +
      (flipped
        ? '<b style="color:var(--sick)">结论翻转了。</b>'
        : '两个视角的结论方向一致，没有翻转。');
  }

  document.querySelectorAll('.segmented button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.segmented button').forEach(function(t){ t.classList.remove('on'); });
      b.classList.add('on');
      mode = b.getAttribute('data-m');
      render();
    });
  });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      cur = DATA[b.getAttribute('data-p')];
      render();
    });
  });

  render();
})();
