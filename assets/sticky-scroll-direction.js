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

/**
 * Adjusts the css top property of an element such that it sticks appropriately based on the scroll
 * direction. The container is assumed to be position: sticky, with top: 0 (or whatever). When
 * scrolling down, it'll stick to the bottom of the container, when scrolling up it'll stick to
 * the top of the container.
 */
if (!customElements.get('sticky-scroll-direction')) {
  class StickyScrollDirection extends HTMLElement {
    connectedCallback() {
      this.init();
    }

    init() {
      const headerIsSticky = document.querySelector('store-header[data-is-sticky="true"]');
      this.headerHeight = Number.parseInt(
        getComputedStyle(this.parentElement).getPropertyValue('--header-height').replace('px', ''),
        10
      );

      this.container = this.firstElementChild;
      this.currentTop = Number.parseInt(
        document.documentElement.scrollTop + this.getBoundingClientRect().top - this.offsetTop,
        10
      );
      this.defaultTop = headerIsSticky ? parseInt(this.headerHeight + 30, 10) : 48;
      this.scrollY = window.scrollY;
      this.minStickySize = this.dataset.minStickySize;

      this.toggleListeners();
      window.addEventListener('on:breakpoint-change', this.toggleListeners.bind(this));
    }

    /**
     * Either inits or destroys the component based on screen size
     */
    toggleListeners() {
      if ((this.minStickySize === 'lg' && theme.mediaMatches.lg)
        || (this.minStickySize === 'md' && theme.mediaMatches.md)) {
        this.addListeners();
      } else {
        this.removeListeners();
      }
    }

    /**
     * Init the scroll watching
     */
    addListeners() {
      this.scrollListener = this.scrollListener || this.handleScroll.bind(this);
      window.addEventListener('scroll', this.scrollListener);

      this.scrollListener();

      // Set the height of the parent to the total height of other elements
      if (this.parentElement.dataset.stickyHeightElems) {
        this.debouncedSetStickyHeights = this.debouncedSetStickyHeights
          || debounce(this.setStickyHeight.bind(this), 500);
        window.addEventListener('resize', this.debouncedSetStickyHeights);

        if ('MutationObserver' in window) {
          this.stickyHeightElems = this.parentElement.dataset.stickyHeightElems;
          this.observer = new MutationObserver(this.debouncedSetStickyHeights);
          document.querySelectorAll(this.stickyHeightElems).forEach((elem) => {
            this.observer.observe(elem, {
              childList: true,
              attributes: true,
              subtree: true
            });
          });
        }

        this.setStickyHeight();
      }

      // Listen for the opening of any disclosures, so their contents can be scrolled to if needed
      this.disclosures = this.querySelectorAll('details');
      if (this.disclosures) {
        this.disclosureChangeHandler = this.disclosureChangeHandler
          || this.handleDisclosureChange.bind(this);
        this.disclosures.forEach((disclosure) => {
          disclosure.addEventListener('transitionend', this.disclosureChangeHandler);
        });
      }
    }

    /**
     * Handle the opening/closing of disclosures when they extend beyond the viewport
     * @param {object} evt - Event object.
     */
    handleDisclosureChange(evt) {
      if (evt.target.classList.contains('disclosure__panel')) {
        const summaryElem = evt.target.closest('.disclosure').querySelector('summary');
        if (!theme.elementUtil.isInViewport(summaryElem)) {
          window.scrollTo({
            behavior: 'smooth',
            top: summaryElem.getBoundingClientRect().top
              - document.body.getBoundingClientRect().top - this.headerHeight - 20
          });
        }
      }
    }

    /**
     * Destroy listeners, reset css attributes
     */
    removeListeners() {
      this.container.style.top = '';
      window.removeEventListener('scroll', this.scrollListener);

      if (this.observer) {
        this.observer.disconnect();
        window.removeEventListener('resize', this.debouncedSetStickyHeights);
      }

      if (this.disclosures) {
        this.disclosures.forEach((disclosure) => {
          disclosure.removeEventListener('transitionend', this.disclosureChangeHandler);
        });
      }
    }

    /**
     * Calculates the heights of certain elements that the height of the sticky element depends on
     */
    setStickyHeight() {
      let totalHeight = 0;
      document.querySelectorAll(this.stickyHeightElems).forEach((elem) => {
        totalHeight += elem.getBoundingClientRect().height;
      });
      this.parentElement.style.setProperty('--sticky-height', `${parseInt(totalHeight, 10)}px`);
    }

    /**
     * Updates the current css top based on scroll direction
     */
    handleScroll() {
      const bounds = this.container.getBoundingClientRect();
      const maxTop = bounds.top + window.scrollY - this.container.offsetTop + this.defaultTop;
      const minTop = this.container.clientHeight - window.innerHeight;

      if (window.scrollY < this.scrollY) {
        this.currentTop -= window.scrollY - this.scrollY;
      } else {
        this.currentTop += this.scrollY - window.scrollY;
      }

      this.currentTop = Math.min(Math.max(this.currentTop, -minTop), maxTop, this.defaultTop);
      this.scrollY = window.scrollY;
      this.container.style.top = `${this.currentTop}px`;
    }
  }

  customElements.define('sticky-scroll-direction', StickyScrollDirection);
}
