if (!customElements.get('quick-nav')) {
  class QuickNav extends HTMLElement {
    constructor() {
      super();
      this.childSelect = this.querySelector('custom-select[data-level="2"]');
      this.grandchildSelect = this.querySelector('custom-select[data-level="3"]');
      this.submitButton = this.querySelector('.js-submit');
      this.priceRange = this.querySelector('.js-quick-nav-price');

      this.addEventListener('change', this.handleQuickNavChange);
      this.addEventListener('click', this.handleQuickNavClick);
    }

    /**
     * Pauses an auto-playing slideshow
     */
    handleQuickNavClick() {
      const slideshowElem = this.closest('slide-show');
      if (slideshowElem && slideshowElem.dataset.autoplay === 'true') {
        const autoplayBtn = slideshowElem.querySelector('.autoplay-btn');
        if (autoplayBtn) autoplayBtn.click();
      }
    }

    /**
     * Handles when anything in the quick nav is changed (one of the selects)
     * @param {object} evt - Event object
     */
    handleQuickNavChange(evt) {
      if (evt.target.matches('custom-select') && evt.detail.selectedValue) {
        const selectedOption = evt.target.querySelector('[aria-selected="true"]');
        this.url = selectedOption.dataset.url;
        this.updateSubmitButton(selectedOption.dataset.url);

        if (selectedOption.dataset.isCollection) {
          this.parseCollectionInfo(selectedOption.dataset.url);
        } else {
          this.unparseCollectionInfo();
        }

        if (evt.target.dataset.level === '1' && this.childSelect) {
          QuickNav.prepareSelect(this.childSelect, evt.detail.selectedValue);
          QuickNav.resetSelect(this.grandchildSelect, true);
        } else if (evt.target.dataset.level === '2' && this.grandchildSelect) {
          QuickNav.prepareSelect(this.grandchildSelect, evt.detail.selectedValue);
        }
      } else if (evt.target.closest('.price-range')) {
        const priceRangeMin = this.priceRange.querySelector("[name='filter.v.price.gte']").value;
        const priceRangeMax = this.priceRange.querySelector("[name='filter.v.price.lte']").value;

        let url = this.url; // eslint-disable-line
        if (priceRangeMin) {
          url = url.includes('?') ? `${url}&` : `${url}?`;
          url += `filter.v.price.gte=${priceRangeMin}`;
        }
        if (priceRangeMax) {
          url = url.includes('?') ? `${url}&` : `${url}?`;
          url += `filter.v.price.lte=${priceRangeMax}`;
        }
        this.updateSubmitButton(url);
        this.parseCollectionInfo(url);
      } else {
        QuickNav.resetSelect(evt.target, false);
      }
    }

    /**
     * Dynamically load the price range slider and updates the number of results
     * @param {string} url - Collection url to fetch
     * @returns {Promise<void>}
     */
    async parseCollectionInfo(url) {
      this.submitButton.ariaDisabled = 'true';
      this.submitButton.classList.add('is-loading');
      let preventButtonEnable = false;

      // Fetch collection page
      const response = await fetch(url);
      if (response.ok) {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = await response.text();

        const productsContainer = tmpl.content.querySelector('[data-num-results]');
        if (productsContainer) {
          const numResults = parseInt(productsContainer.dataset.numResults, 10);
          if (numResults === 0) {
            this.submitButton.textContent = theme.strings.quickNav.show_products_none;
            preventButtonEnable = true;
          } else if (numResults === 1) {
            this.submitButton.textContent = theme.strings.quickNav.button_one.replace(
              '[quantity]',
              numResults
            );
          } else {
            this.submitButton.textContent = theme.strings.quickNav.button_other.replace(
              '[quantity]',
              numResults
            );
          }
        } else {
          // eslint-disable-next-line
          console.warn(
            'Enterprise Theme: An element with [data-num-results] could not be found on the product page.',
            url
          );
        }

        if (this.dataset.showPrice) {
          const priceRangeElem = tmpl.content.querySelector('price-range');
          if (priceRangeElem) {
            this.priceRange.innerHTML = priceRangeElem.outerHTML;
            const maxHeight = this.priceRange.querySelector('.price-range').clientHeight;
            this.priceRange.style.maxHeight = `${parseInt(maxHeight, 10) + 1}px`;
          } else {
            // eslint-disable-next-line
            console.warn(
              'Enterprise Theme: No price ranger slider could be found for collection.',
              url
            );
          }
        }
      }

      if (!preventButtonEnable) this.submitButton.removeAttribute('aria-disabled');
      this.submitButton.classList.remove('is-loading');
    }

    /**
     * Hides the price range slider
     */
    unparseCollectionInfo() {
      if (this.priceRange) this.priceRange.style.maxHeight = '0px';
      this.submitButton.textContent = theme.strings.quickNav.button_standard;
    }

    /**
     * Gets a select ready to be opened (hides irrelevant options, etc)
     * @param {object} selectElem - The select to be prepared
     * @param {string} value - The handle of the parent dropdown to filter available options by
     */
    static prepareSelect(selectElem, value) {
      let hasOptions = false;
      let counter = 0;

      // Show only the relevant options
      selectElem
        .querySelectorAll('.custom-select__option:not(.quick-nav__default-option)')
        .forEach((childLink) => {
          if (childLink.dataset.parentHandle === value) {
            hasOptions = true;
            childLink.style.display = '';
            counter += 1;
          } else {
            childLink.style.display = 'none';
          }
        });

      const listbox = selectElem.querySelector('.quick-nav__listbox');
      listbox.setAttribute('data-link-count', counter < 5 ? counter : 'loads');

      QuickNav.resetSelect(selectElem, !hasOptions);

      if (hasOptions) {
        selectElem.querySelector('.custom-select__btn').removeAttribute('disabled');
      }
    }

    /**
     * Updates the URL on the search button
     * @param {string} url - The new URL
     */
    updateSubmitButton(url) {
      // Update the url situation
      if (url && url.length > 0 && url !== '#') {
        this.submitButton.href = url;
        this.submitButton.removeAttribute('aria-disabled');
      } else {
        this.submitButton.href = '#';
        this.submitButton.setAttribute('aria-disabled', 'true');
      }
    }

    /**
     * Resets a select back to its default state
     * @param {object} selectElem - The select element to reset
     * @param {boolean} disable - Whether the select should be disabled or not
     */
    static resetSelect(selectElem, disable) {
      if (selectElem) {
        const listbox = selectElem.querySelector('.custom-select__listbox');
        listbox.removeAttribute('aria-activedescendant');

        const selectedOption = selectElem.querySelector('[aria-selected="true"]');
        if (selectedOption) {
          selectedOption.setAttribute('aria-selected', 'false');
        }

        const label = selectElem.querySelector('.custom-select__btn span');
        label.textContent = label.dataset.defaultText;
        if (disable) {
          selectElem.querySelector('.custom-select__btn').setAttribute('disabled', 'disabled');
        }

        selectElem.init();
      }
    }
  }

  customElements.define('quick-nav', QuickNav);
}
