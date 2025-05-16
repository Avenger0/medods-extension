export function observeUrlChanges(callback) {
  console.log('👀 SPA URL Observer запущен');
  let currentUrl = location.href;
  let currentPath = location.pathname;
  
  console.log('📍 Текущий URL при инициализации:', currentUrl);

  // Более мощная функция проверки URL
  function checkUrlChange() {
    const newUrl = location.href;
    const newPath = location.pathname;
    
    if (newUrl !== currentUrl || newPath !== currentPath) {
      const oldUrl = currentUrl;
      currentUrl = newUrl;
      currentPath = newPath;
      console.log('🔁 URL изменился:', oldUrl, ' -> ', currentUrl);
      callback();
    }
  }

  // Переопределение истории и попстейт уже реализованы
  ['pushState', 'replaceState'].forEach(fn => {
    const orig = history[fn];
    history[fn] = function (...args) {
      orig.apply(this, args);
      checkUrlChange();
    };
  });

  window.addEventListener('popstate', checkUrlChange);
  
  // Добавляем отслеживание хэша
  window.addEventListener('hashchange', checkUrlChange);
  
  // Интервальная проверка URL для отлова Vue-навигации
  const urlCheckInterval = setInterval(checkUrlChange, 500);
  
  // Vue часто использует собственную навигацию через теги <a>
  // Добавим отслеживание кликов для раннего обнаружения навигации
  document.addEventListener('click', event => {
    // Проверяем, был ли клик на ссылке
    const link = event.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      console.log('🔗 Клик по внутренней ссылке:', link.href);
      // Даем Vue время обработать навигацию, а затем проверяем URL
      setTimeout(checkUrlChange, 50);
      setTimeout(checkUrlChange, 200);
      setTimeout(checkUrlChange, 500);
    }
  }, true);
  
  // Обработка изменений DOM - уже реализована
  const observer = new MutationObserver(() => {
    setTimeout(checkUrlChange, 100);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true, // Добавляем наблюдение за атрибутами
    attributeFilter: ['class', 'style', 'aria-hidden'] // Атрибуты, которые часто меняются при переходах в Vue
  });
  
  // Первоначальная проверка
  callback();
  
  // Возвращаем функцию очистки
  return function cleanup() {
    clearInterval(urlCheckInterval);
    observer.disconnect();
    window.removeEventListener('hashchange', checkUrlChange);
    window.removeEventListener('popstate', checkUrlChange);
  };
}