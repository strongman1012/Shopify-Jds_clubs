/* global trapFocus, removeTrapFocus */

if (!customElements.get('hotspots-image')) {
  class HotspotsImage extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback() {
      window.removeEventListener('on:debounced-resize', this.resizeHandler);
    }

    /**
     * Handles 'click' events on the hotspot images.
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

      this.clickOutsideHandler = this.clickOutsideHandler || this.handleClickOutside.bind(this);
      this.keyUpHandler = this.handleKeyup || this.handleKeyup.bind(this);
      this.resizeHandler = this.resizeHandler || this.closeActiveHotspot.bind(this);

      document.addEventListener('click', this.clickOutsideHandler);
      document.addEventListener('keyup', this.keyUpHandler);
      window.addEventListener('on:debounced-resize', this.resizeHandler);
    }

    /**
     * Hides the product card and deactivates the hotspot.
     * @param {object} evt - Event object.
     */
    closeActiveHotspot(evt) {
      if (evt.type !== 'on:debounced-resize') {
        this.transitionHandler = this.transitionHandler || this.handleTransitionEnd.bind(this);
        this.addEventListener('transitionend', this.transitionHandler);
      }

      if (this.activeHotspot) {
        this.setHotspotActiveState(this.activeHotspot, false);
        removeTrapFocus();

        if (evt.type === 'on:debounced-resize') {
          this.classList.add('overflow-hidden');
          this.activeCard.style = null;
          this.activeCard = null;
        }
      }

      document.removeEventListener('click', this.clickOutsideHandler);
      document.removeEventListener('keyup', this.keyUpHandler);
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
      if (theme.mediaMatches.md && cardRect.right > window.innerWidth - 20) {
        // Card is with 20px of the right edge of the viewport on desktop
        this.activeCard.style.left = `calc(50% - ${cardRect.right - window.innerWidth + 45}px)`;
      } else if (theme.mediaMatches.md && cardRect.left < 20) {
        // Card with 20px of the left edge of the viewport on desktop
        this.activeCard.style.left = `calc(50% - ${cardRect.left - 35}px)`;
      } else if (!theme.mediaMatches.md && cardRect.right > imageRect.right) {
        // Card is out of the image to the right on mobile
        this.activeCard.style.left = `calc(50% - ${cardRect.right - imageRect.width + 35}px)`;
      } else if (!theme.mediaMatches.md && cardRect.left < imageRect.left) {
        // Card is out of the image to the left on mobile
        this.activeCard.style.left = `calc(50% - ${cardRect.left - 35}px)`;
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

  customElements.define('hotspots-image', HotspotsImage);
}
