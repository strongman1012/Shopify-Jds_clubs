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

if (!customElements.get('speech-search-button')) {
  class SpeechSearchButton extends HTMLElement {
    constructor() {
      super();

      this.recognition = null;
      this.isListening = false;
      this.form = null;
      this.searchInput = null;

      const userAgent = window.navigator.userAgent.toLowerCase();
      if ('webkitSpeechRecognition' in window
        && userAgent.indexOf('chrome') > -1 && !!window.chrome
        && userAgent.indexOf('edg/') === -1) {
        // Browser webkit speech recognition api, and is chrome
        this.init();
        this.bindEvents();
      }
    }

    bindEvents() {
      this.recognition.addEventListener(
        'result',
        debounce((evt) => {
          if (evt.results) {
            const term = evt.results[0][0].transcript;
            this.searchInput.value = term;

            if (this.searchInput.getAttribute('role') === 'combobox') {
              this.searchInput.dispatchEvent(new Event('input'));
            } else {
              this.form.submit();
            }
          }
        }, 300)
      );

      this.recognition.addEventListener('audiostart', () => {
        this.isListening = true;
        this.classList.add('search__speech-listening');
      });

      this.recognition.addEventListener('audioend', () => {
        this.isListening = false;
        this.classList.remove('search__speech-listening');
      });

      this.addEventListener('click', this.toggleListen);

      this.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
          this.toggleListen(e);
        }
      });
    }

    init() {
      this.classList.remove('hidden');
      this.recognition = new window.webkitSpeechRecognition(); // eslint-disable-line new-cap
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.form = this.closest('form');
      this.searchInput = this.form.querySelector('.js-search-input');
    }

    /**
     * Stops/starts the browser from listening
     * @param {object} evt - Event object
     */
    toggleListen(evt) {
      evt.preventDefault();
      if (this.isListening) {
        this.recognition.stop();
      } else {
        this.recognition.start();
      }
    }
  }

  customElements.define('speech-search-button', SpeechSearchButton);
}
