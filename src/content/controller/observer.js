export function observeUrlChanges(callback) {
  console.log('👀 SPA URL Observer запущен');
  let currentUrl = location.href;

  function checkUrlChange() {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      console.log('🔁 URL изменился:', currentUrl);
      callback();
    }
  }

  ['pushState', 'replaceState'].forEach(fn => {
    const orig = history[fn];
    history[fn] = function (...args) {
      orig.apply(this, args);
      checkUrlChange();
    };
  });

  window.addEventListener('popstate', checkUrlChange);
  callback();
}