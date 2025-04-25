// src/utils/api.js
class JsonRpcClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.authToken = 'Bearer Vmg2ir22VwGc4WEEq';
    }

    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    async request(method, params = {}, options = {}) {
        const requestBody = {
            id: this.generateRequestId(),
            jsonrpc: "2.0",
            method: method,
            params: params
        };

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.authToken,
                    ...options.headers
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            // Обработка ошибок JSON-RPC
            if (responseData.error) {
                throw new Error(responseData.error.message);
            }

            return responseData.result;
        } catch (error) {
            console.error(`Error in ${method} request:`, error);
            throw error;
        }
    }
}

// Создаем экземпляр клиента
const apiClient = new JsonRpcClient('https://api-sberhealth.gorclinica.ru/medods-extension/1.0/');

// Создаем сервисы для разных типов API-запросов
export const medicationService = {
    getAvailableMedications: async (serviceId) => {
        return apiClient.request('getAvailableMedications', { serviceId });
    },
    createMedication: async (medicationData) => {
        return apiClient.request('createMedication', medicationData);
    },
    // Универсальный метод для кэширования результатов запросов
    cachedRequest: (() => {
        const cache = {};
        return async (method, params = {}, cacheTime = 60000) => {
            const cacheKey = `${method}_${JSON.stringify(params)}`;
            
            // Если результат в кэше и не устарел
            if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < cacheTime)) {
                return cache[cacheKey].data;
            }
            
            // Иначе делаем запрос
            const result = await apiClient.request(method, params);
            
            // Кэшируем результат
            cache[cacheKey] = {
                data: result,
                timestamp: Date.now()
            };
            
            return result;
        };
    })()
};

export const treatmentService = {
    getSchematicsForService: function() {
        const cache = {};
        let activeRequests = {};
        
        return async function(serviceId) {
            const cacheKey = `getSchematics_${serviceId}`;
            
            // Если уже есть активный запрос с таким же ключом, возвращаем его Promise
            if (activeRequests[cacheKey]) {
                return activeRequests[cacheKey];
            }
            
            // Если результат в кэше и не устарел (кэш действителен 1 минуту)
            const cacheTime = 1000; // 1 минута
            if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < cacheTime)) {
                return cache[cacheKey].data;
            }

            const requestPromise = apiClient.request('getSchematics', { serviceId })
                .then(result => {
                    cache[cacheKey] = {
                        data: result,
                        timestamp: Date.now()
                    };
                    
                    delete activeRequests[cacheKey];
                    
                    return result;
                })
                .catch(error => {
                    delete activeRequests[cacheKey];
                    throw error;
                });
            
            activeRequests[cacheKey] = requestPromise;
            
            return requestPromise;
        };
    }(),
    saveSchematic: async (schematicData) => {
        return apiClient.request('saveSchematic', { 
            serviceId: schematicData.createdFor.serviceId,
            medicalCardId: schematicData.createdFor.medicalCardId,
            schematic: schematicData
        });
    }
};

// Экспортируем сам клиент для случаев, когда нужно вызвать произвольный метод
export { apiClient };