<!-- Обновленное отображение процедур с растворителем в стиле препаратов -->
<script>
    // Входные параметры
    export let procedure = {};
    export let onDelete;
    export let isDaySelected = () => false;
    export let onDayToggle;
    
    // Импортируем SVG для галочки
    const checkSvg = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    
    // Внутренние переменные
    $: isProcedureTypeIcon = getProcedureTypeIcon(procedure.type);
    $: procedureTypeClass = `procedure-type-${procedure.type}`;
    
    // Функция для определения иконки процедуры на основе типа
    function getProcedureTypeIcon(type) {
        switch(type) {
            case 'transair':
                return '🧠'; // Иконка для Трансаира
            case 'laser':
                return '🔆'; // Иконка для лазерной терапии
            case 'vlok':
                return '💉'; // Иконка для ВЛОК
            case 'electrophoresis':
                return '⚡'; // Иконка для электрофореза
            default:
                return '⚕️'; // Иконка по умолчанию (медицинский символ)
        }
    }

    // Проверяем, есть ли у процедуры раствор
    $: hasDiluent = procedure.settings && 
                    procedure.settings.hasDiluent === 'да' && 
                    procedure.settings.diluent && 
                    procedure.settings.diluent.type;
</script>

<div class="procedure-row {procedureTypeClass}">
    <div class="procedure-cell">
        <div class="procedure-info">
            <div>
                <span class="procedure-icon">{isProcedureTypeIcon}</span>
                <span class="procedure-name">
                    {procedure.name}
                    <span class="procedure-time">{procedure.time} мин</span>
                </span>
                
                {#if !procedure.isTimeOnly && procedure.settings}
                    <div class="procedure-settings">
                        <span class="polarity-info">
                            Полярность: {procedure.settings.polarity}
                        </span>
                        {#if hasDiluent}
                            <span class="polarity-info">
                                Раствор: {procedure.settings.diluent.type}
                            </span>
                        {/if}
                    </div>
                {/if}
            </div>
            
            <div class="procedure-actions">
                <button class="btn-delete-procedure" on:click={() => onDelete(procedure.id)}>
                    🗑️
                </button>
            </div>
        </div>
    </div>
    
    <!-- Ячейки дней для процедуры -->
    {#each Array(14).fill().map((_, i) => i + 1) as day}
        <div 
            class="schedule-cell {day > 10 ? 'extended-treatment-day' : ''}" 
            class:selected={isDaySelected(day)}
            on:click={() => onDayToggle(day)}
            title={day > 10 ? 'Внимание: продолжительное лечение. Рекомендуется не превышать 10-дневный курс, если нет особых показаний' : ''}
        >
            {#if isDaySelected(day)}
                {@html checkSvg}
            {/if}
        </div>
    {/each}
</div>

<style>
    .procedure-row {
        display: grid;
        grid-template-columns: 400px repeat(14, 1fr);
        align-items: stretch;
        border-bottom: 1px solid #e9ecef;
    }
    
    .procedure-cell {
        border-right: 1px solid #ddd;
        padding: 10px;
        background-color: #f8f9fa;
    }
    
    .procedure-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .procedure-icon {
        font-size: 1.2em;
        margin-right: 8px;
    }
    
    .procedure-name {
        font-weight: 500;
    }
    
    .procedure-time {
        font-weight: normal;
        margin-left: 5px;
        font-style: italic;
        color: #6c757d;
        font-size: 0.9em;
    }
    
    .procedure-settings {
        margin-top: 5px;
        color: #6c757d;
        font-size: 0.9em;
    }
    
    .polarity-info {
        display: block;
    }
    
    .diluent-info {
        display: block;
        margin-top: 3px;
        font-style: italic;
        color: #5a6268;
    }
    
    .procedure-actions {
        display: flex;
        gap: 5px;
    }
    
    .btn-delete-procedure {
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .btn-delete-procedure:hover {
        color: #dc3545;
    }
    
    .schedule-cell {
        border: 1px solid #ddd;
        cursor: pointer;
        transition: background-color 0.3s;
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .schedule-cell:hover {
        background-color: rgba(0,123,255,0.1);
    }
    
    .schedule-cell.selected {
        background-color: #3FAECA;
    }
    
    .extended-treatment-day {
        position: relative;
        background-color: #e7c7c266;
    }
    
    .extended-treatment-day:hover {
        background-color: rgba(255, 244, 230, 0.7);
    }
    
    .extended-treatment-day.selected {
        background-color: #3FAECA;
    }
    
    /* Специфичные стили для разных типов процедур */
    .procedure-type-transair .procedure-cell {
        border-left: 4px solid #3498db;
    }
    
    .procedure-type-laser .procedure-cell {
        border-left: 4px solid #f39c12;
    }
    
    .procedure-type-vlok .procedure-cell {
        border-left: 4px solid #e74c3c;
    }
    
    .procedure-type-electrophoresis .procedure-cell {
        border-left: 4px solid #9b59b6;
    }
</style>