/* 3.4 两个孩子问题 — 样本空间筛选器
   统一用 14×14 = 196 格的空间：每个孩子是（性别 × 星期几）共 14 种。
   四种问法只是四种不同的筛选/加权方式，格子一个没变，答案却从 1/3 跳到 1/2。 */
(function(){
  var grid = document.getElementById('spaceGrid');
  if(!grid) return;

  var DAYS = ['一','二','三','四','五','六','日'];
  /* 编码：0..6 = 女孩+周一..周日，7..13 = 男孩+周一..周日 */
  function isGirl(c){ return c < 7; }
  function day(c){ return c % 7; }

  var MODES = {
    atleast: {
      label:'「这家有两个孩子，其中至少有一个是女孩。」',
      note:'这是一句关于整个家庭的统计描述——你是从「所有至少有一个女孩的家庭」这个池子里看到这一家的。',
      /* 返回该格的权重：0 = 被排除 */
      w: function(a,b){ return (isGirl(a) || isGirl(b)) ? 1 : 0; }
    },
    elder: {
      label:'「这家有两个孩子，老大是女孩。」',
      note:'信息锁定了一个特定的孩子。老二的性别完全不受影响，还是一半一半。',
      w: function(a,b){ return isGirl(a) ? 1 : 0; }
    },
    met: {
      label:'「我在门口碰到了这家的一个孩子，是个女孩。」',
      note:'你遇到的是一个随机抽到的孩子。两个女孩的家庭必然让你遇到女孩，一儿一女的家庭只有一半机会——所以后者的格子只算半个。',
      w: function(a,b){ var g = (isGirl(a)?1:0) + (isGirl(b)?1:0); return g / 2; }
    },
    tuesday: {
      label:'「这家有两个孩子，其中至少有一个是周二出生的女孩。」',
      note:'多给的那一条看似无关的信息（周二），却真的改变了答案——因为它改变了被筛掉的格子。',
      w: function(a,b){
        var t = (isGirl(a) && day(a) === 1) || (isGirl(b) && day(b) === 1);
        return t ? 1 : 0;
      }
    }
  };

  var cells = [];
  for(var i = 0; i < 196; i++){ var e = document.createElement('i'); grid.appendChild(e); cells.push(e); }

  var cur = 'atleast';

  function render(){
    var m = MODES[cur];
    var live = 0, win = 0;

    for(var a = 0; a < 14; a++){
      for(var b = 0; b < 14; b++){
        var w = m.w(a, b);
        var el = cells[a * 14 + b];
        var both = isGirl(a) && isGirl(b);
        if(w === 0){
          el.className = '';
        } else {
          el.className = (both ? 'win' : 'live') + (w < 1 ? ' half' : '');
        }
        live += w;
        if(both) win += w;
      }
    }

    var p = live > 0 ? win / live : 0;
    document.getElementById('nAns').textContent = (p * 100).toFixed(1) + '%';
    document.getElementById('nFrac').textContent = fracOf(win, live);
    document.getElementById('nLive').textContent =
      trim(win) + ' / ' + trim(live) + ' 格';
    document.getElementById('qLabel').textContent = m.label;
    document.getElementById('qNote').textContent = m.note;

    document.getElementById('bY').style.width = (p * 100) + '%';
    document.getElementById('bN').style.width = ((1 - p) * 100) + '%';
  }

  function trim(v){ return Number.isInteger(v) ? String(v) : v.toFixed(1); }

  function fracOf(a, b){
    /* 约分成最简分数，答案是 1/3、1/2、13/27 这种才好认 */
    var x = Math.round(a * 2), y = Math.round(b * 2);
    var g = gcd(x, y) || 1;
    return (x / g) + ' / ' + (y / g);
  }
  function gcd(a, b){ return b ? gcd(b, a % b) : a; }

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){ cur = b.getAttribute('data-p'); render(); });
  });
  document.querySelectorAll('.segmented button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.segmented button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      cur = b.getAttribute('data-m');
      render();
    });
  });

  render();
})();
