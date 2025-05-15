<!-- src/ui/MedicationTooltip.svelte -->
<script>
    import { onMount } from 'svelte';
    
    // Входные параметры
    export let medication = {};
    export let position = "right"; // Позиция всплывающего окна: top, right, bottom, left
    
    let tooltipElement;
    
    // Проверка наличия дополнительной информации
    $: hasActiveIngredient = medication.activeIngredient && medication.activeIngredient.trim() !== '';
    $: hasNotes = medication.notes && medication.notes.trim() !== '';
    $: hasStock = medication.stockQuantity !== undefined && medication.stockQuantity !== null;
    $: hasPrice = medication.price !== undefined && medication.price !== null;
    $: hasDiluents = medication.compatibleDiluents && medication.compatibleDiluents.trim() !== '';
    $: hasVidalLink = medication.vidalLink && medication.vidalLink.trim() !== '';
    
    function getRouteClass(type) {
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
    
    // Функция для расшифровки краткого обозначения типа введения
    function getRouteFullName(type) {
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

    onMount(() => {
        // Убедимся, что всплывающее окно не выходит за пределы экрана
        if (tooltipElement) {
            const rect = tooltipElement.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Корректируем, если выходит за правый край экрана
            if (rect.right > viewportWidth) {
                tooltipElement.style.transform = 'translateX(-100%)';
                tooltipElement.style.left = '-20px';
            }
            
            // Корректируем, если выходит за нижний край экрана
            if (rect.bottom > viewportHeight) {
                if (position === 'bottom') {
                    tooltipElement.style.top = 'auto';
                    tooltipElement.style.bottom = '20px';
                }
            }
        }
    });

    function getStockColorClass(quantity) {
        if (quantity === 0) return 'stock-critical';
        if (quantity <= 3) return 'stock-warning';
        if (quantity >= 10) return 'stock-good';
        return 'stock-normal';
    }
</script>

<div class="medication-tooltip {position}" bind:this={tooltipElement}>
    <div class="tooltip-header">
        <h3>{medication.name}</h3>
        <span class="full-name">{medication.fullName}</span>
        {#if medication.types && medication.types.length > 0}
            <div class="route-badges">
                {#each medication.types as routeType}
                    <span 
                        class="route-badge {getRouteClass(routeType)}" 
                        title="{getRouteFullName(routeType)}"
                    >
                        {routeType}
                    </span>
                {/each}
            </div>
        {/if}
    </div>
    
    <div class="tooltip-content">
        {#if hasActiveIngredient}
            <div class="info-row">
                <span class="med-label">Действующее в-в</span>
                <span class="value">{medication.activeIngredient}</span>
            </div>
        {/if}

        {#if hasDiluents}
            <div class="info-row">
                <span class="med-label">Рек. растворы</span>
                <span class="value">{medication.compatibleDiluents}</span>
            </div>
        {/if}

        {#if hasPrice}
            <div class="info-row">
                <span class="med-label">Цена</span>
                <span class="value stock-price">{medication.price} р.</span>
            </div>
        {/if}
        
        {#if hasStock !== undefined}
            <div class="info-row">
                <span class="med-label">На складе</span>
                <span class="value stock-quantity {getStockColorClass(medication.stockQuantity)}">
                    {medication.stockQuantity} шт.
                    {#if medication.stockQuantity === 0}
                        <span class="stock-status">отсутствует</span>
                    {:else if medication.stockQuantity <= 3}
                        <span class="stock-status">мало</span>
                    {/if}
                </span>
            </div>
        {/if}
        
        {#if hasNotes}
            <div class="info-row med-notes">
                <span class="value">{medication.notes}</span>
            </div>
        {/if}
        
        {#if hasVidalLink}
            <div class="info-row vidal-link">
                <a href={medication.vidalLink} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Открыть в Vidal
                </a>
            </div>
        {/if}
    </div>
</div>

<style>
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