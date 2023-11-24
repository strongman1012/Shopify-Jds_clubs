if (!customElements.get('blog-filter')) {
  class BlogFilter extends HTMLElement {
    constructor() {
      super();
      this.filterDropdown = document.getElementById('blog-filter-dropdown');
      this.bindEvents();
    }

    bindEvents() {
      this.filterDropdown.addEventListener('change', (evt) => {
        const link = this.querySelector(
          `#blog-filter-links a[data-tag="${evt.detail.selectedValue}"]`
        );
        if (link && link.href && link.href !== '#') window.location.href = link.href;
      });
    }
  }

  customElements.define('blog-filter', BlogFilter);
}
