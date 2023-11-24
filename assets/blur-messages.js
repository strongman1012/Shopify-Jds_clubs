(() => {
  const origTitle = document.title;
  const delay = theme.settings.blurMessageDelay * 1000;
  let timer;

  const nextBlurMessage = (firstMessage) => {
    const message = firstMessage ? theme.settings.blurMessage1 : theme.settings.blurMessage2;
    if (message) document.title = message;
    if (theme.settings.blurMessage2) {
      timer = setTimeout(() => {
        nextBlurMessage(!firstMessage);
      }, delay);
    }
  };

  window.addEventListener('blur', () => {
    timer = setTimeout(() => {
      nextBlurMessage(true);
    }, delay);
  });

  window.addEventListener('focus', () => {
    clearTimeout(timer);
    document.title = origTitle;
  });
})();
