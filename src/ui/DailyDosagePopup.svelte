<!-- src/ui/DailyDosagePopup.svelte -->
<script>
    import { createEventDispatcher, onMount } from 'svelte';
    
    export let isOpen = false;
    export let dailyDosages = {}; // Object with day -> dosage format
    export let baseDosage = ''; // Regular dosage from main form
    
    const dispatch = createEventDispatcher();
    let tempDosages = { ...dailyDosages };
    let dayInputs = [];
    
    onMount(() => {
        // Инициализируем массив дней при монтировании
        initializeDayInputs();
    });
    
    // Добавим функцию для инициализации массива дней
    function initializeDayInputs() {
        dayInputs = [];
        for (let i = 1; i <= 14; i++) {
            dayInputs.push({ 
                day: i, 
                value: tempDosages[i] || '' 
            });
        }
    }
    
    // Функция для обновления значения дозировки
    function updateDayDosage(index, value) {
        if (index >= 0 && index < dayInputs.length) {
            dayInputs[index].value = value;
            tempDosages[dayInputs[index].day] = value;
        }
    }
    
    // Наблюдаем за изменением isOpen
    $: if (isOpen) {
        // При открытии попапа заново инициализируем данные
        tempDosages = { ...dailyDosages };
        initializeDayInputs();
    }
    
    // Track if any daily dosage is set
    $: hasDailyDosages = dayInputs.some(item => item.value && item.value.trim() !== '');
    
    function handleClose() {
        dispatch('close');
    }
    
    function handleSave() {
        // Собираем данные из текущего состояния dayInputs
        const validDosages = {};
        
        dayInputs.forEach(item => {
            if (item.value && item.value.trim() !== '') {
                validDosages[item.day] = item.value.trim();
            }
        });
        
        // Проверяем, что есть хотя бы одна дозировка
        const hasValidDosages = Object.keys(validDosages).length > 0;
        
        if (!hasValidDosages) {
            alert('Необходимо ввести дозировку хотя бы для одного дня или использовать общую дозировку.');
            return;
        }
        
        // Отправляем обновленные данные родительскому компоненту
        dispatch('update', { 
            dailyDosages: validDosages,
            hasDailyDosages: hasValidDosages
        });
        
        // Закрываем попап
        handleClose();
    }
    
    function clearAllDosages() {
        tempDosages = {};
        dayInputs = dayInputs.map(item => ({ ...item, value: '' }));
    }
</script>

{#if isOpen}
    <div class="daily-dosage-popup">
        <div class="popup-content">
            <div class="popup-header">
                <h3>Дозировка по дням</h3>
                <button class="close-button" on:click={handleClose}>✕</button>
            </div>
            
            <div class="popup-body">
                <div class="intro-text">
                    <p>Укажите дозировки для конкретных дней приема. Дни с указанной дозировкой будут автоматически выбраны в расписании.</p>
                    
                    {#if hasDailyDosages}
                        <div class="info-box">
                            <p>При использовании дозировки по дням, общая дозировка <i>(под любой день)</i> будет отключена.</p>
                        </div>
                    {/if}
                </div>
                
                <div class="days-grid">
                    {#each dayInputs as item, index}
                        <div class="day-item">
                            <label for={`day-${item.day}`}>День {item.day}</label>
                            <input 
                                type="text" 
                                id={`day-${item.day}`}
                                value={item.value} 
                                on:input={(e) => updateDayDosage(index, e.target.value)}
                                placeholder="Введите дозировку"
                            />
                        </div>
                    {/each}
                </div>
                
                <div class="actions-row">
                    <button class="clear-button" on:click={clearAllDosages}>
                        Очистить все
                    </button>
                </div>
            </div>
            
            <div class="popup-footer">
                <button class="cancel-button" on:click={handleClose}>
                    Отмена
                </button>
                <button class="save-button" on:click={handleSave}>
                    Сохранить
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .daily-dosage-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    
    .popup-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .popup-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .popup-header h3 {
        margin: 0;
        font-size: 18px;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
    }
    
    .close-button:hover {
        color: #333;
    }
    
    .popup-body {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }
    
    .intro-text {
        margin-bottom: 20px;
    }
    
    .info-box {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 12px;
        margin-bottom: 15px;
        border-radius: 4px;
    }
    
    .info-box p {
        margin: 0;
        color: #856404;
    }
    
    .days-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
    }
    
    .day-item {
        display: flex;
        flex-direction: column;
    }
    
    .day-item label {
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .day-item input {
        padding: 8px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .day-item input:focus {
        border-color: #3FAECA;
        outline: none;
    }
    
    .actions-row {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }
    
    .clear-button {
        background-color: #f1f1f1;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        color: #555;
    }
    
    .clear-button:hover {
        background-color: #e1e1e1;
    }
    
    .popup-footer {
        padding: 15px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    
    .cancel-button, .save-button {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        border: none;
        font-size: 16px;
    }
    
    .cancel-button {
        background-color: #f1f1f1;
        color: #333;
    }
    
    .save-button {
        background-color: #3FAECA;
        color: white;
    }
    
    .warning-box {
        background-color: #ffecb3;
        border-left: 4px solid #ffc107;
        padding: 12px;
        margin: 15px 0;
        border-radius: 4px;
    }

    .warning-box p {
        margin: 0;
        color: #856404;
        font-weight: 500;
    }
</style>