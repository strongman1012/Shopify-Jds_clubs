if (!customElements.get('products-toolbar')) {
  class ProductsToolbar extends HTMLElement {
    constructor() {
      super();
      window.initLazyScript(this, this.init.bind(this));
    }

    init() {
      this.filtersComponent = document.querySelector('facet-filters');
      this.filtersColumn = document.querySelector('.main-products-grid__filters');
      this.layoutSwitcher = this.querySelector('.products-toolbar__layout');
      this.compareToggle = document.getElementById('compare-switch');
      this.sortBy = this.querySelector('.products-toolbar__sort');
      this.productsGrid = document.querySelector('.main-products-grid');

      if (this.filtersColumn) {
        this.filterToggle = this.querySelector('.js-toggle-filters');
        this.filterToggle.addEventListener('click', this.toggleFilters.bind(this));
      }

      if (this.layoutSwitcher) {
        this.layoutSwitcher.addEventListener('change', this.handleLayoutChange.bind(this));

        // Set the layout to the layout in localstorage
        const layout = theme.storageUtil.get('products-layout');
        if (layout && layout === 'list') {
          const toggle = document.getElementById(`${layout}-layout-opt`);
          if (toggle) toggle.click();
        }
      }

      if (this.compareToggle) {
        this.compareToggle.addEventListener('change', this.toggleCompare.bind(this));

        const isChecked = theme.storageUtil.get('compare-toggle', true);
        if (isChecked !== null) {
          this.toggleCompare(null, isChecked, true);
        } else {
          this.toggleCompare(null, this.compareToggle.checked, false);
        }

        setTimeout(() => {
          this.classList.add('transition-ready');
          this.productsGrid.classList.add('transition-ready');
        }, 500);
      } else if (theme.settings.compareToggle === 'none') {
        this.toggleCompare(null, true, false);
      }

      if (!this.filtersComponent && this.sortBy) {
        this.sortBy.addEventListener('change', ProductsToolbar.handleSortByChange);
      }
    }

    /**
     * Updates the UI to reflect the compare state
     * @param {object} evt - Change event object
     * @param {boolean} checked - Whether compare is enabled or not (optional)
     * @param {boolean} persist - Whether to persist the new state (optional)
     */
    toggleCompare(evt, checked = null, persist = true) {
      const isChecked = evt ? evt.target.checked : checked;
      this.productsGrid.dataset.compare = isChecked;

      const compareButton = document.getElementById('compare-drawer-open');
      compareButton.classList.toggle('is-out', !isChecked);

      if (!evt && this.compareToggle) this.compareToggle.checked = isChecked;

      if (persist && !Shopify.designMode) {
        theme.storageUtil.set('compare-toggle', isChecked);
      }

      // Load scripts/styles if not already loaded
      if (isChecked) {
        const resourcesTag = document.getElementById('compare-resources');
        if (resourcesTag) {
          const resources = JSON.parse(resourcesTag.textContent);
          resources.forEach((resource) => {
            if (resource.type === 'js') {
              const script = document.createElement('script');
              script.src = resource.path;
              document.head.appendChild(script);
            } else if (resource.type === 'css') {
              const link = document.createElement('link');
              link.href = resource.path;
              link.type = 'text/css';
              link.rel = 'stylesheet';
              document.head.appendChild(link);
            }
          });
          resourcesTag.remove();
        }
      }
    }

    /**
     * Toggles open/closed state of the filters on desktop.
     */
    toggleFilters() {
      this.filterToggle.classList.toggle('is-active');
      this.filtersOpen = this.filterToggle.classList.contains('is-active');
      this.filterToggle.setAttribute('aria-expanded', this.filtersOpen);

      if (theme.mediaMatches.lg) {
        this.filtersColumn.classList.toggle('lg:js-hidden', !this.filtersOpen);
        const productsList = document.querySelector('.main-products-grid__results > .grid');

        productsList.className = this.filtersOpen
          ? productsList.dataset.filtersOpenClasses
          : productsList.dataset.filtersClosedClasses;
      } else {
        this.filtersComponent.open();
      }
    }

    /**
     * Handles 'change' events on the layout switcher buttons.
     * @param {object} evt - Event object.
     */
    handleLayoutChange(evt) {
      this.productsGrid.dataset.layout = evt.target.value;
      theme.storageUtil.set('products-layout', evt.target.value);
    }

    /**
     * Handles when a sort by dropdown is changed (and filtering is disabled)
     * @param {object} evt - Event object.
     */
    static handleSortByChange(evt) {
      const urlObj = new URL(window.location.href);
      urlObj.searchParams.set('sort_by', evt.detail.selectedValue);
      urlObj.hash = 'products-toolbar';
      window.location.href = urlObj.toString();
    }
  }

  customElements.define('products-toolbar', ProductsToolbar);
}
