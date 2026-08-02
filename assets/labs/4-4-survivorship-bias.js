/* 4.4 幸存者偏差 — 弹孔图的两种视角
   模拟一批出击的轰炸机：命中位置按面积随机，但不同部位的致命率不同。
   「只看返航的」= 你手上真正有的数据；「全部出击的」= 你想知道的真相。
   引擎与驾驶舱在返航样本里近乎空白，恰恰因为中弹的那些没回来。 */
(function(){
  var svg = document.getElementById('planeHits');
  if(!svg) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* 部位：矩形集合 + 中弹后被击落的概率（引擎那一项由滑块控制） */
  var REGIONS = [
    {n:'机翼', rects:[[40,96,320,40]], lethal:0.04, holes:[]},
    {n:'机身', rects:[[186,62,28,150]], lethal:0.10, holes:[]},
    {n:'尾翼', rects:[[158,212,84,28]], lethal:0.05, holes:[]},
    {n:'引擎', rects:[[78,98,28,36],[136,98,28,36],[236,98,28,36],[294,98,28,36]], lethal:0.70, holes:[]},
    {n:'驾驶舱', rects:[[187,26,26,34]], lethal:0.85, holes:[]}
  ];

  var N = 1000, seed = 19430701;
  var mode = 'returned';
  var sLethal = document.getElementById('sLethal');

  function area(r){ return r.rects.reduce(function(s, q){ return s + q[2] * q[3]; }, 0); }

  function simulate(){
    var eng = parseFloat(sLethal.value) / 100;
    REGIONS[3].lethal = eng;
    document.getElementById('vLethal').textContent = (eng * 100).toFixed(0) + '%';

    var areas = REGIONS.map(area);
    var total = areas.reduce(function(a, b){ return a + b; }, 0);
    var r = rng(seed);

    var all = REGIONS.map(function(){ return 0; });
    var ret = REGIONS.map(function(){ return 0; });
    var allPts = [], retPts = [];
    var lost = 0;

    for(var i = 0; i < N; i++){
      /* 每架挨几发：泊松(3) 的简易采样 */
      var k = 0, p = Math.exp(-3), acc = p, u = r();
      while(u > acc && k < 14){ k++; p = p * 3 / k; acc += p; }

      var hits = [], down = false;
      for(var j = 0; j < k; j++){
        var pick = r() * total, idx = 0, run = 0;
        for(idx = 0; idx < REGIONS.length; idx++){ run += areas[idx]; if(pick <= run) break; }
        if(idx >= REGIONS.length) idx = REGIONS.length - 1;
        var reg = REGIONS[idx];
        /* 在该部位的矩形集合里按面积挑一个，再取均匀点 */
        var ra = r() * area(reg), acc2 = 0, rect = reg.rects[0];
        for(var m = 0; m < reg.rects.length; m++){
          acc2 += reg.rects[m][2] * reg.rects[m][3];
          if(ra <= acc2){ rect = reg.rects[m]; break; }
        }
        hits.push([idx, rect[0] + r() * rect[2], rect[1] + r() * rect[3]]);
        if(r() < reg.lethal) down = true;
      }
      if(down) lost++;
      hits.forEach(function(h){
        all[h[0]]++;
        if(allPts.length < 2200) allPts.push(h);
        if(!down){ ret[h[0]]++; if(retPts.length < 2200) retPts.push(h); }
      });
    }

    return {all:all, ret:ret, allPts:allPts, retPts:retPts, lost:lost, back:N - lost};
  }

  function render(){
    var s = simulate();
    var pts = mode === 'returned' ? s.retPts : s.allPts;
    var cnt = mode === 'returned' ? s.ret : s.all;
    var planes = mode === 'returned' ? s.back : N;

    svg.innerHTML = pts.map(function(h){
      return '<circle class="dot ' + (mode === 'returned' ? 's' : 'a') +
        '" cx="' + h[1].toFixed(1) + '" cy="' + h[2].toFixed(1) + '" r="1.9" opacity="0.75"/>';
    }).join('');

    var rows = ['<tr><th>部位</th><th>每百架飞机上的弹孔数</th><th>中弹后被击落的概率</th></tr>'];
    REGIONS.forEach(function(reg, i){
      var per100 = planes > 0 ? cnt[i] / planes * 100 : 0;
      rows.push('<tr><td>' + reg.n + '</td><td class="' + (per100 < 20 ? 's' : '') + '">' +
        per100.toFixed(1) + '</td><td>' + (reg.lethal * 100).toFixed(0) + '%</td></tr>');
    });
    document.getElementById('hitTable').innerHTML = rows.join('');

    document.getElementById('nPlanes').textContent = planes + ' 架';
    document.getElementById('nLost').textContent = s.lost + ' 架';
    var engPer = planes > 0 ? s.ret[3] / s.back * 100 : 0;
    var engAll = s.all[3] / N * 100;
    document.getElementById('nGap').textContent = (engAll / Math.max(engPer, 0.01)).toFixed(1) + '×';

    document.getElementById('story').innerHTML = mode === 'returned'
      ? '这是你能拿到的全部数据：<b>' + s.back + ' 架</b>飞回来的飞机。引擎部位每百架只有 <b>' +
        engPer.toFixed(1) + '</b> 个弹孔，看起来「几乎没人打那儿」。<br>' +
        '<b>于是最自然的结论是：把装甲加在弹孔最多的机翼和机身上。而这个结论是错的。</b>'
      : '这是真相：<b>' + N + ' 架</b>出击的飞机全部算上（含没能返航的 <b>' + s.lost +
        ' 架</b>）。引擎部位每百架其实有 <b>' + engAll.toFixed(1) +
        '</b> 个弹孔，和别处差不多。<br><b>返航样本里那片空白，不是因为没人打，是因为打中那里的飞机没回来。</b>';
  }

  document.querySelectorAll('.segmented button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.segmented button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      mode = b.getAttribute('data-m');
      render();
    });
  });
  sLethal.addEventListener('input', render);
  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ sLethal.value = b.getAttribute('data-p'); render(); });
  });

  render();
})();
