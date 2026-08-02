/* 3.1 蒙提霍尔 — 可玩三门 + 自动千局统计板
   两件事同框：手玩几局建立体感，自动模拟给出统计上说得过去的结论。
   「主持人不知情」模式是本实验的关键对照：同样是开出一扇羊门，
   主持人知不知道门后有什么，决定了换门有没有优势。 */
(function(){
  var row = document.getElementById('doorRow');
  if(!row) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var N = 3;            /* 门数 */
  var informed = true;  /* 主持人是否知情 */
  var seed = 1337;

  /* 手玩状态 */
  var phase = 'pick';   /* pick → decide → done */
  var car = 0, picked = -1, opened = [], voided = false;
  var tally = {stayW:0, stayN:0, swW:0, swN:0};

  var sN = document.getElementById('sDoors');

  function rnd(){ return Math.random(); }

  function newRound(){
    car = Math.floor(rnd() * N);
    picked = -1; opened = []; voided = false;
    phase = 'pick';
    draw();
  }

  function hostOpen(){
    var cand = [];
    for(var i = 0; i < N; i++) if(i !== picked) cand.push(i);
    if(informed) cand = cand.filter(function(i){ return i !== car; });
    /* 洗牌后取前 N-2 扇打开 */
    for(var j = cand.length - 1; j > 0; j--){
      var k = Math.floor(rnd() * (j + 1)); var t = cand[j]; cand[j] = cand[k]; cand[k] = t;
    }
    opened = cand.slice(0, N - 2);
    voided = opened.indexOf(car) > -1;   /* 主持人不知情时可能提前开出汽车 */
  }

  function draw(){
    row.style.setProperty('--dcols', Math.min(N, 20));
    row.innerHTML = '';
    for(var i = 0; i < N; i++){
      var b = document.createElement('button');
      b.type = 'button';
      var isOpen = opened.indexOf(i) > -1;
      var reveal = phase === 'done' || (isOpen && voided);
      b.className = (i === picked ? 'picked ' : '') + (isOpen ? 'open ' : '') +
                    ((reveal && i === car) ? 'car' : '');
      b.textContent = isOpen ? '🐐' : (phase === 'done' ? (i === car ? '🚗' : '🐐') : (i + 1));
      b.disabled = isOpen || phase !== 'pick';
      (function(idx){
        b.addEventListener('click', function(){
          if(phase !== 'pick') return;
          picked = idx;
          hostOpen();
          phase = voided ? 'done' : 'decide';
          draw();
        });
      })(i);
      row.appendChild(b);
    }

    var msg = document.getElementById('playMsg');
    var acts = document.getElementById('playActs');
    acts.innerHTML = '';

    if(phase === 'pick'){
      msg.textContent = '选一扇门。' + (N > 3 ? '（共 ' + N + ' 扇，其中 1 扇后面是车）' : '');
    } else if(phase === 'decide'){
      var other = -1;
      for(var m = 0; m < N; m++) if(m !== picked && opened.indexOf(m) < 0) other = m;
      msg.textContent = '主持人打开了 ' + opened.length + ' 扇门，后面都是羊。现在只剩你选的 ' +
        (picked + 1) + ' 号和 ' + (other + 1) + ' 号。换不换？';
      mkBtn(acts, '坚持 ' + (picked + 1) + ' 号', function(){ finish(false); }, true);
      mkBtn(acts, '换到 ' + (other + 1) + ' 号', function(){ finish(true); }, false);
    } else {
      msg.textContent = voided
        ? '主持人不知情，结果提前把车开出来了——这一局作废。（这正是「不知情」模式的代价：有相当比例的局根本走不到换门这一步。）'
        : (picked === car ? '🚗 中了！' : '🐐 是羊。');
      mkBtn(acts, '再来一局', newRound, true);
    }

    document.getElementById('tally').innerHTML =
      '你的手玩战绩　不换：<b>' + tally.stayW + ' / ' + tally.stayN + '</b>　　换门：<b>' +
      tally.swW + ' / ' + tally.swN + '</b>';
  }

  function mkBtn(parent, label, fn, ghost){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (ghost ? ' ghost' : '');
    b.textContent = label;
    b.addEventListener('click', fn);
    parent.appendChild(b);
  }

  function finish(swap){
    if(swap){
      for(var m = 0; m < N; m++) if(m !== picked && opened.indexOf(m) < 0) picked = m;
      tally.swN++; if(picked === car) tally.swW++;
    } else {
      tally.stayN++; if(picked === car) tally.stayW++;
    }
    phase = 'done';
    draw();
  }

  /* ---------- 自动模拟 ---------- */
  function simulate(rounds){
    var r = rng(seed);
    var stayW = 0, swW = 0, valid = 0;
    for(var i = 0; i < rounds; i++){
      var c = Math.floor(r() * N);
      var p = Math.floor(r() * N);
      var cand = [];
      for(var j = 0; j < N; j++) if(j !== p) cand.push(j);
      if(informed) cand = cand.filter(function(x){ return x !== c; });
      for(var k = cand.length - 1; k > 0; k--){
        var q = Math.floor(r() * (k + 1)); var t = cand[k]; cand[k] = cand[q]; cand[q] = t;
      }
      var op = cand.slice(0, N - 2);
      if(op.indexOf(c) > -1) continue;   /* 车被提前开出，本局作废 */
      valid++;
      if(p === c) stayW++;
      var other = -1;
      for(var m = 0; m < N; m++) if(m !== p && op.indexOf(m) < 0) other = m;
      if(other === c) swW++;
    }
    return {stayW:stayW, swW:swW, valid:valid, rounds:rounds};
  }

  function runSim(){
    var res = simulate(1000);
    var stayR = res.valid ? res.stayW / res.valid * 100 : 0;
    var swR = res.valid ? res.swW / res.valid * 100 : 0;
    document.getElementById('nStay').textContent = stayR.toFixed(1) + '%';
    document.getElementById('nSwitch').textContent = swR.toFixed(1) + '%';
    document.getElementById('barStay').setAttribute('width', 480 * stayR / 100);
    document.getElementById('barSwitch').setAttribute('width', 480 * swR / 100);
    document.getElementById('simNote').innerHTML =
      '模拟 <b>1000</b> 局' +
      (res.valid < res.rounds
        ? '，其中 <b>' + (res.rounds - res.valid) + '</b> 局因主持人提前开出汽车而作废，有效 <b>' + res.valid + '</b> 局'
        : '（全部有效）') +
      '。不换赢 <b>' + res.stayW + '</b> 局，换门赢 <b>' + res.swW + '</b> 局。';
  }

  function refresh(){
    document.getElementById('vDoors').textContent = N + ' 扇';
    document.getElementById('vHost').textContent = informed ? '知情（经典规则）' : '随机开门（不知情）';
    newRound();
    runSim();
  }

  sN.addEventListener('input', function(){
    N = Math.round(parseFloat(sN.value));
    tally = {stayW:0, stayN:0, swW:0, swN:0};
    refresh();
  });

  document.querySelectorAll('.segmented button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.segmented button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      informed = b.getAttribute('data-h') === '1';
      tally = {stayW:0, stayN:0, swW:0, swN:0};
      refresh();
    });
  });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      N = parseInt(v[0], 10); informed = v[1] === '1';
      sN.value = N;
      document.querySelectorAll('.segmented button').forEach(function(x){
        x.classList.toggle('on', x.getAttribute('data-h') === v[1]);
      });
      tally = {stayW:0, stayN:0, swW:0, swN:0};
      refresh();
    });
  });

  document.getElementById('resim').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    runSim();
  });

  refresh();
})();
