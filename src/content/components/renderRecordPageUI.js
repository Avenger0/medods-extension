import RecordButton from '../../ui/RecordButton.svelte';
const TARGET_SELECTOR = '#show_info_table_title';
const ELEMENT_ID = 'record-button-container';

// Единый объект конфигурации и состояния
const state = {
  // Основные переменные состояния
  mounted: false,
  intervalId: null,
  currentPath: null,
  currentRecordId: null,
  
  // Отладочная информация
  debug: true,
  instanceId: Math.random().toString(36).substring(2, 9),
  
  // Функция для вывода отладочной информации
  log(type, message, ...data) {
    if (!this.debug) return;
    
    const icons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      start: '🚀',
      action: '🔄',
      timer: '⏱️',
      mount: '📌',
      unmount: '🗑️',
      route: '🧭',
      check: '🔍'
    };
    
    const icon = icons[type] || '📝';
    console.log(`${icon} [RecordBtn-${this.instanceId}] ${message}`, ...data);
  }
};

/**
 * Извлекает ID записи из URL
 * @param {string} url - URL для анализа
 * @returns {object} - Объект с информацией о странице
 */
function parseUrl(url) {
  const parsedUrl = new URL(url, window.location.origin);
  const path = parsedUrl.pathname;
  
  // Регулярное выражение для извлечения ID записи
  const match = path.match(/\/medical_records\/(\d+)\/(\d+)/);
  
  return {
    isRecordPage: !!match,
    patientId: match ? match[1] : null,
    recordId: match ? match[2] : null,
    fullPath: path + parsedUrl.search,
    params: parsedUrl.searchParams
  };
}

/**
 * Полностью удаляет компонент и освобождает ресурсы
 */
function cleanup() {
  state.log('action', 'Запущена процедура очистки');
  
  // Очищаем интервал
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.log('unmount', 'Интервал остановлен:', state.intervalId);
    state.intervalId = null;
  }
  
  // Удаляем компонент из DOM
  const existingElement = document.getElementById(ELEMENT_ID);
  if (existingElement) {
    existingElement.remove();
    state.log('unmount', 'Компонент удален из DOM');
  }
  
  // Сбрасываем состояние
  state.mounted = false;
}

/**
 * Проверяет необходимость и возможность монтирования компонента
 * @param {boolean} force - Принудительная проверка
 */
function checkAndMountIfNeeded(force = false) {
  const urlInfo = parseUrl(window.location.href);
  state.log('check', 'Проверка страницы:', urlInfo);
  
  // Проверка изменения ID записи
  const recordIdChanged = urlInfo.recordId !== state.currentRecordId;
  if (recordIdChanged) {
    state.log('route', `Изменился ID записи: ${state.currentRecordId || 'none'} -> ${urlInfo.recordId || 'none'}`);
    state.currentRecordId = urlInfo.recordId;
    
    // При смене записи всегда удаляем компонент
    if (state.mounted) {
      state.log('action', 'Удаляем компонент из-за смены записи');
      cleanup();
    }
  }
  
  // Проверка наличия элементов
  const targetElement = document.querySelector(TARGET_SELECTOR);
  const existingButton = document.getElementById(ELEMENT_ID);
  
  // Логируем текущую ситуацию
  state.log('check', `Состояние: запись=${urlInfo.isRecordPage}, целевой_элемент=${!!targetElement}, компонент=${!!existingButton}, mounted=${state.mounted}`);
  
  // Синхронизируем состояние с реальным DOM
  if (!existingButton && state.mounted) {
    state.log('warn', 'Компонент исчез из DOM, но состояние не обновлено');
    state.mounted = false;
  }
  
  // Основная логика монтирования
  if (urlInfo.isRecordPage && targetElement) {
    if (!existingButton) {
      // Создаем новый компонент
      state.log('mount', 'Монтируем компонент для записи:', urlInfo.recordId);
      
      const container = document.createElement('div');
      container.id = ELEMENT_ID;
      container.setAttribute('data-record-id', urlInfo.recordId);
      container.setAttribute('data-instance', state.instanceId);
      container.setAttribute('data-timestamp', Date.now());
      
      targetElement.appendChild(container);
      
      try {
        new RecordButton({ target: container });
        state.mounted = true;
        state.log('success', 'Компонент успешно смонтирован');
      } catch (err) {
        state.log('error', 'Ошибка при монтировании компонента:', err);
        container.remove();
      }
    } else {
      // Проверяем, соответствует ли существующий компонент текущей записи
      const componentRecordId = existingButton.getAttribute('data-record-id');
      if (componentRecordId !== urlInfo.recordId) {
        state.log('warn', `Компонент принадлежит другой записи (${componentRecordId} vs ${urlInfo.recordId})`);
        cleanup();
        // Повторно запускаем проверку после очистки
        setTimeout(() => checkAndMountIfNeeded(true), 10);
      } else {
        state.log('info', 'Компонент уже смонтирован для этой записи');
      }
    }
  } else if (!urlInfo.isRecordPage && (existingButton || state.mounted)) {
    // Не на странице записи, но компонент есть - удаляем
    state.log('action', 'Не страница записи - удаляем компонент');
    cleanup();
  }
}

/**
 * Запускает серию проверок DOM с возрастающими интервалами
 * Полезно после изменения URL, когда DOM может обновляться с задержкой
 */
function scheduleChecks() {
  // Серия проверок с увеличивающимися интервалами
  const intervals = [10, 50, 100, 250, 500, 1000, 1500];
  
  intervals.forEach((delay, index) => {
    setTimeout(() => {
      state.log('timer', `Запланированная проверка #${index + 1} (${delay}ms)`);
      checkAndMountIfNeeded(true);
    }, delay);
  });
}

/**
 * Настраивает все обработчики событий для отслеживания навигации
 */
function setupNavigationListeners() {
  // 1. Обработчик изменения URL через History API
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    state.log('route', 'Обнаружен pushState');
    scheduleChecks();
  };
  
  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    state.log('route', 'Обнаружен replaceState');
    scheduleChecks();
  };
  
  // 2. Обработчик навигации назад/вперёд
  window.addEventListener('popstate', () => {
    state.log('route', 'Обнаружен popstate');
    scheduleChecks();
  });
  
  // 3. Отслеживание изменений URL через MutationObserver
  const urlObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    const urlInfo = parseUrl(currentUrl);
    
    if (urlInfo.fullPath !== state.currentPath) {
      state.log('route', `Обнаружено изменение URL: ${state.currentPath || 'initial'} -> ${urlInfo.fullPath}`);
      state.currentPath = urlInfo.fullPath;
      scheduleChecks();
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });
  
  // 4. Обработчик кликов по ссылкам
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.includes('/medical_records/')) {
      state.log('route', 'Клик по ссылке записи:', link.href);
      scheduleChecks();
    }
  });
  
  // 5. Обработчик изменений в DOM - ищем целевой элемент
  const domObserver = new MutationObserver((mutations) => {
    const urlInfo = parseUrl(window.location.href);
    if (urlInfo.isRecordPage && !document.getElementById(ELEMENT_ID)) {
      // Проверяем, появился ли целевой элемент
      const targetElement = document.querySelector(TARGET_SELECTOR);
      if (targetElement) {
        state.log('action', 'DOM Observer: обнаружен целевой элемент');
        checkAndMountIfNeeded(true);
      }
    }
  });
  
  domObserver.observe(document.body, { childList: true, subtree: true });
  
  state.log('success', 'Все обработчики навигации настроены');
}

/**
 * Основная функция инициализации компонента
 * @returns {Function} Функция для очистки ресурсов
 */
export function renderUIForRecordPage() {
  state.log('start', 'Инициализация компонента RecordButton');
  
  // Очищаем предыдущие ресурсы при повторном вызове
  cleanup();
  
  // Устанавливаем обработчики только один раз
  if (!window._recordButtonListenersInitialized) {
    setupNavigationListeners();
    window._recordButtonListenersInitialized = true;
  }
  
  // Запоминаем текущий путь
  const urlInfo = parseUrl(window.location.href);
  state.currentPath = urlInfo.fullPath;
  state.currentRecordId = urlInfo.recordId;
  
  // Выполняем первоначальную проверку
  checkAndMountIfNeeded(true);
  
  // Устанавливаем интервал для регулярных проверок
  state.intervalId = setInterval(() => {
    state.log('timer', 'Регулярная проверка по интервалу');
    checkAndMountIfNeeded();
  }, 1000);
  
  state.log('success', 'Интервал установлен, ID:', state.intervalId);
  
  // Запускаем дополнительные проверки для надежности
  scheduleChecks();
  
  // Возвращаем функцию очистки
  return cleanup;
}

// Обработчик выгрузки страницы
window.addEventListener('beforeunload', cleanup);

// Автоматическая инициализация при загрузке модуля
state.log('info', 'Модуль загружен');
checkAndMountIfNeeded(true);