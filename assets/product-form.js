if (!customElements.get('product-form')) {
  class ProductForm extends HTMLElement {
    constructor() {
      super();
      if (this.hasChildNodes()) this.init();
    }

    init() {
      this.form = this.querySelector('.js-product-form');
      if (this.form) {
        this.form.querySelector('[name="id"]').disabled = false;
        this.cartDrawer = document.querySelector('cart-drawer');
        this.submitBtn = this.querySelector('[name="add"]');

        if (theme.settings.afterAtc !== 'no-js') {
          this.addEventListener('submit', this.handleSubmit.bind(this));
        }
      }
    }

    /**
     * Handles submission of the product form.
     * @param {object} evt - Event object.
     */
    async handleSubmit(evt) {
      if (evt.target.id === 'product-signup_form') return;

      evt.preventDefault();

      if (this.submitBtn.getAttribute('aria-disabled') === 'true') return;

      if (theme.settings.vibrateOnATC && window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }

      this.errorMsg = null;
      this.setErrorMsgState();

      // Disable "Add to Cart" button until submission is complete.
      this.submitBtn.setAttribute('aria-disabled', 'true');
      this.submitBtn.classList.add('is-loading');

      const formData = new FormData(this.form);
      let sections = 'cart-icon-bubble';
      if (this.cartDrawer) {
        sections += `,${this.cartDrawer.closest('.shopify-section').id.replace('shopify-section-', '')}`;
      }

      formData.append('sections_url', window.location.pathname);
      formData.append('sections', sections);

      const fetchRequestOpts = {
        method: 'POST',
        headers: {
          Accept: 'application/javascript',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      };

      try {
        const oldCartResponse = await fetch(`${theme.routes.cart}.js`);
        if (!oldCartResponse.ok) throw new Error(oldCartResponse.status);
        const oldCartData = await oldCartResponse.json();

        const response = await fetch(theme.routes.cartAdd, fetchRequestOpts);
        const data = await response.json();

        if (data.status) this.setErrorMsgState(data.description);

        if (!response.ok) throw new Error(response.status);

        if (theme.settings.afterAtc === 'page') {
          // Allow the tick animation to complete
          setTimeout(() => {
            window.location.href = theme.routes.cart;
          }, 300);
        } else {
          // Update cart icon count.
          ProductForm.updateCartIcon(data);

          // If item was added from Quick Add drawer, show "Added to cart" message.
          const quickAddDrawer = this.closest('quick-add-drawer');
          if (quickAddDrawer) quickAddDrawer.addedToCart();

          setTimeout(() => {
            if (this.cartDrawer) {
              this.cartDrawer.renderContents(
                data,
                !quickAddDrawer && theme.settings.afterAtc === 'drawer'
              );
            } else if (window.location.pathname === theme.routes.cart) {
              const cartItems = document.querySelector('cart-items');
              if (cartItems) cartItems.refreshCart();
            }
          }, 500);
        }

        const newCartResponse = await fetch(`${theme.routes.cart}.js`);
        if (!newCartResponse.ok) throw new Error(newCartResponse.status);
        const newCartData = await newCartResponse.json();
        const itemInOldCart = oldCartData.items.filter(
          (item) => item.variant_id === data.variant_id
        )[0];

        // Check if product was already in the cart
        if (itemInOldCart) {
          this.dispatchEvent(new CustomEvent('on:line-item:change', {
            bubbles: true,
            detail: {
              cart: newCartData,
              variantId: data.variant_id,
              oldQuantity: itemInOldCart.quantity,
              newQuantity: (itemInOldCart.quantity === data.quantity)
                ? itemInOldCart.quantity : data.quantity
            }
          }));
        } else {
          this.dispatchEvent(new CustomEvent('on:cart:add', {
            bubbles: true,
            detail: {
              cart: newCartData,
              variantId: data.variant_id
            }
          }));
          
        }
      } catch (error) {
        console.log(error); // eslint-disable-line
        this.dispatchEvent(new CustomEvent('on:cart:error', {
          bubbles: true,
          detail: {
            error: this.errorMsg.textContent
          }
        }));
      } finally {
        location.reload();
        // Re-enable 'Add to Cart' button.
        this.submitBtn.classList.add('is-success');
        this.submitBtn.removeAttribute('aria-disabled');
        setTimeout(() => {
          this.submitBtn.classList.remove('is-loading');
          this.submitBtn.classList.remove('is-success');
        }, 1400);
      }

    }

    /**
     * Updates the cart icon count in the header.
     * @param {object} response - Response JSON.
     */
    static updateCartIcon(response) {
      const cartIconBubble = document.getElementById('cart-icon-bubble');
      if (cartIconBubble) {
        cartIconBubble.innerHTML = response.sections['cart-icon-bubble'];
      }
    }

    /**
     * Shows/hides an error message.
     * @param {string} [error=false] - Error to show a message for.
     */
    setErrorMsgState(error = false) {
      this.errorMsg = this.errorMsg || this.querySelector('.js-form-error');
      if (!this.errorMsg) return;

      this.errorMsg.hidden = !error;
      if (error) this.errorMsg.textContent = error;
    }
  }

  customElements.define('product-form', ProductForm);
}
