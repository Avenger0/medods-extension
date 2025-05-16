<!-- src/ui/MedicationTooltip.svelte -->
<script>
    import { onMount } from 'svelte';
    
    export let medications = [];
    export let medication = {};
    export let position = "right";

    let tooltipElement;
    let actualData = null;
    let isDataReady = false;

    // Инициализация безопасных значений по умолчанию
    let displayData = {
        name: 'Препарат',
        fullName: '',
        activeIngredient: '',
        notes: '',
        stockQuantity: 0,
        price: '',
        compatibleDiluents: '',
        vidalLink: '',
        types: [] // Важно: инициализируем типы как пустой массив
    };

    onMount(() => {
        try {
            // Попытка найти актуальные данные
            if (medication && medication.id && Array.isArray(medications)) {
                actualData = medications.find(med => med && med.id == medication.id) || null;
            }
            
            // Объединяем данные из actualData и medication
            displayData = {
                name: medication?.name || 'Препарат',
                fullName: medication?.fullName || '',
                activeIngredient: actualData?.activeIngredient || medication?.activeIngredient || '',
                notes: actualData?.notes || medication?.notes || '',
                stockQuantity: typeof actualData?.stockQuantity === 'number' ? actualData.stockQuantity : 
                               typeof medication?.stockQuantity === 'number' ? medication.stockQuantity : 0,
                price: actualData?.price || medication?.price || '',
                compatibleDiluents: actualData?.compatibleDiluents || medication?.compatibleDiluents || '',
                vidalLink: actualData?.vidalLink || medication?.vidalLink || '',
                
                // Сохраняем типы из обоих источников, отдавая приоритет actualData
                types: Array.isArray(actualData?.types) ? actualData.types : 
                       Array.isArray(medication?.types) ? medication.types : 
                       Array.isArray(actualData?.availableTypes) ? actualData.availableTypes :
                       Array.isArray(medication?.availableTypes) ? medication.availableTypes : []
            };
            
            isDataReady = true;
            
            // Позиционирование tooltip
            if (tooltipElement) {
                const rect = tooltipElement.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                if (rect.right > viewportWidth) {
                    tooltipElement.style.transform = 'translateX(-100%)';
                    tooltipElement.style.left = '-20px';
                }
                
                if (rect.bottom > viewportHeight && position === 'bottom') {
                    tooltipElement.style.top = 'auto';
                    tooltipElement.style.bottom = '20px';
                }
            }
        } catch (error) {
            console.error('Ошибка при инициализации MedicationTooltip:', error);
            isDataReady = true; // Всё равно помечаем как готово, чтобы отрисовать что-то
        }
    });

    // Условия отображения информации - проверяем только displayData
    $: hasActiveIngredient = displayData.activeIngredient && displayData.activeIngredient.trim() !== '';
    $: hasNotes = displayData.notes && displayData.notes.trim() !== '';
    $: hasStock = displayData.stockQuantity !== undefined && displayData.stockQuantity !== null;
    $: hasPrice = displayData.price && displayData.price.toString().trim() !== '';
    $: hasDiluents = displayData.compatibleDiluents && displayData.compatibleDiluents.trim() !== '';
    $: hasVidalLink = displayData.vidalLink && displayData.vidalLink.trim() !== '';
    $: hasTypes = displayData.types && Array.isArray(displayData.types) && displayData.types.length > 0;
    
    function getRouteClass(type) {
        if (!type) return 'route-unknown';
        
        switch(type) {
            case 'в/в': return 'route-iv';
            case 'в/м': return 'route-im';
            case 'п/к': return 'route-sc';
            case 'внутрь': return 'route-oral';
            case 'мест.': return 'route-local';
            case 'рект.': return 'route-rectal';
            case 'ингал.': return 'route-inhaled';
            case 'др.': return 'route-other';
            default: return 'route-unknown';
        }
    }
    
    function getRouteFullName(type) {
        if (!type) return '';
        
        switch(type) {
            case 'в/в': return 'Внутривенно';
            case 'в/м': return 'Внутримышечно';
            case 'п/к': return 'Подкожно';
            case 'внутрь': return 'Перорально';
            case 'мест.': return 'Местно';
            case 'рект.': return 'Ректально';
            case 'ингал.': return 'Ингаляционно';
            case 'др.': return 'Другое';
            default: return type;
        }
    }

    function getStockColorClass(quantity) {
        if (quantity === 0) return 'stock-critical';
        if (quantity <= 3) return 'stock-warning';
        if (quantity >= 10) return 'stock-good';
        return 'stock-normal';
    }
</script>

<div class="medication-tooltip {position}" bind:this={tooltipElement}>
    {#if !isDataReady}
        <div class="loading">Загрузка данных...</div>
    {:else}
        <div class="tooltip-header">
            <h3>{displayData.name}</h3>
            <span class="full-name">{displayData.fullName}</span>
            
            <!-- Блок с типами введения, с проверкой существования -->
            {#if hasTypes}
                <div class="route-badges">
                    {#each displayData.types as routeType}
                        {#if routeType}
                            <span 
                                class="route-badge {getRouteClass(routeType)}" 
                                title="{getRouteFullName(routeType)}"
                            >
                                {routeType}
                            </span>
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>
        
        <div class="tooltip-content">
            {#if hasActiveIngredient}
                <div class="info-row">
                    <span class="med-label">Действующее в-в</span>
                    <span class="value">{displayData.activeIngredient}</span>
                </div>
            {/if}

            {#if hasDiluents}
                <div class="info-row">
                    <span class="med-label">Рек. растворы</span>
                    <span class="value">{displayData.compatibleDiluents}</span>
                </div>
            {/if}

            {#if hasPrice}
                <div class="info-row">
                    <span class="med-label">Цена</span>
                    <span class="value stock-price">{displayData.price} р.</span>
                </div>
            {/if}
            
            {#if hasStock}
                <div class="info-row">
                    <span class="med-label">На складе</span>
                    <span class="value stock-quantity {getStockColorClass(displayData.stockQuantity)}">
                        {displayData.stockQuantity} шт.
                        {#if displayData.stockQuantity === 0}
                            <span class="stock-status">отсутствует</span>
                        {:else if displayData.stockQuantity <= 3}
                            <span class="stock-status">мало</span>
                        {/if}
                    </span>
                </div>
            {/if}
            
            {#if hasNotes}
                <div class="info-row med-notes">
                    <span class="value">{displayData.notes}</span>
                </div>
            {/if}
            
            {#if hasVidalLink}
                <div class="info-row vidal-link">
                    <a href={displayData.vidalLink} target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Открыть в Vidal
                    </a>
                </div>
            {/if}
        </div>
    {/if}
</div>
<style>
     .loading {
        padding: 20px;
        text-align: center;
        color: #6c757d;
        font-style: italic;
    }
    
    .medication-tooltip {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        padding: 12px;
        z-index: 1000;
        font-size: 14px;
        width: 320px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        /* Убираем opacity и visibility, т.к. ими управляет родительский компонент */
    }
    
    /* Стили содержимого */
    .tooltip-header {
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
    }
    
    .tooltip-header h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        color: #333;
    }
    
    .full-name {
        color: #666;
        font-size: 13px;
        display: block;
    }
    
    .info-row {
        display: flex;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }
    
    .med-label {
        flex: 0 0 160px;
        font-weight: 500;
        color: #555;
    }
    
    .value {
        flex: 1;
        color: #333;
    }
    
    .stock-quantity {
        font-weight: 500;
        color: #28a745;
    }
    
    .med-notes {
        flex-direction: column;
        background-color: #fffbea;
        border-radius: 4px;
        padding: 6px;
    }
    
    .med-notes .med-label {
        margin-bottom: 4px;
    }
    
    .vidal-link {
        margin-top: 12px;
    }
    
    .vidal-link a {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #007bff;
        text-decoration: none;
        font-weight: 500;
    }
    
    .vidal-link a:hover {
        text-decoration: underline;
    }

    .stock-quantity {
        font-weight: 500;
    }
    
    .stock-good {
        color: #28a745;
    }
    
    .stock-normal {
        color: #17a2b8;
    }
    
    .stock-warning {
        color: #ffc107;
    }
    
    .stock-critical {
        color: #dc3545;
    }
    
    .stock-status {
        font-size: 12px;
        margin-left: 6px;
        padding: 1px 5px;
        border-radius: 3px;
        font-weight: normal;
    }
    
    .stock-warning .stock-status {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .stock-critical .stock-status {
        background-color: #f8d7da;
        color: #721c24;
    }

     .route-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 8px;
    }
    
    .route-badge {
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 500;
        display: inline-block;
    }
    
    /* Внутривенно */
    .route-badge.route-iv {
        background-color: #e3f2fd;
        color: #0d47a1;
        border: 1px solid #bbdefb;
    }
    
    /* Внутримышечно */
    .route-badge.route-im {
        background-color: #e8f5e9;
        color: #1b5e20;
        border: 1px solid #c8e6c9;
    }
    
    /* Подкожно */
    .route-badge.route-sc {
        background-color: #fff3e0;
        color: #e65100;
        border: 1px solid #ffe0b2;
    }
    
    /* Перорально */
    .route-badge.route-oral {
        background-color: #e8eaf6;
        color: #303f9f;
        border: 1px solid #c5cae9;
    }
    
    /* Местно */
    .route-badge.route-local {
        background-color: #fce4ec;
        color: #c2185b;
        border: 1px solid #f8bbd0;
    }
    
    /* Ректально */
    .route-badge.route-rectal {
        background-color: #f1f8e9;
        color: #689f38;
        border: 1px solid #dcedc8;
    }
    
    /* Ингаляционно */
    .route-badge.route-inhaled {
        background-color: #e0f7fa;
        color: #0097a7;
        border: 1px solid #b2ebf2;
    }
    
    /* Другое */
    .route-badge.route-other {
        background-color: #f3e5f5;
        color: #6a1b9a;
        border: 1px solid #e1bee7;
    }
    
    /* Неизвестный тип */
    .route-badge.route-unknown {
        background-color: #f5f5f5;
        color: #757575;
        border: 1px solid #e0e0e0;
    }

</style>