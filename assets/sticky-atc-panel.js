if (!customElements.get('sticky-atc-panel')) {
  class StickyAtcPanel extends HTMLElement {
    constructor() {
      super();

      this.productSection = this.closest('.cc-main-product');
      this.productInfo = this.productSection.querySelector('.product-info');
      this.productForm = this.productSection.querySelector('product-form');

      if ('IntersectionObserver' in window && 'MutationObserver' in window) {
        this.bindEvents();
      }
    }

    // eslint-disable-next-line class-methods-use-this
    disconnectedCallback() {
      window.removeEventListener('scroll', StickyAtcPanel.handleScroll);
    }

    bindEvents() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.productForm && !theme.mediaMatches.md) {
            this.classList.toggle('sticky-atc-panel--out', entry.boundingClientRect.bottom > 0);
          } else if (entry.target === this.productInfo && theme.mediaMatches.md) {
            this.classList.toggle('sticky-atc-panel--out', entry.isIntersecting);
          }
        });
      });

      if (this.productForm) observer.observe(this.productForm);
      if (this.productInfo) observer.observe(this.productInfo);

      window.addEventListener('scroll', StickyAtcPanel.handleScroll);
    }

    /**
     * Watches for a scroll to the bottom of the page
     */
    static handleScroll() {
      document.body.classList.toggle(
        'scrolled-to-bottom',
        window.scrollY + window.innerHeight + 100 > document.body.scrollHeight
      );
    }
  }

  customElements.define('sticky-atc-panel', StickyAtcPanel);
}
