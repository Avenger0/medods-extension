<!-- Обновленная форма процедур с растворителем в стиле препаратов -->
<script>
    import TreatmentModal from './TreatmentModal.svelte';

    export let isOpen = false;
    export let onClose;
    export let onSave;
    
    // Процедуры с настройками
    const availableProcedures = [
        { id: 'transair', name: 'Трансаир', timeOnly: true },
        { id: 'laser', name: 'Лазер терапевтический', timeOnly: true },
        { id: 'vlok', name: 'ВЛОК', timeOnly: true },
        { id: 'electrophoresis', name: 'Электрофорез', timeOnly: false }
    ];

    // Растворители для электрофореза
    const solutionTypes = [
        'Новокаин',
        'Эуфиллин',
        'Анальгин',
        'Магнезия',
        'Кальций',
        'Йод',
        'Цинк',
        'Медь'
    ];

    // Предустановленные варианты времени
    const presetTimes = [10, 20, 30, 40];

    // Начальное состояние формы
    let procedureForm = {
        type: availableProcedures[0].id,
        time: 20, // Значение по умолчанию
        polarity: 'положительная',
        hasDiluent: 'нет', // По аналогии с препаратами
        diluent: {
            type: solutionTypes[0],
            dosage: ''
        }
    };

    // Получаем текущую выбранную процедуру
    $: selectedProcedure = availableProcedures.find(p => p.id === procedureForm.type);
    $: isTimeOnly = selectedProcedure?.timeOnly || false;

    // Проверка валидности формы
    $: isFormValid = validateForm();

    function validateForm() {
        // Базовая проверка - тип процедуры должен быть выбран
        if (!procedureForm.type) return false;

        // Проверка времени - оно всегда должно быть выбрано
        if (!procedureForm.time || procedureForm.time <= 0) return false;

        // Для электрофореза нужны дополнительные проверки
        if (procedureForm.type === 'electrophoresis') {
            if (!procedureForm.polarity) return false;
            // Проверяем раствор только если он используется
            if (procedureForm.hasDiluent === 'да') {
                if (!procedureForm.diluent.type) return false;
            }
        }

        return true;
    }

    function handleSave() {
        if (!isFormValid) return;

        // Формируем данные для сохранения
        const procedureData = {
            id: 'procedure_' + Date.now(),
            type: procedureForm.type,
            name: selectedProcedure.name,
            isTimeOnly: isTimeOnly,
            time: procedureForm.time,
            settings: !isTimeOnly ? {
                polarity: procedureForm.polarity,
                hasDiluent: procedureForm.hasDiluent,
                diluent: procedureForm.hasDiluent === 'да' ? {
                    type: procedureForm.diluent.type,
                    dosage: procedureForm.diluent.dosage || ''
                } : null
            } : null
        };

        onSave(procedureData);
    }

    function handleProcedureTypeChange(event) {
        procedureForm.type = event.target.value;
    }

    function handleTimeSelection(time) {
        procedureForm.time = time;
    }
</script>

<TreatmentModal
    {isOpen}
    {onClose}
    maxWidth="650px"
    minHeight="auto"
    maxHeight="650px"
    height="auto"
    overlayAlign="right"
    overlayPadding="0 11% 0 0"
>
    <div class="procedure-form-container">
        <h3>Добавление физиотерапевтической процедуры</h3>
        
        <!-- Выбор типа процедуры -->
        <div class="form-group">
            <label for="procedure-type">Тип процедуры:</label>
            <select 
                id="procedure-type" 
                class="form-control" 
                value={procedureForm.type} 
                on:change={handleProcedureTypeChange}
            >
                {#each availableProcedures as procedure}
                    <option value={procedure.id}>{procedure.name}</option>
                {/each}
            </select>
        </div>
        
        <!-- Настройки времени (общие для всех процедур) -->
        <div class="form-group">
            <label>Время процедуры (мин):</label>
            <div class="time-options">
                {#each presetTimes as time}
                    <button 
                        class="time-btn {procedureForm.time === time ? 'active' : ''}" 
                        on:click={() => handleTimeSelection(time)}
                    >
                        {time}
                    </button>
                {/each}
            </div>
        </div>
        
        <!-- Дополнительные настройки для электрофореза -->
        {#if !isTimeOnly}
            <div class="form-group">
                <label for="polarity">Полярность:</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input 
                            type="radio" 
                            name="polarity" 
                            value="положительная" 
                            bind:group={procedureForm.polarity}
                        />
                        Положительная (+)
                    </label>
                    <label class="radio-label">
                        <input 
                            type="radio" 
                            name="polarity" 
                            value="отрицательная" 
                            bind:group={procedureForm.polarity}
                        />
                        Отрицательная (-)
                    </label>
                </div>
            </div>
            
            <!-- Выбор использования растворителя, аналогичный препаратам -->
            <div class="form-group">
                <label>Использовать раствор:</label>
                <div class="radio-group">
                    <label class="radio-label">
                        <input 
                            type="radio" 
                            name="hasDiluent" 
                            value="нет"
                            bind:group={procedureForm.hasDiluent}
                        />
                        Нет
                    </label>
                    <label class="radio-label">
                        <input 
                            type="radio" 
                            name="hasDiluent" 
                            value="да"
                            bind:group={procedureForm.hasDiluent}
                        />
                        Да
                    </label>
                </div>
            </div>
            
            <!-- Блок растворителя, аналогичный блоку в препаратах -->
            {#if procedureForm.hasDiluent === 'да'}
                <div class="diluent-container">
                    <div class="diluent-row">
                        <select 
                            bind:value={procedureForm.diluent.type}
                            class="form-control diluent-select"
                        >
                            {#each solutionTypes as type}
                                <option value={type}>{type}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            {/if}
        {/if}
        
        <!-- Кнопки управления -->
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
    
    .procedure-form-container {
        padding: 15px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    label {
        display: block;
        margin-bottom: 8px;
        font-weight: 400;
        font-size: 16px !important;
        font-style: italic !important;
    }
    
    .form-control {
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px !important;
    }
    
    .time-options {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    
    .time-btn {
        padding: 8px 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f8f9fa;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .time-btn:hover {
        background-color: #e9ecef;
    }
    
    .time-btn.active {
        background-color: #3FAECA;
        color: white;
        border-color: #3FAECA;
    }
    
    .radio-group {
        display: flex;
        gap: 20px;
    }
    
    .radio-label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        font-size: 18px !important;
        font-style: normal !important;
    }
    
    /* Стили для блока растворителя, аналогичные препаратам */
    .diluent-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
        margin-top: 10px;
    }
    
    .diluent-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .diluent-select {
        flex: 3;
    }
    
    .diluent-dosage {
        flex: 2;
    }
    
    .button-row {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 30px;
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
</style>