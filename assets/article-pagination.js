if (!customElements.get('article-pagination')) {
  class ArticlePagination extends HTMLElement {
    constructor() {
      super();

      this.article = this.closest('.js-article');
      this.paginationText = this.querySelector('.js-pagination-text');
      this.paginationLinks = this.querySelectorAll('.js-pagination-link');

      this.init();
      this.addListeners();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.scrollHandler);
    }

    init() {
      this.handleScroll();
      if (this.paginationText) {
        if (this.paginationText.dataset.showReadingTime) {
          this.estimateReadingTime();
        }

        // Prepare the pagination links for hover
        if (theme.device.hasHover) {
          this.paginationLinks.forEach((link) => {
            if (link.title && link.title.length > 0) {
              link.setAttribute('data-title', link.title);
              link.removeAttribute('title');
            }
          });
        }
      }
    }

    addListeners() {
      this.scrollHandler = this.scrollHandler || this.handleScroll.bind(this);
      window.addEventListener('scroll', this.scrollHandler);

      if (this.paginationText && theme.device.hasHover) {
        this.mouseEnterHandler = this.mouseEnterHandler || this.handleMenuMouseEnter.bind(this);
        this.mouseLeaveHandler = this.mouseLeaveHandler || this.handleMenuMouseLeave.bind(this);

        this.paginationLinks.forEach((link) => {
          link.addEventListener('mouseenter', this.mouseEnterHandler);
          link.addEventListener('mouseleave', this.mouseLeaveHandler);
        });
      }
    }

    /**
     * Tracks scroll progress through the article
     */
    handleScroll() {
      const pos = this.article.getBoundingClientRect();
      // 200px after the end of the article
      const targetY = pos.height + this.article.offsetTop - window.innerHeight + 200;
      const percentScrolled = parseInt((100 / targetY) * window.scrollY, 10);
      this.style.setProperty('--percent-scrolled', `${percentScrolled}%`);
      // Scrolled 300px past the end of the article
      this.classList.toggle('is-visible', window.scrollY - targetY < 300);
    }

    /**
     * Handles 'mouseenter' event on pagination links
     * @param {object} evt - Event object
     */
    handleMenuMouseEnter(evt) {
      if (evt.currentTarget.dataset.title) {
        this.paginationText.textContent = evt.currentTarget.dataset.title;
      }
    }

    /**
     * Handles 'mouseleave' event on pagination links
     */
    handleMenuMouseLeave() {
      if (this.paginationText.dataset.readTime) {
        this.paginationText.textContent = this.paginationText.dataset.readTime;
      } else {
        this.paginationText.textContent = '';
      }
    }

    /**
     * Calculates the reading time of the article in minutes (assumed people read at 240 words per
     * minute)
     */
    estimateReadingTime() {
      const articleText = this.article.querySelector('.article__content').textContent;
      const wordCount = articleText.trim().split(/\s+/).length || 1;
      const readTime = Math.round(wordCount / 240);
      const text = theme.strings.articleReadTime.replace('[x]', readTime > 0 ? readTime : 1);
      this.paginationText.textContent = text;
      this.paginationText.setAttribute('data-read-time', text);
    }
  }

  customElements.define('article-pagination', ArticlePagination);
}
