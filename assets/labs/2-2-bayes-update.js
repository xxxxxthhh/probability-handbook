/* 2.2 贝叶斯更新的日常化 — 证据链信念更新器
   赔率形式：后验赔率 = 先验赔率 × 每条证据的似然比。
   证据可以逐条开关，折线记录信念被一条条搬动的轨迹。 */
(function(){
  var box = document.getElementById('evList');
  if(!box) return;

  /* lr：P(看到这条 | 是诈骗) ÷ P(看到这条 | 不是诈骗)。>1 指向诈骗，<1 指向正常。
     这些数值是用于演示的量级估计，不是实测统计量——正文已注明。 */
  var EV = [
    {id:'dom',  t:'发件域名很陌生，和落款公司对不上', lr:3},
    {id:'typo', t:'正文有明显错别字或生硬的翻译腔',   lr:5},
    {id:'urge', t:'要求你「24 小时内」处理，否则冻结', lr:8},
    {id:'greet',t:'称呼是「尊敬的用户」，不是你的名字', lr:4},
    {id:'exe',  t:'附件是 .zip 或 .exe',              lr:20},
    {id:'real', t:'落款的人确实是你认识的同事',        lr:0.5},
    {id:'order',t:'邮件里准确报出了你的订单号',        lr:0.2}
  ];

  var PRESET = {
    normal: {prior:5,  on:['real','order']},
    phish:  {prior:5,  on:['dom','typo','urge','greet']},
    spear:  {prior:5,  on:['urge','exe','order']}
  };

  var active = {};
  var sPrior = document.getElementById('sPrior');

  EV.forEach(function(e){
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = e.id;
    if(e.lr < 1) b.className = 'against';
    b.innerHTML = e.t + '<span class="lr">似然比 ' + e.lr + '×' +
      (e.lr < 1 ? '（指向「不是诈骗」）' : '') + '</span>';
    b.addEventListener('click', function(){
      active[e.id] = !active[e.id];
      render();
    });
    box.appendChild(b);
  });

  var W = 600, H = 190, L = 46, R = 12, T = 14, B = 44;

  function render(){
    var prior = parseFloat(sPrior.value) / 100;
    document.getElementById('vPrior').textContent = (prior * 100).toFixed(1) + '%';

    var odds = prior / (1 - prior);
    var traj = [{label:'先验', p:prior}];
    var used = [];

    EV.forEach(function(e){
      var b = box.querySelector('[data-id="' + e.id + '"]');
      b.classList.toggle('on', !!active[e.id]);
      if(active[e.id]){
        odds *= e.lr;
        used.push(e);
        traj.push({label:'+' + (used.length), p: odds / (1 + odds)});
      }
    });

    var post = odds / (1 + odds);

    /* 折线 */
    var n = Math.max(traj.length - 1, 1);
    function x(i){ return L + (n === 0 ? 0 : i / n) * (W - L - R); }
    function y(p){ return T + (1 - p) * (H - T - B); }
    var pts = traj.map(function(d, i){ return x(i) + ',' + y(d.p); });
    document.getElementById('beliefLine').setAttribute('points', pts.join(' '));

    var dots = document.getElementById('beliefDots');
    dots.innerHTML = '';
    var lbl = document.getElementById('beliefLabels');
    lbl.innerHTML = '';
    traj.forEach(function(d, i){
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x(i)); c.setAttribute('cy', y(d.p)); c.setAttribute('r', 4);
      c.setAttribute('class', 'dot');
      dots.appendChild(c);
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x(i)); t.setAttribute('y', H - 26);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = i === 0 ? '先验' : used[i-1].t.slice(0, 4) + '…';
      lbl.appendChild(t);
    });

    /* 读数 */
    document.getElementById('nPost').textContent = (post * 100).toFixed(1) + '%';
    document.getElementById('nOdds').textContent =
      odds >= 1 ? odds.toFixed(1) + ' : 1' : '1 : ' + (1 / odds).toFixed(1);
    var totalLr = used.reduce(function(a, e){ return a * e.lr; }, 1);
    document.getElementById('nLr').textContent = totalLr >= 1
      ? totalLr.toFixed(1) + '×' : '÷' + (1 / totalLr).toFixed(1);

    document.getElementById('bTp').style.width = (post * 100) + '%';
    document.getElementById('bFp').style.width = ((1 - post) * 100) + '%';

    document.getElementById('freqLine').innerHTML =
      '自然频率版：<b>1000 封</b>同时具备以上特征的邮件里，约有 <b>' +
      Math.round(post * 1000) + ' 封</b>是诈骗，<b>' +
      (1000 - Math.round(post * 1000)) + ' 封</b>是正常邮件。';
  }

  sPrior.addEventListener('input', render);

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var p = PRESET[b.getAttribute('data-p')];
      sPrior.value = p.prior;
      active = {};
      p.on.forEach(function(k){ active[k] = true; });
      render();
    });
  });

  (function init(){
    var p = PRESET.phish;
    sPrior.value = p.prior;
    p.on.forEach(function(k){ active[k] = true; });
    render();
  })();
})();
