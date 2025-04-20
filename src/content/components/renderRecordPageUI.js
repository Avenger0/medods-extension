import IntegratedTreatmentSchemeButton from '../../ui/IntegratedTreatmentSchemeButton.svelte';

const TARGET_SELECTOR = '#show_info_table_title';
const TREATMENT_SCHEME_ID = 'treatment-scheme-container';

// Единый объект конфигурации и состояния
const state = {
  mounted: false,
  intervalId: null,
  currentPath: null,
  currentRecordId: null,
  currentPatientId: null,
  
  debug: true,
  instanceId: Math.random().toString(36).substring(2, 9),

  styleConfigs: {
    // Пример стилизации для одного учреждения
    'clinic1': {
      mainButtonBgColor: '#4CAF50', // Зеленый
      mainButtonTextColor: 'white',
      schemesBgColor: '#f0f8ff', // Светло-голубой фон
      schemesTitleColor: '#2c3e50',
      useButtonBgColor: '#3498db', // Синий
      editButtonBgColor: '#9b59b6', // Фиолетовый
      createButtonBgColor: '#4CAF50', // Красный
    }
  },
  
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
 * Полностью удаляет компоненты и освобождает ресурсы
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
  const treatmentSchemeElement = document.getElementById(TREATMENT_SCHEME_ID);
  
  if (treatmentSchemeElement) {
    treatmentSchemeElement.remove();
    state.log('unmount', 'Компонент TreatmentSchemeButton удален из DOM');
  }
  
  // Сбрасываем состояние
  state.mounted = false;
}

/**
 * Проверяет необходимость и возможность монтирования компонентов
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
    state.currentPatientId = urlInfo.patientId;
    
    // При смене записи всегда удаляем компоненты
    if (state.mounted) {
      state.log('action', 'Удаляем компоненты из-за смены записи');
      cleanup();
    }
  }
  
  // Проверка наличия элементов
  const targetElement = document.querySelector(TARGET_SELECTOR);
  const existingTreatmentSchemeButton = document.getElementById(TREATMENT_SCHEME_ID);
  
  // Логируем текущую ситуацию
  state.log('check', `Состояние: запись=${urlInfo.isRecordPage}, целевой_элемент=${!!targetElement}, mounted=${state.mounted}`);
  
  // Синхронизируем состояние с реальным DOM
  if (!existingTreatmentSchemeButton && state.mounted) {
    state.log('warn', 'Компонент исчез из DOM, но состояние не обновлено');
    state.mounted = false;
  }
  
  // Основная логика монтирования
  if (urlInfo.isRecordPage && targetElement) {
    if (!existingTreatmentSchemeButton) {
      // Создаем новый компонент TreatmentSchemeButton
      state.log('mount', 'Монтируем компонент TreatmentSchemeButton');
      
      const treatmentSchemeContainer = document.createElement('div');
      treatmentSchemeContainer.id = TREATMENT_SCHEME_ID;
      
      targetElement.appendChild(treatmentSchemeContainer);
      
      try {
        // Создаем экземпляр компонента с настройками стилей
        new IntegratedTreatmentSchemeButton({ 
          target: treatmentSchemeContainer,
          props: {
            serviceId: urlInfo.recordId,
            medicalCardId: urlInfo.patientId,
            // Передаем настройки стилей
            ...state.styleConfigs.clinic1
          }
        });
        state.log('success', 'Компонент TreatmentSchemeButton успешно смонтирован');
        state.mounted = true;
      } catch (err) {
        state.log('error', 'Ошибка при монтировании TreatmentSchemeButton:', err);
        treatmentSchemeContainer.remove();
      }
    }
  } else if (!urlInfo.isRecordPage && (existingTreatmentSchemeButton || state.mounted)) {
    // Не на странице записи, но компонент есть - удаляем
    state.log('action', 'Не страница записи - удаляем компонент');
    cleanup();
  }
}

/**
 * Основная функция инициализации компонентов
 * @returns {Function} Функция для очистки ресурсов
 */
export function renderUIForRecordPage() {
  state.log('start', 'Инициализация компонентов');
  
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
  state.currentPatientId = urlInfo.patientId;
  
  // Выполняем первоначальную проверку
  checkAndMountIfNeeded(true);
  
  // Устанавливаем интервал для регулярных проверок
  state.intervalId = setInterval(() => {
    state.log('timer', 'Регулярная проверка по интервалу');
    checkAndMountIfNeeded();
  }, 1000);
  
  state.log('success', 'Интервал установлен, ID:', state.intervalId);
  
  // Возвращаем функцию очистки
  return cleanup;
}

// Обработчики навигации (остаются без изменений)
function setupNavigationListeners() {
  // Существующая логика обработки навигации
  ['pushState', 'replaceState'].forEach(fn => {
    const orig = history[fn];
    history[fn] = function() {
      orig.apply(this, arguments);
      state.log('route', `Обнаружен ${fn}`);
      scheduleChecks();
    };
  });
  
  window.addEventListener('popstate', () => {
    state.log('route', 'Обнаружен popstate');
    scheduleChecks();
  });
  
  // Observers и другая логика навигации
}

function scheduleChecks() {
  const intervals = [10, 50, 100, 250, 500, 1000, 1500];
  
  intervals.forEach((delay, index) => {
    setTimeout(() => {
      state.log('timer', `Запланированная проверка #${index + 1} (${delay}ms)`);
      checkAndMountIfNeeded(true);
    }, delay);
  });
}

// Обработчик выгрузки страницы
window.addEventListener('beforeunload', cleanup);

// Автоматическая инициализация при загрузке модуля
state.log('info', 'Модуль загружен');
checkAndMountIfNeeded(true);