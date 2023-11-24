if (!customElements.get('shipping-calculator')) {
  class ShippingCalculator extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('button');
      this.button.addEventListener('click', this.handleSubmit.bind(this));
    }

    init() {
      this.country = this.querySelector('.js-country-select');
      this.province = this.querySelector('.js-province-select');
      this.zip = this.querySelector('.js-zip-input');
      this.rates = this.querySelector('.js-rates');
      this.errors = this.querySelector('.js-errors');
      this.initialised = true;
    }

    /**
     * Handles submission of the rates calculator.
     * @param {object} evt - Event object.
     */
    async handleSubmit(evt) {
      evt.preventDefault();
      if (!this.initialised) this.init();

      this.errors.hidden = true;
      this.rates.hidden = true;
      this.button.disabled = true;
      this.button.classList.add('is-loading');

      const params = `shipping_address[zip]=${this.zip.value}&shipping_address[country]=${this.country.value}&shipping_address[province]=${this.province.value}`;

      try {
        const response = await fetch(`${theme.routes.cart}/shipping_rates.json?${params}`);
        const data = await response.json();

        if (response.ok) {
          this.showRates(data);
        } else {
          this.showErrors(data);
        }
      } catch (error) {
        console.log(error); // eslint-disable-line
      } finally {
        this.button.classList.remove('is-loading');
        this.button.disabled = false;
      }
    }

    /**
     * Formats and shows a list of available shipping rates.
     * @param {object} data - Response data.
     */
    showRates(data) {
      const headingEl = this.rates.querySelector('.js-rates-heading');
      const textEl = this.rates.querySelector('.js-rates-text');
      textEl.innerHTML = '';

      if (data.shipping_rates && data.shipping_rates.length) {
        const headingLocaleStr = data.shipping_rates.length === 1 ? 'singleRate' : 'multipleRates';
        let rates = '';

        data.shipping_rates.forEach((rate) => {
          const formattedRate = theme.settings.moneyWithCurrencyFormat.replace(/\{\{\s*(\w+)\s*\}\}/, rate.price);
          rates += `<li>${rate.name}: ${formattedRate}</li>`;
        });

        headingEl.hidden = false;
        headingEl.textContent = theme.strings.shippingCalculator[headingLocaleStr];
        textEl.innerHTML = `<ul class="styled-list">${rates}</ul>`;
      } else {
        headingEl.hidden = true;
        textEl.innerHTML = theme.strings.shippingCalculator.noRates;
      }

      this.rates.hidden = false;
    }

    /**
     * Formats and shows errors relating to rates retrieval.
     * @param {object} data - Response data.
     */
    showErrors(data) {
      let errors = '';

      Object.keys(data).forEach((key) => {
        errors += `<li>${data[key]}</li>`;
      });

      this.errors.querySelector('.js-errors-text').innerHTML = `<ul class="styled-list">${errors}</ul>`;
      this.errors.hidden = false;
    }
  }

  customElements.define('shipping-calculator', ShippingCalculator);
}
