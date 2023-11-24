if (!customElements.get('countdown-timer')) {
  class CountdownTimer extends HTMLElement {
    constructor() {
      super();
      this.endDate = new Date(this.dataset.endDate).getTime();
      if (!Number(this.endDate)) return;

      window.initLazyScript(this, this.init.bind(this));
    }

    init() {
      this.daysEl = this.querySelector('.js-days');
      this.hoursEl = this.querySelector('.js-hours');
      this.minsEl = this.querySelector('.js-mins');
      this.secsEl = this.querySelector('.js-secs');

      this.second = 1000;
      this.minute = 60 * this.second;
      this.hour = 60 * this.minute;
      this.day = 24 * this.hour;

      this.timer();
      this.interval = setInterval(this.timer.bind(this), this.second);
    }

    timer() {
      const timeDiff = this.endDate - new Date();

      if (timeDiff < 0) {
        clearInterval(this.interval);
        return;
      }

      const days = Math.floor(timeDiff / this.day);
      const hours = Math.floor(timeDiff / this.hour);
      const mins = Math.floor(timeDiff / this.minute);
      const secs = Math.floor(timeDiff / this.second);

      this.daysEl.textContent = days;
      this.hoursEl.textContent = hours - days * 24;
      this.minsEl.textContent = mins - hours * 60;
      this.secsEl.textContent = secs - mins * 60;
    }
  }

  customElements.define('countdown-timer', CountdownTimer);
}
