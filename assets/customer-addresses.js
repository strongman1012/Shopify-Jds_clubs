class CustomerAddresses extends HTMLElement {
  constructor() {
    super();
    this.addListeners();
  }

  addListeners() {
    this.querySelector('.js-add-address').addEventListener('click', CustomerAddresses.handleAddBtnClick);

    this.querySelectorAll('.js-edit-address').forEach((btn) => {
      btn.addEventListener('click', CustomerAddresses.handleEditBtnClick);
    });

    this.querySelectorAll('.js-delete-address').forEach((btn) => {
      btn.addEventListener('click', CustomerAddresses.handleDeleteBtnClick);
    });

    this.querySelectorAll('.js-cancel').forEach((btn) => {
      btn.addEventListener('click', CustomerAddresses.handleCancelBtnClick);
    });
  }

  /**
   * Handles 'click' events on the 'add new address' button.
   */
  static handleAddBtnClick() {
    document.getElementById('add-address-drawer').open();
  }

  /**
   * Handles 'click' events on 'edit address' buttons.
   * @param {object} evt - Event object.
   */
  static handleEditBtnClick(evt) {
    document.getElementById(`edit-${evt.target.dataset.addressId}-drawer`).open();
  }

  /**
   * Handles 'click' events on 'delete address' buttons.
   * @param {object} evt - Event object.
   */
  static handleDeleteBtnClick(evt) {
    // eslint-disable-next-line no-alert, no-restricted-globals
    if (confirm(evt.target.getAttribute('data-confirm-message'))) {
      const form = document.createElement('form');
      form.method = 'post';
      form.action = evt.target.dataset.target;

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_method';
      input.value = 'delete';
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }
  }

  /**
   * Handles 'click' events on 'cancel' buttons.
   * @param {object} evt - Event object.
   */
  static handleCancelBtnClick(evt) {
    evt.target.closest('side-drawer').close();
  }
}

customElements.define('customer-addresses', CustomerAddresses);
