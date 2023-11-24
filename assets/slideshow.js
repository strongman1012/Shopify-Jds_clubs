/* global debounce */

if (!customElements.get('slide-show')) {
  class SlideShow extends HTMLElement {
    constructor() {
      super();
      window.initLazyScript(this, this.init.bind(this));
    }

    init() {
      this.slideshow = this.querySelector('.slideshow');
      this.slides = this.querySelectorAll('.slideshow__slide');
      this.nav = this.querySelector('.slideshow-nav');
      this.pagination = this.querySelector('.slideshow-pagination');
      this.rtl = document.dir === 'rtl';
      this.currentIndex = 0;
      this.swipeThreshold = 80;

      if (this.nav) {
        this.counterCurrent = this.querySelector('.slideshow-nav__counter-current');
        this.nav.addEventListener('click', this.handleNavClick.bind(this));
      }

      if (this.pagination) {
        this.pageBtns = this.querySelectorAll('.page-btn');
        this.pagination.addEventListener('click', this.handlePaginationClick.bind(this));
      }

      if (theme.device.hasTouch) {
        this.slideshow.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.slideshow.addEventListener('touchmove', debounce(this.handleTouchMove.bind(this), 200), { passive: true });
      }

      this.slideshow.addEventListener('transitionend', SlideShow.handleTransitionend);

      this.setSlideVisibility();
      if (this.dataset.autoplay === 'true') this.initAutoPlay();
    }

    initAutoPlay() {
      this.autoplayEnabled = true;
      this.autoplaySpeed = this.dataset.speed * 1000;

      this.addEventListener('mouseover', this.pauseAutoplay.bind(this));
      this.addEventListener('mouseleave', this.resumeAutoplay.bind(this));
      this.slideshow.addEventListener('focusin', this.pauseAutoplay.bind(this));
      this.slideshow.addEventListener('focusout', this.resumeAutoplay.bind(this));

      this.addObserver();
      this.startAutoplay();
    }

    /**
     * Handles 'click' events on the nav buttons container.
     * @param {object} evt - Event object.
     */
    handleNavClick(evt) {
      if (evt.target.matches('.autoplay-btn')) {
        this.togglePlayState(evt);
        return;
      }

      if (evt.target.name === 'next') {
        this.showNextSlide();
      } else if (evt.target.name === 'prev') {
        this.showPrevSlide();
      }
    }

    /**
     * Handles 'click' events on the pagination.
     * @param {object} evt - Event object.
     */
    handlePaginationClick(evt) {
      if (!evt.target.matches('.page-btn')) return;
      this.autoplayTimeLeft = this.autoplaySpeed;
      this.setActiveSlide(Number(evt.target.dataset.index));
    }

    /**
     * Handles 'touchstart' events on the slideshow.
     * @param {object} evt - Event object.
     */
    handleTouchStart(evt) {
      this.touchStart = evt.changedTouches[0].screenX;
    }

    /**
     * Handles 'touchmove' events on the slideshow.
     * @param {object} evt - Event object.
     */
    handleTouchMove(evt) {
      const touchEnd = evt.changedTouches[0].screenX;

      if (touchEnd < this.touchStart - this.swipeThreshold) {
        this.rtl ? this.showPrevSlide() : this.showNextSlide();
      }

      if (touchEnd > this.touchStart + this.swipeThreshold) {
        this.rtl ? this.showNextSlide() : this.showPrevSlide();
      }
    }

    /**
     * Handles 'transitionend' events on the slideshow.
     * @param {object} evt - Event object.
     */
    static handleTransitionend(evt) {
      if (!evt.target.matches('.has-motion')) return;
      evt.target.classList.remove('transition-out');
    }

    showNextSlide() {
      let index = this.currentIndex + 1;
      if (index === this.slides.length) index = 0;
      this.setActiveSlide(index, 'next');
    }

    showPrevSlide() {
      let index = this.currentIndex - 1;
      if (index < 0) index = this.slides.length - 1;
      this.setActiveSlide(index, 'prev');
    }

    /**
     * Sets the active slide.
     * @param {number} slideIndex - Index of the slide to show.
     * @param {string} slideDirection - Direction for slide transitions.
     */
    setActiveSlide(slideIndex, slideDirection) {
      if (slideIndex === this.currentIndex) return;

      // Set data attribute for direction of slide transitions.
      let dir = slideDirection || (slideIndex < this.currentIndex ? 'prev' : 'next');
      if (this.rtl) dir = dir === 'next' ? 'prev' : 'next';
      this.dataset.direction = dir;

      // Trigger text overlay transition out.
      this.slides[this.currentIndex].classList.add('transition-out');

      setTimeout(() => {
        // Move new slide into the viewport.
        this.slideshow.scrollTo({ left: this.slides[slideIndex].offsetLeft, behavior: 'instant' });

        // Update current slide and trigger transitions.
        this.slides[slideIndex].classList.add('is-active');
        this.slides[this.currentIndex].classList.remove('is-active', 'transition-out');

        // Add class to transitioned content element (if it exists).
        const transitionedEl = this.slides[this.currentIndex].querySelector('.has-motion');
        if (transitionedEl) transitionedEl.classList.add('transition-out');

        // Reset autoplay slide timer.
        if (this.autoplayEnabled) this.autoplayStartTime = Date.now();

        // Update slide counter.
        if (this.counterCurrent) this.counterCurrent.textContent = slideIndex + 1;

        this.currentIndex = slideIndex;
        this.setSlideVisibility();
        this.updatePagination();
      }, 200);
    }

    /**
     * Updates the 'aria-current' attribute of the pagination buttons.
     */
    updatePagination() {
      if (!this.pagination) return;

      this.pageBtns.forEach((el, index) => {
        if (index === this.currentIndex) {
          el.setAttribute('aria-current', 'true');
        } else {
          el.removeAttribute('aria-current');
        }
      });
    }

    stopAutoplay() {
      this.setSlideshowState('paused');
      clearInterval(this.autoplayTimer);
      clearTimeout(this.resumeTimer);
    }

    startAutoplay() {
      this.autoplayTimeLeft = null;
      this.autoplayStartTime = Date.now();
      this.autoplayTimer = setInterval(this.showNextSlide.bind(this), this.autoplaySpeed);
      this.setSlideshowState('running');
    }

    pauseAutoplay() {
      if (!this.autoplayEnabled || this.autoplayPaused) return;
      this.stopAutoplay();

      if (this.autoplayTimeLeft) {
        this.autoplayTimeLeft -= (Date.now() - this.resumedTime);
      } else {
        this.autoplayTimeLeft = this.autoplaySpeed - (Date.now() - this.autoplayStartTime);
      }
    }

    resumeAutoplay() {
      if (!this.autoplayEnabled || !this.autoplayPaused) return;

      this.resumedTime = Date.now();
      this.resumeTimer = setTimeout(() => {
        this.showNextSlide();
        this.startAutoplay();
      }, this.autoplayTimeLeft);

      this.setSlideshowState('running');
    }

    /**
     * Adds an observer to pause autoplay when the slideshow is not in the viewport.
     */
    addObserver() {
      if ('IntersectionObserver' in window === false) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.resumeAutoplay();
          } else {
            this.pauseAutoplay();
          }
        });
      });

      observer.observe(this);
    }

    /**
     * Sets 'aria-hidden' and 'tabindex' of the slides and text overlay buttons.
     */
    setSlideVisibility() {
      this.slides.forEach((el, index) => {
        const btns = el.querySelectorAll('a');

        if (index === this.currentIndex) {
          el.setAttribute('aria-hidden', 'false');
          el.removeAttribute('tabindex');

          btns.forEach((btn) => {
            btn.removeAttribute('tabindex');
          });
        } else {
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('tabindex', '-1');

          btns.forEach((btn) => {
            btn.setAttribute('tabindex', '-1');
          });
        }
      });
    }

    /**
     * Sets 'aria-live' state of the slideshow and 'play-state' of the pagination animation.
     * @param {string} state - State to set ('running' or 'paused').
     */
    setSlideshowState(state) {
      this.style.setProperty('--play-state', state);
      this.slideshow.setAttribute('aria-live', state === 'running' ? 'off' : 'polite');
      this.autoplayPaused = state === 'paused';
    }

    /**
     * Toggles the autoplay state.
     * @param {object} evt - Event object.
     */
    togglePlayState(evt) {
      evt.target.classList.toggle('is-paused');
      this.autoplayEnabled = !this.autoplayEnabled;
      this.dataset.autoplay = this.autoplayEnabled ? 'true' : 'false';
      this.autoplayEnabled ? this.startAutoplay() : this.stopAutoplay();
    }
  }

  customElements.define('slide-show', SlideShow);
}
