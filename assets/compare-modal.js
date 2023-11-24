/* global DetailsModal, CompareUtil */

customElements.whenDefined('details-modal').then(() => {
  class CompareModal extends DetailsModal {
    constructor() {
      super();
      this.compareContainer = this.querySelector('.compare-container');
      this.compareArea = this.compareContainer.querySelector('.js-compare-area');
      this.loadingSpinner = this.compareContainer.querySelector('.loading-spinner');
      this.closeButton = this.querySelectorAll('.js-compare-close');

      this.bindEvents();
    }

    disconnectedCallback() {
      document.removeEventListener('focusin', this.clickHandler);

      if (Shopify.designMode) {
        document.removeEventListener('shopify:section:load', CompareModal.handleSectionChange);
        document.removeEventListener('on:product-compare:reload', this.compareReloadHandler);
      }
    }

    bindEvents() {
      this.addEventListener('on:product-compare-modal:open', this.open);

      this.clickHandler = this.handleClick.bind(this);
      document.addEventListener('click', this.clickHandler);

      this.closeButton.forEach((closeButton) => {
        closeButton.addEventListener('click', this.close.bind(this));
      });

      // Refresh the compare when the Compare section get updated
      if (Shopify.designMode) {
        this.compareReloadHandler = this.renderCompareTable.bind(this);
        document.addEventListener('shopify:section:load', CompareModal.handleSectionChange);
        document.addEventListener('on:product-compare:reload', this.compareReloadHandler);
      }
    }

    /**
     * Handles a 'click' event for remove from compare
     * @param {object} evt - Event object
     */
    handleClick(evt) {
      if (evt.target.classList.contains('js-compare-col-remove')) {
        evt.preventDefault();

        CompareUtil.removeFromCompare(evt.target.dataset.productId.toString(), true);

        const compareCount = CompareUtil.getCompareCount();
        this.compareContainer.dataset.compareCount = compareCount;
        if (compareCount === 1) {
          this.close();
        }
      }
    }

    /**
     * Opens the compare modal
     */
    open() {
      this.modal.classList.remove('hidden');
      this.renderCompareTable();
      super.open();
    }

    /**
     * Hook into the super function to hide the modal when it's finished closing
     * @param {object} evt - Event object
     */
    handleTransitionEnd(evt) {
      super.handleTransitionEnd(evt);
      if (this.modal.open === false) {
        this.modal.classList.add('hidden');
      }
    }

    /**
     * Triggers a refresh the compare table based on Theme Editor events
     * @param {object} evt - Event object
     */
    static handleSectionChange(evt) {
      if (evt.target.matches('.cc-compare')) {
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('on:product-compare:reload'));
        }, 1000);
      }
    }

    /**
     * Renders the compare table
     */
    async renderCompareTable() {
      // Reset the previous state if applicable
      this.loadingSpinner.removeAttribute('hidden');
      this.loadingSpinner.removeAttribute('aria-hidden');
      this.compareArea.classList.remove('revealable--in');
      this.compareArea.innerHTML = '';

      // Get the compare products
      const compareProducts = CompareUtil.getSelectedProducts();
      if (compareProducts) {
        this.compareContainer.dataset.compareCount = compareProducts.length;

        // Transform the HTML into something flexbox friendly
        const compareProductHtmlArr = await CompareModal.getCompareProducts(compareProducts);
        const compareFieldsArr = [];

        if (compareProductHtmlArr.length > 0) {
          compareProductHtmlArr.forEach((compareProductHtml) => {
            const responseHTML = document.implementation.createHTMLDocument();
            responseHTML.documentElement.innerHTML = compareProductHtml; // eslint-disable-line

            responseHTML.querySelectorAll('.shopify-section > div').forEach((compareField) => {
              if (!compareFieldsArr[compareField.dataset.compareKey]) {
                compareFieldsArr[compareField.dataset.compareKey] = [];
              }
              compareFieldsArr[compareField.dataset.compareKey].push(compareField);
            });
          });

          // Create the compare flex
          const compareElem = document.createElement('div');
          compareElem.className = 'compare-temp';

          Object.entries(compareFieldsArr).forEach(([key, value]) => {
            // If we can show empty metafield rows, or all metafields are not empty
            if (theme.settings.compareShowEmptyMetafields
              || !value.every((elem) => !!elem.dataset.isEmptyMetafield)) {
              const compareRow = document.createElement('div');
              compareRow.className = `compare-row compare-row--${
                key.includes('metafield') ? 'metafield' : key.replace('compare-', '')
              }`;
              value.forEach((elem) => compareRow.appendChild(elem));
              compareElem.appendChild(compareRow);
            }
          });

          this.compareArea.innerHTML = compareElem.innerHTML;
        } else {
          this.compareArea.innerHTML = `Unable to compare products.${
            Shopify.designMode
              ? ' Ensure the Product Compare section is enabled.'
              : ' Please try again later.'
          }`;
        }

        // Timeout to trigger CSS transition
        setTimeout(() => {
          this.loadingSpinner.setAttribute('hidden', 'true');
          this.loadingSpinner.setAttribute('aria-hidden', 'true');
          this.compareArea.classList.add('revealable--in');
        }, 100);
      }
    }

    /**
     * Fetches an array of html for each of the compare products, using the section rendering API
     * @param {Array} compareProducts - An array of product objects to compare
     */
    static async getCompareProducts(compareProducts) {
      const tempHtml = [];
      await Promise.all(
        compareProducts.map(async (product) => {
          const response = await fetch(`${product.url}`);
          if (response.ok) {
            const tmpl = document.createElement('template');
            tmpl.innerHTML = await response.text();
            const compareEl = tmpl.content.querySelector('.cc-compare');
            if (compareEl) tempHtml[product.id] = compareEl.outerHTML;
          }
        })
      );

      // Return the html in the order they were added to the compare
      const returnHtml = [];
      if (Object.keys(tempHtml).length > 0) {
        compareProducts.forEach((product) => returnHtml.push(tempHtml[product.id]));
      }

      return returnHtml;
    }
  }

  customElements.define('compare-modal', CompareModal);
});
