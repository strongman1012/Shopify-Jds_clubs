if (!customElements.get('discount-code')) {
  class DiscountCode extends HTMLElement {
    constructor() {
      super();
      this.discountCode = this.querySelector('.js-discount-code');
      this.discountCodeBtn = this.querySelector('.js-copy-button');
      this.copySuccess = this.querySelector('.js-copy-success');
      this.init();
    }

    init() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        this.discountCodeBtn.addEventListener('click', this.copyCode.bind(this));
        this.discountCode.addEventListener('click', this.copyCode.bind(this));
      } else {
        this.discountCodeBtn.hidden = true;
      }
    }

    copyCode() {
      const discountCode = this.discountCode.textContent.trim();
      navigator.clipboard.writeText(discountCode).then(
        () => {
          this.copySuccess.classList.add('is-visible');
          this.copySuccess.setAttribute('aria-hidden', false);

          setTimeout(() => {
            this.copySuccess.classList.add('is-closing');
          }, 1800);

          setTimeout(() => {
            this.copySuccess.classList.remove('is-closing');
            this.copySuccess.classList.remove('is-visible');
          }, 2000);
        },
        () => {
          alert(theme.strings.discountCopyFail); // eslint-disable-line
        }
      );
    }
  }

  customElements.define('discount-code', DiscountCode);
}
