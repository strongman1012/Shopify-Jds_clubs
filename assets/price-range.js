if (!customElements.get('price-range')) {
  class PriceRange extends HTMLElement {
    constructor() {
      super();
      window.initLazyScript(this, this.init.bind(this));
    }

    init() {
      this.minNumberInput = document.getElementById('price-range-number-min');
      this.maxNumberInput = document.getElementById('price-range-number-max');
      this.minSliderInput = document.getElementById('price-range-slider-min');
      this.maxSliderInput = document.getElementById('price-range-slider-max');
      this.minValue = Number(this.minNumberInput.min);
      this.maxValue = Number(this.maxNumberInput.max);
      this.timeout = null;
      this.addEventListener('input', this.handleInput.bind(this));
    }

    /**
     * Handles 'input' events on the price range component.
     * @param {object} evt - Event object.
     */
    handleInput(evt) {
      if (evt.detail !== undefined) {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
          this.updateSliderInputs(evt);
          this.updateNumberInputs();
        }, 500);
      } else {
        this.updateSliderInputs(evt);
        this.updateNumberInputs();
      }
    }

    /**
     * Updates the value of the 'number' type inputs.
     */
    updateNumberInputs() {
      this.minNumberInput.value = this.minSliderInput.value !== this.minNumberInput.min
        ? this.minSliderInput.value : null;

      this.maxNumberInput.value = this.maxSliderInput.value !== this.maxNumberInput.max
        ? this.maxSliderInput.value : null;
    }

    /**
     * Updates the value of the 'range' type inputs.
     * @param {object} evt - Event object.
     */
    updateSliderInputs(evt) {
      const minValue = parseInt(this.minNumberInput.value, 10);
      const maxValue = parseInt(this.maxNumberInput.value, 10);

      if (minValue > maxValue - 10) {
        if (evt.target === this.minNumberInput) {
          this.maxSliderInput.value = minValue + 10;

          if (maxValue === this.maxValue) {
            this.minSliderInput.value = this.maxValue - 10;
          }
        } else {
          this.minSliderInput.value = maxValue - 10;
        }
      }

      if (maxValue < minValue + 10) {
        if (evt.target === this.maxNumberInput) {
          this.minSliderInput.value = maxValue - 10;

          if (minValue === this.minValue) {
            this.maxSliderInput.value = 10;
          }
        } else {
          this.maxSliderInput.value = minValue + 10;
        }
      }

      if (evt.target === this.minNumberInput) {
        this.minSliderInput.value = minValue || Number(this.minNumberInput.min);
      }

      if (evt.target === this.maxNumberInput) {
        this.maxSliderInput.value = maxValue || Number(this.maxNumberInput.max);
      }
    }
  }

  customElements.define('price-range', PriceRange);
}
