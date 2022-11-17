console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

const setComicSans = async (value = null) => {
  const { COMIC_SANS } = await chrome.storage.sync.get(['COMIC_SANS']);
  const isEnabled = value ? value : COMIC_SANS || false;
  if (isEnabled) {
    document.body.style.fontFamily =
      '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif';
  } else {
    document.body.style.fontSize = '';
    document.body.style.fontFamily = '';
  }
};

const setNpeExit = async (value = null) => {
  const proposalHeaderEl = document.querySelector(
    '[data-testid="proposal-header"]'
  );

  if (!proposalHeaderEl) {
    return;
  }

  const { NPE_EXIT } = await chrome.storage.sync.get(['NPE_EXIT']);
  const isEnabled = value ? value : NPE_EXIT || false;
  if (isEnabled) {
    const closeButtonEl = document.createElement('a');
    closeButtonEl.id = 'npe-exit-button';
    closeButtonEl.href = '/dashboard';
    closeButtonEl.innerHTML = '⨯';
    closeButtonEl.title = 'Close the NPE';
    closeButtonEl.className = 'npe-exit-button';
    proposalHeaderEl.firstChild.prepend(closeButtonEl);
  } else {
    const closeButtonEl = document.getElementById('npe-exit-button');
    if (closeButtonEl) {
      closeButtonEl.parentNode.removeChild(closeButtonEl);
    }
  }
};

(async () => {
  await setComicSans();
  window.addEventListener('load', () => {
    setTimeout(async () => {
      await setNpeExit();
    }, 1000);
  });
})();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { type, value } = request;

  if (type === 'COMIC_SANS') {
    await setComicSans(value);
  }

  if (type === 'NPE_EXIT') {
    await setNpeExit(value);
  }
});
