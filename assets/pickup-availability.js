if (!customElements.get('pickup-availability')) {
  class PickupAvailability extends HTMLElement {
    constructor() {
      super();
      if (!this.hasAttribute('available')) return;

      this.refreshHandler = this.handleRefreshBtnClick.bind(this);
      this.unavailableHtml = this.querySelector('template').content.firstElementChild.cloneNode(true);

      this.getAvailability(this.dataset.variantId);
    }

    /**
     * Handles 'click' events on the refresh button.
     */
    handleRefreshBtnClick() {
      this.getAvailability(this.dataset.variantId);
    }

    /**
     * Gets pick up availability for the current variant.
     * @param {string} variantId - Current variant id.
     */
    async getAvailability(variantId) {
      let { rootUrl } = this.dataset;
      if (!rootUrl.endsWith('/')) rootUrl = `${rootUrl}/`;

      try {
        const response = await fetch(`${rootUrl}variants/${variantId}/?section_id=pickup-availability`);
        if (!response.ok) throw new Error(response.status);

        const tmpl = document.createElement('template');
        tmpl.innerHTML = await response.text();

        this.renderPickupInfo(tmpl.content.querySelector('.shopify-section'));
      } catch (error) {
        const refreshBtn = this.querySelector('.js-refresh');
        if (refreshBtn) refreshBtn.removeEventListener('click', this.refreshHandler);
        this.renderUnavailableMsg();
      }
    }

    /**
     * Renders the pick up info.
     * @param {string} sectionHtml - Fetched section HTML.
     */
    renderPickupInfo(sectionHtml) {
      const drawer = document.querySelector('.js-pickup-drawer');
      if (drawer) drawer.remove();

      if (!sectionHtml.querySelector('.pickup-status')) {
        this.innerHTML = '';
        this.removeAttribute('available');
        return;
      }

      this.setAttribute('available', '');
      this.innerHTML = sectionHtml.querySelector('.pickup-status').outerHTML;
      document.body.appendChild(sectionHtml.querySelector('.js-pickup-drawer'));

      const showDetailsBtn = this.querySelector('.js-show-pickup-info');
      if (showDetailsBtn) {
        showDetailsBtn.addEventListener('click', () => {
          document.querySelector('.js-pickup-drawer').open(showDetailsBtn);
        });
      }
    }

    /**
     * Renders a 'pick up unavailable' message.
     */
    renderUnavailableMsg() {
      this.innerHTML = '';
      this.appendChild(this.unavailableHtml);
      this.querySelector('.js-refresh').addEventListener('click', this.refreshHandler);
    }
  }

  customElements.define('pickup-availability', PickupAvailability);
}
