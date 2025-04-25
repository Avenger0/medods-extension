// src/utils/versionCheck.js
import { apiClient } from './api.js';

const VERSION_CACHE_KEY = 'medods_extension_version_check';
const CACHE_DURATION = 10000; // 1 минута в миллисекундах

export default class VersionChecker {
    constructor(currentVersion) {
        this.currentVersion = currentVersion;
        this.lastCheckTime = 0;
        this.isOutdated = false;
        this.latestVersion = null;
        this.errorMessage = null;
        
        // Пытаемся восстановить кеш из localStorage
        this._loadFromCache();
    }
    
    async checkVersion() {
        const now = Date.now();
        
        // Проверяем, не прошло ли слишком мало времени с последней проверки
        if (now - this.lastCheckTime < CACHE_DURATION) {
            return {
                isOutdated: this.isOutdated,
                latestVersion: this.latestVersion,
                currentVersion: this.currentVersion,
                errorMessage: this.errorMessage
            };
        }
        
        try {
            // Запрос к API для проверки версии
            const result = await apiClient.request('getLatestVersion', {});
            
            if (result && result.version) {
                this.latestVersion = result.version;
                this.isOutdated = this._compareVersions(this.currentVersion, this.latestVersion) < 0;
                this.errorMessage = null;
                this.lastCheckTime = now;
                
                // Сохраняем результат в кеш
                this._saveToCache();
                
                return {
                    isOutdated: this.isOutdated,
                    latestVersion: this.latestVersion,
                    currentVersion: this.currentVersion,
                    errorMessage: null
                };
            } else {
                throw new Error('Некорректный ответ от сервера');
            }
        } catch (error) {
            console.error('Ошибка при проверке версии:', error);
            this.errorMessage = error.message || 'Ошибка при проверке версии';
            
            // В случае ошибки используем кешированные данные, если они есть
            return {
                isOutdated: this.isOutdated,
                latestVersion: this.latestVersion,
                currentVersion: this.currentVersion,
                errorMessage: this.errorMessage
            };
        }
    }
    
    // Сравнивает версии в формате YYYY.MM.DD
    _compareVersions(v1, v2) {
        // Преобразуем строки версий в массивы чисел
        const v1Parts = v1.split('.').map(Number);
        const v2Parts = v2.split('.').map(Number);
        
        // Сравниваем компоненты версий
        for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
            const part1 = v1Parts[i] || 0;
            const part2 = v2Parts[i] || 0;
            
            if (part1 < part2) return -1;
            if (part1 > part2) return 1;
        }
        
        return 0; // Версии равны
    }
    
    _saveToCache() {
        try {
            const cacheData = {
                lastCheckTime: this.lastCheckTime,
                isOutdated: this.isOutdated,
                latestVersion: this.latestVersion,
                currentVersion: this.currentVersion
            };
            
            localStorage.setItem(VERSION_CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            console.error('Ошибка при сохранении кеша версии:', e);
        }
    }
    
    _loadFromCache() {
        try {
            const cachedData = localStorage.getItem(VERSION_CACHE_KEY);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                
                this.lastCheckTime = data.lastCheckTime || 0;
                this.isOutdated = data.isOutdated || false;
                this.latestVersion = data.latestVersion || null;
                
                // Проверяем, не устарел ли кеш
                if (Date.now() - this.lastCheckTime > CACHE_DURATION) {
                    this._clearCache();
                }
            }
        } catch (e) {
            console.error('Ошибка при загрузке кеша версии:', e);
            this._clearCache();
        }
    }
    
    _clearCache() {
        this.lastCheckTime = 0;
        this.isOutdated = false;
        this.latestVersion = null;
        
        try {
            localStorage.removeItem(VERSION_CACHE_KEY);
        } catch (e) {
            console.error('Ошибка при очистке кеша версии:', e);
        }
    }
}