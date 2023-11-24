if (!customElements.get('product-message')) {
  class ProductMessage extends HTMLElement {
    constructor() {
      super();
      this.closeButton = this.querySelector('.js-close-message');
      this.openInEditor = false;

      this.init();
      this.bindEvents();
    }

    disconnectedCallback() {
      if (this.blockSelectHandler) {
        document.removeEventListener('shopify:block:select', this.blockSelectHandler);
      }

      if (this.blockDeselectHandler) {
        document.removeEventListener('shopify:block:deselect', this.blockDeselectHandler);
      }
    }

    /**
     * Decide whether to show the message, and whether to hide it again (if it's transient)
     */
    init() {
      let preventShow = false;

      if (this.dataset.persistentClose && !Shopify.designMode) {
        const closedMessages = theme.storageUtil.get('closed-messages', true) || [];
        if (closedMessages && closedMessages.includes(this.dataset.blockId)) {
          preventShow = true;
          this.remove();
        }
      }

      if (this.classList.contains('product-message--out') && (!preventShow || Shopify.designMode)) {
        this.show(!this.dataset.transient);

        if (this.dataset.transient) {
          setTimeout(() => {
            if (!this.openInEditor) {
              this.hide(false);
            }
          }, this.dataset.transient * 1000);
        }
      }
    }

    /**
     * Handle close and TE events
     */
    bindEvents() {
      if (this.closeButton) {
        this.closeButton.addEventListener('click', this.handleCloseClick.bind(this));
      }

      if (Shopify.designMode && this.dataset.transient) {
        this.blockSelectHandler = this.handleBlockSelect.bind(this);
        this.blockDeselectHandler = this.handleBlockDeselect.bind(this);
        document.addEventListener('shopify:block:select', this.blockSelectHandler);
        document.addEventListener('shopify:block:deselect', this.blockDeselectHandler);
      }
    }

    /**
     * Decide whether to show the message or not
     * @param {object} evt - Event object
     */
    handleBlockSelect(evt) {
      if (evt.target.classList.contains('product-message') && evt.target.dataset.transient) {
        this.openInEditor = true;
        this.show(true);
      }
    }

    /**
     * Decide whether to hide the message or not
     * @param {object} evt - Event object
     */
    handleBlockDeselect(evt) {
      if (evt.target.classList.contains('product-message') && evt.target.dataset.transient) {
        this.openInEditor = false;
        this.hide(true);
        theme.storageUtil.remove('closed-messages');
      }
    }

    /**
     * Closes the message and stores its closure in localStorage when appropriate
     */
    handleCloseClick() {
      if (this.dataset.persistentClose) {
        const closedMessages = theme.storageUtil.get('closed-messages', true) || [];
        if (!closedMessages.includes(this.dataset.blockId)) {
          closedMessages.push(this.dataset.blockId);
          theme.storageUtil.set('closed-messages', closedMessages);
        }
      }
      this.hide(true);
    }

    /**
     * Shows the message
     * @param {boolean} instant - If the message should animate or not
     */
    show(instant) {
      if (instant) {
        this.style.transitionDelay = '0s';
        this.style.transitionDuration = '0s';
      }
      this.classList.remove('product-message--out');
    }

    /**
     * Hides the message
     * @param {boolean} instant - If the message should animate or not
     */
    hide(instant) {
      if (instant) {
        this.style.transitionDelay = '0s';
        this.style.transitionDuration = '0.2s';
        this.style.filter = 'opacity(0)'; // Use a non-transitioning property
        this.style.pointerEvents = 'none';
      }

      if (this.classList.contains('product-message--info')) {
        this.style.maxHeight = `${this.getBoundingClientRect().height + 10}px`;
        setTimeout(() => {
          // Delay to trigger css transition
          this.classList.add('product-message--out');
        });
      } else {
        this.classList.add('product-message--out');
      }
    }
  }

  customElements.define('product-message', ProductMessage);
}
