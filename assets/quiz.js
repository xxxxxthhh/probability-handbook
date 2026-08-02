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

  /* 打印时展开全部 quiz 答案。
     必须用 JS 把 details.open 打开，不能只靠 CSS：<details> 未展开时，
     它的非 summary 内容是被 UA 的 shadow DOM（隐藏的 slot）藏起来的，
     在光 DOM 的 .answer 上写 display:block 越不过那一层祖先。
     handbook.css 里的那条 CSS 规则保留，作为禁用 JS 时的尽力而为。 */
  function expandAll(){
    document.querySelectorAll('.quiz details').forEach(function(d){ d.open = true; });
  }
  window.addEventListener('beforeprint', expandAll);
  /* Safari 等不触发 beforeprint 的浏览器走 matchMedia 兜底 */
  if(window.matchMedia){
    var mq = window.matchMedia('print');
    var onChange = function(e){ if(e.matches) expandAll(); };
    if(mq.addEventListener) mq.addEventListener('change', onChange);
    else if(mq.addListener) mq.addListener(onChange);
  }
})();
