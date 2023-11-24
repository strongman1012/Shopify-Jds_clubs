if (!customElements.get('announcement-bar')) {
  class AnnouncementBar extends HTMLElement {
    constructor() {
      super();
      this.slider = this.querySelector('.announcement__slider');
      this.localization = this.querySelector('.announcement__localization');
      this.links = this.querySelectorAll('.js-announcement-link');
      this.menu = document.querySelector('.main-menu__content');
      this.isPaused = false;

      this.bindEvents();
      this.init();
    }

    disconnectedCallback() {
      if (this.moveLinksHandler) {
        window.removeEventListener('on:breakpoint-change', this.moveLinksHandler);
      }

      if (this.moveLocalizationHandler) {
        window.removeEventListener('on:breakpoint-change', this.moveLocalizationHandler);
      }
    }

    bindEvents() {
      if (this.links) {
        this.moveLinksHandler = this.moveLinksHandler || this.moveLinks.bind(this);
        window.addEventListener('on:breakpoint-change', this.moveLinksHandler);
      }

      if (this.localization) {
        this.moveLocalizationHandler = this.moveLocalizationHandler
          || this.moveLocalization.bind(this);
        window.addEventListener('on:breakpoint-change', this.moveLocalizationHandler);
      }

      if (this.slider) {
        this.slider.addEventListener('mouseenter', this.pauseSlider.bind(this));
        this.slider.addEventListener('mouseleave', this.resumeSlider.bind(this));
      }
    }

    /**
     * Start sliders a slidin'
     */
    init() {
      if (this.slider) {
        const slides = this.slider.querySelectorAll('.announcement__text');
        slides[0].classList.add('is-visible');

        const nextSlide = () => {
          if (!this.isPaused && theme.elementUtil.isInViewport(this)) {
            const currSlide = this.slider.querySelector('.announcement__text.is-visible');
            const currSlideIndex = Array.from(currSlide.parentNode.children)
              .indexOf(currSlide);
            const nextSlideIndex = currSlideIndex + 1 < slides.length ? currSlideIndex + 1 : 0;

            if (document.dir === 'rtl') {
              this.slider.scrollTo(
                -Math.abs(nextSlideIndex * slides[nextSlideIndex].clientWidth),
                0
              );
            } else {
              this.slider.scrollTo(slides[nextSlideIndex].offsetLeft - 32, 0);
            }

            slides[nextSlideIndex].classList.add('is-visible');
            slides[currSlideIndex].classList.remove('is-visible');
          }

          setTimeout(nextSlide, this.dataset.slideDelay);
        };
        setTimeout(nextSlide, this.dataset.slideDelay);
      }

      if (this.links) {
        this.moveLinks();
      }

      if (this.localization) {
        this.moveLocalization();
      }
    }

    /**
     * Move the help links selectors to the mobile nav/back to the announcement bar if necessary
     */
    moveLinks() {
      const menuAnnouncementLinks = document.querySelector('.mob__announcement-links');
      if (!theme.mediaMatches.md && !menuAnnouncementLinks) {
        // Move localization to mobile
        const mobNav = document.createElement('nav');
        mobNav.classList.add('mob__announcement-links');

        const mobNavUl = document.createElement('ul');
        mobNav.classList.add('secondary-nav');

        this.links.forEach((link) => {
          mobNav.innerHTML += `<li><a class="secondary-nav__item" href="${link.href}">${link.innerText}</a>`;
        });

        mobNav.appendChild(mobNavUl);
        this.menu.appendChild(mobNav);
      } else if (theme.mediaMatches.md && menuAnnouncementLinks) {
        menuAnnouncementLinks.remove();
      }
    }

    /**
     * Move the localization selectors to the mobile nav/back to the announcement bar if necessary
     */
    moveLocalization() {
      const menuLocalization = document.querySelector('.mob__localization');
      if (!theme.mediaMatches.md && !menuLocalization) {
        // Move localization to mobile
        const mobLocalizationElem = document.createElement('div');
        mobLocalizationElem.classList.add('mob__localization');
        mobLocalizationElem.appendChild(this.localization.firstElementChild);
        this.menu.appendChild(mobLocalizationElem);
      } else if (theme.mediaMatches.md && menuLocalization) {
        // Move localization back to announcement bar
        this.localization.appendChild(menuLocalization.firstElementChild);
        menuLocalization.remove();
      }
    }

    /**
     * Pauses the auto-rotating slider
     */
    pauseSlider() {
      this.isPaused = true;
    }

    /**
     * Resumes the auto-rotating slider
     */
    resumeSlider() {
      this.isPaused = false;
    }
  }

  customElements.define('announcement-bar', AnnouncementBar);
}
