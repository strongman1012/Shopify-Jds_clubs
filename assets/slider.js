/**
 * Returns a function that as long as it continues to be invoked, won't be triggered.
 * @param {Function} fn - Callback function.
 * @param {number} [wait=300] - Delay (in milliseconds).
 * @returns {Function}
 */
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

class CarouselSlider extends HTMLElement {
  constructor() {
    super();
    this.slides = this.querySelectorAll('.slider__item');
    if (this.slides.length < 2) return;

    window.initLazyScript(this, this.init.bind(this));
  }

  init() {
    this.slider = this.querySelector('.slider');
    this.grid = this.querySelector('.slider__grid');
    this.nav = this.querySelector('.slider-nav');
    this.rtl = document.dir === 'rtl';

    if (this.nav) {
      this.prevBtn = this.querySelector('button[name="prev"]');
      this.nextBtn = this.querySelector('button[name="next"]');
    }

    this.initSlider();
    window.addEventListener('on:breakpoint-change', this.handleBreakpointChange.bind(this));
  }

  initSlider() {
    this.gridWidth = this.grid.clientWidth;

    // Distance between leading edges of adjacent slides (i.e. width of card + gap).
    this.slideSpan = this.getWindowOffset(this.slides[1]) - this.getWindowOffset(this.slides[0]);

    // Width of gap between slides.
    this.slideGap = this.slideSpan - this.slides[0].clientWidth;

    this.slidesPerPage = Math.round((this.gridWidth + this.slideGap) / this.slideSpan);
    this.slidesToScroll = theme.settings.sliderItemsPerNav === 'page' ? this.slidesPerPage : 1;
    this.totalPages = this.slides.length - this.slidesPerPage + 1;

    this.setCarouselState(this.totalPages > 1);
    if (this.totalPages < 2 || !this.nav) return;

    this.sliderStart = this.getWindowOffset(this.slider);
    if (!this.sliderStart) this.sliderStart = (this.slider.clientWidth - this.gridWidth) / 2;
    this.sliderEnd = this.sliderStart + this.gridWidth;

    this.addListeners();
    this.setButtonStates();
  }

  addListeners() {
    this.scrollHandler = debounce(this.handleScroll.bind(this));
    this.navClickHandler = this.handleNavClick.bind(this);

    this.slider.addEventListener('scroll', this.scrollHandler);
    this.nav.addEventListener('click', this.navClickHandler);
  }

  removeListeners() {
    this.slider.removeEventListener('scroll', this.scrollHandler);
    this.nav.removeEventListener('click', this.navClickHandler);
  }

  /**
   * Handles 'scroll' events on the slider element.
   */
  handleScroll() {
    this.currentIndex = Math.round(this.slider.scrollLeft / this.slideSpan);
    this.setButtonStates();
  }

  /**
   * Handles 'click' events on the nav buttons container.
   * @param {object} evt - Event object.
   */
  handleNavClick(evt) {
    if (!evt.target.matches('.slider-nav__btn')) return;

    if ((evt.target.name === 'next' && !this.rtl) || (evt.target.name === 'prev' && this.rtl)) {
      this.scrollPos = this.slider.scrollLeft + (this.slidesToScroll * this.slideSpan);
    } else {
      this.scrollPos = this.slider.scrollLeft - (this.slidesToScroll * this.slideSpan);
    }

    this.slider.scrollTo({ left: this.scrollPos, behavior: 'smooth' });
  }

  /**
   * Handles 'on:breakpoint-change' events on the window.
   */
  handleBreakpointChange() {
    if (this.nav) this.removeListeners();
    this.initSlider();
  }

  /**
   * Gets the offset of an element from the edge of the viewport (left for ltr, right for rtl).
   * @param {number} el - Element.
   * @returns {number}
   */
  getWindowOffset(el) {
    return this.rtl
      ? window.innerWidth - el.getBoundingClientRect().right
      : el.getBoundingClientRect().left;
  }

  /**
   * Gets the visible state of a slide.
   * @param {Element} el - Slide element.
   * @returns {boolean}
   */
  getSlideVisibility(el) {
    const slideStart = this.getWindowOffset(el);
    const slideEnd = Math.floor(slideStart + this.slides[0].clientWidth);
    return slideStart >= this.sliderStart && slideEnd <= this.sliderEnd;
  }

  /**
   * Sets the active state of the carousel.
   * @param {boolean} active - Set carousel as active.
   */
  setCarouselState(active) {
    if (active) {
      this.removeAttribute('inactive');

      // If slider width changed when activated, reinitialise it.
      if (this.gridWidth !== this.grid.clientWidth) {
        this.handleBreakpointChange();
      }
    } else {
      this.setAttribute('inactive', '');
    }
  }

  /**
   * Sets the disabled state of the nav buttons.
   */
  setButtonStates() {
    this.prevBtn.disabled = this.getSlideVisibility(this.slides[0]) && this.slider.scrollLeft === 0;
    this.nextBtn.disabled = this.getSlideVisibility(this.slides[this.slides.length - 1]);
  }
}

customElements.define('carousel-slider', CarouselSlider);
