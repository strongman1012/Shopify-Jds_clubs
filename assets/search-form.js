/* global debounce */

if (!customElements.get('search-form')) {
  class SearchForm extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('.js-search-input');
      this.resetBtn = this.querySelector('.js-search-reset');
      this.addListeners();
      this.init();
    }

    addListeners() {
      this.input.addEventListener('input', debounce(this.handleInput.bind(this)));
      this.resetBtn.addEventListener('click', this.handleReset.bind(this));
    }

    init() {
      if ((this.input.dataset.placeholderTwo || this.input.dataset.placeholderThree)
        && (this.input.dataset.placeholderPromptsMob === 'true' || theme.mediaMatches.md)) {
        this.typeInPlaceholders();
      }
    }

    /**
     * Simulates the placeholder titles being typed in and the previous one deleted, on repeat
     */
    typeInPlaceholders() {
      const typingSpeed = this.input.dataset.typingSpeed || 100;
      const deletingSpeed = this.input.dataset.deletingSpeed || 60;
      const delayAfterDeleting = this.input.dataset.delayAfterDeleting || 500;
      const delayBeforeFirstDelete = this.input.dataset.delayBeforeFirstDelete || 2000;
      const delayAfterWordTyped = this.input.dataset.delayAfterWordTyped || 2400;
      const placeholders = [];

      if (this.input.placeholder) {
        placeholders.push(this.input.placeholder);
      }

      if (this.input.dataset.placeholderTwo) {
        placeholders.push(this.input.dataset.placeholderTwo);
      }

      if (this.input.dataset.placeholderThree) {
        placeholders.push(this.input.dataset.placeholderThree);
      }

      const typeInNextPlaceholder = async (placeholder) => {
        await new Promise((resolve) => {
          let currentPlaceholder = this.input.getAttribute('placeholder');

          // If necessary remove the start of the word to type in if it already exists in the
          // placeholder
          let nextPlaceholder = (currentPlaceholder.length >= 3
              && placeholder.startsWith(currentPlaceholder))
            ? placeholder.replace(currentPlaceholder, '')
            : placeholder;

          const typingIntervalId = setInterval(() => {
            currentPlaceholder = this.input.getAttribute('placeholder');
            this.input.setAttribute('placeholder', currentPlaceholder + nextPlaceholder.charAt(0));
            if (nextPlaceholder.length === 1) {
              resolve();
              clearInterval(typingIntervalId); // Stop typing
            } else {
              nextPlaceholder = nextPlaceholder.substring(1);
            }
          }, typingSpeed);
        });
      };

      const deleteCurrentPlaceholder = async (nextPlaceholder) => {
        await new Promise((resolve) => {
          let prevPlaceholder = this.input.getAttribute('placeholder');
          const deletionIntervalId = setInterval(() => {
            const newPlaceholder = prevPlaceholder.substring(0, prevPlaceholder.length - 1);
            this.input.setAttribute('placeholder', newPlaceholder);
            prevPlaceholder = newPlaceholder;
            if (prevPlaceholder.length === 0
              || (prevPlaceholder.length >= 3 && nextPlaceholder.startsWith(prevPlaceholder))) {
              resolve();
              clearInterval(deletionIntervalId);
            }
          }, deletingSpeed);
        });
      };

      let startIndex = 0;
      const showNextPlaceholder = () => {
        startIndex = (startIndex + 1) % placeholders.length;
        const nextPlaceholder = placeholders[startIndex];
        deleteCurrentPlaceholder.call(this, nextPlaceholder).then(() => {
          setTimeout(() => {
            typeInNextPlaceholder.call(this, nextPlaceholder).then(() => {
              setTimeout(showNextPlaceholder.bind(this), delayAfterWordTyped);
            });
          }, delayAfterDeleting);
        });
      };

      setTimeout(showNextPlaceholder.bind(this), delayBeforeFirstDelete);
    }

    /**
     * Handles 'input' events on the search field.
     */
    handleInput() {
      if (this.input.value.length > 0) {
        this.input.classList.add('search__input--dirty');
      } else {
        this.input.classList.remove('search__input--dirty');
      }
    }

    /**
     * Handles the reset button being clicked
     */
    handleReset() {
      this.input.classList.remove('search__input--dirty');
    }
  }

  customElements.define('search-form', SearchForm);
}
