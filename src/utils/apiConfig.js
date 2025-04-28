// src/utils/apiConfig.js
export const apiConfig = {
    baseUrl: "https://api-sberhealth.gorclinica.ru/medods-extension/1.0/",

    // Кэширование
    cache: {
        defaultTTL: 60000, // 1 минута
        schematics: {
            ttl: 1000, // 1 секунда для схем лечения
        },
    },

    // Таймауты
    timeouts: {
        request: 30000, // 30 секунд для запроса
    },

    // Максимальное количество повторных попыток
    maxRetries: 3,
};

/**
 * Функция для переопределения конфигурации
 * @param {Object} customConfig - Пользовательская конфигурация
 */
export function configureApi(customConfig) {
    Object.assign(apiConfig, customConfig);
}
