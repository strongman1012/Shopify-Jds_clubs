/* global debounce, trapFocus */

if (!customElements.get('cart-items')) {
  class CartItems extends HTMLElement {
    constructor() {
      super();
      if (this.dataset.empty === 'false') this.init();
    }

    disconnectedCallback() {
      document.removeEventListener('dispatch:cart-drawer:refresh', this.cartRefreshHandler);
    }

    init() {
      this.fetchRequestOpts = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      };

      this.cartDrawer = document.getElementById('cart-drawer');
      this.itemStatus = document.getElementById('cart-line-item-status');
      this.currentTotalItemCount = Array.from(this.querySelectorAll('[name="updates[]"]')).reduce(
        (total, quantityInput) => total + parseInt(quantityInput.value, 10),
        0
      );

      this.currentQuantities = [];
      this.querySelectorAll('.cart-item').forEach((item) => {
        this.currentQuantities[item.dataset.variantId] = Number(item.querySelector('.qty-input__input').value);
      });

      this.addEventListener('click', this.handleClick.bind(this));
      this.addEventListener('change', debounce(this.handleChange.bind(this)));

      this.cartRefreshHandler = this.refreshCart.bind(this);
      document.addEventListener('dispatch:cart-drawer:refresh', this.cartRefreshHandler);
    }

    /**
     * Handles 'click' events on the cart items element.
     * @param {object} evt - Event object.
     */
    handleClick(evt) {
      if (!evt.target.matches('.js-remove-item')) return;
      evt.preventDefault();
      this.updateQuantity(evt.target.dataset.index, 0);
    }

    /**
     * Handles 'change' events on the cart items element.
     * @param {object} evt - Event object.
     */
    handleChange(evt) {
      this.updateQuantity(evt.target.dataset.index, evt.target.value, document.activeElement.name);
    }

    /**
     * Updates the quantity of a line item.
     * @param {number} line - Line item index.
     * @param {number} quantity - Quantity to set.
     * @param {string} name - Active element name.
     */
    async updateQuantity(line, quantity, name) {
      this.enableLoading(line);

      // clear all errors except this line's (which will be refreshed after this update)
      const lineErrorsId = `line-item-error-${line}`;
      const lineErrors = document.getElementById(lineErrorsId);
      document.querySelectorAll(`.cart-errors, .cart-item__error:not([id="${lineErrorsId}"])`).forEach((el) => {
        el.innerHTML = '';
        el.hidden = true;
      });

      this.fetchRequestOpts.body = JSON.stringify({
        line,
        quantity,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });

      try {
  
        const lineItem = document.getElementById(`cart-item-${line}`);
        const variantId = Number(lineItem.dataset.variantId);
        const oldTotalQuantity = this.currentTotalItemCount;
        const response = await fetch(theme.routes.cartChange, this.fetchRequestOpts);
        const data = await response.json();

        if (!response.ok) throw new Error(data.errors || response.status);

        const newTotalQuantity = data.item_count;

        if (this.cartDrawer) {
          this.cartDrawer
            .querySelector('.drawer__content')
            .classList.toggle('drawer__content--flex', newTotalQuantity === 0);

          if (newTotalQuantity === 0) {
            const recommendations = this.cartDrawer.querySelector('product-recommendations');
            if (recommendations) recommendations.remove();
          }
        } else if (newTotalQuantity === 0) {
          // We're on the Cart page
          const cartTitle = this.closest('.cc-main-cart').querySelector('.js-cart-title');
          if (cartTitle) cartTitle.style.textAlign = 'center';

          const cartSummaryCss = document.getElementById('cart-summary-css');
          if (cartSummaryCss) cartSummaryCss.remove();

          const cartSummary = document.getElementById('cart-summary');
          if (cartSummary) cartSummary.hidden = true;
        }

        this.getSectionsToRender().forEach((section) => {
          const sectionEl = document.getElementById(section.id);
          if (!sectionEl) return;

          const { selector } = section;
          const el = sectionEl.querySelector(selector) || sectionEl;
          el.innerHTML = CartItems.getElementHTML(data.sections[section.section], selector);
        });

        this.updateRecommendations(data.item_count > 0 ? data.items[0].product_id : null);
        this.updateLiveRegions();
        this.setFocus(line, newTotalQuantity, name);
        this.dataset.empty = newTotalQuantity === 0;
        this.currentTotalItemCount = newTotalQuantity;

        // Fire the on:line-item:change event if the line item quantity has changed
        if (oldTotalQuantity !== newTotalQuantity) {
          this.dispatchEvent(new CustomEvent('on:line-item:change', {
            bubbles: true,
            detail: {
              cart: data,
              variantId,
              oldQuantity: this.currentQuantities[variantId],
              newQuantity: Number(quantity)
            }
          }));
          if(window.BOLD && BOLD.common && BOLD.common.eventEmitter && typeof BOLD.common.eventEmitter.emit === 'function'){
            BOLD.common.eventEmitter.emit('BOLD_COMMON_cart_loaded', data);
          }
        }

        this.currentQuantities[variantId] = Number(quantity);

        lineErrors.innerHTML = '';
        lineErrors.hidden = true;
      } catch (error) {
        if (/^[0-9]+$/.test(error.message)) {
          lineErrors.textContent = theme.strings.cartError;
        } else {
          lineErrors.textContent = error.message;
        }
        lineErrors.hidden = false;
        console.log(error); // eslint-disable-line

        this.querySelectorAll('.cart-item__loader').forEach((loader) => {
          loader.hidden = true;
        });

        this.dispatchEvent(new CustomEvent('on:cart:error', {
          bubbles: true,
          detail: {
            error: error.message
          }
        }));

        const input = document.getElementById(`quantity-${line}`);
        input.value = input.dataset.initialValue;
        input.closest('quantity-input').currentQty = input.dataset.initialValue;
      } finally {
        this.classList.remove('pointer-events-none');
      }
    }

    /**
     * Refreshes the cart by rerendering its sections and updating its product recommendations.
     */
    async refreshCart() {
      const errors = document.getElementById('cart-errors');
      try {
        const sections = this.getSectionsToRender().map((section) => section.section);
        const response = await fetch(`?sections=${sections}`);
        const data = await response.json();

        if (!response.ok) throw new Error(response.status);

        this.getSectionsToRender().forEach((section) => {
          const sectionEl = document.getElementById(section.id);
          if (!sectionEl) return;

          const el = sectionEl.querySelector(section.selector) || sectionEl;
          el.innerHTML = CartItems.getElementHTML(data[section.section], section.selector);
        });

        const firstCartItem = this.querySelector('.cart-item:first-child');
        this.updateRecommendations(firstCartItem ? firstCartItem.dataset.productId : null);

        errors.innerHTML = '';
        errors.hidden = true;
      } catch (error) {
        errors.textContent = theme.strings.cartError;
        errors.hidden = false;
        console.log(error); // eslint-disable-line

        this.dispatchEvent(new CustomEvent('on:cart:error', {
          bubbles: true,
          detail: {
            error: error.message
          }
        }));
      }
    }

    /**
     * Returns an array of objects containing required section details.
     * @returns {Array}
     */
    getSectionsToRender() {
      let sections = [
        {
          id: 'cart-icon-bubble',
          section: 'cart-icon-bubble',
          selector: '.shopify-section'
        },
        {
          id: 'free-shipping-notice',
          section: 'free-shipping-notice',
          selector: '.free-shipping-notice'
        }
      ];

      if (this.cartDrawer) {
        const cartDrawerId = this.cartDrawer.closest('.shopify-section').id.replace('shopify-section-', '');
        sections = [
          ...sections,
          {
            id: 'cart-items',
            section: cartDrawerId,
            selector: 'cart-items'
          },
          {
            id: 'cart-drawer',
            section: cartDrawerId,
            selector: '.drawer__footer'
          }
        ];
      } else {
        sections = [
          ...sections,
          {
            id: 'cart-items',
            section: this.dataset.section,
            selector: 'cart-items'
          },
          {
            id: 'cart-summary',
            section: document.getElementById('cart-summary').dataset.section,
            selector: '.cart__summary'
          }
        ];
      }

      return sections;
    }

    /**
     * Gets the innerHTML of an element.
     * @param {string} html - Section HTML.
     * @param {string} selector - CSS selector for the element to get the innerHTML of.
     * @returns {string}
     */
    static getElementHTML(html, selector) {
      const tmpl = document.createElement('template');
      tmpl.innerHTML = html;

      const el = tmpl.content.querySelector(selector);
      return el ? el.innerHTML : '';
    }

    /**
     * Shows a loading icon over a line item.
     * @param {string} line - Line item index.
     */
    enableLoading(line) {
      this.classList.add('pointer-events-none');

      const loader = this.querySelector(`#cart-item-${line} .cart-item__loader`);
      if (loader) loader.hidden = false;

      document.activeElement.blur();
      if (this.itemStatus) this.itemStatus.setAttribute('aria-hidden', 'false');
    }

    /**
     * Updates the cart recommendations.
     * @param {string} productId - The product id for which to find recommendations.
     */
    updateRecommendations(productId) {
      this.recommendations = this.recommendations || document.getElementById('cart-recommendations');
      if (!this.recommendations) return;

      if (productId) {
        this.recommendations.dataset.productId = productId;
        this.recommendations.init();
      } else {
        this.recommendations.innerHTML = '';
      }
    }

    /**
     * Updates the live regions.
     */
    updateLiveRegions() {
      this.itemStatus.setAttribute('aria-hidden', 'true');

      const cartStatus = document.getElementById('cart-live-region-text');
      cartStatus.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        cartStatus.setAttribute('aria-hidden', 'true');
      }, 1000);
    }

    /**
     * Traps focus in the relevant container or focuses the active element.
     * @param {number} line - Line item index.
     * @param {number} itemCount - Item count.
     * @param {string} name - Active element name.
     */
    setFocus(line, itemCount, name) {
      const lineItem = document.getElementById(`cart-item-${line}`);
      let activeEl;

      if (lineItem) {
        activeEl = lineItem.querySelector(`[name="${name}"]`);
      }

      if (this.cartDrawer) {
        if (lineItem && activeEl) {
          trapFocus(this.cartDrawer, activeEl);
        } else if (itemCount === 0) {
          trapFocus(
            this.cartDrawer.querySelector('.js-cart-empty'),
            this.cartDrawer.querySelector('a')
          );
        } else if (this.cartDrawer.querySelector('.cart-item')) {
          trapFocus(this.cartDrawer, document.querySelector('.js-item-name'));
        }
      } else if (lineItem && activeEl) {
        activeEl.focus();
      }
    }
  }

  customElements.define('cart-items', CartItems);
}
