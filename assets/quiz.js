/* 先猜一次 (guess-first) 组件：记录读者选择，不判对错。
   用法：<div class="guess" id="任意"><div class="opts"><button data-g="...">…</button></div>
        <div class="after">…</div></div>
   quiz 折叠用原生 <details>，无需 JS——JS 被禁用时答案仍可展开。 */
(function(){
  document.querySelectorAll('.guess').forEach(function(box){
    var opts = box.querySelectorAll('.opts button');
    opts.forEach(function(b){
      b.addEventListener('click', function(){
        opts.forEach(function(x){ x.classList.remove('picked'); });
        b.classList.add('picked');
        box.classList.add('answered');
      });
    });
  });
})();
