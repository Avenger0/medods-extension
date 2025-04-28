// src/utils/cache.js
export class CacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.options = {
            defaultTTL: 60000, // 1 минута по умолчанию
            ...options,
        };
    }

    /**
     * Получить значение из кэша
     * @param {string} key - Ключ кэша
     * @returns {any|null} - Данные из кэша или null, если кэш отсутствует или истек
     */
    get(key) {
        if (!this.cache.has(key)) return null;

        const { data, timestamp, ttl } = this.cache.get(key);

        // Проверка на истекшее время жизни кэша
        if (Date.now() - timestamp > ttl) {
            this.delete(key);
            return null;
        }

        return data;
    }

    /**
     * Сохранить значение в кэш
     * @param {string} key - Ключ кэша
     * @param {any} data - Данные для кэширования
     * @param {number} [ttl] - Время жизни кэша в миллисекундах
     */
    set(key, data, ttl = this.options.defaultTTL) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
        return data;
    }

    /**
     * Удалить значение из кэша
     * @param {string} key - Ключ кэша
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Проверить, есть ли ключ в кэше и не истек ли он
     * @param {string} key - Ключ кэша
     * @returns {boolean} - true, если кэш существует и не истек
     */
    has(key) {
        if (!this.cache.has(key)) return false;

        const { timestamp, ttl } = this.cache.get(key);
        return Date.now() - timestamp <= ttl;
    }

    /**
     * Очистить весь кэш
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Очистить устаревшие записи кэша
     */
    clearExpired() {
        for (const [key, { timestamp, ttl }] of this.cache.entries()) {
            if (Date.now() - timestamp > ttl) {
                this.delete(key);
            }
        }
    }

    /**
     * Инвалидировать кэш по шаблону ключа
     * @param {RegExp} pattern - Регулярное выражение для поиска ключей
     */
    invalidateByPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.delete(key);
            }
        }
    }
}

// Активные запросы для дедупликации
export class RequestManager {
    constructor() {
        this.activeRequests = new Map();
    }

    /**
     * Регистрация нового запроса
     * @param {string} key - Уникальный ключ запроса
     * @param {Promise} promise - Promise запроса
     * @returns {Promise} - Promise запроса
     */
    register(key, promise) {
        this.activeRequests.set(key, promise);

        // Автоматически удаляем запрос из активных по завершении
        promise.finally(() => {
            if (this.activeRequests.get(key) === promise) {
                this.activeRequests.delete(key);
            }
        });

        return promise;
    }

    /**
     * Проверка, есть ли активный запрос с таким ключом
     * @param {string} key - Ключ запроса
     * @returns {Promise|null} - Promise запроса или null
     */
    getActiveRequest(key) {
        return this.activeRequests.get(key) || null;
    }

    /**
     * Отмена всех активных запросов
     */
    cancelAll() {
        this.activeRequests.clear();
    }
}
