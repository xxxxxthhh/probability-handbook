/* 2.1 医疗检测悖论 — 千人图交互实验
   三滑块（患病率 / 灵敏度 / 假阳性率）→ 1000 人图标阵列 + PPV 即时更新。 */
(function(){
  var N = 1000;
  var grid = document.getElementById('grid');
  if(!grid) return;

  var cells = [];
  for(var i=0;i<N;i++){ var el=document.createElement('i'); grid.appendChild(el); cells.push(el); }

  var sPrev = document.getElementById('prev'),
      sSens = document.getElementById('sens'),
      sFpr  = document.getElementById('fpr');

  function update(){
    var p    = parseFloat(sPrev.value),
        sens = parseFloat(sSens.value),
        fpr  = parseFloat(sFpr.value);
    document.getElementById('vPrev').textContent = p.toFixed(1)+'%';
    document.getElementById('vSens').textContent = sens.toFixed(0)+'%';
    document.getElementById('vFpr').textContent  = fpr.toFixed(1)+'%';

    var sick    = Math.round(N*p/100);
    var tp      = Math.round(sick*sens/100);
    var fn      = sick-tp;
    var healthy = N-sick;
    var fp      = Math.round(healthy*fpr/100);
    var pos     = tp+fp;
    var ppv     = pos>0 ? (tp/pos*100) : 0;

    for(var i=0;i<N;i++){
      cells[i].className = i<tp ? 'tp' : i<tp+fn ? 'fn' : i<tp+fn+fp ? 'fp' : '';
    }
    document.getElementById('ppv').textContent = ppv.toFixed(1)+'%';
    document.getElementById('nTp').textContent = '真阳性 '+tp+' 人';
    document.getElementById('nFp').textContent = '假阳性 '+fp+' 人';
    var tpW = pos>0 ? (tp/pos*100) : 0;
    document.getElementById('barTp').style.width = tpW+'%';
    document.getElementById('barFp').style.width = (100-tpW)+'%';
  }

  [sPrev,sSens,sFpr].forEach(function(s){ s.addEventListener('input', update); });

  document.querySelectorAll('.presets button').forEach(function(b){
    b.addEventListener('click', function(){
      var v = b.getAttribute('data-p').split(',');
      sPrev.value=v[0]; sSens.value=v[1]; sFpr.value=v[2];
      update();
    });
  });

  update();
})();
