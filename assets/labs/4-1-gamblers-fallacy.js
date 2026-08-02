/* 4.1 赌徒谬误与热手 — 随机性鉴别器
   一条真随机序列，一条「人造随机」序列（人为提高交替率、压掉连号）。
   读者先猜哪条是真的，再看两条的统计量。
   默认固定种子，保证正文/打印版里的数字就是页面上的数字。 */
(function(){
  var boxA = document.getElementById('seqA');
  if(!boxA) return;

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var N = 100;
  var seed = 777001;
  var revealed = false;
  var realIsA = true;

  var sAlt = document.getElementById('sAlt');

  function makeTrue(r){
    var s = [];
    for(var i = 0; i < N; i++) s.push(r() < 0.5 ? 1 : 0);
    return s;
  }
  /* 人造：以概率 alt 强制和上一个不同——这正是人「编」随机时干的事 */
  function makeFake(r, alt){
    var s = [r() < 0.5 ? 1 : 0];
    for(var i = 1; i < N; i++){
      s.push(r() < alt ? 1 - s[i-1] : s[i-1]);
    }
    return s;
  }

  function longestRun(s){
    var best = 1, cur = 1;
    for(var i = 1; i < s.length; i++){
      cur = s[i] === s[i-1] ? cur + 1 : 1;
      if(cur > best) best = cur;
    }
    return best;
  }
  function altRate(s){
    var c = 0;
    for(var i = 1; i < s.length; i++) if(s[i] !== s[i-1]) c++;
    return c / (s.length - 1);
  }
  function runsOf(s, k){
    /* 长度 >= k 的连号有几段 */
    var n = 0, cur = 1;
    for(var i = 1; i <= s.length; i++){
      if(i < s.length && s[i] === s[i-1]) cur++;
      else { if(cur >= k) n++; cur = 1; }
    }
    return n;
  }

  var A, B;

  function build(){
    var r = rng(seed);
    var alt = parseFloat(sAlt.value) / 100;
    document.getElementById('vAlt').textContent = (alt * 100).toFixed(0) + '%';
    var real = makeTrue(r);
    var fake = makeFake(r, alt);
    realIsA = r() < 0.5;
    A = realIsA ? real : fake;
    B = realIsA ? fake : real;
    revealed = false;
    draw();
  }

  function strip(box, s){
    box.innerHTML = '';
    s.forEach(function(v){
      var e = document.createElement('i');
      e.className = v ? 'h' : 't';
      e.textContent = v ? '正' : '反';
      box.appendChild(e);
    });
  }

  function draw(){
    strip(boxA, A);
    strip(document.getElementById('seqB'), B);

    document.getElementById('statA').innerHTML = statCell(A);
    document.getElementById('statB').innerHTML = statCell(B);

    var v = document.getElementById('verdict');
    if(!revealed){
      v.innerHTML = '两条序列各抛 100 次。<b>其中一条是真随机，另一条是「人造」的。</b>先看一眼，再猜——然后对照下面的统计量。';
      v.className = 'hint';
    } else {
      v.innerHTML = '<b>答案：序列' + (realIsA ? '甲' : '乙') + '是真随机的，序列' +
        (realIsA ? '乙' : '甲') + '是人造的。</b>真随机那条的交替率应当在 50% 附近、最长连号通常有 6–7 个；' +
        '人造那条交替率明显偏高、连号明显偏短——<b>而人眼觉得「更随机」的，恰恰是人造的那条。</b>';
      v.className = '';
    }
  }

  function statCell(s){
    return '交替率 <b>' + (altRate(s) * 100).toFixed(0) + '%</b>　·　最长连号 <b>' +
      longestRun(s) + '</b>　·　长度≥4 的连号 <b>' + runsOf(s, 4) + '</b> 段';
  }

  document.getElementById('guessA').addEventListener('click', function(){ revealed = true; draw(); });
  document.getElementById('guessB').addEventListener('click', function(){ revealed = true; draw(); });
  document.getElementById('regen').addEventListener('click', function(){
    seed = (Math.random() * 4294967296) | 0;
    build();
  });
  sAlt.addEventListener('input', build);

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ sAlt.value = b.getAttribute('data-p'); build(); });
  });

  build();
})();
