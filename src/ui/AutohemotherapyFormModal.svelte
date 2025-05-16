<!-- src/ui/AutohemotherapyFormModal.svelte -->
<script>
    import TreatmentModal from './TreatmentModal.svelte';
    import { medicationService } from '../utils/api.js';
    import { onMount } from 'svelte';

    export let isOpen = false;
    export let onClose;
    export let onSave;

    let bloodDiluents = [];

    onMount(async () => {
        try {
            const autohemoResult = await medicationService.getDiluentsByType('autohemo');
            if (autohemoResult && autohemoResult.diluents) {
                bloodDiluents = autohemoResult.diluents.autohemo || [];
            }
        } catch (error) {
            console.error('Ошибка загрузки растворителей для аутогемотерапии:', error);
            // Установите значение по умолчанию при ошибке
            bloodDiluents = ['Глюконат кальция'];
        }
    });

    const bloodDosages = Array.from({length: 10}, (_, i) => `${i + 1} мл`);
    const diluentDosages = Array.from({length: 6}, (_, i) => `${i} мл`);
    
    // Начальное состояние
    let autohemotherapy = {
        diluent: '',
        doctor: 'Дулебенец',
        dailyDosages: {}
    };
    
    // Создаем структуру для редактирования дозировок по дням
    let dailyDosages = Array.from({length: 14}, (_, i) => {
        return {
            day: i + 1,
            blood: '',
            diluent: ''
        };
    });
    
    // Валидация формы
    $: isFormValid = dailyDosages.some(day => day.blood !== '');
    
    function resetForm() {
        autohemotherapy = {
            diluent: {
                type: 'Глюконат кальция',
                enabled: false
            },
            doctor: '',
            dailyDosages: {}
        };
        
        // Сбрасываем дозировки
        dailyDosages = Array.from({length: 14}, (_, i) => {
            return {
                day: i + 1,
                blood: '',
                diluent: ''
            };
        });
    }

    // Функция для заполнения стандартных дозировок
    function fillStandardDosages() {
        // Стандартная схема дозировок для крови
        const standardBloodDosages = {
            1: "2 мл", 2: "3 мл", 3: "4 мл", 4: "5 мл", 5: "6 мл", 
            6: "5 мл", 7: "4 мл", 8: "3 мл", 9: "2 мл", 10: "2 мл"
        };
        
        // Стандартная схема для глюконата кальция
        const standardCalciumDosages = {
            1: "1 мл", 2: "1 мл", 3: "2 мл", 4: "2 мл", 5: "3 мл", 
            6: "2 мл", 7: "2 мл", 8: "1 мл", 9: "1 мл", 10: "0 мл"
        };
        
        // Заполняем первые 10 дней стандартными дозировками
        dailyDosages = dailyDosages.map((day, index) => {
            if (index < 10) {
                return {
                    day: index + 1,
                    blood: standardBloodDosages[index + 1] || '',
                    diluent: autohemotherapy.diluent.enabled ? 
                        standardCalciumDosages[index + 1] || '' : ''
                };
            }
            return day;
        });
    }
    
    // Обработчик сохранения
    function handleSave() {
        // Собираем дозировки по дням в формат для сохранения
        const formattedDosages = {};
        
        dailyDosages.forEach(day => {
            if (day.blood) {
                if (!formattedDosages[day.day]) {
                    formattedDosages[day.day] = {};
                }
                formattedDosages[day.day].blood = day.blood;
                
                if (autohemotherapy.diluent.enabled && day.diluent) {
                    formattedDosages[day.day].diluent = day.diluent;
                }
            }
        });
        
        // Создаем объект для сохранения
        const procedureData = {
            id: 'procedure_' + Date.now(),
            type: 'autohemotherapy',
            name: 'Аутогемотерапия',
            isTimeOnly: false,
            displayTime: false,
            time: null,
            hasDailyDosages: true,
            comment: '',
            settings: {
                diluent: {
                    type: autohemotherapy.diluent.type,
                    enabled: autohemotherapy.diluent.enabled
                },
                doctor: autohemotherapy.doctor,
                dailyDosages: formattedDosages
            }
        };
        
        procedureData.forceUpdate = true;
    
        onSave(procedureData);

        resetForm();
    }
    
    // Обработчик изменения типа разведения
    function handleDiluentTypeChange() {
        if (!autohemotherapy.diluent.enabled) {
            // Если разведение отключено, очищаем дозировки растворителя
            dailyDosages = dailyDosages.map(day => ({
                ...day,
                diluent: ''
            }));
        }
    }

    $: if (isOpen) {
        resetForm();
    }

</script>

<TreatmentModal 
    {isOpen} 
    {onClose}
    maxWidth="750px"
    minHeight="auto"
    maxHeight="750px"
    height="auto"
    overlayAlign="right"
    overlayPadding="0 11% 0 0"
>
    <div class="autohemo-modal">
        <h3>Аутогемотерапия</h3>
        
        <div class="form-group">
            <label>Разведение:</label>
            <div class="radio-group">
                <label class="radio-label">
                    <input 
                        type="checkbox" 
                        bind:checked={autohemotherapy.diluent.enabled}
                        on:change={handleDiluentTypeChange}
                    />
                    С разведением
                </label>
                
                {#if autohemotherapy.diluent.enabled}
                    <select 
                        bind:value={autohemotherapy.diluent.type}
                        class="form-control diluent-select"
                    >
                        {#each bloodDiluents as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </select>
                {/if}
            </div>
        </div>
        
        <div class="form-group">
            <label>Дозировки по дням:</label>
            <button 
                class="btn-standard-dosages"
                on:click={fillStandardDosages}
            >
                Заполнить стандартные дозировки
            </button>
            
            <div class="daily-dosages">
                <div class="dosage-header">
                    <div class="day-column">День</div>
                    <div class="dosage-column">Кровь</div>
                    {#if autohemotherapy.diluent.enabled}
                        <div class="dosage-column">Разведение</div>
                    {/if}
                </div>
                
                {#each dailyDosages as day}
                    <div class="dosage-row">
                        <div class="day-column">День {day.day}</div>
                        <div class="dosage-column">
                            <select 
                                bind:value={day.blood}
                                class="form-control dosage-select"
                            >
                                <option value="">Не указано</option>
                                {#each bloodDosages as dosage}
                                    <option value={dosage}>{dosage}</option>
                                {/each}
                            </select>
                        </div>
                        {#if autohemotherapy.diluent.enabled}
                            <div class="dosage-column">
                                <select 
                                    bind:value={day.diluent}
                                    class="form-control dosage-select"
                                    disabled={!day.blood}
                                >
                                    <option value="">Не указано</option>
                                    {#each diluentDosages as dosage}
                                        <option value={dosage}>{dosage}</option>
                                    {/each}
                                </select>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
            
            <div class="info-box">
                <p>
                    <strong>Информация:</strong> Из вены берется кровь 
                    {#if autohemotherapy.diluent.enabled}
                        и в разведении с {autohemotherapy.diluent.type}
                    {:else}
                        в чистом виде
                    {/if}
                     вводится внутримышечно. Укажите дозировки для каждого дня процедуры.
                </p>
            </div>
        </div>
        
        <div class="button-row">
            <button 
                class="btn-cancel" 
                on:click={onClose}
            >
                Отмена
            </button>
            <button 
                class="btn-save" 
                disabled={!isFormValid}
                on:click={handleSave}
            >
                Добавить процедуру
            </button>
        </div>
    </div>
</TreatmentModal>

<style>
    h3 {
        font-size: 21px;
        margin: 0 0 20px 0;
        padding: 0;
    }
    
    .autohemo-modal {
        padding: 15px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .radio-group {
        display: flex;
        gap: 15px;
        align-items: center;
    }
    
    .radio-label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
    }
    
    .form-control {
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
    }
    
    .diluent-select {
        width: 200px;
    }
    
    .daily-dosages {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-top: 10px;
        max-height: 320px;
        overflow-y: auto;
    }
    
    .dosage-header {
        display: grid;
        grid-template-columns: 100px 1fr 1fr;
        background-color: #f8f9fa;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        padding: 8px;
        gap: 15px;
    }
    
    .dosage-row {
        display: grid;
        grid-template-columns: 100px 1fr 1fr;
        padding: 8px;
        border-bottom: 1px solid #eee;
        align-items: center;
        gap: 15px;
    }
    
    .dosage-row:last-child {
        border-bottom: none;
    }
    
    .day-column {
        font-weight: 500;
    }
    
    .dosage-select {
        width: 100%;
    }
    
    .info-box {
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        padding: 10px;
        margin-top: 15px;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .button-row {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
    
    .btn-save, .btn-cancel {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        border: none;
        font-size: 16px;
    }
    
    .btn-save {
        background-color: #3FAECA;
        color: white;
    }
    
    .btn-save:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-cancel {
        background-color: #f1f1f1;
        color: #333;
    }
    
    .btn-standard-dosages {
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 10px;
    }

    .btn-standard-dosages:hover {
        background-color: #5a6268;
    }
</style>