if (!customElements.get('variant-label')) {
  class VariantLabel extends HTMLElement {
    constructor() {
      super();
      this.variantLabels = this.querySelectorAll('.js-variant-label');
      window.initLazyScript(this, this.initLazySection.bind(this));
    }

    initLazySection() {
      if (this.variantLabels) {
        // Bind to on:variant:change event for this product
        const variantPicker = this.closest('.product').querySelector('variant-picker');
        if (variantPicker) {
          variantPicker.addEventListener('on:variant:change', this.handleVariantChange.bind(this));
        }

        if (this.dataset.currentVariantId) {
          this.setVisibleVariantLabel(this.dataset.currentVariantId);
        }
      }
    }

    /**
     * Sets the visible variant variantLabels.
     * @param {string} variantId - The variant id
     */
    setVisibleVariantLabel(variantId) {
      this.variantLabels.forEach((variantLabel) => {
        variantLabel.hidden = variantLabel.dataset.variantId.toString() !== variantId.toString();
      });
    }

    /**
     * Handles a 'change' event on the variant picker element
     * @param {object} evt - Event object
     */
    handleVariantChange(evt) {
      if (evt.detail.variant) {
        this.setVisibleVariantLabel(evt.detail.variant.id);
      }
    }
  }

  customElements.define('variant-label', VariantLabel);
}
