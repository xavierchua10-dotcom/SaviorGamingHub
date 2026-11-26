/* Savior Gaming Hub — hub behaviour. Games live in games/<name>/<page>.html and load on demand. */

/* ---- card tilt ---- */
(function(){
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reduceMotion || !finePointer) return;

    var cards = document.querySelectorAll('.game-card');
    cards.forEach(function(card){
      card.addEventListener('pointermove', function(e){
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function(){
        card.style.transform = '';
      });
    });
  })();

/* ---- support / feedback panels ---- */
(function(){
    var panels = [
      { btnId: 'supportBtn', overlayId: 'supportOverlay', closeId: 'supportClose' },
      { btnId: 'feedbackBtn', overlayId: 'feedbackOverlay', closeId: 'feedbackClose' }
    ];

    panels.forEach(function(cfg){
      var btn = document.getElementById(cfg.btnId);
      var overlay = document.getElementById(cfg.overlayId);
      var closeBtn = document.getElementById(cfg.closeId);
      if (!btn || !overlay || !closeBtn) return;

      function openOverlay(){
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
      }
      function closeOverlay(){
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        btn.focus();
      }

      btn.addEventListener('click', openOverlay);
      closeBtn.addEventListener('click', closeOverlay);
      overlay.addEventListener('click', function(e){
        if (e.target === overlay) closeOverlay();
      });
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay();
      });
    });
  })();

/* ---- game viewer: opens a game page inside the hub, address never changes ---- */
(function(){
  var wrap=document.getElementById('gameFrameWrap'), ttl=document.getElementById('gameFrameTitle');
  var frame=null, pushed=false, token=0, cache={};
  var TITLES={arcade:'Retro Arcade',pool:'Pool',pixelart:'Finding Purposes in Life',orbspire:'Orb Spire'};
  function load(key){
    if(cache[key]) return Promise.resolve(cache[key]);
    return fetch('games/'+key+'.html').then(function(r){
      if(!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function(t){ cache[key]=t; return t; });
  }
  function show(key){
    var my=++token;
    ttl.textContent=TITLES[key.split('/')[0]]||'';
    wrap.classList.add('open'); wrap.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden';
    return load(key).then(function(html){
      if(my!==token) return false;
      if(frame) frame.remove();
      frame=document.createElement('iframe'); frame.id='gameFrame'; frame.title='Game';
      frame.setAttribute('allow','autoplay; fullscreen; gamepad'); frame.srcdoc=html; wrap.appendChild(frame);
      return true;
    }).catch(function(){ if(my===token) close(); return false; });
  }
  function open(key){
    if(!pushed){ try{ history.pushState({sfGame:1},'',location.href); pushed=true; }catch(e){} }
    return show(key);
  }
  function close(){
    token++; wrap.classList.remove('open'); wrap.setAttribute('aria-hidden','true');
    if(frame){ frame.remove(); frame=null; } document.documentElement.style.overflow=''; pushed=false;
  }
  document.querySelectorAll('[data-game]').forEach(function(a){
    a.addEventListener('click',function(e){ e.preventDefault(); open(a.getAttribute('data-game')); });
  });
  document.getElementById('gameFrameBack').addEventListener('click',close);
  window.addEventListener('popstate',close);
  window.addEventListener('message',function(e){
    if(!frame || e.source!==frame.contentWindow || !e.data || !e.data.sfGo) return;
    if(e.data.sfGo==='hub') close(); else show(e.data.sfGo);
  });
  var h=location.hash.replace(/^#/,'');
  if(h){
    if(h.indexOf('/')<0) h+='/index';
    show(h).then(function(ok){ if(ok){ try{ history.replaceState({sfGame:1},'',location.pathname+location.search); pushed=true; }catch(e){} } });
  }
})();

/* ---- install as an app (offline copy) ---- */
if('serviceWorker' in navigator){ window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); }); }
