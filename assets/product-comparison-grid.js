if (!customElements.get('product-comparison-grid')) {
  class ProductComparisonGrid extends HTMLElement {
    constructor() {
      super();
      this.grid = this.querySelector('.product-comparison-grid');
      this.rows = this.grid.querySelectorAll('tr');
      this.gridContainer = this.querySelector('.product-comparison-container');
      this.showAllButton = this.querySelector('.js-show-all');

      if (this.showAllButton) {
        this.showAllButton.addEventListener('click', this.handleShowAllClick.bind(this));
      }
    }

    /**
     * Handles 'click' events on the show all rows button
     * @param {object} evt - Event object.
     */
    handleShowAllClick(evt) {
      // Toggle the button text
      const buttonText = evt.target.textContent;
      evt.target.textContent = evt.target.dataset.toggleText;
      evt.target.dataset.toggleText = buttonText;

      // Set the initial max height to transition from
      const gridHeight = this.grid.clientHeight;
      this.gridContainer.style.maxHeight = `${gridHeight}px`;
      this.gridContainer.style.overflow = 'hidden';
      this.gridContainer.classList.add('is-transitioning');

      // Show/hide the relevant rows
      let heightReduction = 0;
      this.rows.forEach((row) => {
        if (row.classList.contains('js-hidden')) {
          row.classList.remove('js-hidden');
          row.dataset.wasHidden = 'true';
        } else if (row.dataset.wasHidden) {
          heightReduction += row.clientHeight;
        }
      });

      this.gridContainer.style.maxHeight = `${heightReduction > 0 ? gridHeight - heightReduction : this.grid.clientHeight}px`;

      // End of max height transition
      setTimeout(() => {
        if (heightReduction > 0) {
          // Hide the rows
          this.rows.forEach((row) => {
            if (row.dataset.wasHidden === 'true') {
              row.classList.add('js-hidden');
              row.removeAttribute('was-hidden');
            }
          });
        }

        // Reset the height back to auto
        this.gridContainer.style.maxHeight = '';
        this.gridContainer.style.overflow = '';
        this.gridContainer.classList.remove('is-transitioning');
      }, (parseFloat(window.getComputedStyle(this.gridContainer).transitionDuration) * 1000));
    }
  }

  customElements.define('product-comparison-grid', ProductComparisonGrid);
}
