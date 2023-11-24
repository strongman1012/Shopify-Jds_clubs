if (!customElements.get('tabbed-content')) {
  class Tabs extends HTMLElement {
    constructor() {
      super();
      this.tabList = this.querySelector('[role="tablist"]');
      this.activeTab = this.tabList.querySelector('[aria-selected="true"]');
      this.isVerticalTablist = this.tabList.getAttribute('aria-orientation') === 'vertical';
      this.tabs = this.querySelectorAll('[role="tab"]');
      this.panels = this.querySelectorAll('[role="tabpanel"]');

      // If no tab is active by default, activate the first tab.
      if (!this.activeTab) {
        this.activeTab = this.tabs[0];
        this.activateTab(this.activeTab);
      }

      this.addListeners();
    }

    addListeners() {
      this.tabList.addEventListener('click', this.handleClick.bind(this));
      this.tabList.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handles 'click' events on the tablist.
     * @param {object} evt - Event object.
     */
    handleClick(evt) {
      if (!evt.target.matches('[role="tab"]') || evt.target === this.activeTab) return;
      this.activateTab(evt.target);
    }

    /**
     * Handles 'keydown' events on the tablist.
     * @param {object} evt - Event object.
     */
    handleKeydown(evt) {
      switch (evt.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          evt.preventDefault();
          if (!this.isVerticalTablist) {
            this.switchTabOnKeyPress(evt.key);
          }
          break;

        case 'ArrowUp':
        case 'ArrowDown':
          evt.preventDefault();
          if (this.isVerticalTablist) {
            this.switchTabOnKeyPress(evt.key);
          }
          break;

        // Activate the first tab.
        case 'Home':
          evt.preventDefault();
          this.activateTab(this.tabs[0]);
          break;

        // Activate the last tab.
        case 'End':
          evt.preventDefault();
          this.activateTab(this.tabs[this.tabs.length - 1]);
          break;
      }
    }

    /**
     * Activates the next or previous tab according to the key pressed.
     * @param {string} key - Key pressed.
     */
    switchTabOnKeyPress(key) {
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        // If active tab is the last tab.
        if (this.activeTab === this.tabs[this.tabs.length - 1]) {
          // Activate first tab.
          this.activateTab(this.tabs[0]);
        } else {
          // Activate next tab.
          this.activateTab(this.activeTab.nextElementSibling);
        }
      } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
        // If active tab is the first tab.
        if (this.activeTab === this.tabs[0]) {
          this.activateTab(this.tabs[this.tabs.length - 1]);
        } else {
          // Activate the previous tab.
          this.activateTab(this.activeTab.previousElementSibling);
        }
      }
    }

    /**
     * Activates a tab.
     * @param {Element} tab - Tab element (button).
     */
    activateTab(tab) {
      this.deactivateActiveTab();

      Tabs.setTabState(tab, true);
      tab.removeAttribute('tabindex');
      this.activeTab = tab;

      if (document.activeElement.matches('.tablist__tab')) {
        tab.focus();
      }
    }

    /**
     * Deactivates the currently active tab.
     */
    deactivateActiveTab() {
      Tabs.setTabState(this.activeTab, false);
      this.activeTab.setAttribute('tabindex', '-1');
      this.activeTab = null;
    }

    /**
     * Sets the active state of a tab and associated content panel.
     * @param {Element} tab - Tab element (button).
     * @param {boolean} active - Set the tab as active.
     */
    static setTabState(tab, active) {
      tab.setAttribute('aria-selected', active);

      const panelId = tab.getAttribute('aria-controls');
      document.getElementById(panelId).hidden = !active;
    }
  }

  customElements.define('tabbed-content', Tabs);
}
