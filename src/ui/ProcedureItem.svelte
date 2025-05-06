<!-- Обновленное отображение процедур с растворителем -->
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
    $: hasComment = procedure.comment && procedure.comment.trim() !== '';
    $: hasFrequency = procedure.type === 'vlok' && procedure.frequency;
    $: electrophoresisInfo = getElectrophoresisInfo(procedure);

    $: isAutohemotherapy = procedure.type === 'autohemotherapy';
    $: isElectrophoresis = procedure.type === 'electrophoresis';
    $: autohemoHasDiluent = isAutohemotherapy && procedure.settings && 
                        procedure.settings.diluent && 
                        procedure.settings.diluent.enabled;
    $: dailyDosages = isAutohemotherapy && procedure.settings ? procedure.settings.dailyDosages || {} : {};

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
            case 'autohemotherapy':
                return '🔴'; // Иконка для аутогемотерапии
            default:
                return '⚕️'; // Иконка по умолчанию (медицинский символ)
        }
    }

    // Функция для получения информации об электрофорезе
    function getElectrophoresisInfo(procedure) {
        if (!isElectrophoresis || !procedure.settings) {
            return '';
        }
        
        const polarity = procedure.settings.polarity || 'положительная';
        const polaritySymbol = polarity === 'положительная' ? '+' : '–';
        
        if (procedure.settings.hasDiluent === 'да' && procedure.settings.diluent) {
            return `${procedure.settings.diluent.type} (${polaritySymbol})`;
        } else {
            return `Полярность: ${polarity} (${polaritySymbol})`;
        }
    }

    // Проверяем, есть ли у процедуры раствор
    $: hasDiluent = procedure.settings && 
                    procedure.settings.hasDiluent === 'да' && 
                    procedure.settings.diluent && 
                    procedure.settings.diluent.type;
</script>

{#if !isAutohemotherapy}
    <div class="procedure-row {procedureTypeClass}">
        <div class="procedure-cell">
            <div class="procedure-info">
                <div>
                    <span class="procedure-icon">{isProcedureTypeIcon}</span>
                    <span class="procedure-name">
                        {procedure.name}
                        {#if !isAutohemotherapy}
                            <span class="procedure-time">{procedure.time} мин</span>
                            {#if hasFrequency}
                                <span class="procedure-frequency">{procedure.frequency} Гц</span>
                            {/if}
                        {/if}
                    </span>

                    {#if isAutohemotherapy}
                        <div class="autohemo-info">
                            {#if autohemoHasDiluent}
                                <span class="diluent-info">Разведение: {procedure.settings.diluent.type}</span>
                            {:else}
                                <span class="diluent-info">Без разведения</span>
                            {/if}
                        </div>
                    {:else if isElectrophoresis}
                        <div class="electro-info">
                            <div class="electro-params">
                                <div class="param-item">
                                    <span class="param-label">Полярность:</span>
                                    <span class="param-value">
                                        {procedure.settings?.polarity || 'положительная'} 
                                        <span class="polarity-symbol">({procedure.settings?.polarity === 'отрицательная' ? '–' : '+'})</span>
                                    </span>
                                </div>
                                
                                <div class="param-item">
                                    <span class="param-label">Время:</span>
                                    <span class="param-value">{procedure.time} мин</span>
                                </div>
                                
                                {#if procedure.settings?.hasDiluent === 'да' && procedure.settings?.diluent}
                                    <div class="param-item">
                                        <span class="param-label">Раствор:</span>
                                        <span class="param-value">
                                            {procedure.settings.diluent.type} 
                                            {procedure.settings.diluent.dosage ? `(${procedure.settings.diluent.dosage})` : ''}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
         
                    {#if hasComment}
                        <div class="procedure-comment">
                            <span class="comment-icon" title="{procedure.comment}">
                                <svg fill="#3faeca" width="14" height="14" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1229.93 594.767c36.644 37.975 50.015 91.328 43.72 142.909-9.128 74.877-30.737 144.983-56.093 215.657-27.129 75.623-54.66 151.09-82.332 226.512-44.263 120.685-88.874 241.237-132.65 362.1-10.877 30.018-18.635 62.072-21.732 93.784-3.376 34.532 21.462 51.526 52.648 36.203 24.977-12.278 49.288-28.992 68.845-48.768 31.952-32.31 63.766-64.776 94.805-97.98 15.515-16.605 30.86-33.397 45.912-50.438 11.993-13.583 24.318-34.02 40.779-42.28 31.17-15.642 55.226 22.846 49.582 49.794-5.39 25.773-23.135 48.383-39.462 68.957l-1.123 1.416a1559.53 1559.53 0 0 0-4.43 5.6c-54.87 69.795-115.043 137.088-183.307 193.977-67.103 55.77-141.607 103.216-223.428 133.98-26.65 10.016-53.957 18.253-81.713 24.563-53.585 12.192-112.798 11.283-167.56 3.333-40.151-5.828-76.246-31.44-93.264-68.707-29.544-64.698-8.98-144.595 6.295-210.45 18.712-80.625 46.8-157.388 75.493-234.619l2.18-5.867 1.092-2.934 2.182-5.87 2.182-5.873c33.254-89.517 67.436-178.676 101.727-267.797 31.294-81.296 62.72-162.537 93.69-243.95 2.364-6.216 5.004-12.389 7.669-18.558l1-2.313c6.835-15.806 13.631-31.617 16.176-48.092 6.109-39.537-22.406-74.738-61.985-51.947-68.42 39.4-119.656 97.992-170.437 156.944l-6.175 7.17c-15.78 18.323-31.582 36.607-47.908 54.286-16.089 17.43-35.243 39.04-62.907 19.07-29.521-21.308-20.765-48.637-3.987-71.785 93.18-128.58 205.056-248.86 350.86-316.783 60.932-28.386 146.113-57.285 225.882-58.233 59.802-.707 116.561 14.29 157.774 56.99Zm92.038-579.94c76.703 29.846 118.04 96.533 118.032 190.417-.008 169.189-182.758 284.908-335.53 212.455-78.956-37.446-117.358-126.202-98.219-227.002 26.494-139.598 183.78-227.203 315.717-175.87Z" fill-rule="evenodd"/>
                                </svg>
                            </span>
                            <span class="comment-text">{procedure.comment}</span>
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
{/if}

<!-- Если это аутогемотерапия - добавляем дополнительные строки -->
{#if isAutohemotherapy}
    <!-- Строка для крови с указанием типа процедуры и разведения -->
    <div class="procedure-row autohemo-row blood-row">
        <div class="procedure-subcell">
            <div class="autohemo-component-info">
                <span class="autohemo-component-icon">🩸</span>
                <div class="autohemo-desc">
                    <span class="autohemo-title">Аутогемотерапия / Кровь</span>
                    <span class="autohemo-details">
                        {#if autohemoHasDiluent}
                            Разведение: {procedure.settings.diluent.type}
                        {:else}
                            Без разведения
                        {/if}
                    </span>
                </div>
                <div class="procedure-actions">
                    <button class="btn-delete-procedure" on:click={() => onDelete(procedure.id)}>
                        🗑️
                    </button>
                </div>
            </div>
        </div>
        
        {#each Array(14).fill().map((_, i) => i + 1) as day}
            <div 
                class="schedule-cell {day > 10 ? 'extended-treatment-day' : ''}" 
                class:selected={isDaySelected(day)}
                on:click={() => onDayToggle(day)}
                title={dailyDosages[day] && dailyDosages[day].blood ? `День ${day}: Кровь ${dailyDosages[day].blood}` : ''}
            >
                {#if isDaySelected(day) && dailyDosages[day] && dailyDosages[day].blood}
                    <div class="dosage-content">
                        <div class="check">{@html checkSvg}</div>
                        <div class="dosage-value">{dailyDosages[day].blood}</div>
                    </div>
                {:else if isDaySelected(day)}
                    {@html checkSvg}
                {/if}
            </div>
        {/each}
    </div>
    
    <!-- Строка для растворителя, если он есть -->
    {#if autohemoHasDiluent}
        <div class="procedure-row autohemo-row diluent-row">
            <div class="procedure-subcell">
                <span class="autohemo-component">💧 {procedure.settings.diluent.type}</span>
            </div>
            
            {#each Array(14).fill().map((_, i) => i + 1) as day}
                <div 
                    class="schedule-cell {day > 10 ? 'extended-treatment-day' : ''}" 
                    class:selected={isDaySelected(day)}
                    on:click={() => onDayToggle(day)}
                    title={dailyDosages[day] && dailyDosages[day].diluent ? `День ${day}: ${procedure.settings.diluent.type} ${dailyDosages[day].diluent}` : ''}
                >
                    {#if isDaySelected(day) && dailyDosages[day] && dailyDosages[day].diluent}
                        <div class="dosage-content">
                            <div class="check">{@html checkSvg}</div>
                            <div class="dosage-value">{dailyDosages[day].diluent}</div>
                        </div>
                    {:else if isDaySelected(day)}
                        {@html checkSvg}
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
{/if}

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
        height: 100%;
    }
    
    .procedure-icon {
        font-size: 1.2em;
        margin-right: 8px;
    }
    
    .procedure-name {
        font-size: 1.3em;
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

    .procedure-comment {
        display: flex;
        align-items: center;
        margin-top: 4px;
        font-size: 1.1em;
        color: #555;
    }

    .comment-icon {
        display: inline-flex;
        margin-right: 5px;
        cursor: help;
    }

    .comment-text {
        font-style: italic;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 280px;
    }

    .procedure-frequency {
        font-weight: normal;
        margin-left: 5px;
        color: #3FAECA;
        font-size: 0.9em;
    }

    /* Специфичный стиль для аутогемотерапии */
    .procedure-type-autohemotherapy .procedure-cell {
        border-left: 4px solid #28a745;
    }

    .autohemo-row {
        background-color: rgba(248, 249, 250, 0.5);
    }

    .blood-row .procedure-subcell {
        border-left: 4px solid #dc3545;
    }

    .diluent-row .procedure-subcell {
        border-left: 4px solid #dc3545;
    }

    .procedure-subcell {
        padding: 5px 10px 5px 10px;
        background-color: #f8f9fa;
        border-right: 1px solid #ddd;
    }

    /* Новые стили для улучшенного отображения компонентов аутогемотерапии */
    .autohemo-component-info {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .autohemo-component-icon {
        font-size: 1.8em;
    }
    
    .autohemo-desc {
        display: flex;
        flex-direction: column;
    }
    
    .autohemo-title {
        font-weight: 500;
        font-size: 1.1em;
        color: #28a745;
    }
    
    .autohemo-details {
        font-size: 0.9em;
        color: #555;
    }

    .autohemo-component {
        font-size: 1.3em;
        font-weight: 500;
        display: flex;
        align-items: center;
        height: 100%;
    }

    .autohemo-info, .electro-info {
        display: flex;
        gap: 10px;
        margin-top: 4px;
        font-size: 0.9em;
        color: #555;
    }

    .doctor-info, .polarity-info {
        font-weight: 500;
    }

    .dosage-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .dosage-value {
        font-size: 10px;
        font-weight: bold;
        color: white;
        background-color: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        padding: 1px 3px;
        margin-top: 2px;
    }

    .check {
        transform: scale(0.8);
    }

    .electro-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-top: 5px;
    }

    .electro-params {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }

    .param-item {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .param-label {
        font-weight: 500;
        color: #666;
        font-size: 1.3em;
    }

    .param-value {
        font-weight: normal;
        color: #333;
        font-size: 1.3em;
    }

    .polarity-symbol {
        font-weight: bold;
        margin-left: 2px;
    }
</style>