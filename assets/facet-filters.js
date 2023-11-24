/* global SideDrawer, debounce, initLazyImages */

if (!customElements.get('facet-filters')) {
  class FacetFilters extends SideDrawer {
    connectedCallback() {
      this.init();
    }

    disconnectedCallback() {
      window.removeEventListener('popstate', this.historyChangeHandler);

      if (this.breakpointChangeHandler) {
        window.removeEventListener('on:breakpoint-change', this.breakpointChangeHandler);
      }
    }

    init() {
      this.filteringEnabled = this.dataset.filtering === 'true';
      this.sortingEnabled = this.dataset.sorting === 'true';
      this.form = document.getElementById('facets');
      this.results = document.getElementById('filter-results');

      if (this.filteringEnabled) {
        this.filters = this.querySelector('.facets__filters');
        this.activeFilters = this.querySelector('.facets__active-filters');
        this.activeFiltersList = this.querySelector('.active-filters');
        this.activeFiltersHeader = this.querySelector('.active-filters-header');
        this.footer = this.querySelector('.facets__footer');
      }

      if (this.sortingEnabled) {
        this.mobileSortByOptions = this.querySelectorAll('.js-drawer-sort-by');
        this.desktopSortBy = document.querySelector('.products-toolbar__sort');
      }

      this.handleBreakpointChange();
      this.addListeners();
    }

    addListeners() {
      if (this.filteringEnabled) {
        this.breakpointChangeHandler = this.breakpointChangeHandler
          || this.handleBreakpointChange.bind(this);
        this.filters.addEventListener('click', this.handleFiltersClick.bind(this));
        this.filters.addEventListener('input', debounce(this.handleFilterChange.bind(this), 300));
        this.activeFilters.addEventListener('click', this.handleActiveFiltersClick.bind(this));
        window.addEventListener('on:breakpoint-change', this.breakpointChangeHandler);
      }

      if (this.sortingEnabled) {
        this.desktopSortBy.addEventListener('change', this.handleFilterChange.bind(this));
      }

      this.historyChangeHandler = this.historyChangeHandler || this.handleHistoryChange.bind(this);
      window.addEventListener('popstate', this.historyChangeHandler);
    }

    /**
     * Handles viewport breakpoint changes.
     */
    handleBreakpointChange() {
      if (theme.mediaMatches.lg) {
        this.setAttribute('open', '');
        this.setAttribute('aria-hidden', 'false');
        this.removeAttribute('aria-modal');
        this.removeAttribute('role');
      } else {
        this.close();
        this.setAttribute('role', 'dialog');
        this.setAttribute('aria-modal', 'true');
        this.setAttribute('aria-hidden', 'true');
        this.hidden = false;
      }
    }

    /**
     * Handles 'input' events on the filters and 'change' events on the sort by dropdown.
     * @param {object} evt - Event object.
     */
    handleFilterChange(evt) {
      const formData = new FormData(this.form);
      const searchParams = new URLSearchParams(formData);
      const emptyParams = [];

      if (this.sortingEnabled) {
        let currentSortBy = searchParams.get('sort_by');

        // Keep the mobile facets form sync'd with the desktop sort by dropdown
        if (evt.target.tagName === 'CUSTOM-SELECT') {
          this.mobileSortByOptions.forEach((option) => {
            option.checked = option.value === evt.detail.selectedValue;
            currentSortBy = evt.detail.selectedValue;
          });
        }

        // Set the 'sort_by' parameter.
        searchParams.set('sort_by', currentSortBy);
      }

      // Get empty parameters.
      searchParams.forEach((value, key) => {
        if (!value) emptyParams.push(key);
      });

      // Remove empty parameters.
      emptyParams.forEach((key) => {
        searchParams.delete(key);
      });

      this.applyFilters(searchParams.toString(), evt);
    }

    /**
     * Handles 'click' events on the filters.
     * @param {object} evt - Event object.
     */
    handleFiltersClick(evt) {
      const { target } = evt;

      // Filter 'clear' button clicked.
      if (target.matches('.js-clear-filter')) {
        evt.preventDefault();
        this.applyFilters(new URL(evt.target.href).searchParams.toString(), evt);
      }

      // Filter 'show more' button clicked.
      if (target.matches('.js-show-more')) {
        const filter = target.closest('.filter');
        target.remove();

        filter.querySelectorAll('li').forEach((el) => {
          el.classList.remove('js-hidden');
        });
      }
    }

    /**
     * Handles 'click' events on the active filters.
     * @param {object} evt - Event object.
     */
    handleActiveFiltersClick(evt) {
      if (evt.target.tagName !== 'A') return;
      evt.preventDefault();
      this.applyFilters(new URL(evt.target.href).searchParams.toString(), evt);
    }

    /**
     * Handles history changes (e.g. back button clicked).
     * @param {object} evt - Event object.
     */
    handleHistoryChange(evt) {
      if (evt.state !== null) {
        let searchParams = '';

        if (evt.state && evt.state.searchParams) {
          ({ searchParams } = evt.state);
        }

        this.applyFilters(searchParams, null, false);
      }
    }

    /**
     * Fetches the filtered/sorted page data and updates the current page.
     * @param {string} searchParams - Filter/sort search parameters.
     * @param {object} evt - Event object.
     * @param {boolean} [updateUrl=true] - Update url with the selected options.
     */
    async applyFilters(searchParams, evt, updateUrl = true) {
      this.results.classList.add('is-loading');

      // Disable "Show X results" button until submission is complete.
      const closeBtn = this.querySelector('.js-close-drawer-mob');
      closeBtn.ariaDisabled = 'true';
      closeBtn.classList.add('is-loading');

      // Fetch filtered products markup.
      const response = await fetch(`${window.location.pathname}?${searchParams}`);

      if (response.ok) {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = await response.text();

        // Update the filters.
        if (this.filteringEnabled) this.updateFilters(tmpl.content, evt);

        // Update the label of the mobile filter button
        closeBtn.innerText = tmpl.content.querySelector('.js-close-drawer-mob').innerText;

        // Update the results.
        this.results.innerHTML = tmpl.content.getElementById('filter-results').innerHTML;

        // Reinitiate lazyload images after filters applied.
        if (typeof initLazyImages === 'function') initLazyImages();

        // Update the URL.
        if (updateUrl) FacetFilters.updateURL(searchParams);

        // Scroll to the top of the results if needed
        if (this.results.getBoundingClientRect().top < 0) {
          // If the header is sticky, compensate for it when scrolling to elements
          let headerHeight = 0;
          if (document.querySelector('store-header[data-is-sticky="true"]')) {
            headerHeight = Number.parseInt(
              getComputedStyle(this.parentElement)
                .getPropertyValue('--header-height')
                .replace('px', ''),
              10
            ) || 0;
          }
          window.scrollTo({
            top: this.results.getBoundingClientRect().top + window.scrollY - headerHeight - 45,
            behavior: 'smooth'
          });
        }

        // Enable the "Show X results" button
        closeBtn.classList.remove('is-loading');
        closeBtn.removeAttribute('aria-disabled');

        // Broadcast the update for anything else to hook into
        document.dispatchEvent(new CustomEvent('on:facet-filters:updated'), { bubbles: true });
      }

      this.results.classList.remove('is-loading');
    }

    /**
     * Updates the filters with the fetched data.
     * @param {string} html - HTML of the fetched document.
     * @param {object} evt - Event object.
     */
    updateFilters(html, evt) {
      document.querySelectorAll('.filter').forEach((filter) => {
        const { index } = filter.dataset;
        const fetchedFilter = html.querySelector(`.filter[data-index="${index}"]`);

        if (filter.dataset.type !== 'sort') {
          if (filter.dataset.type === 'price_range') {
            FacetFilters.updateFilter(filter, fetchedFilter, false);

            if (!evt || evt.target.tagName !== 'INPUT') {
              filter.querySelectorAll('input').forEach((input) => {
                input.value = html.getElementById(input.id).value;
              });
            }
          } else if (evt && evt.target.tagName === 'INPUT') {
            const changedFilter = evt.target.closest('.filter');

            if (changedFilter && changedFilter.dataset) {
              FacetFilters.updateFilter(
                filter,
                fetchedFilter,
                filter.dataset.index !== changedFilter.dataset.index
              );
            }
          } else {
            FacetFilters.updateFilter(filter, fetchedFilter, true);
          }
        }
      });

      // Update active filters.
      this.updateActiveFilters(html);

      // Update '[x] results' button (mobile only).
      const footerEl = html.querySelector('.facets__footer');
      this.footer.innerHTML = footerEl.innerHTML;
    }

    /**
     * Updates a filter.
     * @param {Element} filter - Filter element.
     * @param {Element} fetchedFilter - Fetched filter element.
     * @param {boolean} updateAll - Update all filter markup or just toggle/header.
     */
    static updateFilter(filter, fetchedFilter, updateAll) {
      if (updateAll) {
        filter.innerHTML = fetchedFilter.innerHTML;
      } else {
        // Update toggle and header only.
        filter.replaceChild(
          fetchedFilter.querySelector('.filter__toggle'),
          filter.querySelector('.filter__toggle')
        );
        filter.querySelector('.filter__header').innerHTML = fetchedFilter.querySelector('.filter__header').innerHTML;
      }
    }

    /**
     * Updates the active filters.
     * @param {string} html - HTML of the fetched page.
     */
    updateActiveFilters(html) {
      const activeFiltersList = html.querySelector('.active-filters');
      const activeFiltersHeader = html.querySelector('.active-filters-header');

      this.activeFiltersList.innerHTML = activeFiltersList.innerHTML;
      this.activeFiltersHeader.innerHTML = activeFiltersHeader.innerHTML;
      this.activeFilters.hidden = !this.activeFiltersList.querySelector('.active-filter');
    }

    /**
     * Updates the url with the current filter/sort parameters.
     * @param {string} searchParams - Filter/sort parameters.
     */
    static updateURL(searchParams) {
      window.history.pushState(
        { searchParams },
        '',
        `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`
      );
    }
  }

  customElements.define('facet-filters', FacetFilters);
}
