if (!customElements.get('country-province-selector')) {
  class CountryProvinceSelector extends HTMLElement {
    constructor() {
      super();
      this.countryEl = this.querySelector('.js-country-select');
      this.provinceEl = this.querySelector('.js-province-select');
      this.provinceContainer = this.querySelector('.js-province-container');
      this.init();
    }

    init() {
      CountryProvinceSelector.setSelectedOption(this.countryEl, this.countryEl.dataset.default);

      if (this.provinceEl.dataset.default && this.provinceEl.options.length > 0) {
        CountryProvinceSelector.setSelectedOption(this.provinceEl, this.provinceEl.dataset.default);
      }

      this.handleCountryChange();
      this.countryEl.addEventListener('change', this.handleCountryChange.bind(this));
    }

    /**
     * Handles 'change' events on the country selector.
     */
    handleCountryChange() {
      const selectedOption = this.countryEl.options[this.countryEl.selectedIndex];
      const provinces = JSON.parse(selectedOption.dataset.provinces);

      // Remove current options.
      Array.from(this.provinceEl.options).forEach((option) => option.remove());

      if (provinces && provinces.length === 0) {
        this.provinceContainer.hidden = true;
      } else {
        provinces.forEach((province) => {
          const option = document.createElement('option');
          [option.value, option.innerHTML] = province;
          this.provinceEl.appendChild(option);
        });

        this.provinceContainer.hidden = false;
      }
    }

    /**
     * Sets the selected option of a <select> element.
     * @param {Element} selector - Country or province <select> element.
     * @param {string} value - Value of the option to select.
     */
    static setSelectedOption(selector, value) {
      Array.from(selector.options).forEach((option, index) => {
        if (option.value === value || option.innerHTML === value) {
          selector.selectedIndex = index;
        }
      });
    }
  }

  customElements.define('country-province-selector', CountryProvinceSelector);
}
