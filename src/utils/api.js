class JsonRpcClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
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
                    'Authorization': 'Bearer Vmg2ir22VwGc4WEEq',
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

export const apiClient = new JsonRpcClient('https://api-sberhealth.gorclinica.ru/medods-extension/1.0/');