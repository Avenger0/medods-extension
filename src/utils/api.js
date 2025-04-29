// src/utils/api.js
import { CacheManager, RequestManager } from "./cache.js";
import { apiConfig } from "./apiConfig.js";

class JsonRpcClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        const token =
            import.meta.env.MEDODS_API_TOKEN || "DefaultTokenForDevelopment";
            
        this.authToken = `Bearer ${token}`;

        // Инициализируем менеджер кэша
        this.cacheManager = new CacheManager({
            defaultTTL: apiConfig.cache.defaultTTL,
        });

        // Инициализируем менеджер запросов
        this.requestManager = new RequestManager();
    }

    generateRequestId() {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    async request(method, params = {}, options = {}) {
        const requestBody = {
            id: this.generateRequestId(),
            jsonrpc: "2.0",
            method: method,
            params: params,
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.authToken,
                    ...options.headers,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            if (responseData.error) {
                throw new Error(responseData.error.message);
            }

            return responseData.result;
        } catch (error) {
            console.error(`Error in ${method} request:`, error);
            throw error;
        }
    }

    /**
     * Выполнить запрос с кэшированием
     * @param {string} method - Метод API
     * @param {Object} params - Параметры запроса
     * @param {Object} options - Дополнительные опции
     * @returns {Promise<any>} - Результат запроса
     */
    async cachedRequest(method, params = {}, options = {}) {
        const cacheKey = `${method}_${JSON.stringify(params)}`;
        const ttl = options.ttl || apiConfig.cache.defaultTTL;

        // Проверяем кэш
        const cachedData = this.cacheManager.get(cacheKey);
        if (cachedData !== null) {
            return cachedData;
        }

        // Проверяем, есть ли уже активный запрос с таким ключом
        const activeRequest = this.requestManager.getActiveRequest(cacheKey);
        if (activeRequest) {
            return activeRequest;
        }

        // Выполняем запрос и регистрируем его
        const promise = this.request(method, params, options).then((result) => {
            // Сохраняем результат в кэш
            return this.cacheManager.set(cacheKey, result, ttl);
        });

        // Регистрируем активный запрос
        return this.requestManager.register(cacheKey, promise);
    }

    /**
     * Инвалидировать кэш для определенного метода
     * @param {string} method - Метод API
     */
    invalidateCache(method) {
        this.cacheManager.invalidateByPattern(new RegExp(`^${method}_`));
    }
}

// Создаем экземпляр клиента, используя URL из конфигурации
const apiClient = new JsonRpcClient(apiConfig.baseUrl);

// Переписанный medicationService
export const medicationService = {
    /**
     * Получить доступные медикаменты
     * @param {string} serviceId - ID сервиса
     * @returns {Promise<Object>} - Список медикаментов
     */
    getAvailableMedications: async (serviceId) => {
        return apiClient.cachedRequest("getAvailableMedications", {
            serviceId,
        });
    },

    /**
     * Создать новый медикамент
     * @param {Object} medicationData - Данные медикамента
     * @returns {Promise<Object>} - Результат создания
     */
    createMedication: async (medicationData) => {
        // После создания нового медикамента инвалидируем кэш списка
        const result = await apiClient.request(
            "createMedication",
            medicationData
        );
        apiClient.invalidateCache("getAvailableMedications");
        return result;
    },

    /**
     * Универсальный метод для кэширования запросов
     * @param {string} method - Метод API
     * @param {Object} params - Параметры
     * @param {number} ttl - Время жизни кэша в мс
     * @returns {Promise<any>} - Результат запроса
     */
    cachedRequest: async (
        method,
        params = {},
        ttl = apiConfig.cache.defaultTTL
    ) => {
        return apiClient.cachedRequest(method, params, { ttl });
    },
};

// Переписанный treatmentService
export const treatmentService = {
    /**
     * Получить схемы лечения для сервиса
     * @param {string} serviceId - ID сервиса
     * @returns {Promise<Object>} - Список схем лечения
     */
    getSchematicsForService: async (serviceId) => {
        return apiClient.cachedRequest(
            "getSchematics",
            { serviceId },
            {
                ttl: apiConfig.cache.schematics.ttl,
            }
        );
    },

    /**
     * Сохранить схему лечения
     * @param {Object} schematicData - Данные схемы
     * @returns {Promise<Object>} - Результат сохранения
     */
    saveSchematic: async (schematicData) => {
        const params = {
            serviceId: schematicData.createdFor.serviceId,
            medicalCardId: schematicData.createdFor.medicalCardId,
            schematic: schematicData,
        };

        // После сохранения схемы инвалидируем кэш схем для этого сервиса
        const result = await apiClient.request("saveSchematic", params);
        apiClient.invalidateCache("getSchematics");
        return result;
    },
};

// Добавляем новый сервис для процедур
export const procedureService = {
    /**
     * Получить список доступных типов процедур
     * @returns {Promise<Object>} - Список типов процедур
     */
    getAvailableProcedureTypes: async () => {
        return apiClient.cachedRequest("getAvailableProcedureTypes", {}, {
            ttl: apiConfig.cache.defaultTTL
        });
    },

    /**
     * Получить настройки процедуры определенного типа
     * @param {string} procedureType - Тип процедуры
     * @returns {Promise<Object>} - Настройки процедуры
     */
    getProcedureSettings: async (procedureType) => {
        return apiClient.cachedRequest("getProcedureSettings", { 
            procedureType 
        }, {
            ttl: apiConfig.cache.defaultTTL
        });
    },

    /**
     * Универсальный метод для кэширования запросов процедур
     * @param {string} method - Метод API
     * @param {Object} params - Параметры
     * @param {number} ttl - Время жизни кэша в мс
     * @returns {Promise<any>} - Результат запроса
     */
    cachedRequest: async (
        method,
        params = {},
        ttl = apiConfig.cache.defaultTTL
    ) => {
        return apiClient.cachedRequest(method, params, { ttl });
    },
};

export { apiClient };
