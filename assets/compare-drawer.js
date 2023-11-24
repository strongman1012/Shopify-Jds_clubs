class CompareUtil {
  /**
   * Returns an array of the selected compare products from localStorage
   * @returns {Array}
   */
  static getSelectedProducts() {
    const compareProducts = theme.storageUtil.get('compare-products', true);
    return compareProducts || [];
  }

  /**
   * Sets an array of the selected compare products to localStorage
   * @param {Array} compareProducts - An array of product objects to compare
   */
  static setSelectedProducts(compareProducts) {
    theme.storageUtil.set('compare-products', compareProducts);
  }

  /**
   * Adds a product id and url to the compare array in localStorage
   * @param {string} productId - the product id
   * @param {string} productUrl - the product url
   * @param {boolean} updateDom - whether the dom should be updated or not
   */
  static addToCompare(productId, productUrl, updateDom) {
    const compareProducts = CompareUtil.getSelectedProducts();
    if (!compareProducts.some((product) => product.id === productId)) {
      compareProducts.push({ id: productId, url: productUrl });
    }
    CompareUtil.setSelectedProducts(compareProducts);
    CompareUtil.updateCompareCounters(compareProducts.length);

    if (updateDom) {
      CompareUtil.updateCompareCheckboxes();
    }
  }

  /**
   * Removes a product from the compare array in localStorage
   * @param {string} productId - the product id
   * @param {boolean} updateDom - whether the dom should be updated or not
   */
  static removeFromCompare(productId, updateDom) {
    let compareProducts = CompareUtil.getSelectedProducts();
    if (compareProducts) {
      compareProducts = compareProducts.filter((product) => product.id !== productId);
    }
    CompareUtil.setSelectedProducts(compareProducts);
    CompareUtil.updateCompareCounters(compareProducts.length);

    if (updateDom) {
      CompareUtil.updateCompareCheckboxes();

      // Remove the product from the compare basket
      theme.elementUtil.remove(document.getElementById(`compare-basket-${productId}`));

      // Remove the product from the compare modal
      theme.elementUtil.remove(document.querySelectorAll(`.compare-col--${productId}`));
    }
  }

  /**
   * Removes a product from the compare array in localStorage
   * @param {boolean} updateDom - whether the dom should be updated or not
   */
  static clearCompare(updateDom) {
    const compareProducts = CompareUtil.getSelectedProducts();
    if (compareProducts) {
      compareProducts.forEach((product) => {
        CompareUtil.removeFromCompare(product.id, updateDom);
      });
    }
  }

  /**
   * Set whether the detected checkboxes should be checked or not
   */
  static updateCompareCheckboxes() {
    const compareProducts = CompareUtil.getSelectedProducts();
    document.querySelectorAll('.js-compare-checkbox').forEach((checkbox) => {
      checkbox.checked = compareProducts.filter(
        (product) => product.id === checkbox.dataset.productId
      ).length;
    });
  }

  /**
   * Returns a count of the number of currently in the compare basket
   * @returns {number}
   */
  static getCompareCount() {
    return CompareUtil.getSelectedProducts().length;
  }

  /**
   * Updates counters on the page with the count of products in the compare basket
   * @param {number} pCount - optionally can pass in the count of products to update
   */
  static updateCompareCounters(pCount) {
    const count = pCount || CompareUtil.getCompareCount();
    document.querySelectorAll('.js-compare-counter').forEach((counter) => {
      counter.innerText = count;
    });
  }
}

/* global SideDrawer */

if (!customElements.get('compare-drawer')) {
  class CompareDrawer extends SideDrawer {
    constructor() {
      super();
      this.openDrawerButton = document.querySelector('.js-open-compare-drawer');
      this.compareBasketArea = this.querySelector('.js-compare-basket');
      this.loadingSpinner = this.querySelector('.loading-spinner');
      this.doCompareButton = this.querySelector('.js-trigger-compare');
      this.clearButton = this.querySelector('.js-clear-compare');
      this.maxCompare = this.dataset.maxCompare;
      this.compareModal = document.querySelector('.js-compare-modal');
      this.init();
      this.bindEvents();
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.clickHandler);
      document.removeEventListener('change', this.changeHandler);
      document.removeEventListener('on:facet-filters:updated', CompareUtil.updateCompareCheckboxes);
    }

    init() {
      CompareUtil.updateCompareCheckboxes();
      CompareUtil.updateCompareCounters();
      this.toggleCompareButton();
      setTimeout(() => {
        this.openDrawerButton.removeAttribute('style');
        this.openDrawerButton.classList.add('transition-ready');
      }, 500);

      this.compareModal.querySelector('.details-modal').classList.remove('hidden');
    }

    bindEvents() {
      this.clickHandler = this.handleClick.bind(this);
      this.changeHandler = this.handleChange.bind(this);

      document.addEventListener('click', this.clickHandler);
      document.addEventListener('change', this.changeHandler);
      document.addEventListener('on:facet-filters:updated', CompareUtil.updateCompareCheckboxes);
      this.doCompareButton.addEventListener('click', this.handleDoCompareClick.bind(this));
      this.clearButton.addEventListener('click', this.handleClearCompareClick.bind(this));
    }

    /**
     * Updates the position of the 'Compare' fixed right-hand side button
     */
    toggleCompareButton() {
      if (CompareUtil.getCompareCount() === 0) {
        this.openDrawerButton.classList.add('is-out');
      } else {
        this.openDrawerButton.classList.remove('is-out');
      }
    }

    /**
     * Handles a 'click' event on open/close/remove from compare button
     * @param {object} evt - Event object
     */
    handleClick(evt) {
      if (evt.target === this.openDrawerButton) {
        if (evt.target.classList.contains('is-open')) {
          this.close();
        } else {
          this.open(evt.target);
        }
      } else if (evt.target.classList.contains('js-compare-basket-remove')) {
        CompareUtil.removeFromCompare(evt.target.dataset.productId.toString(), true);
        this.updateBasketState();
      } else if (this.overlay.classList.contains('js-compare-overlay') || evt.target.classList.contains('js-close-compare')) {
        this.close();
      }
    }

    /**
     * Handles a 'change' event for comparison checkboxes
     * @param {object} evt - Event object
     */
    handleChange(evt) {
      if (evt.target.classList.contains('js-compare-checkbox')) {
        const productData = evt.target.dataset;

        if (evt.target.checked) {
          if (CompareUtil.getCompareCount() < this.maxCompare) {
            CompareUtil.addToCompare(
              productData.productId.toString(),
              productData.productUrl,
              false
            );
          } else {
            alert(`${theme.strings.compare.limit.replace('[quantity]', this.maxCompare)}`); // eslint-disable-line
            evt.target.checked = false;
          }
        } else {
          CompareUtil.removeFromCompare(productData.productId.toString(), false);
        }

        this.updateBasketState();

        if (CompareUtil.getCompareCount() > 0) {
          this.toggleCompareButton();
        }
      }
    }

    /**
     * Handle click on the Compare button
     */
    handleDoCompareClick() {
      this.close();
      this.compareModal.dispatchEvent(new CustomEvent('on:product-compare-modal:open'), { bubbles: true });
    }

    /**
     * Handle click on the Clear button
     */
    handleClearCompareClick() {
      CompareUtil.clearCompare(true);
      this.close();
    }

    /**
     * Opens the compare drawer
     * @param {Element} opener - Element that triggered opening of the drawer
     */
    async open(opener) {
      opener.classList.add('is-open');
      this.overlay.classList.add('overlay--over-nav');
      this.overlay.classList.add('js-compare-overlay');
      super.open(opener);
      this.renderCompareBasket();
    }

    /**
     * Closes the compare drawer
     */
    close() {
      this.openDrawerButton.classList.remove('is-open');
      this.overlay.classList.remove('overlay--over-nav');
      this.overlay.classList.remove('js-compare-overlay');
      super.close();
    }

    /**
     * Enables/disables the 'Compare now' button based on number of products in compare basket
     */
    updateBasketState() {
      const compareCount = CompareUtil.getCompareCount();
      this.doCompareButton.setAttribute('aria-disabled', compareCount < 2);

      theme.elementUtil.remove(this.compareBasketArea.querySelector('.js-select-more'));
      theme.elementUtil.remove(this.compareBasketArea.querySelector('.js-select-one'));

      const continueButton = `<button class='js-close-compare link'>${theme.strings.compare.continue}</button>`;

      if (compareCount === 1) {
        this.compareBasketArea.innerHTML += `<div class='compare-prompt text-sm js-select-more'>${theme.strings.compare.more} ${continueButton}</div>`;
      } else if (compareCount === 0) {
        this.compareBasketArea.innerHTML += `<div class='compare-prompt text-sm js-select-one'>${theme.strings.compare.empty} ${continueButton}</div>`;
      }
    }

    /**
     * Fetches and renders the products in the compare basket
     */
    async renderCompareBasket() {
      const compareProducts = CompareUtil.getSelectedProducts();
      if (compareProducts) {
        // Reset the previous state if applicable
        this.loadingSpinner.removeAttribute('hidden');
        this.loadingSpinner.removeAttribute('aria-hidden');
        this.compareBasketArea.classList.remove('revealable--in');
        this.compareBasketArea.innerHTML = '';

        // Get the contents of the compare basket
        const compareProductHtmlArr = await CompareDrawer.getBasketProducts(compareProducts);
        compareProductHtmlArr.forEach((compareProductHtml) => {
          this.compareBasketArea.innerHTML += compareProductHtml;
        });

        window.initLazyImages();

        // Timeout to trigger CSS transition
        setTimeout(() => {
          this.loadingSpinner.setAttribute('hidden', 'true');
          this.loadingSpinner.setAttribute('aria-hidden', 'true');
          this.compareBasketArea.classList.add('revealable--in');

          this.updateBasketState();
        }, 100);
      }
    }

    /**
     * Fetches an array of html for each of the compare products, using the section rendering API
     * @param {Array} compareProducts - An array of product objects to compare
     */
    static async getBasketProducts(compareProducts) {
      const tempHtml = [];
      await Promise.all(
        compareProducts.map(async (product) => {
          await fetch(`${product.url}?sections=product-compare-basket`)
            .then((response) => response.json())
            .then((response) => {
              tempHtml[product.id] = response['product-compare-basket'];
            });
        })
      );

      // Return the html in the order they were added to the compare
      const returnHtml = [];
      compareProducts.forEach((product) => returnHtml.push(tempHtml[product.id]));
      return returnHtml;
    }
  }

  customElements.define('compare-drawer', CompareDrawer);
}
