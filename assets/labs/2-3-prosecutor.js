/* 2.3 检察官谬误 — DNA 匹配计算器
   模型：嫌疑人池共 P 人，其中恰有 1 人是真凶，池内先验均等。
   DNA 的似然比 = N（真凶必匹配，无辜者匹配概率 1/N）。
   其他证据用一个额外的似然比 L 表示。
   后验赔率 = 1/(P−1) × L × N —— 与 2.2 的赔率形式是同一台机器。 */
(function(){
  var grid = document.getElementById('mGrid');
  if(!grid) return;

  var sPool = document.getElementById('sPool'),
      sRand = document.getElementById('sRand'),
      sOther = document.getElementById('sOther');

  var MAXDOTS = 80;

  function human(v){
    if(v >= 1e8) return (v/1e8).toFixed(1).replace(/\.0$/,'') + ' 亿';
    if(v >= 1e4) return (v/1e4).toFixed(v >= 1e6 ? 0 : 1).replace(/\.0$/,'') + ' 万';
    return Math.round(v).toLocaleString('en-US');
  }

  /* 取两位有效数字：对数滑块落点是 5011872 这种毛数，读起来像精度，
     其实只是刻度的舍入噪声。取整成 500 万，图和正文才对得上。 */
  function nice(v){
    var mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
    return Math.max(2, Math.round(v / mag) * mag);
  }

  function update(){
    /* 滑块走对数刻度，跨度太大，线性刻度没法用 */
    var P = nice(Math.pow(10, parseFloat(sPool.value)));
    var N = nice(Math.pow(10, parseFloat(sRand.value)));
    var L = parseFloat(sOther.value);

    document.getElementById('vPool').textContent = human(P) + ' 人';
    document.getElementById('vRand').textContent = '1 / ' + human(N);
    document.getElementById('vOther').textContent =
      L === 1 ? '1×（没有其他证据）' : L + '×';

    var expFalse = (P - 1) / N;                 /* 池中无辜者里预计有几人也匹配 */
    var odds = (1 / (P - 1)) * L * N;
    var pGuilty = odds / (1 + odds);

    /* 圆点：1 个真凶 + 若干随机匹配者 */
    var shown = Math.min(Math.round(expFalse), MAXDOTS - 1);
    grid.innerHTML = '';
    var one = document.createElement('i'); one.className = 's'; grid.appendChild(one);
    for(var i = 0; i < shown; i++){
      var e = document.createElement('i'); e.className = 'a'; grid.appendChild(e);
    }
    document.getElementById('dotNote').textContent =
      expFalse < 0.01
        ? '池子里预计连 0.01 个随机匹配者都凑不出——匹配上的几乎只可能是真凶。'
        : '红点 = 真凶；琥珀点 = 碰巧也匹配的无辜者，预计约 ' +
          (expFalse < 1 ? expFalse.toFixed(2) : Math.round(expFalse)) + ' 人' +
          (Math.round(expFalse) > MAXDOTS - 1 ? '（图中只画了 ' + (MAXDOTS-1) + ' 个）' : '') + '。';

    document.getElementById('nPros').textContent = '1 / ' + human(N);
    document.getElementById('nReal').textContent = (pGuilty * 100).toFixed(
      pGuilty > 0.999 ? 2 : 1) + '%';
    document.getElementById('nExp').textContent =
      expFalse < 1 ? expFalse.toFixed(2) + ' 人' : Math.round(expFalse) + ' 人';

    document.getElementById('bG').style.width = (pGuilty * 100) + '%';
    document.getElementById('bI').style.width = ((1 - pGuilty) * 100) + '%';

    document.getElementById('story').innerHTML =
      '嫌疑人池 <b>' + human(P) + ' 人</b>，其中 1 人是真凶、' + human(P - 1) +
      ' 人无辜。随机匹配概率 1/' + human(N) + ' → 无辜者里预计有 <b>' +
      (expFalse < 1 ? expFalse.toFixed(2) : Math.round(expFalse)) +
      ' 人</b>也会匹配上。<br>所以「DNA 匹配」的一共约 <b>' +
      (1 + expFalse < 2 ? (1 + expFalse).toFixed(2) : Math.round(1 + expFalse)) +
      ' 人</b>，其中真凶只有 1 人 → 有罪概率 ≈ <b>' + (pGuilty * 100).toFixed(1) + '%</b>。';
  }

  [sPool, sRand, sOther].forEach(function(s){ s.addEventListener('input', update); });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sPool.value = v[0]; sRand.value = v[1]; sOther.value = v[2];
      update();
    });
  });

  update();
})();
