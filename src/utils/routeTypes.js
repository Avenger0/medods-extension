/**
 * Типы введения препаратов
 * @type {Array<Object>}
 */
export const ROUTE_TYPES = [
    { id: 'iv', short: 'в/в', name: 'Внутривенно', description: 'Введение лекарственного средства непосредственно в вену' },
    { id: 'im', short: 'в/м', name: 'Внутримышечно', description: 'Введение лекарственного средства в мышечную ткань' },
    { id: 'sc', short: 'п/к', name: 'Подкожно', description: 'Введение лекарственного средства под кожу' },
    { id: 'oral', short: 'внутрь', name: 'Перорально', description: 'Прием лекарственного средства через рот' },
    { id: 'local', short: 'мест.', name: 'Местно', description: 'Применение лекарственного средства непосредственно на пораженную область' },
    { id: 'rectal', short: 'рект.', name: 'Ректально', description: 'Введение лекарственного средства через прямую кишку' },
    { id: 'inhaled', short: 'ингал.', name: 'Ингаляционно', description: 'Введение лекарственного средства через дыхательные пути' },
    { id: 'other', short: 'др.', name: 'Другое', description: 'Иной способ введения' }
];

/**
 * Получить объект типа введения по короткому обозначению
 * @param {string} shortName - Короткое обозначение типа введения (в/в, в/м и т.д.)
 * @returns {Object|undefined} Объект типа введения или undefined, если не найден
 */
export function getRouteTypeByShort(shortName) {
    return ROUTE_TYPES.find(route => route.short === shortName);
}

/**
 * Получить объект типа введения по идентификатору
 * @param {string} id - Идентификатор типа введения (iv, im и т.д.)
 * @returns {Object|undefined} Объект типа введения или undefined, если не найден
 */
export function getRouteTypeById(id) {
    return ROUTE_TYPES.find(route => route.id === id);
}

/**
 * Преобразовать короткое обозначение в идентификатор
 * @param {string} shortName - Короткое обозначение типа введения
 * @returns {string} Идентификатор типа введения или 'unknown'
 */
export function shortToId(shortName) {
    const routeType = getRouteTypeByShort(shortName);
    return routeType ? routeType.id : 'unknown';
}

/**
 * Получить цвета для типа введения
 * @param {string} shortName - Короткое обозначение типа введения
 * @returns {Object} Объект с цветами
 */
export function getRouteColors(shortName) {
    const id = shortToId(shortName);
    const colorMap = {
        'iv': { bg: '#e3f2fd', color: '#0d47a1', border: '#bbdefb' },
        'im': { bg: '#e8f5e9', color: '#1b5e20', border: '#c8e6c9' },
        'sc': { bg: '#fff3e0', color: '#e65100', border: '#ffe0b2' },
        'oral': { bg: '#e8eaf6', color: '#303f9f', border: '#c5cae9' },
        'local': { bg: '#fce4ec', color: '#c2185b', border: '#f8bbd0' },
        'rectal': { bg: '#f1f8e9', color: '#689f38', border: '#dcedc8' },
        'inhaled': { bg: '#e0f7fa', color: '#0097a7', border: '#b2ebf2' },
        'other': { bg: '#f3e5f5', color: '#6a1b9a', border: '#e1bee7' },
        'unknown': { bg: '#f5f5f5', color: '#757575', border: '#e0e0e0' }
    };
    
    return colorMap[id] || colorMap.unknown;
}