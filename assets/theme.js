/* 深浅色切换：默认跟随系统 prefers-color-scheme，点击后写 html[data-theme] */
(function(){
  var btn = document.querySelector('.theme-toggle');
  if(!btn) return;
  function effective(){
    var t = document.documentElement.getAttribute('data-theme');
    if(t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  btn.addEventListener('click', function(){
    document.documentElement.setAttribute('data-theme', effective()==='dark' ? 'light' : 'dark');
  });
})();
