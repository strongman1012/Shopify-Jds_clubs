/**
 * Sets a cookie.
 * @param {string} name - Name for the cookie.
 * @param {string} value - Value for the cookie.
 * @param {number} days - Number of days until the cookie should expire.
 */
function setCookie(name, value, days) {
  let expires = '';

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=None; Secure`;
}

/**
 * Gets the value of a cookie (if it exists).
 * @param {string} name - Name of the cookie.
 * @returns {?string}
 */
function getCookie(name) {
  const cookieString = `; ${document.cookie}`;
  const cookies = cookieString.split(`; ${name}=`);

  if (cookies.length === 2) {
    return cookies.pop().split(';').shift();
  }

  return null;
}

/* global Modal */

if (!customElements.get('pop-up')) {
  customElements.whenDefined('modal-dialog').then(() => {
    class PopUp extends Modal {
      constructor() {
        super();
        this.cookie = `${this.id}-dismissed`;

        if (Shopify.designMode) {
          document.addEventListener('shopify:section:select', (evt) => {
            if (evt.target === this.closest('.shopify-section')) this.open();
          });

          document.addEventListener('shopify:section:deselect', this.close.bind(this));
        } else if (!getCookie(this.cookie)) {
          if (this.querySelector('.alert')) {
            this.open();
          } else {
            setTimeout(() => this.open(), Number(this.dataset.delay) * 1000);
          }
        }
      }

      /**
       * Handles 'click' events on the modal.
       * @param {object} evt - Event object.
       */
      handleClick(evt) {
        super.handleClick(evt);

        if (evt.target.matches('.js-close-modal')) {
          setCookie(this.cookie, true, this.dataset.dismissDays);
        }
      }
    }

    customElements.define('pop-up', PopUp);
  });
}
