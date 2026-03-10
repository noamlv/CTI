(function () {
  function initMobileNavbarAutoHide() {
    var header = document.getElementById('quarto-header');
    if (!header) return;

    var lastY = window.scrollY || 0;
    var ticking = false;

    function isMobile() {
      return window.matchMedia('(max-width: 991.98px)').matches;
    }

    function update() {
      var y = window.scrollY || 0;
      if (!isMobile()) {
        header.classList.remove('nav-hidden-mobile');
        lastY = y;
        return;
      }

      if (y < 20) {
        header.classList.remove('nav-hidden-mobile');
      } else if (y > lastY + 6) {
        header.classList.add('nav-hidden-mobile');
      } else if (y < lastY - 6) {
        header.classList.remove('nav-hidden-mobile');
      }

      lastY = y;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavbarAutoHide);
  } else {
    initMobileNavbarAutoHide();
  }
})();
