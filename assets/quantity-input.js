class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('.qty-input__input');
    this.currentQty = this.input.value;
    this.changeEvent = new Event('change', { bubbles: true });

    this.addEventListener('click', this.handleClick.bind(this));
    this.input.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  /**
   * Handles 'click' events on the quantity input element.
   * @param {object} evt - Event object.
   */
  handleClick(evt) {
    if (!evt.target.matches('.qty-input__btn')) return;
    evt.preventDefault();

    if (evt.target.name === 'plus') {
      this.input.stepUp();
    } else {
      this.input.stepDown();
    }

    if (this.input.value !== this.currentQty) {
      this.input.dispatchEvent(this.changeEvent);
      this.currentQty = this.input.value;
    }
  }

  /**
   * Handles 'keydown' events on the input field.
   * @param {object} evt - Event object.
   */
  handleKeydown(evt) {
    if (evt.key !== 'Enter') return;
    evt.preventDefault();

    if (this.input.value !== this.currentQty) {
      this.input.blur();
      this.input.focus();
      this.currentQty = this.input.value;
    }
  }
}

customElements.define('quantity-input', QuantityInput);
