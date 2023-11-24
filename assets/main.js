/**
 * Polyfills :focus-visible for non supporting browsers (Safari < 15.4).
 */
function focusVisiblePolyfill() {
  const navKeys = [
    "Tab",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Enter",
    "Space",
    "Escape",
    "Home",
    "End",
    "PageUp",
    "PageDown",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (evt) => {
    if (navKeys.includes(evt.code)) mouseClick = false;
  });

  window.addEventListener("mousedown", () => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("is-focused");
      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("is-focused");
    },
    true
  );
}

// Add polyfill if :focus-visible is not supported.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

/**
 * Creates a 'mediaMatches' object from the media queries specified in the theme,
 * and adds listeners for each media query. If a breakpoint is crossed, the mediaMatches
 * values are updated and a 'on:breakpoint-change' event is dispatched.
 */
(() => {
  const { mediaQueries } = theme;
  if (!mediaQueries) return;

  const mqKeys = Object.keys(mediaQueries);
  const mqLists = {};
  theme.mediaMatches = {};

  /**
   * Handles a media query (breakpoint) change.
   */
  const handleMqChange = () => {
    const newMatches = mqKeys.reduce((acc, media) => {
      acc[media] = !!(mqLists[media] && mqLists[media].matches);
      return acc;
    }, {});

    // Update mediaMatches values after breakpoint change.
    Object.keys(newMatches).forEach((key) => {
      theme.mediaMatches[key] = newMatches[key];
    });

    window.dispatchEvent(new CustomEvent("on:breakpoint-change"));
  };

  mqKeys.forEach((mq) => {
    // Create mqList object for each media query.
    mqLists[mq] = window.matchMedia(mediaQueries[mq]);

    // Get initial matches for each query.
    theme.mediaMatches[mq] = mqLists[mq].matches;

    // Add an event listener to each query.
    try {
      mqLists[mq].addEventListener("change", handleMqChange);
    } catch (err1) {
      // Fallback for legacy browsers (Safari < 14).
      mqLists[mq].addListener(handleMqChange);
    }
  });
})();

/**
 * Returns a function that as long as it continues to be invoked, won't be triggered.
 * @param {Function} fn - Callback function.
 * @param {number} [wait=300] - Delay (in milliseconds).
 * @returns {Function}
 */
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Sets a 'viewport-height' custom property on the root element.
 */
function setViewportHeight() {
  document.documentElement.style.setProperty(
    "--viewport-height",
    `${window.innerHeight}px`
  );
}

/**
 * Sets a 'header-height' custom property on the root element.
 */
function setHeaderHeight() {
  const header = document.getElementById("shopify-section-header");
  if (!header) return;
  let height = header.offsetHeight;

  // Add announcement bar height (if shown).
  const announcement = document.getElementById("shopify-section-announcement");
  if (announcement) height += announcement.offsetHeight;

  document.documentElement.style.setProperty("--header-height", `${height}px`);
}

/**
 * Sets a 'scrollbar-width' custom property on the root element.
 */
function setScrollbarWidth() {
  document.documentElement.style.setProperty(
    "--scrollbar-width",
    `${window.innerWidth - document.documentElement.clientWidth}px`
  );
}

/**
 * Sets the dimension variables.
 */
function setDimensionVariables() {
  setViewportHeight();
  setHeaderHeight();
  setScrollbarWidth();
}

// Set the dimension variables.
setDimensionVariables();

// Update the dimension variables if viewport resized.
window.addEventListener("resize", debounce(setDimensionVariables, 50));

/**
 * Checks if a lazy load image has alternate <source> elements and copies the
 * 'data-src' and 'data-srcset' attributes to 'src' and 'srcset' accordingly.
 * @param {Element} img - Image element.
 */
function setImageSources(img) {
  const setImageAttr = (el) => {
    if (el.dataset.src && !el.src) {
      el.src = el.dataset.src;
    }

    if (el.dataset.srcset && !el.srcset) {
      el.srcset = el.dataset.srcset;
    }
  };

  if (img.parentNode.tagName === "PICTURE") {
    Array.from(img.parentNode.children).forEach((el) => {
      setImageAttr(el);
    });
  } else {
    setImageAttr(img);
  }
}

/**
 * Initialises lazy load images.
 */
function initLazyImages() {
  if (
    "loading" in HTMLImageElement.prototype === false &&
    "IntersectionObserver" in window
  ) {
    // If native lazyload not supported but IntersectionObserver supported (Safari).
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            setImageSources(img);
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "0px 0px 500px 0px" }
    );

    document.querySelectorAll('[loading="lazy"]').forEach((img) => {
      io.observe(img);
    });
  } else {
    // If native lazy load supported or IntersectionObserver not supported (legacy browsers).
    document.querySelectorAll('[loading="lazy"]').forEach((img) => {
      setImageSources(img);
    });
  }
}

/**
 * Adds an observer to initialise a script when an element is scrolled into view.
 * @param {Element} element - Element to observe.
 * @param {Function} callback - Function to call when element is scrolled into view.
 * @param {number} [threshold=500] - Distance from viewport (in pixels) to trigger init.
 */
function initLazyScript(element, callback, threshold = 500) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (typeof callback === "function") {
              callback();
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: `0px 0px ${threshold}px 0px` }
    );

    io.observe(element);
  } else {
    callback();
  }
}

/**
 * Pauses all media (videos/models) within an element.
 * @param {Element} [el=document] - Element to pause media within.
 */
function pauseAllMedia(el = document) {
  el.querySelectorAll(".js-youtube, .js-vimeo, video").forEach((video) => {
    const component = video.closest("video-component");
    if (component && component.dataset.background === "true") return;

    if (video.matches(".js-youtube")) {
      video.contentWindow.postMessage(
        '{ "event": "command", "func": "pauseVideo", "args": "" }',
        "*"
      );
    } else if (video.matches(".js-vimeo")) {
      video.contentWindow.postMessage('{ "method": "pause" }', "*");
    } else {
      video.pause();
    }
  });

  el.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

class DeferredMedia extends HTMLElement {
  constructor() {
    super();

    const loadBtn = this.querySelector(".js-load-media");
    if (loadBtn) {
      loadBtn.addEventListener("click", this.loadContent.bind(this));
    } else {
      this.addObserver();
    }
  }

  /**
   * Adds an Intersection Observer to load the content when viewport scroll is near
   */
  addObserver() {
    if ("IntersectionObserver" in window === false) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadContent(false, false, "observer");
            observer.unobserve(this);
          }
        });
      },
      { rootMargin: "0px 0px 1000px 0px" }
    );

    observer.observe(this);
  }

  /**
   * Loads the deferred media.
   * @param {boolean} [focus=true] - Focus the deferred media element after loading.
   * @param {boolean} [pause=true] - Whether to pause all media after loading.
   * @param {string} [loadTrigger='click'] - The action that caused the deferred content to load.
   */
  loadContent(focus = true, pause = true, loadTrigger = "click") {
    if (pause) pauseAllMedia();
    if (this.getAttribute("loaded") !== null) return;

    this.loadTrigger = loadTrigger;
    const content =
      this.querySelector("template").content.firstElementChild.cloneNode(true);
    this.appendChild(content);
    this.setAttribute("loaded", "");

    const deferredEl = this.querySelector("video, model-viewer, iframe");
    if (deferredEl && focus) deferredEl.focus();
  }
}

customElements.define("deferred-media", DeferredMedia);

class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.disclosure = this.querySelector("details");
    this.toggle = this.querySelector("summary");
    this.panel = this.toggle.nextElementSibling;
    this.init();
  }

  init() {
    // Check if the content element has a CSS transition.
    const styles = window.getComputedStyle(this.panel);
    this.hasTransition = styles.transition !== "all 0s ease 0s";

    if (this.hasTransition) {
      this.toggle.addEventListener("click", this.handleToggle.bind(this));
      this.disclosure.addEventListener(
        "transitionend",
        this.handleTransitionEnd.bind(this)
      );
    }
  }

  /**
   * Handles 'click' events on the summary element.
   * @param {object} evt - Event object.
   */
  handleToggle(evt) {
    evt.preventDefault();

    if (!this.disclosure.open) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Handles 'transitionend' events on the details element.
   * @param {object} evt - Event object.
   */
  handleTransitionEnd(evt) {
    if (evt.target !== this.panel) return;

    if (this.disclosure.classList.contains("is-closing")) {
      this.disclosure.classList.remove("is-closing");
      this.disclosure.open = false;
    }

    this.panel.removeAttribute("style");
  }

  /**
   * Adds inline 'height' style to the content element, to trigger open transition.
   */
  addContentHeight() {
    this.panel.style.height = `${this.panel.scrollHeight}px`;
  }

  /**
   * Opens the details element.
   */
  open() {
    // Set content 'height' to zero before opening the details element.
    this.panel.style.height = "0";

    // Open the details element
    this.disclosure.open = true;

    // Set content 'height' to its scroll height, to enable CSS transition.
    this.addContentHeight();
  }

  /**
   * Closes the details element.
   */
  close() {
    // Set content height to its scroll height, to enable transition to zero.
    this.addContentHeight();

    // Add class to enable styling of content or toggle icon before or during close transition.
    this.disclosure.classList.add("is-closing");

    // Set content height to zero to trigger the transition.
    // Slight delay required to allow scroll height to be applied before changing to '0'.
    setTimeout(() => {
      this.panel.style.height = "0";
    });
  }
}

customElements.define("details-disclosure", DetailsDisclosure);

const trapFocusHandlers = {};

/**
 * Removes focus trap event listeners and optionally focuses an element.
 * @param {Element} [elementToFocus=null] - Element to focus when trap is removed.
 */
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

/**
 * Traps focus within a container, e.g. modal or side drawer.
 * @param {Element} container - Container element to trap focus within.
 * @param {Element} [elementToFocus=container] - Initial element to focus when trap is applied.
 */
function trapFocus(container, elementToFocus = container) {
  const focusableEls = Array.from(
    container.querySelectorAll(
      'summary, a[href], area[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), object, iframe, audio[controls], video[controls], [tabindex]:not([tabindex^="-"])'
    )
  );

  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (evt) => {
    if (
      evt.target !== container &&
      evt.target !== lastEl &&
      evt.target !== firstEl
    )
      return;
    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = () => {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = (evt) => {
    if (evt.code !== "Tab") return;

    // If tab pressed on last focusable element, focus the first element.
    if (evt.target === lastEl && !evt.shiftKey) {
      evt.preventDefault();
      firstEl.focus();
    }

    //  If shift + tab pressed on the first focusable element, focus the last element.
    if ((evt.target === container || evt.target === firstEl) && evt.shiftKey) {
      evt.preventDefault();
      lastEl.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  (elementToFocus || container).focus();
}

class Modal extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.handleClick.bind(this));
  }

  /**
   * Handles 'click' events on the modal.
   * @param {object} evt - Event object.
   */
  handleClick(evt) {
    if (evt.target !== this && !evt.target.matches(".js-close-modal")) return;
    this.close();
  }

  /**
   * Opens the modal.
   * @param {Element} opener - Modal opener element.
   */
  open(opener) {
    // Prevent page behind from scrolling when side drawer is open
    this.scrollY = window.scrollY;
    document.body.classList.add("fixed");
    document.body.style.top = `-${this.scrollY}px`;

    this.setAttribute("open", "");
    this.openedBy = opener;

    trapFocus(this);
    window.pauseAllMedia();

    // Add event handler (so the bound event listener can be removed).
    this.keyupHandler = (evt) => evt.key === "Escape" && this.close();

    // Add event listener (for while modal is open).
    this.addEventListener("keyup", this.keyupHandler);
  }

  /**
   * Closes the modal.
   */
  close() {
    // Restore page position and scroll behaviour.
    document.body.style.top = "";
    document.body.classList.remove("fixed");
    window.scrollTo(0, this.scrollY);

    this.removeAttribute("open");

    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();

    // Remove event listener added on modal opening.
    this.removeEventListener("keyup", this.keyupHandler);
  }
}

customElements.define("modal-dialog", Modal);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");
    if (!button) return;

    button.addEventListener("click", () => {
      const modal = document.getElementById(this.dataset.modal);
      if (modal) modal.open(button);
    });
  }
}

customElements.define("modal-opener", ModalOpener);

class ProductCard extends HTMLElement {
  constructor() {
    super();
    window.initLazyScript(this, this.init.bind(this));
  }

  init() {
    this.images = this.querySelectorAll(".card__main-image");
    this.links = this.querySelectorAll(".js-prod-link");
    this.quickAddBtn = this.querySelector(".js-quick-add");

    if (this.quickAddBtn) {
      this.productUrl = this.quickAddBtn.dataset.productUrl;
    } else if (this.links.length) {
      this.productUrl = this.links[0].href;
    }

    this.addEventListener("change", this.handleSwatchChange.bind(this));
  }

  /**
   * Handles 'change' events in the product card swatches.
   * @param {object} evt - Event object.
   */
  handleSwatchChange(evt) {
    if (!evt.target.matches(".opt-btn")) return;

    // Swap current card image to selected variant image.
    if (evt.target.dataset.mediaId) {
      const variantMedia = this.querySelector(
        `[data-media-id="${evt.target.dataset.mediaId}"]`
      );

      if (variantMedia) {
        this.images.forEach((image) => {
          image.hidden = true;
        });
        variantMedia.hidden = false;
      }
    }

    const separator = this.productUrl.split("?").length > 1 ? "&" : "?";
    const url = `${this.productUrl + separator}variant=${
      evt.target.dataset.variantId
    }`;

    // Update link hrefs to url of selected variant.
    this.links.forEach((link) => {
      link.href = url;
    });

    // Update the Quick Add button data.
    if (this.quickAddBtn) {
      this.quickAddBtn.dataset.selectedColor = evt.target.value;
    }
  }
}

customElements.define("product-card", ProductCard);

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector(".qty-input__input");
    this.currentQty = this.input.value;
    this.changeEvent = new Event("change", { bubbles: true });

    this.addEventListener("click", this.handleClick.bind(this));
    this.input.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  /**
   * Handles 'click' events on the quantity input element.
   * @param {object} evt - Event object.
   */
  handleClick(evt) {
    if (!evt.target.matches(".qty-input__btn")) return;
    evt.preventDefault();

    if (evt.target.name === "plus") {
      this.input.stepUp();
    } else {
      this.input.stepDown();
    }

    if (this.input.value !== this.currentQty) {
      this.input.dispatchEvent(this.changeEvent);
      this.currentQty = this.input.value;
    }
  }

  /**
   * Handles 'keydown' events on the input field.
   * @param {object} evt - Event object.
   */
  handleKeydown(evt) {
    if (evt.key !== "Enter") return;
    evt.preventDefault();

    if (this.input.value !== this.currentQty) {
      this.input.blur();
      this.input.focus();
      this.currentQty = this.input.value;
    }
  }
}

customElements.define("quantity-input", QuantityInput);

class SideDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = document.querySelector(".js-overlay");
  }

  /**
   * Handles a 'click' event on the drawer.
   * @param {object} evt - Event object.
   */
  handleClick(evt) {
    if (evt.target.matches(".js-close-drawer") || evt.target === this.overlay) {
      this.close();
    }
  }

  /**
   * Opens the drawer.
   * @param {Element} [opener] - Element that triggered opening of the drawer.
   * @param {Element} [elementToFocus] - Element to focus after drawer opened.
   * @param {Function} [callback] - Callback function to trigger after the open has completed
   */
  open(opener, elementToFocus, callback) {
    this.dispatchEvent(
      new CustomEvent(`on:${this.dataset.name}:before-open`, {
        bubbles: true,
      })
    );

    // Prevent page behind from scrolling when side drawer is open.
    this.scrollY = window.scrollY;
    document.body.classList.add("fixed");
    document.body.style.top = `-${this.scrollY}px`;
    document.documentElement.style.height = "100vh";

    this.overlay.classList.add("is-visible");
    this.setAttribute("open", "");
    this.setAttribute("aria-hidden", "false");
    this.opener = opener;

    trapFocus(this, elementToFocus);

    // Create event handler variables (so the bound event listeners can be removed).
    this.clickHandler = this.clickHandler || this.handleClick.bind(this);
    this.keyupHandler = (evt) => {
      if (evt.key !== "Escape" || evt.target.closest(".cart-drawer-popup"))
        return;
      this.close();
    };

    // Add event listeners (for while drawer is open).
    this.addEventListener("click", this.clickHandler);
    this.addEventListener("keyup", this.keyupHandler);
    this.overlay.addEventListener("click", this.clickHandler);

    // Handle events after the drawer opens
    const transitionDuration = parseFloat(
      getComputedStyle(this).getPropertyValue("--longest-transition-in-ms")
    );
    setTimeout(() => {
      if (callback) callback();
      this.dispatchEvent(
        new CustomEvent(`on:${this.dataset.name}:after-open`, {
          bubbles: true,
        })
      );
    }, transitionDuration);
  }

  /**
   * Closes the drawer.
   * @param {Function} [callback] - Call back function to trigger after the close has completed
   */
  close(callback) {
    this.dispatchEvent(
      new CustomEvent(`on:${this.dataset.name}:before-close`, {
        bubbles: true,
      })
    );

    this.removeAttribute("open");
    this.setAttribute("aria-hidden", "true");
    this.overlay.classList.remove("is-visible");

    removeTrapFocus(this.opener);

    // Restore page position and scroll behaviour.
    document.documentElement.style.height = "";
    document.body.style.top = "";
    document.body.classList.remove("fixed");
    window.scrollTo(0, this.scrollY);

    // Remove event listeners added on drawer opening.
    this.removeEventListener("click", this.clickHandler);
    this.removeEventListener("keyup", this.keyupHandler);
    this.overlay.removeEventListener("click", this.clickHandler);

    // Handle events after the drawer closes
    const transitionDuration = parseFloat(
      getComputedStyle(this).getPropertyValue("--longest-transition-in-ms")
    );
    setTimeout(() => {
      if (callback) callback();
      this.dispatchEvent(
        new CustomEvent(`on:${this.dataset.name}:after-close`, {
          bubbles: true,
        })
      );
    }, transitionDuration);
  }
}

customElements.define("side-drawer", SideDrawer);

window.addEventListener(
  "resize",
  debounce(() => {
    window.dispatchEvent(new CustomEvent("on:debounced-resize"));
  })
);

/**
 * Keeps a record of the height of the given child element and stores it in a css variable called
 * `--element-height`. This height is kept up to date when the browser changes size or the child
 * element mutates.
 *
 * The selector must only match one element, and don't nest watched elements.
 *
 * Example usage:
 * <slide-show data-css-var-height=".quick-nav">
 * ... will result in:
 * <slide-show data-css-var-height=".quick-nav" style="--element-height: 483px;">
 */
document.addEventListener("DOMContentLoaded", () => {
  const parentElems = document.querySelectorAll("[data-css-var-height]");
  if (parentElems) {
    const updateHeight = (elem) => {
      const parentElem = elem.closest("[data-css-var-height]");
      parentElem.style.setProperty(
        "--element-height",
        `${elem.clientHeight}px`
      );
    };

    let mutationObserver = null;
    if ("MutationObserver" in window) {
      mutationObserver = new MutationObserver(
        debounce((mutationList) => {
          const elemToWatch = mutationList[0].target.closest(
            "[data-css-var-height]"
          );
          updateHeight(
            elemToWatch.querySelector(elemToWatch.dataset.cssVarHeight)
          );
        })
      );
    }

    parentElems.forEach((parentElem) => {
      const elemToWatch = parentElem.querySelector(
        parentElem.dataset.cssVarHeight
      );
      if (elemToWatch) {
        if (mutationObserver) {
          mutationObserver.observe(elemToWatch, {
            childList: true,
            attributes: true,
            subtree: true,
          });
        }

        window.addEventListener("on:debounced-resize", () => {
          updateHeight(elemToWatch);
        });

        updateHeight(elemToWatch);
      } else {
        // eslint-disable-next-line
        console.warn(
          `Enterprise Theme: No child elements matching ${parentElem.dataset.cssVarHeight} could be found.`
        );
      }
    });
  }
});

/**
 * Provides convenient utility functions for interacting with elements
 */
(() => {
  theme.elementUtil = {};

  /**
   * Allows for removal of elements in one line of code
   * @param {object} elem - Element to remove
   */
  theme.elementUtil.remove = (elem) => {
    if (elem) {
      if (typeof elem.remove === "function") {
        elem.remove();
      } else {
        elem.forEach((thisElem) => {
          thisElem.remove();
        });
      }
    }
  };

  /**
   * Checks if the passed element is in viewport or not
   * @param {object} elem - Element to check the view of
   * @returns {boolean}
   */
  theme.elementUtil.isInViewport = (elem) => {
    const rect = elem.getBoundingClientRect();
    return (
      Math.round(rect.top) >= 0 &&
      Math.round(rect.left) >= 0 &&
      Math.round(rect.bottom) <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      Math.round(rect.right) <=
        (window.innerWidth || document.documentElement.clientWidth)
    );
  };
})();

/**
 * Utility functions for interacting with LocalStorage/SessionStorage
 */
(() => {
  theme.storageUtil = {};

  theme.storageUtil.set = (key, value, isSession) => {
    if (isSession) {
      sessionStorage.setItem(
        `cc-${key}`,
        typeof value === "object" ? JSON.stringify(value) : value
      );
    } else {
      localStorage.setItem(
        `cc-${key}`,
        typeof value === "object" ? JSON.stringify(value) : value
      );
    }
  };

  theme.storageUtil.get = (key, isJson, isSession) => {
    let value = isSession
      ? sessionStorage.getItem(`cc-${key}`)
      : localStorage.getItem(`cc-${key}`);
    if (isJson) {
      value = JSON.parse(value);
    }
    return value;
  };

  theme.storageUtil.remove = (key, isSession) => {
    if (isSession) {
      sessionStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  };
})();

class StoreHeader extends HTMLElement {
  constructor() {
    super();
    this.menu = this.querySelector(".main-menu__content");
    this.searchToggle = this.querySelector(".js-show-search");
    this.mobNavToggle = this.querySelector(".main-menu__toggle");
    this.shakeyCartIcon = this.querySelector(".header__icon--cart-shake");
    this.headerGroupSections = document.querySelectorAll(
      ".shopify-section-group-header-group"
    );

    this.stickyInitialised = false;
    this.stickyTransitioning = false;
    this.lastScrollPos = 0;

    this.headerTransitionSpeed = parseFloat(
      getComputedStyle(this).getPropertyValue("--header-transition-speed")
    );

    window.setHeaderHeight();
    this.bindEvents();
    this.init();
  }

  disconnectedCallback() {
    window.removeEventListener("on:debounced-resize", this.resizeHandler);
    if (this.breakpointChangeHandler) {
      window.removeEventListener(
        "on:breakpoint-change",
        this.breakpointChangeHandler
      );
    }
  }

  bindEvents() {
    this.resizeHandler =
      this.resizeHandler || this.updateHeaderHeights.bind(this);
    window.addEventListener("on:debounced-resize", this.resizeHandler);

    this.mobNavToggle.addEventListener("click", window.setHeaderHeight);
    this.mobNavToggle.addEventListener("click", this.setHeaderEnd.bind(this));

    if (this.dataset.isSticky) {
      this.breakpointChangeHandler =
        this.breakpointChangeHandler || this.init.bind(this);
      window.addEventListener(
        "on:breakpoint-change",
        this.breakpointChangeHandler
      );
    }

    if (this.dataset.isSearchMinimised) {
      this.searchToggle.addEventListener(
        "click",
        this.handleSearchToggleClick.bind(this)
      );
    }
  }

  /**
   * Init sticky behaviour of the header
   */
  init() {
    this.updateHeaderHeights();

    if (this.dataset.isSticky) {
      if (theme.mediaMatches.md && !this.stickyInitialised) {
        this.stickyInitialised = true;
        // Animate the menu in/out on scroll up/down
        window.addEventListener("scroll", this.handleScroll.bind(this));
      }

      setTimeout(() => {
        document.querySelector(".cc-header").classList.add("cc-header--sticky");
      });

      this.setMenuHeight();
      this.setHeaderEnd();
    }

    // Stop the cart icon from shaking when necessary
    if (this.shakeyCartIcon) {
      let pageCount = theme.storageUtil.get("shake-page-count", false, true);
      pageCount = pageCount ? parseInt(pageCount, 10) + 1 : 1;
      const shakeFrequency = parseInt(
        this.shakeyCartIcon.dataset.shakeFrequency,
        10
      );
      if (pageCount < shakeFrequency) {
        this.shakeyCartIcon.classList.remove("header__icon--cart-shake");
      } else {
        pageCount = 0;
      }
      theme.storageUtil.set("shake-page-count", pageCount, true);
    }
  }

  /**
   * Toggles visibility of the search bar (mobile only)
   * @param {object} evt - Event object
   */
  handleSearchToggleClick(evt) {
    evt.preventDefault();
    const searchBar = this.querySelector(".js-search-bar");
    if (this.classList.contains("search-is-collapsed")) {
      this.classList.remove("search-is-collapsed");

      // Wait for reveal animation to complete
      setTimeout(() => {
        this.classList.add("search-is-visible");
        const searchInput = searchBar.querySelector(".js-search-input");
        searchInput.focus();
        window.setHeaderHeight();
      }, this.headerTransitionSpeed);
    } else {
      this.classList.remove("search-is-visible");

      setTimeout(() => {
        this.classList.add("search-is-collapsed");
      });

      setTimeout(window.setHeaderHeight, this.headerTransitionSpeed);
    }
  }

  /**
   * Wrapper for calling the two below
   */
  updateHeaderHeights() {
    if (theme.mediaMatches.md) {
      this.setMenuHeight();
      setTimeout(window.setHeaderHeight, this.headerTransitionSpeed);
    } else {
      window.setHeaderHeight();
    }

    // Set a css variable to record where the page content starts
    if (this.headerGroupSections && this.headerGroupSections.length > 0) {
      let headerGroupHeight = 0;
      this.headerGroupSections.forEach((section) => {
        headerGroupHeight += section.getBoundingClientRect().height;
      });

      if (headerGroupHeight > 0) {
        document.documentElement.style.setProperty(
          "--content-start",
          `${headerGroupHeight.toFixed(1)}px`
        );
      }
    }
  }

  /**
   * Set a css variable to the height of the menu links
   */
  setMenuHeight() {
    if (this.menu && this.menu.clientHeight) {
      this.style.setProperty(
        "--menu-height",
        `${this.menu.clientHeight + 16}px`
      );
      document.documentElement.style.setProperty(
        "--header-height",
        `${this.clientHeight}px`
      );
    }
  }

  /**
   * Handles 'scroll' event on the header
   */
  handleScroll() {
    if (
      !document.body.classList.contains("fixed") &&
      !this.stickyTransitioning
    ) {
      if (document.documentElement.scrollTop < 200) {
        this.show();
      } else if (this.lastScrollPos < document.documentElement.scrollTop) {
        this.hide();
      } else if (this.lastScrollPos - 5 > document.documentElement.scrollTop) {
        this.show();
      }

      this.lastScrollPos = document.documentElement.scrollTop;
    }
  }

  /**
   * Set a css variable to indicate where the nav ends on the page
   */
  setHeaderEnd() {
    const headerEnd = Number(
      this.getBoundingClientRect().top + this.clientHeight
    );
    document.documentElement.style.setProperty(
      "--header-end",
      `${headerEnd.toFixed(1)}px`
    );
    document.documentElement.style.setProperty(
      "--header-end-padded",
      `${(headerEnd + (theme.mediaMatches.md ? 56 : 20)).toFixed(1)}px`
    );
  }

  /**
   * Updates hidden class for header element
   */
  show() {
    this.classList.remove("is-out");
    this.stickyTransitioning = true;
    setTimeout(() => {
      this.lastScrollPos = document.documentElement.scrollTop;
      this.stickyTransitioning = false;
      this.handleScroll();
      this.setHeaderEnd();
    }, 300);
  }

  /**
   * Updates hidden class for header element
   */
  hide() {
    if (!this.stickyTransitioning) {
      this.classList.add("is-out");
      this.stickyTransitioning = true;
      setTimeout(() => {
        this.lastScrollPos = document.documentElement.scrollTop;
        this.stickyTransitioning = false;
        this.handleScroll();
        this.setHeaderEnd();
      }, 300);
    }
  }
}

customElements.define("store-header", StoreHeader);

class MainMenu extends HTMLElement {
  constructor() {
    super();
    this.mainDisclosure = this.querySelector(".main-menu__disclosure");
    this.mainToggle = this.querySelector(".main-menu__toggle");
    this.firstLevelMenuLinks = this.querySelectorAll(".js-nav-hover");
    this.firstLevelSingleLinks = this.querySelectorAll(
      ".main-nav__item--primary:not(.main-nav__item-content)"
    );
    this.nav = this.querySelector(".main-nav");
    this.overlay = document.querySelector(".js-overlay");
    this.searchIcon = document.querySelector(".header__icons .js-show-search");
    this.sidebarLinks = this.querySelectorAll(".js-sidebar-hover");
    this.elementsWhichCloseMenus = document.querySelectorAll(".js-closes-menu");

    this.childNavOpen = false;
    this.overlayOpen = false;

    this.addListeners();
    this.init();
  }

  disconnectedCallback() {
    window.removeEventListener("focusin", this.focusOutHandler);
    window.removeEventListener(
      "on:breakpoint-change",
      this.breakpointChangeHandler
    );

    if (Shopify.designMode) {
      document.removeEventListener(
        "shopify:block:select",
        this.blockSelectHandler
      );
      document.removeEventListener(
        "shopify:block:deselect",
        this.blockDeselectHandler
      );
    }
  }

  addListeners() {
    this.focusOutHandler =
      this.focusOutHandler || this.handleFocusOut.bind(this);
    this.breakpointChangeHandler =
      this.breakpointChangeHandler || this.init.bind(this);

    this.mainDisclosure.addEventListener(
      "transitionend",
      MainMenu.handleTransition.bind(this)
    );
    this.mainToggle.addEventListener(
      "click",
      this.handleMainMenuToggle.bind(this)
    );
    this.nav.addEventListener("click", MainMenu.handleNavClick.bind(this));
    window.addEventListener("focusin", this.focusOutHandler);
    window.addEventListener(
      "on:breakpoint-change",
      this.breakpointChangeHandler
    );

    if (Shopify.designMode) {
      this.blockSelectHandler =
        this.blockSelectHandler || this.handleBlockSelect.bind(this);
      this.blockDeselectHandler =
        this.blockDeselectHandler || this.handleBlockDeselect.bind(this);
      document.addEventListener(
        "shopify:block:select",
        this.blockSelectHandler
      );
      document.addEventListener(
        "shopify:block:deselect",
        this.blockDeselectHandler
      );
    }

    if (!theme.mediaMatches.md && this.searchIcon) {
      this.searchIcon.addEventListener(
        "click",
        this.closeMainDisclosure.bind(this)
      );
    }
  }

  /**
   * Sets 'open' state of the main disclosure element.
   * @param {?object} evt - Event object.
   */
  init(evt) {
    if (!evt) {
      this.mainDisclosure.open = theme.mediaMatches.xl;
    } else if (!theme.mediaMatches.xl && !this.childNavOpen) {
      this.close(this.mainDisclosure);

      if (this.overlayOpen) this.toggleOverlay(false);
    } else {
      // If there's another menu open, close it.
      const activeDisclosure = this.nav.querySelector("details.is-open");
      if (activeDisclosure) {
        this.close(activeDisclosure);
      } else {
        MainMenu.open(this.mainDisclosure, false);
      }

      if (!this.childNavOpen) {
        if (this.overlayOpen) this.toggleOverlay(false);
      }
    }

    // Close the submenus (they're open for no-js)
    this.querySelectorAll(".child-nav--dropdown details[open]").forEach(
      (childToggle) => {
        childToggle.removeAttribute("open");
      }
    );

    if (theme.device.hasHover) {
      // Add event handler (so the bound event listener can be removed)
      this.mouseEnterMenuLinkHandler =
        this.mouseEnterMenuLinkHandler ||
        this.handleMouseEnterMenuLink.bind(this);
      this.mouseLeaveMenuLinkHandler =
        this.mouseLeaveMenuLinkHandler ||
        this.handleMouseLeaveMenuLink.bind(this);
      this.mouseEnterSingleLinkHandler =
        this.mouseEnterSingleLinkHandler ||
        this.handleMouseEnterSingleLink.bind(this);
      this.mouseLeaveSingleLinkHandler =
        this.mouseLeaveSingleLinkHandler ||
        this.handleMouseLeaveSingleLink.bind(this);
      this.mouseEnterMenuCloserHandler =
        this.mouseEnterMenuCloserHandler || this.handleClose.bind(this);

      // Bind listening events for mouse enter/leave a main menu link
      if (!this.mouseOverListening && theme.mediaMatches.md) {
        this.firstLevelMenuLinks.forEach((menuLink) => {
          menuLink.addEventListener(
            "mouseenter",
            this.mouseEnterMenuLinkHandler
          );
          menuLink.addEventListener(
            "mouseleave",
            this.mouseLeaveMenuLinkHandler
          );
        });
        this.firstLevelSingleLinks.forEach((singleLink) => {
          singleLink.addEventListener(
            "mouseenter",
            this.mouseEnterSingleLinkHandler
          );
          singleLink.addEventListener(
            "mouseleave",
            this.mouseLeaveSingleLinkHandler
          );
        });
        this.elementsWhichCloseMenus.forEach((elem) => {
          elem.addEventListener("mouseenter", this.mouseEnterMenuCloserHandler);
        });
        this.mouseOverListening = true;
      } else if (this.mouseOverListening && !theme.mediaMatches.md) {
        this.firstLevelMenuLinks.forEach((menuLink) => {
          menuLink.removeEventListener(
            "mouseenter",
            this.mouseEnterMenuLinkHandler
          );
          menuLink.removeEventListener(
            "mouseleave",
            this.mouseLeaveMenuLinkHandler
          );
        });
        this.firstLevelSingleLinks.forEach((singleLink) => {
          singleLink.removeEventListener(
            "mouseenter",
            this.mouseEnterSingleLinkHandler
          );
          singleLink.removeEventListener(
            "mouseleave",
            this.mouseLeaveSingleLinkHandler
          );
        });
        this.elementsWhichCloseMenus.forEach((elem) => {
          elem.removeEventListener(
            "mouseenter",
            this.mouseEnterMenuCloserHandler
          );
        });
        this.mouseOverListening = false;
      }

      if (this.sidebarLinks) {
        if (!this.mouseOverSidebarListening && theme.mediaMatches.md) {
          this.sidebarLinks.forEach((sidebarLink) => {
            sidebarLink.addEventListener(
              "mouseenter",
              MainMenu.handleSidenavMenuToggle
            );
          });
          this.mouseOverSidebarListening = true;
        } else if (this.mouseOverSidebarListening && !theme.mediaMatches.md) {
          this.sidebarLinks.forEach((sidebarLink) => {
            sidebarLink.removeEventListener(
              "mouseenter",
              MainMenu.handleSidenavMenuToggle
            );
          });
          this.mouseOverSidebarListening = false;
        }
      }
    }
  }

  /**
   * Close the menu if the nav loses focus
   * @param {object} evt - Event object.
   */
  handleFocusOut(evt) {
    if (!this.contains(evt.target) && this.overlayOpen) this.handleClose();
  }

  /**
   * Updates the visible sidebar item
   * @param {object} evt - Event object.
   * @param {Element} [summaryElem] - The summary element to open.
   */
  static handleSidenavMenuToggle(evt, summaryElem = evt.target) {
    const container = summaryElem.closest(".child-nav");
    const lastSidenavElem = container.querySelector(".is-visible");
    if (lastSidenavElem) {
      lastSidenavElem.classList.remove("is-visible");
    }
    summaryElem.classList.add("is-visible");

    // Maintain a CSS variable which records the height of the current sidebar links
    const menu = summaryElem.closest("nav-menu");
    if (menu) {
      const openDisclosure = menu.querySelector(".disclosure__panel");
      if (openDisclosure) {
        container.style.setProperty(
          "--sidebar-height",
          `${Number.parseInt(
            openDisclosure.getBoundingClientRect().height,
            10
          )}px`
        );
      }
    }
  }

  /**
   * Handles 'toggle' event on the main disclosure element.
   * @param {object} evt - Event object.
   */
  handleMainMenuToggle(evt) {
    evt.preventDefault();
    this.opener = this.mainToggle;

    if (!this.mainDisclosure.open) {
      MainMenu.open(this.mainDisclosure);
    } else {
      this.close(this.mainDisclosure, true);
    }
  }

  /**
   * Handles 'mouseenter' event on the main menu items using a timeout to infer hover intent
   * @param {object} evt - Event object
   */
  handleMouseEnterMenuLink(evt) {
    this.menuLinkTimeout = setTimeout(
      this.openMenuFromMouseEnter.bind(this, evt.target),
      Number.parseInt(this.dataset.menuSensitivity, 10)
    );
  }

  /**
   * Handles 'mouseleave' event on the main menu items - clears the timeout
   */
  handleMouseLeaveMenuLink() {
    if (this.menuLinkTimeout) clearTimeout(this.menuLinkTimeout);
  }

  /**
   * Handles 'mouseenter' event on links with no submenu items using a timeout to infer hover intent
   */
  handleMouseEnterSingleLink() {
    this.singleLinkTimeout = setTimeout(() => {
      this.handleClose();
    }, Number.parseInt(this.dataset.menuSensitivity, 10));
  }

  /**
   * Handles 'mouseleave' event on links with no submenu - clears the timeout
   */
  handleMouseLeaveSingleLink() {
    if (this.singleLinkTimeout) clearTimeout(this.singleLinkTimeout);
  }

  /**
   * Opens the menu being hovered over
   * @param {Element} menuElem - The menu element to open.
   */
  openMenuFromMouseEnter(menuElem) {
    trapFocus(menuElem);

    const disclosure = menuElem.closest("details");
    if (!disclosure.classList.contains("is-open")) {
      const activeDisclosure = this.nav.querySelector("details.is-open");

      // If there's another menu open, close it.
      if (activeDisclosure && activeDisclosure !== disclosure) {
        this.close(activeDisclosure);
      } else {
        this.toggleOverlay(!this.overlayOpen);
      }

      MainMenu.open(disclosure);
    }
  }

  /**
   * Handles 'click' event on the nav.
   * @param {object} evt - Event object.
   */
  static handleNavClick(evt) {
    const mainMenuContent = evt.target.closest(".main-menu__content");
    let el = evt.target;

    // Handle sidebar link clicks
    if (theme.mediaMatches.md && el.matches(".js-sidebar-hover")) {
      evt.preventDefault();
      MainMenu.handleSidenavMenuToggle(evt);
    }

    // Don't follow # links
    if (evt.target.href && evt.target.href.endsWith("#")) evt.preventDefault();

    // If we're on a device without hover on a larger screen, open the menu
    if (theme.mediaMatches.md && !theme.device.hasHover) {
      el = evt.target.closest(".js-toggle");
      if (!el) return;
    }

    if (!el.matches(".js-toggle,.js-back")) return;

    const disclosure = el.closest("details");

    if (theme.mediaMatches.md && theme.device.hasHover) {
      disclosure.classList.toggle("is-open");
      return;
    }

    this.opener = el;

    if (el.matches(".js-toggle")) {
      evt.preventDefault();

      if (!theme.mediaMatches.md) {
        mainMenuContent.classList.add("main-menu__content--no-focus");
      }

      if (!disclosure.classList.contains("is-open")) {
        this.childNavOpen = true;

        const activeDisclosure = this.nav.querySelector("details.is-open");
        // If there's another menu open, close it.
        if (activeDisclosure && activeDisclosure !== disclosure) {
          this.close(activeDisclosure);
        } else if (theme.mediaMatches.md) {
          this.toggleOverlay(!this.overlayOpen);
        }

        MainMenu.open(disclosure);
      } else {
        this.close(disclosure, true);
        this.childNavOpen = false;
        this.toggleOverlay(false);
      }
    } else if (el.matches(".js-back")) {
      evt.preventDefault();
      this.close(disclosure, true);
      this.childNavOpen = false;

      if (!theme.mediaMatches.md) {
        mainMenuContent.classList.remove("main-menu__content--no-focus");
      }
    }
  }

  /**
   * Handles 'transitionend' event on the nav.
   * @param {object} evt - Event object.
   */
  static handleTransition(evt) {
    const disclosure = evt.target.closest("details");

    if (disclosure.classList.contains("is-closing")) {
      disclosure.classList.remove("is-closing");
      disclosure.open = false;

      removeTrapFocus();
      this.opener = null;
    }
  }

  /**
   * Handles a 'click' event on the overlay and a 'keyup' event on the nav.
   * @param {object} evt - Event object.
   */
  handleClose(evt) {
    if (evt && evt.type === "keyup" && evt.key !== "Escape") return;

    const disclosure = theme.mediaMatches.md
      ? this.nav.querySelector("details.is-open")
      : this.mainDisclosure;

    if (disclosure) {
      this.close(disclosure, true);
      this.toggleOverlay(false);
      this.childNavOpen = false;
    }
  }

  /**
   * Toggles visibility of the background overlay.
   * @param {boolean} show - Show the overlay.
   */
  toggleOverlay(show) {
    this.overlayOpen = show;
    this.overlay.classList.toggle("overlay--nav", show);
    this.overlay.classList.toggle("is-visible", show);

    if (show) {
      // Add event handler (so the bound event listener can be removed).
      this.closeHandler = this.closeHandler || this.handleClose.bind(this);

      // Add event listeners (for while the nav is open).
      this.overlay.addEventListener("click", this.closeHandler);
      this.nav.addEventListener("keyup", this.closeHandler);

      if (theme.mediaMatches.md) {
        this.overlay.addEventListener("mouseenter", this.closeHandler);
      }
    } else {
      // Remove event listener added on nav opening.
      this.overlay.removeEventListener("click", this.closeHandler);
      this.nav.removeEventListener("keyup", this.closeHandler);

      if (theme.mediaMatches.md) {
        this.overlay.removeEventListener("mouseenter", this.closeHandler);
      }
    }
  }

  /**
   * Closes the main nav menu
   */
  closeMainDisclosure() {
    if (this.mainDisclosure.classList.contains("is-open")) {
      this.close(this.mainDisclosure, true);
      this.toggleOverlay(false);
      this.childNavOpen = false;
    }
  }

  /**
   * Updates open/opening classes for disclosure element.
   * @param {Element} el - Disclosure element.
   * @param {boolean} [mainMenuOpen=true] - Main menu is open.
   */
  static open(el, mainMenuOpen = true) {
    el.open = true;

    // Cap the max width of grandchildren on desktop their contents don't widen the dropdown
    if (theme.mediaMatches.md && !el.classList.contains("js-mega-nav")) {
      // If the nav menu spills off the right of the screen, shift it to the left
      const dropdownContainer = el.querySelector(".main-nav__child");
      if (dropdownContainer.getBoundingClientRect().right > window.innerWidth) {
        dropdownContainer.classList.add("main-nav__child--offset-right");
      }

      const dropdown = el.querySelector(".child-nav--dropdown");
      if (dropdown) {
        dropdown
          .querySelectorAll(".main-nav__grandchild")
          .forEach((grandchildElem) => {
            grandchildElem.style.maxWidth = `${dropdown.clientWidth}px`;
          });
      }
    } else if (
      theme.mediaMatches.md &&
      el.querySelector(".mega-nav--sidebar")
    ) {
      const firstSummaryElem = el.querySelector(
        ".mega-nav--sidebar details[open] summary"
      );
      if (firstSummaryElem) {
        // Open the first sidebar mega menu
        MainMenu.handleSidenavMenuToggle(null, firstSummaryElem);
      }
    }

    // Slight delay required before starting transitions.
    setTimeout(() => {
      el.classList.remove("is-closing");
      el.classList.add("is-open");
    });

    if (mainMenuOpen) {
      removeTrapFocus();
      trapFocus(el);

      if (
        theme.mediaMatches.md ||
        el.classList.contains("main-menu__disclosure")
      ) {
        document.body.classList.add("overflow-hidden");
      }
    }
  }

  /**
   * Updates close/closing classes of a disclosure element.
   * @param {Element} el - Disclosure element.
   * @param {boolean} [transition=false] - Close action has a CSS transition.
   */
  close(el, transition = true) {
    el.classList.remove("is-open");

    if (transition) {
      el.classList.add("is-closing");
    } else {
      el.classList.remove("is-closing");
      el.open = false;

      removeTrapFocus(this.opener);
      this.opener = null;
    }

    setTimeout(() => {
      const offsetMenu = el.querySelector(".main-nav__child--offset-right");
      if (offsetMenu)
        offsetMenu.classList.remove("main-nav__child--offset-right");
    }, 200);

    if (
      theme.mediaMatches.md ||
      el.classList.contains("main-menu__disclosure")
    ) {
      document.body.classList.remove("overflow-hidden");
    }
  }

  /**
   * Decide whether to show a particular mega menu
   * @param {object} evt - Event object
   */
  handleBlockSelect(evt) {
    const activeDisclosure = this.nav.querySelector("details.is-open");
    if (activeDisclosure) {
      this.close(activeDisclosure, false);
    }

    if (evt.target.matches(".js-mega-nav")) {
      MainMenu.open(evt.target, false);
      this.toggleOverlay(true);
    }
  }

  /**
   * Decide whether to hide a particular mega menu
   * @param {object} evt - Event object
   */
  handleBlockDeselect(evt) {
    if (evt.target.matches(".js-mega-nav")) {
      this.close(evt.target, false);
      this.toggleOverlay(false);
    }
  }
}

customElements.define("main-menu", MainMenu);

class CarouselSlider extends HTMLElement {
  constructor() {
    super();
    this.slides = this.querySelectorAll(".slider__item");
    if (this.slides.length < 2) return;
    window.initLazyScript(this, this.init.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener(
      "on:breakpoint-change",
      this.breakpointChangeHandler
    );
  }

  init() {
    this.slider = this.querySelector(".slider");
    this.grid = this.querySelector(".slider__grid");
    this.nav = this.querySelector(".slider-nav");
    this.rtl = document.dir === "rtl";
    this.breakpointChangeHandler =
      this.breakpointChangeHandler || this.handleBreakpointChange.bind(this);

    if (this.nav) {
      this.prevBtn = this.querySelector('button[name="prev"]');
      this.nextBtn = this.querySelector('button[name="next"]');
    }

    this.initSlider();
    window.addEventListener(
      "on:breakpoint-change",
      this.breakpointChangeHandler
    );
  }

  initSlider() {
    this.gridWidth = this.grid.clientWidth;

    // Distance between leading edges of adjacent slides (i.e. width of card + gap).
    this.slideSpan =
      this.getWindowOffset(this.slides[1]) -
      this.getWindowOffset(this.slides[0]);

    // Width of gap between slides.
    this.slideGap = this.slideSpan - this.slides[0].clientWidth;

    this.slidesPerPage = Math.round(
      (this.gridWidth + this.slideGap) / this.slideSpan
    );
    this.slidesToScroll =
      theme.settings.sliderItemsPerNav === "page" ? this.slidesPerPage : 1;
    this.totalPages = this.slides.length - this.slidesPerPage + 1;

    this.setCarouselState(this.totalPages > 1);
    if (this.totalPages < 2) return;

    this.sliderStart = this.getWindowOffset(this.slider);
    if (!this.sliderStart)
      this.sliderStart = (this.slider.clientWidth - this.gridWidth) / 2;
    this.sliderEnd = this.sliderStart + this.gridWidth;

    if (window.matchMedia("(pointer: fine)").matches) {
      this.slider.classList.add("is-grabbable");
    }

    this.addListeners();
    this.setButtonStates();
  }

  addListeners() {
    if (this.nav) {
      this.scrollHandler = debounce(this.handleScroll.bind(this));
      this.navClickHandler = this.handleNavClick.bind(this);

      this.slider.addEventListener("scroll", this.scrollHandler);
      this.nav.addEventListener("click", this.navClickHandler);
    }

    if (window.matchMedia("(pointer: fine)").matches) {
      this.mousedownHandler = this.handleMousedown.bind(this);
      this.mouseupHandler = this.handleMouseup.bind(this);
      this.mousemoveHandler = this.handleMousemove.bind(this);

      this.slider.addEventListener("mousedown", this.mousedownHandler);
      this.slider.addEventListener("mouseup", this.mouseupHandler);
      this.slider.addEventListener("mouseleave", this.mouseupHandler);
      this.slider.addEventListener("mousemove", this.mousemoveHandler);
    }
  }

  removeListeners() {
    if (this.nav) {
      this.slider.removeEventListener("scroll", this.scrollHandler);
      this.nav.removeEventListener("click", this.navClickHandler);
    }

    this.slider.removeEventListener("mousedown", this.mousedownHandler);
    this.slider.removeEventListener("mouseup", this.mouseupHandler);
    this.slider.removeEventListener("mouseleave", this.mouseupHandler);
    this.slider.removeEventListener("mousemove", this.mousemoveHandler);
  }

  /**
   * Handles 'scroll' events on the slider element.
   */
  handleScroll() {
    this.currentIndex = Math.round(this.slider.scrollLeft / this.slideSpan);
    this.setButtonStates();
  }

  /**
   * Handles 'mousedown' events on the slider element.
   * @param {object} evt - Event object.
   */
  handleMousedown(evt) {
    this.mousedown = true;
    this.startX = evt.pageX - this.sliderStart;
    this.scrollPos = this.slider.scrollLeft;
    this.slider.classList.add("is-grabbing");
  }

  /**
   * Handles 'mouseup' events on the slider element.
   */
  handleMouseup() {
    this.mousedown = false;
    this.slider.classList.remove("is-grabbing");
  }

  /**
   * Handles 'mousemove' events on the slider element.
   * @param {object} evt - Event object.
   */
  handleMousemove(evt) {
    if (!this.mousedown) return;
    evt.preventDefault();

    const x = evt.pageX - this.sliderStart;
    this.slider.scrollLeft = this.scrollPos - (x - this.startX) * 2;
  }

  /**
   * Handles 'click' events on the nav buttons container.
   * @param {object} evt - Event object.
   */
  handleNavClick(evt) {
    if (!evt.target.matches(".slider-nav__btn")) return;

    if (
      (evt.target.name === "next" && !this.rtl) ||
      (evt.target.name === "prev" && this.rtl)
    ) {
      this.scrollPos =
        this.slider.scrollLeft + this.slidesToScroll * this.slideSpan;
    } else {
      this.scrollPos =
        this.slider.scrollLeft - this.slidesToScroll * this.slideSpan;
    }

    this.slider.scrollTo({ left: this.scrollPos, behavior: "smooth" });
  }

  /**
   * Handles 'on:breakpoint-change' events on the window.
   */
  handleBreakpointChange() {
    this.removeListeners();
    this.initSlider();
  }

  /**
   * Gets the offset of an element from the edge of the viewport (left for ltr, right for rtl).
   * @param {number} el - Element.
   * @returns {number}
   */
  getWindowOffset(el) {
    return this.rtl
      ? window.innerWidth - el.getBoundingClientRect().right
      : el.getBoundingClientRect().left;
  }

  /**
   * Gets the visible state of a slide.
   * @param {Element} el - Slide element.
   * @returns {boolean}
   */
  getSlideVisibility(el) {
    const slideStart = this.getWindowOffset(el);
    const slideEnd = Math.floor(slideStart + this.slides[0].clientWidth);
    return slideStart >= this.sliderStart && slideEnd <= this.sliderEnd;
  }

  /**
   * Sets the active state of the carousel.
   * @param {boolean} active - Set carousel as active.
   */
  setCarouselState(active) {
    if (active) {
      this.removeAttribute("inactive");

      // If slider width changed when activated, reinitialise it.
      if (this.gridWidth !== this.grid.clientWidth) {
        this.handleBreakpointChange();
      }
    } else {
      this.setAttribute("inactive", "");
    }
  }

  /**
   * Sets the disabled state of the nav buttons.
   */
  setButtonStates() {
    if (!this.prevBtn && !this.nextBtn) {
      return;
    }

    this.prevBtn.disabled =
      this.getSlideVisibility(this.slides[0]) && this.slider.scrollLeft === 0;
    this.nextBtn.disabled = this.getSlideVisibility(
      this.slides[this.slides.length - 1]
    );
  }
}

customElements.define("carousel-slider", CarouselSlider);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
    window.initLazyScript(this, this.init.bind(this), 500);
  }

  async init() {
    const { productId } = this.dataset;
    if (!productId) return;

    try {
      const response = await fetch(
        `${this.dataset.url}&product_id=${productId}`
      );
      if (!response.ok) throw new Error(response.status);

      const tmpl = document.createElement("template");
      tmpl.innerHTML = await response.text();

      const el = tmpl.content.querySelector("product-recommendations");
      if (el && el.hasChildNodes()) {
        this.innerHTML = el.innerHTML;
      }

      window.initLazyImages();
    } catch (error) {
      console.log(error); // eslint-disable-line
    }
  }
}

customElements.define("product-recommendations", ProductRecommendations);

setTimeout(() => {
  requestAnimationFrame(initLazyImages);
}, 0);
window.initLazyScript = initLazyScript;

document.addEventListener("keydown", (evt) => {
  if (evt.code === "Tab") {
    document.body.classList.add("tab-used");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.add("dom-loaded");
  }, 0);

  setTimeout(() => {
    document.body.classList.add("dom-loaded-plus-6");
  }, 6000);

  if (theme.settings.externalLinksNewTab) {
    document.addEventListener("click", (evt) => {
      const link =
        evt.target.tagName === "A" ? evt.target : evt.target.closest("a");
      if (
        link &&
        link.tagName === "A" &&
        window.location.hostname !== new URL(link.href).hostname
      ) {
        link.target = "_blank";
      }
    });
  }

  // Ensure anchor scrolling is smooth (this shouldn't be added in the CSS)
  document.addEventListener("click", (evt) => {
    if (
      evt.target.tagName === "A" &&
      window.location.hostname === new URL(evt.target.href).hostname &&
      evt.target.href.includes("#")
    ) {
      document.getElementsByTagName("html")[0].style.scrollBehavior = "smooth";
      setTimeout(() => {
        document.getElementsByTagName("html")[0].style.scrollBehavior = "";
      }, 1000);
    }
  });
});




