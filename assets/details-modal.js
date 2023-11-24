/* global trapFocus, removeTrapFocus */

class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsEl = this.querySelector('details');
    this.toggle = this.querySelector('summary');
    this.modal = this.querySelector('.modal');
    this.detailsEl.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * Handles 'click' events on the modal.
   * @param {object} evt - Event object.
   */
  handleClick(evt) {
    if (this.hasTransition === undefined) {
      const overlayStyles = window.getComputedStyle(this.modal);
      this.hasTransition = overlayStyles.transition !== 'all 0s ease 0s';
    }

    if (!this.detailsEl.open) {
      if (evt.target === this.toggle) {
        evt.preventDefault();
        this.open();
      }
    } else if (evt.target === this.modal || evt.target === this.toggle) {
      evt.preventDefault();
      this.close();
    }
  }

  /**
   * Handles 'transitionend' events on the modal.
   * @param {object} evt - Event object.
   */
  handleTransitionEnd(evt) {
    if (evt.target === this.modal && this.detailsEl.classList.contains('is-closing')) {
      this.detailsEl.classList.remove('is-closing');
      this.detailsEl.open = false;
      document.body.classList.remove('overflow-hidden');

      // Remove event listener added on modal opening.
      this.detailsEl.removeEventListener('transitionend', this.transitionendHandler);
    }
  }

  /**
   * Initiates opening of the modal.
   */
  open() {
    document.body.classList.add('overflow-hidden');
    this.detailsEl.open = true;

    trapFocus(this.detailsEl);

    // Add event handler (so the bound event listener can be removed).
    this.keyupHandler = (evt) => evt.key === 'Escape' && this.close();

    // Add event listener (for while modal is open).
    this.detailsEl.addEventListener('keyup', this.keyupHandler);

    if (this.hasTransition) {
      this.transitionendHandler = this.transitionendHandler || this.handleTransitionEnd.bind(this);
      this.detailsEl.addEventListener('transitionend', this.transitionendHandler);
    }
  }

  /**
   * Initiates closing of the modal.
   */
  close() {
    if (this.hasTransition) {
      this.detailsEl.classList.add('is-closing');
    } else {
      this.detailsEl.open = false;
      document.body.classList.remove('overflow-hidden');
    }

    removeTrapFocus();

    // Remove event listener added on modal opening.
    this.detailsEl.removeEventListener('keyup', this.keyupHandler);
  }
}

customElements.define('details-modal', DetailsModal);
