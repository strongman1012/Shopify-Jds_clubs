/* global debounce */

// Initialise and observe animate on scroll
if (document.body.classList.contains('cc-animate-enabled')) {
  if ('IntersectionObserver' in window && 'MutationObserver' in window) {
    const initAnimateOnScroll = () => {
      const animatableElems = document.querySelectorAll('[data-cc-animate]:not(.cc-animate-init)');
      if (animatableElems.length > 0) {
        const intersectionObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            // In view and hasn't been animated yet
            if (entry.isIntersecting && !entry.target.classList.contains('cc-animate-in')) {
              entry.target.classList.add('cc-animate-in');
              observer.unobserve(entry.target);
            }
          });
        });

        // Initialise and observe each animatable element
        animatableElems.forEach((elem) => {
          // Set the animation delay
          if (elem.dataset.ccAnimateDelay) {
            elem.style.animationDelay = elem.dataset.ccAnimateDelay;
          }

          // Set the animation duration
          if (elem.dataset.ccAnimateDuration) {
            elem.style.animationDuration = elem.dataset.ccAnimateDuration;
          }

          // Init the animation
          if (elem.dataset.ccAnimate) {
            elem.classList.add(elem.dataset.ccAnimate);
          }

          elem.classList.add('cc-animate-init');

          // Watch for elem
          intersectionObserver.observe(elem);
        });
      }
    };

    const aosMinWidth = getComputedStyle(document.documentElement)
      .getPropertyValue('--aos-min-width') || '0';
    const mq = window.matchMedia(`(min-width: ${aosMinWidth}px)`);
    if (mq.matches) {
      initAnimateOnScroll();

      // Check for more animatable elements when the DOM mutates
      document.addEventListener('DOMContentLoaded', () => {
        const observer = new MutationObserver(debounce(initAnimateOnScroll, 250));
        observer.observe(document.body, {
          subtree: true,
          childList: true
        });
      });
    } else {
      document.body.classList.remove('cc-animate-enabled');

      try {
        mq.addEventListener('change', (event) => {
          if (event.matches) {
            document.body.classList.add('cc-animate-enabled');
            setTimeout(initAnimateOnScroll, 100);
          }
        });
      } catch (e) {
        // Legacy browsers (Safari < 14), rely on the animations being shown by the line above the
        // try
      }
    }
  } else {
    // Reveal all the animations
    document.body.classList.remove('cc-animate-enabled');
  }
}
