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
    const presetTimes = [5, 10, 15, 20, 25, 30, 35, 40];
    
    // Специальные значения времени для лазера
    const laserTimes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    // Начальное состояние формы
    let procedureForm = {
        type: availableProcedures[0].id,
        time: 20,
        polarity: 'положительная',
        hasDiluent: 'нет',
        diluent: {
            type: solutionTypes[0],
            dosage: ''
        },
        comment: '',
        frequency: ''
    };

    $: commentCharsLeft = 30 - (procedureForm.comment ? procedureForm.comment.length : 0);
    $: isCommentLengthLow = commentCharsLeft < 5;

    // Получаем текущую выбранную процедуру
    $: selectedProcedure = availableProcedures.find(p => p.id === procedureForm.type);
    $: isTimeOnly = selectedProcedure?.timeOnly || false;
    $: isLaserSelected = procedureForm.type === 'laser';
    $: isVLOKSelected = procedureForm.type === 'vlok';

    $: isFrequencyValid = !isVLOKSelected || (procedureForm.frequency && procedureForm.frequency.trim() !== '');

    // Общая проверка валидности формы, которая обновляется при изменении любых зависимостей
    $: isFormValid = (
        procedureForm.type && 
        procedureForm.time > 0 && 
        isFrequencyValid &&
        (procedureForm.type !== 'electrophoresis' || procedureForm.polarity) &&
        (procedureForm.type !== 'electrophoresis' || procedureForm.hasDiluent !== 'да' || procedureForm.diluent.type) &&
        (procedureForm.comment ? procedureForm.comment.length <= 30 : true)
    );

    function handleSave() {
        if (!isFormValid) return;

        // Формируем данные для сохранения
        const procedureData = {
            id: 'procedure_' + Date.now(),
            type: procedureForm.type,
            name: selectedProcedure.name,
            isTimeOnly: isTimeOnly,
            time: procedureForm.time,
            comment: procedureForm.comment || '',
            frequency: isVLOKSelected ? procedureForm.frequency : null,
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
        
        // Сбрасываем комментарий при смене типа процедуры
        procedureForm.comment = '';
        
        // Сбрасываем частоту при смене типа процедуры
        procedureForm.frequency = '';
        
        // Устанавливаем время по умолчанию в зависимости от типа процедуры
        if (procedureForm.type === 'laser') {
            procedureForm.time = 5; // Значение по умолчанию для лазера
        } else if (procedureForm.type === 'vlok') {
            procedureForm.time = 15; // Значение по умолчанию для ВЛОК
        } else {
            procedureForm.time = 20; // Значение по умолчанию для других процедур
        }
    }

    function handleTimeSelection(time) {
        procedureForm.time = time;
    }
    
    // Ограничение ввода комментария до 30 символов
    function limitCommentLength(event) {
        const input = event.target;
        if (input.value.length > 30) {
            input.value = input.value.slice(0, 30);
            procedureForm.comment = input.value;
        }
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
        
        <!-- Настройки времени (общие для всех процедур кроме лазера) -->
        {#if !isLaserSelected}
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
        {:else}
            <!-- Специальные настройки времени для лазера -->
            <div class="form-group">
                <label>Время процедуры (мин):</label>
                <div class="time-options laser-time-options">
                    {#each laserTimes as time}
                        <button 
                            class="time-btn laser-time-btn {procedureForm.time === time ? 'active' : ''}" 
                            on:click={() => handleTimeSelection(time)}
                        >
                            {time}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        {#if isVLOKSelected}
            <div class="form-group">
                <label for="procedure-frequency">
                    Частота (Гц): <span class="required">*</span>
                </label>
                <input 
                    type="text" 
                    id="procedure-frequency" 
                    class="form-control" 
                    bind:value={procedureForm.frequency}
                    placeholder="Введите частоту..."
                    required
                    class:invalid={isVLOKSelected && !isFrequencyValid}
                />
                {#if isVLOKSelected && !isFrequencyValid}
                    <div class="validation-error">Частота обязательна для ВЛОК</div>
                {/if}
            </div>
        {/if}

        <div class="form-group">
            <label for="procedure-comment">
                Комментарий
                <span class="info" title="В этом поле можно указать локализацию воздействия и другие уточнения">
                    <svg fill="#3faeca" width="16" height="16" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1229.93 594.767c36.644 37.975 50.015 91.328 43.72 142.909-9.128 74.877-30.737 144.983-56.093 215.657-27.129 75.623-54.66 151.09-82.332 226.512-44.263 120.685-88.874 241.237-132.65 362.1-10.877 30.018-18.635 62.072-21.732 93.784-3.376 34.532 21.462 51.526 52.648 36.203 24.977-12.278 49.288-28.992 68.845-48.768 31.952-32.31 63.766-64.776 94.805-97.98 15.515-16.605 30.86-33.397 45.912-50.438 11.993-13.583 24.318-34.02 40.779-42.28 31.17-15.642 55.226 22.846 49.582 49.794-5.39 25.773-23.135 48.383-39.462 68.957l-1.123 1.416a1559.53 1559.53 0 0 0-4.43 5.6c-54.87 69.795-115.043 137.088-183.307 193.977-67.103 55.77-141.607 103.216-223.428 133.98-26.65 10.016-53.957 18.253-81.713 24.563-53.585 12.192-112.798 11.283-167.56 3.333-40.151-5.828-76.246-31.44-93.264-68.707-29.544-64.698-8.98-144.595 6.295-210.45 18.712-80.625 46.8-157.388 75.493-234.619l2.18-5.867 1.092-2.934 2.182-5.87 2.182-5.873c33.254-89.517 67.436-178.676 101.727-267.797 31.294-81.296 62.72-162.537 93.69-243.95 2.364-6.216 5.004-12.389 7.669-18.558l1-2.313c6.835-15.806 13.631-31.617 16.176-48.092 6.109-39.537-22.406-74.738-61.985-51.947-68.42 39.4-119.656 97.992-170.437 156.944l-6.175 7.17c-15.78 18.323-31.582 36.607-47.908 54.286-16.089 17.43-35.243 39.04-62.907 19.07-29.521-21.308-20.765-48.637-3.987-71.785 93.18-128.58 205.056-248.86 350.86-316.783 60.932-28.386 146.113-57.285 225.882-58.233 59.802-.707 116.561 14.29 157.774 56.99Zm92.038-579.94c76.703 29.846 118.04 96.533 118.032 190.417-.008 169.189-182.758 284.908-335.53 212.455-78.956-37.446-117.358-126.202-98.219-227.002 26.494-139.598 183.78-227.203 315.717-175.87Z" fill-rule="evenodd"/>
                    </svg>
                </span>
            </label>
            <div class="comment-input-container">
                <input 
                    type="text" 
                    id="procedure-comment" 
                    class="form-control comment-input" 
                    bind:value={procedureForm.comment}
                    placeholder="Введите комментарий..."
                    maxlength="30"
                    on:input={limitCommentLength}
                />
                <div class="comment-char-counter {isCommentLengthLow ? 'low-chars' : ''}">
                    {commentCharsLeft}
                </div>
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
        display: flex;
        align-items: center;
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

    .laser-time-options {
        max-width: 100%;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
    }

    .laser-time-btn {
        padding: 6px 10px;
        font-size: 14px;
    }

    .comment-input-container {
        position: relative;
        display: flex;
        align-items: center;
        max-width: 50%;
    }

    .comment-input {
        padding-right: 40px;
    }

    .comment-char-counter {
        position: absolute;
        right: 10px;
        font-size: 12px;
        color: #6c757d;
        background-color: #f8f9fa;
        padding: 2px 5px;
        border-radius: 3px;
    }

    .low-chars {
        color: #dc3545;
        font-weight: bold;
    }

    .info {
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        margin-left: 4px;
        vertical-align: middle;
    }

    .required {
        color: #dc3545;
        margin-left: 3px;
    }

    .validation-error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
    }

    .invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

    .form-control:focus.invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
    }

</style>