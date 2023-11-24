class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
    window.initLazyScript(this, this.init.bind(this), 500);
  }

  async init() {
    const { productId } = this.dataset;
    if (!productId) return;

    try {
      const response = await fetch(`${this.dataset.url}&product_id=${productId}`);
      if (!response.ok) throw new Error(response.status);

      const tmpl = document.createElement('template');
      tmpl.innerHTML = await response.text();

      const el = tmpl.content.querySelector('product-recommendations');
      if (el && el.hasChildNodes()) {
        this.innerHTML = el.innerHTML;
      }

      window.initLazyImages();
    } catch (error) {
      console.log(error); // eslint-disable-line
    }
  }
}

customElements.define('product-recommendations', ProductRecommendations);
