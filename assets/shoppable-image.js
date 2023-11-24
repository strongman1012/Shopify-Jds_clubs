/* global trapFocus, removeTrapFocus */

if (!customElements.get('shoppable-image')) {
  class ShoppableImage extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('click', this.handleClick.bind(this));
    }

    /**
     * Handles 'click' events on the shoppable image.
     * @param {object} evt - Event object.
     */
    handleClick(evt) {
      if (!evt.target.matches('.hotspot__btn')) return;
      const hotspot = evt.target.parentNode;

      if (hotspot === this.activeHotspot) {
        this.closeActiveHotspot(evt);
      } else {
        if (this.activeHotspot) this.closeActiveHotspot(evt);
        this.activateHotspot(hotspot);
      }
    }

    /**
     * Handles 'click' events on the document.
     * @param {object} evt - Event object.
     */
    handleClickOutside(evt) {
      if (evt.target.matches('.hotspot__btn') || evt.target.matches('.hotspot__card')) return;
      if (this.activeHotspot) this.closeActiveHotspot(evt);
    }

    /**
     * Handles 'keyup' events on the document.
     * @param {object} evt - Event object.
     */
    handleKeyup(evt) {
      if (evt.key !== 'Escape') return;
      if (this.activeHotspot) this.closeActiveHotspot(evt);
    }

    /**
     * Handles 'transitionend' events on the shoppable image.
     * @param {object} evt - Event object.
     */
    handleTransitionEnd(evt) {
      if (this.activeHotspot || evt.propertyName !== 'opacity') return;

      this.classList.add('overflow-hidden');
      this.activeCard.style = null;
      this.activeCard = null;

      this.removeEventListener('transitionend', this.transitionHandler);
    }

    /**
     * Activates a hotspot and shows the corresponding product card.
     * @param {Element} hotspot - Selected hotspot.
     */
    activateHotspot(hotspot) {
      this.activeCard = hotspot.querySelector('.hotspot__card');
      this.checkCardPosition();
      this.classList.remove('overflow-hidden');
      this.setHotspotActiveState(hotspot, true);
      trapFocus(hotspot);

      document.addEventListener('click', this.handleClickOutside.bind(this));
      document.addEventListener('keyup', this.handleKeyup.bind(this));
      window.addEventListener('resize', this.closeActiveHotspot.bind(this));
    }

    /**
     * Hides the product card and deactivates the hotspot.
     * @param {object} evt - Event object.
     */
    closeActiveHotspot(evt) {
      if (evt.type !== 'resize') {
        this.transitionHandler = this.transitionHandler || this.handleTransitionEnd.bind(this);
        this.addEventListener('transitionend', this.transitionHandler);
      }

      this.setHotspotActiveState(this.activeHotspot, false);
      removeTrapFocus();

      if (evt.type === 'resize') {
        this.classList.add('overflow-hidden');
        this.activeCard.style = null;
        this.activeCard = null;
      }

      document.removeEventListener('click', this.handleClickOutside.bind(this));
      document.removeEventListener('keyup', this.handleKeyup.bind(this));
      window.removeEventListener('resize', this.closeActiveHotspot.bind(this));
    }

    /**
     * Ensures the card is within the image bounds horizontally and viewport bounds vertically.
     */
    checkCardPosition() {
      const cardRect = this.activeCard.getBoundingClientRect();
      const imageRect = this.getBoundingClientRect();

      if (cardRect.bottom > document.documentElement.clientHeight) {
        // Card is out of the viewport to the bottom.
        this.activeCard.style.top = 'auto';
        this.activeCard.style.bottom = 'calc(100% + 12px)';
      }

      if (cardRect.right > imageRect.right) {
        // Card is out of the image to the right.
        this.activeCard.style.left = `calc(50% - ${(cardRect.right - imageRect.width) - 4}px)`;
      } else if (cardRect.left < imageRect.left) {
        // Card is out of the image to the left.
        this.activeCard.style.left = `calc(50% - ${cardRect.left - 28}px)`;
      }
    }

    /**
     * Sets the active state of a hotspot.
     * @param {Element} hotspot - Hotspot element.
     * @param {boolean} active - Set the hotspot as active.
     */
    setHotspotActiveState(hotspot, active) {
      hotspot.classList.toggle('is-active', active);
      hotspot.querySelector('.hotspot__btn').setAttribute('aria-expanded', active);
      hotspot.querySelector('.hotspot__card').setAttribute('aria-hidden', !active);

      this.activeHotspot = active ? hotspot : null;
    }
  }

  customElements.define('shoppable-image', ShoppableImage);
}
