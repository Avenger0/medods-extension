import { observeUrlChanges } from './observer.js';
import { renderUIForRecordPage } from '../components/renderRecordPageUI.js';

export function startRouter() {
  console.log('📡 Router запущен');
  let currentMatch = null;
  let cleanupObserver = null;
  
  // Функция для проверки маршрутов с регулярными выражениями в pathname и search
  function checkRoutes() {
    const path = window.location.pathname;
    const fullPath = path + window.location.search;
    
    console.log('🧭 Проверка маршрутов для пути:', fullPath);
    
    // Проверяем каждый маршрут отдельно
    routes.forEach((route, index) => {
      // Проверяем как pathname, так и fullPath для большей гибкости
      const matchesPath = route.match.test(path);
      const matchesFull = route.matchFull ? route.matchFull.test(fullPath) : false;
      const matches = matchesPath || matchesFull;
      
      console.log(`📍 Маршрут ${index}: ${route.match} -> ${matches ? 'совпадение' : 'нет совпадения'}`);
    });
    
    // Находим подходящий маршрут, проверяя и путь, и полный URL
    const match = routes.find(r => {
      return r.match.test(path) || (r.matchFull && r.matchFull.test(fullPath));
    });
    
    console.log('📌 Итоговый найденный роут:', match?.match);
    
    if (match !== currentMatch) {
      // Если предыдущий маршрут был активен, вызовем cleanup-функцию
      if (currentMatch && currentMatch.cleanup) {
        console.log('🧹 Очистка предыдущего маршрута:', currentMatch.match);
        currentMatch.cleanup();
      }
      
      currentMatch = match;
      
      // Сохраняем функцию очистки, которую возвращает render
      if (match) {
        console.log('🔄 Рендеринг компонента для маршрута:', match.match);
        match.cleanup = match.render();
      }
    }
  }
  
  // Обновляем определение маршрутов, добавляя проверку полного URL с параметрами
  const routes = [
    { 
      match: /\/medical_records\/\d+\/\d+/, 
      // Добавляем отдельный тест для полного URL с параметрами
      matchFull: /\/medical_records\/\d+\/\d+(\?.*)?$/,
      render: renderUIForRecordPage 
    },
    { 
      match: /\/entries\/\d+/, 
      matchFull: /\/entries\/\d+(\?.*)?$/,
      render: renderUIForRecordPage 
    }
  ];
  
  // Запускаем наш наблюдатель URL
  if (cleanupObserver) {
    cleanupObserver();
  }
  cleanupObserver = observeUrlChanges(checkRoutes);
  
  // Vue router иногда инициализируется с задержкой
  // Добавим проверки при загрузке страницы
  setTimeout(checkRoutes, 1000);
  setTimeout(checkRoutes, 3000);
}

// Добавьте следующий код в функцию startRouter() в router.js
// перед возвратом

// Пытаемся отследить события vue-router, если он присутствует
function monitorVueRouter() {
  // Ждём, пока Vue полностью загрузится
  setTimeout(() => {
    try {
      // Vue часто хранит экземпляр приложения в __vue__ или _vueApp
      const appElement = document.querySelector('#app') || document.querySelector('[data-v-app]');
      if (appElement && (appElement.__vue__ || appElement._vueApp)) {
        console.log('📱 Vue приложение обнаружено, пытаемся отследить router');
        
        // Проверка через globalProperties в Vue 3
        if (appElement._vueApp && appElement._vueApp.config && appElement._vueApp.config.globalProperties) {
          const router = appElement._vueApp.config.globalProperties.$router;
          if (router) {
            console.log('🛣️ Vue Router обнаружен');
            router.afterEach(() => {
              console.log('🔄 Vue Router событие afterEach');
              checkRoutes();
            });
          }
        }
        
        // Для Vue 2
        if (appElement.__vue__ && appElement.__vue__.$router) {
          console.log('🛣️ Vue 2 Router обнаружен');
          appElement.__vue__.$router.afterEach(() => {
            console.log('🔄 Vue 2 Router событие afterEach');
            checkRoutes();
          });
        }
      }
    } catch (e) {
      console.error('Ошибка при попытке мониторинга Vue Router:', e);
    }
  }, 2000); // Даём Vue время загрузиться
}

monitorVueRouter();