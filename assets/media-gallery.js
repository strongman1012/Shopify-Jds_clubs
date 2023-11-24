if (!customElements.get('media-gallery')) {
  class MediaGallery extends HTMLElement {
    constructor() {
      super();

      if (Shopify.designMode) {
        setTimeout(() => this.init(), 200);
      } else {
        this.init();
      }
    }

    disconnectedCallback() {
      window.removeEventListener('on:debounced-resize', this.resizeHandler);

      if (this.resizeInitHandler) {
        window.removeEventListener('on:debounced-resize', this.resizeInitHandler);
      }

      if (this.zoomInitHandler) {
        window.removeEventListener('on:debounced-resize', this.zoomInitHandler);
      }
    }

    init() {
      this.section = this.closest('.js-product');
      this.mediaGroupingEnabled = this.hasAttribute('data-media-grouping-enabled')
        && this.getMediaGroupData();
      this.stackedScroll = this.dataset.stackedScroll;
      this.stackedUnderline = this.dataset.stackedUnderline === 'true' && !this.mediaGroupingEnabled;
      this.isFeatured = this.dataset.isFeatured === 'true';
      this.viewer = this.querySelector('.media-viewer');
      this.thumbs = this.querySelector('.media-thumbs');
      this.thumbsItems = this.querySelectorAll('.media-thumbs__item');
      this.controls = this.querySelector('.media-ctrl');
      this.prevBtn = this.querySelector('.media-ctrl__btn[name="prev"]');
      this.nextBtn = this.querySelector('.media-ctrl__btn[name="next"]');
      this.counterCurrent = this.querySelector('.media-ctrl__current-item');
      this.counterTotal = this.querySelector('.media-ctrl__total-items');
      this.liveRegion = this.querySelector('.media-gallery__status');
      this.zoomLinks = this.querySelectorAll('.js-zoom-link');
      this.loadingSpinner = this.querySelector('.loading-spinner');
      this.xrButton = this.querySelector('.media-xr-button');

      if (this.mediaGroupingEnabled) {
        this.setActiveMediaGroup(this.getMediaGroupFromOptionSelectors());
      }

      if (this.dataset.layout === 'stacked' && theme.mediaMatches.md) {
        this.resizeInitHandler = this.resizeInitHandler || this.initGallery.bind(this);
        window.addEventListener('on:debounced-resize', this.resizeInitHandler);
        this.setVisibleItems();
        this.previousMediaItem = this.querySelector('.media-viewer__item.is-current-variant');
        setTimeout(() => this.customSetActiveMedia(this.previousMediaItem, this.stackedScroll === 'always'), 200);
      } else {
        this.initGallery();
      }

      if (this.zoomLinks) {
        this.zoomInitHandler = this.zoomInitHandler || this.initZoom.bind(this);
        this.zoomEventListener = this.zoomEventListener || this.handleZoomMouseMove.bind(this);
        window.addEventListener('on:debounced-resize', this.zoomInitHandler);
        this.initZoom();
        this.zoomLinks.forEach((el) => {
          el.addEventListener('click', (evt) => {
            evt.preventDefault();
          });
        });
      }

      this.section.addEventListener('on:variant:change', this.onVariantChange.bind(this));
    }

    /**
     * Handle a change in variant on the page.
     * @param {Event} evt - variant change event dispatched by variant-picker
     */
    onVariantChange(evt) {
      if (this.mediaGroupingEnabled) {
        this.setActiveMediaGroup(this.getMediaGroupFromOptionSelectors());
      }

      if (evt.detail.variant && evt.detail.variant.featured_media) {
        const variantMedia = this.viewer.querySelector(
          `[data-media-id="${evt.detail.variant.featured_media.id}"]`
        );
        this.customSetActiveMedia(variantMedia, true);
      }
    }

    /**
     * Gets the media group from currently selected variant options.
     * @returns {?object}
     */
    getMediaGroupFromOptionSelectors() {
      const optionSelectors = this.section.querySelectorAll('.option-selector');
      if (optionSelectors.length > this.getMediaGroupData().groupOptionIndex) {
        const selector = optionSelectors[this.getMediaGroupData().groupOptionIndex];
        if (selector.dataset.selectorType === 'dropdown') {
          return selector.querySelector('.custom-select__btn').textContent.trim();
        }
        return selector.querySelector('input:checked').value;
      }
      return null;
    }

    /**
     * Gets the variant media associations for a product.
     * @returns {?object}
     */
    getMediaGroupData() {
      this.variantMediaData=false;
      // if (typeof this.variantMediaData === 'undefined') {
      //   const dataEl = this.querySelector('.js-data-variant-media');
      //   this.variantMediaData = dataEl ? JSON.parse(dataEl.textContent) : false;
      // }
      return this.variantMediaData;
    }

    /**
     * Gets an object mapping media to groups, and the reverse
     * @returns {?object}
     */
    getMediaGroupMap() {
      if (!this.mediaGroupMap) {
        this.mediaGroupMap = {
          groups: {}
        };

        // set up grouping
        const variantMediaData = this.getMediaGroupData();
        let currentMediaOptionName = false;
        this.viewerItems = this.querySelectorAll('.media-viewer__item');
        this.viewerItems.forEach((item) => {
          for (let i = 0; i < variantMediaData.variantMedia.length; i += 1) {
            if (parseInt(item.dataset.mediaId, 10) === variantMediaData.variantMedia[i].mediaId) {
              if (currentMediaOptionName !== variantMediaData.variantMedia[i].option) {
                currentMediaOptionName = variantMediaData.variantMedia[i].option;
              }
            }
          }
          if (currentMediaOptionName) {
            if (!this.mediaGroupMap.groups[currentMediaOptionName]) {
              this.mediaGroupMap.groups[currentMediaOptionName] = {
                name: currentMediaOptionName,
                items: []
              };
            }
            const groupItem = { main: item };
            if (this.thumbs) {
              groupItem.thumb = this.thumbs.querySelector(
                `[data-media-id="${item.dataset.mediaId}"].media-thumbs__item`
              );
            }
            this.mediaGroupMap.groups[currentMediaOptionName].items.push(groupItem);
          }
        });

        // add helper
        this.mediaGroupMap.groupFromItem = (item) => {
          const groups = Object.keys(this.mediaGroupMap.groups);
          for (let i = 0; i < groups; i += 1) {
            const group = groups[i];
            for (let j = 0; j < this.mediaGroupMap.groups[group].items.length; j += 1) {
              if (this.mediaGroupMap.groups[group].items[j] === item) {
                return this.mediaGroupMap.groups[group];
              }
            }
          }
          return this.mediaGroupMap.groups[Object.keys(this.mediaGroupMap.groups)[0]];
        };
      }

      return this.mediaGroupMap;
    }

    /**
     * Show only images associated to the current variant
     * @param {string} groupName - optional - Group to show (uses this.currentItem if empty)
     */
    setActiveMediaGroup(groupName) {
      const mediaGroupMap = this.getMediaGroupMap();
      const selectedGroup = groupName
        ? mediaGroupMap.groups[groupName]
        : mediaGroupMap.groupFromItem(this.currentItem);

      if (selectedGroup) {
        if (this.currentGroup !== selectedGroup) {
          this.currentGroup = selectedGroup;
          this.viewerItems.forEach((item) => {
            item.style.display = 'none';
            item.classList.remove('media-viewer__item--single');
          });
          this.thumbsItems.forEach((item) => {
            item.style.display = 'none';
          });

          let currentItemIsVisible = false;
          selectedGroup.items.forEach((item) => {
            item.main.style.display = '';
            if (item.thumb) {
              item.thumb.style.display = '';
            }
            if (item.main === this.currentItem) {
              currentItemIsVisible = true;
            }
          });
          this.setVisibleItems();

          // If current item is not in this group, set it as the active item
          if (!currentItemIsVisible) {
            this.customSetActiveMedia(selectedGroup.items[0].main, true);
          }

          // Handle single images on stacked view
          if (selectedGroup.items.length === 1) {
            selectedGroup.items[0].main.classList.add('media-viewer__item--single');
          }
        }
      } else {
        this.viewerItems.forEach((item) => {
          item.style.display = '';
        });
        this.thumbsItems.forEach((item) => {
          item.style.display = '';
        });
      }
    }

    /**
     * Initialises the media gallery slider and associated controls.
     */
    initGallery() {
      this.setVisibleItems();
      if (this.visibleItems.length <= 1) return;

      this.viewerItemOffset = this.visibleItems[1].offsetLeft - this.visibleItems[0].offsetLeft;
      this.currentIndex = Math.round(this.viewer.scrollLeft / this.viewerItemOffset);
      this.currentItem = this.visibleItems[this.currentIndex];
      this.addListeners();

      if (this.thumbs && this.currentItem) {
        this.currentThumb = this.thumbs.querySelector(
          `[data-media-id="${this.currentItem.dataset.mediaId}"]`
        );
      }

      if (!this.isFeatured && document.hasFocus()) {
        // Eager load the slider images for smooth UX
        this.viewer.querySelectorAll('.product-image[loading="lazy"]').forEach((img, index) => {
          setTimeout(() => {
            img.loading = 'eager';
          }, 500 * (index + 1));
        });
      }

      const currentItem = this.querySelector('.media-viewer__item.is-current-variant');
      this.customSetActiveMedia(currentItem, true);
    }

    addListeners() {
      this.viewer.addEventListener('scroll', this.handleScroll.bind(this));
      if (this.controls) this.controls.addEventListener('click', this.handleNavClick.bind(this));
      if (this.thumbs) this.thumbs.addEventListener('click', this.handleThumbClick.bind(this));
      this.resizeHandler = this.resizeHandler || this.handleResize.bind(this);
      window.addEventListener('on:debounced-resize', this.resizeHandler);
    }

    /**
     * Initialized the zoom on hover for desktop
     */
    initZoom() {
      this.zoomLinks.forEach((el) => {
        const zoomWidth = Number(el.querySelector('.zoom-image').dataset.originalWidth || 0);
        const imageWidth = el.querySelector('.product-image').getBoundingClientRect().width;
        if (theme.mediaMatches.md && ((zoomWidth - 75) > (imageWidth))) {
          el.addEventListener('mousemove', this.zoomEventListener);
          el.classList.remove('pointer-events-none');
        } else {
          el.removeEventListener('mousemove', this.zoomEventListener);
          el.classList.add('pointer-events-none');
        }
      });
    }

    /**
     * Handles mouse move over a zoomable image
     * @param {?object} evt - Event object.
     */
    handleZoomMouseMove(evt) {
      const hoverElem = evt.currentTarget;
      const zoomImage = hoverElem.querySelector('.js-zoom-image');

      // Download the zoom image if necessary
      if (zoomImage.dataset.src) {
        this.loadingSpinner.classList.remove('loading-spinner--out');

        const img = new Image();
        img.src = zoomImage.dataset.src;
        img.onload = () => {
          zoomImage.src = img.src;
          hoverElem.classList.remove('media--zoom-not-loaded');
          this.loadingSpinner.classList.add('loading-spinner--out');
        };
        zoomImage.removeAttribute('data-src');
      }

      try {
        const offsetX = evt.offsetX ? evt.offsetX : evt.touches[0].pageX;
        const offsetY = evt.offsetY ? evt.offsetY : evt.touches[0].pageY;
        const x = (offsetX / zoomImage.offsetWidth) * 100;
        const y = (offsetY / zoomImage.offsetHeight) * 100;
        zoomImage.style.objectPosition = `${x}% ${y}%`;
      } catch (err) {
        // Fail silently
      }
    }

    /**
     * Handles 'scroll' events on the main media container.
     */
    handleScroll() {
      const newIndex = Math.round(this.viewer.scrollLeft / this.viewerItemOffset);

      if (newIndex !== this.currentIndex) {
        const viewerItemOffset = this.visibleItems[1].offsetLeft - this.visibleItems[0].offsetLeft;

        // If scroll wasn't caused by a resize event, update the active media.
        if (viewerItemOffset === this.viewerItemOffset) {
          this.customSetActiveMedia(this.visibleItems[newIndex], false);
        }
      }
    }

    /**
     * Handles 'click' events on the controls container.
     * @param {object} evt - Event object.
     */
    handleNavClick(evt) {
      if (!evt.target.matches('.media-ctrl__btn')) return;

      const itemToShow = evt.target === this.nextBtn
        ? this.visibleItems[this.currentIndex + 1]
        : this.visibleItems[this.currentIndex - 1];

      this.viewer.scrollTo({ left: itemToShow.offsetLeft, behavior: 'smooth' });
    }

    /**
     * Handles 'click' events on the thumbnails container.
     * @param {object} evt - Event object.
     */
    handleThumbClick(evt) {
      const thumb = evt.target.closest('[data-media-id]');
      if (!thumb) return;

      const itemToShow = this.querySelector(`[data-media-id="${thumb.dataset.mediaId}"]`);
      this.customSetActiveMedia(itemToShow);

      MediaGallery.playActiveMedia(itemToShow);
    }

    /**
     * Handles debounced 'resize' events on the window.
     */
    handleResize() {
      // Reset distance from leading edge of one slide to the next.
      this.viewerItemOffset = this.visibleItems[1].offsetLeft - this.visibleItems[0].offsetLeft;

      if (this.thumbs && this.currentThumb) {
        this.checkThumbVisibilty(this.currentThumb);
      }
    }

    /**
     * Stub for variant-picker calls. Listening to change event instead.
     */
    // eslint-disable-next-line class-methods-use-this
    setActiveMedia() {}

    /**
     * Sets the active media item.
     * @param {Element} mediaItem - Media element to set as active.
     * @param {boolean} [scrollToItem=true] - Scroll to the active media item.
     */
    customSetActiveMedia(mediaItem, scrollToItem = true) {
      if (mediaItem === this.currentItem) return;
      window.pauseAllMedia(this);
      this.currentItem = mediaItem;
      this.currentIndex = this.visibleItems.indexOf(this.currentItem);

      if (this.dataset.layout === 'stacked' && theme.mediaMatches.md) {
        // Update the active class and scroll to the active media
        if (this.stackedUnderline) {
          if (this.previousMediaItem) this.previousMediaItem.classList.remove('is-active');
          mediaItem.classList.add('is-active');
          this.previousMediaItem = mediaItem;
        }

        if (this.stackedScroll !== 'never') {
          const y = mediaItem.getBoundingClientRect().top
            + document.documentElement.scrollTop - 150;

          // If the element is far enough away to scroll to it
          if (Math.abs(y - document.documentElement.scrollTop) > 300) {
            window.scrollTo({
              top: y < 100 ? 0 : y,
              behavior: 'smooth'
            });
          }
        }
        return;
      }

      if (scrollToItem) this.viewer.scrollTo({ left: this.currentItem.offsetLeft });
      if (this.thumbs) this.setActiveThumb();

      if (this.controls) {
        if (this.prevBtn) {
          this.prevBtn.disabled = this.currentIndex === 0;
        }

        if (this.nextBtn) {
          this.nextBtn.disabled = this.currentIndex === this.visibleItems.length - 1;
        }

        if (this.counterCurrent) {
          this.counterCurrent.textContent = this.currentIndex + 1;
        }
      }

      this.announceLiveRegion(this.currentItem, this.currentIndex + 1);

      if (this.xrButton && mediaItem.dataset.mediaType === 'model') {
        this.xrButton.dataset.shopifyModel3dId = mediaItem.dataset.mediaId;
      }
    }

    /**
     * Sets the active thumbnail.
     */
    setActiveThumb() {
      this.currentThumb = this.thumbs.querySelector(
        `[data-media-id="${this.currentItem.dataset.mediaId}"]`
      );
      const btn = this.currentThumb.querySelector('button');

      this.thumbs.querySelectorAll('.media-thumbs__btn').forEach((el) => {
        el.classList.remove('is-active');
        el.removeAttribute('aria-current');
      });

      btn.classList.add('is-active');
      btn.setAttribute('aria-current', 'true');
      this.checkThumbVisibilty(this.currentThumb);
    }

    /**
     * Creates an array of the visible media items.
     */
    setVisibleItems() {
      this.viewerItems = this.querySelectorAll('.media-viewer__item');
      this.visibleItems = Array.from(this.viewerItems).filter((el) => el.clientWidth > 0);
      if (this.counterTotal) {
        this.counterTotal.textContent = this.visibleItems.length;
      }
    }

    /**
     * Ensures a thumbnail is in the visible area of the slider.
     * @param {Element} thumb - Thumb item element.
     */
    checkThumbVisibilty(thumb) {
      const scrollPos = this.thumbs.scrollLeft;
      const lastVisibleThumbOffset = this.thumbs.clientWidth + scrollPos;
      const thumbOffset = thumb.offsetLeft;

      if (thumbOffset + thumb.clientWidth > lastVisibleThumbOffset || thumbOffset < scrollPos) {
        this.thumbs.scrollTo({ left: thumbOffset, behavior: 'smooth' });
      }
    }

    /**
     * Updates the media gallery status.
     * @param {Element} mediaItem - Active media element.
     * @param {number} index - Active media index.
     */
    announceLiveRegion(mediaItem, index) {
      const image = mediaItem.querySelector('.media-viewer img');
      if (!image) return;

      this.liveRegion.setAttribute('aria-hidden', 'false');
      this.liveRegion.innerHTML = theme.strings.imageAvailable.replace('[index]', index);

      setTimeout(() => {
        this.liveRegion.setAttribute('aria-hidden', 'true');
      }, 2000);
    }

    /**
     * Loads the deferred media for the active item.
     * @param {Element} mediaItem - Active media element.
     */
    static playActiveMedia(mediaItem) {
      window.pauseAllMedia();
      const deferredMedia = mediaItem.querySelector('deferred-media');
      if (deferredMedia) deferredMedia.loadContent();
    }
  }

  customElements.define('media-gallery', MediaGallery);
}
