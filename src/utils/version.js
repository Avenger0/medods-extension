// src/utils/version.js

// Жестко закодированная версия, которая будет обновляться скриптами сборки
export const appVersion = {
    // Версия в формате YYYY.MM.DD
    version: '2025.04.26',

    // Метод для получения текущей версии в виде строки
    toString() {
        return this.version;
    },

    // Разбивает версию на компоненты
    getParts() {
        return this.version.split(".").map(Number);
    },

    // Сравнивает с другой версией
    compareTo(otherVersion) {
        const currentParts = this.getParts();
        const otherParts = otherVersion.split(".").map(Number);

        for (
            let i = 0;
            i < Math.max(currentParts.length, otherParts.length);
            i++
        ) {
            const current = currentParts[i] || 0;
            const other = otherParts[i] || 0;

            if (current < other) return -1;
            if (current > other) return 1;
        }

        return 0;
    },

    // Проверяет, устарела ли текущая версия по сравнению с другой
    isOlderThan(otherVersion) {
        return this.compareTo(otherVersion) < 0;
    },
};
