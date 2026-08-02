/* 0 导读 — 直觉误差计
   三个场景（体检阳性 / 23 人生日 / 轮盘连红），滑块放上直觉答案，
   与真实答案并排比较。真实答案是常数，来源见正文。 */
(function(){
  var sl = document.getElementById('guessSl');
  if(!sl) return;

  var SC = {
    test: {
      q: '1% 的人患病，检测灵敏度 90%、假阳性率 9%。体检查出阳性——你真的患病的概率是？',
      truth: 9.2, typical: 90,
      legS: '真的患病', legN: '虚惊一场',
      why: '<b>错在哪：</b>基础率忽视——你盯着检测多准，忘了问这病多罕见。健康人基数太大，误报的绝对人数压倒了真阳性。'
    },
    bday: {
      q: '一个 23 人的房间里，存在两个人生日同一天的概率是？',
      truth: 50.7, typical: 5,
      legS: '房间里有同生日的', legN: '全员生日各不相同',
      why: '<b>错在哪：</b>配对数低估——你算的是「有人和我同天」（22 个机会），题目问的是「任意两人同天」（253 对机会）。配对数按人数的平方长。'
    },
    roul: {
      q: '欧式轮盘连开 5 次红，下一把开黑的概率是？',
      truth: 48.6, typical: 75,
      legS: '下一把开黑', legN: '下一把开红或 0',
      why: '<b>错在哪：</b>赌徒谬误——轮盘不记得前五把。18 个黑格 ÷ 37 个格子 = 48.6%，和第一把、第一百把完全一样。'
    }
  };

  var key = 'test';
  var els = {
    q: document.getElementById('qText'),
    v: document.getElementById('vGuess'),
    bg: document.getElementById('barGuess'),
    bt: document.getElementById('barTruth'),
    ng: document.getElementById('nGuess'),
    nt: document.getElementById('nTruth'),
    gap: document.getElementById('nGap'),
    legS: document.getElementById('legS'),
    legN: document.getElementById('legN'),
    why: document.getElementById('whyText'),
    arr: document.getElementById('arr')
  };

  var cells = [];
  for(var i=0;i<100;i++){ var c=document.createElement('i'); els.arr.appendChild(c); cells.push(c); }

  var W = 500; /* SVG 里条形的满宽 */

  function render(){
    var s = SC[key];
    var g = parseFloat(sl.value);

    els.q.textContent = s.q;
    els.v.textContent = g + '%';
    els.ng.textContent = g + '%';
    els.nt.textContent = s.truth + '%';
    els.gap.textContent = Math.abs(g - s.truth).toFixed(1);
    els.bg.setAttribute('width', W * g / 100);
    els.bt.setAttribute('width', W * s.truth / 100);
    els.legS.textContent = s.legS;
    els.legN.textContent = s.legN;
    els.why.innerHTML = s.why;

    var hit = Math.round(s.truth);
    for(var i=0;i<100;i++){ cells[i].className = i < hit ? 's' : ''; }
  }

  sl.addEventListener('input', render);

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      key = b.getAttribute('data-p');
      sl.value = SC[key].typical;   /* 预设同时把滑块拨回该场景最常见的直觉答案 */
      render();
    });
  });

  render();
})();
