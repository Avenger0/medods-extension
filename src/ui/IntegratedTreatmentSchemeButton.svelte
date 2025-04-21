<!-- src/ui/IntegratedTreatmentSchemeButton.svelte -->
<script>
    // Импортируем компоненты
    import ExistingSchemes from './ExistingSchemes.svelte';
    import MedicationFormModal from './MedicationFormModal.svelte';
    import CreateSchemeButton from './CreateSchemeButton.svelte';
    import TreatmentModal from './TreatmentModal.svelte';
    
    // Пропсы для интеграции
    export let serviceId = null;
    export let medicalCardId = null;
    
    // Стилевые пропсы - модальное окно
    export let modalMaxWidth = '1100px';
    export let modalBgColor = 'white';
    export let modalBorderRadius = '8px';
    export let modalOverlayColor = 'rgba(0,0,0,0.2)';
    
    // Стилевые пропсы - список схем
    export let schemesBgColor = '#f8f9fa';
    export let schemesTitleColor = '#333';
    export let schemesBorderColor = '#e9ecef';
    
    // Стилевые пропсы - элементы схем
    export let schemeItemBgColor = '#f8f9fa';
    export let schemeItemHoverColor = '#e9ecef';
    export let schemeItemBorderColor = '#e9ecef';
    export let schemeTitleColor = '#333';
    export let schemeDetailsColor = '#6c757d';
    
    // Стилевые пропсы - кнопки действий со схемами
    export let useButtonBgColor = '#007bff';
    export let useButtonTextColor = '#fff';
    export let editButtonBgColor = '#6c757d';
    export let editButtonTextColor = '#fff';
    
    // Стилевые пропсы - кнопки создания новой схемы
    export let createButtonBgColor = '#28a745';
    export let createButtonTextColor = '#fff';
    export let createButtonHoverColor = '#218838';
    export let createButtonBorderRadius = '4px';
    
    // Стилевые пропсы - главная кнопка
    export let mainButtonBgColor = '#007bff';
    export let mainButtonTextColor = 'white';
    export let mainButtonBorderRadius = '4px';
    
    // Состояние интерфейса
    let isModalOpen = false;
    let isCreatingNewScheme = false;
    let isMedicationFormOpen = false;
    let isLoading = false;
    let validationError = '';

    let requireConfirmation = false;

    $: requireConfirmation = selectedMedications.length > 0 && isCreatingNewScheme;

    // Данные препаратов и форм
    let medications = [
        { id: 1, name: 'Цефтриаксон', type: 'в/м' },
        { id: 2, name: 'Метронидазол', type: 'в/в' },
        { id: 3, name: 'Ибупрофен', type: 'в/м' }
    ];
    
    // Текущая форма препарата
    let currentMedicationForm = {
        medication: medications[0],
        administrationType: 'в/м',
        dosage: '',
        hasDiluent: 'нет',
        diluents: []
    };
    
    // ID редактируемого препарата
    let editingMedicationId = null;
    let currentEditingScheme = null;
    
    // Выбранные препараты и расписание
    let selectedMedications = [];
    let selectedDays = {};
    
    // Примеры существующих схем
    let existingSchemes = [

    ];
    
    // Проверка валидности расписания
    $: isScheduleValid = selectedMedications.length > 0 && 
        selectedMedications.every(medication => 
            selectedDays[medication.id] && 
            Object.values(selectedDays[medication.id]).some(daySet => daySet.size > 0)
        );
    
    // Функция для открытия/закрытия главного модального окна
    function toggleModal() {
        isModalOpen = !isModalOpen;
        if (!isModalOpen) {
            resetState();
        }
    }
    
    // Сброс состояния при закрытии
    function resetState() {
        currentMedicationForm = getEmptyMedicationForm();
        selectedMedications = [];
        selectedDays = {};
        isCreatingNewScheme = false;
        currentEditingScheme = null;
        validationError = '';
    }
    
    // Создание пустой формы препарата
    function getEmptyMedicationForm() {
        return {
            medication: medications[0],
            administrationType: 'в/м',
            dosage: '',
            hasDiluent: 'нет',
            diluents: []
        };
    }
    
    // Открыть форму добавления нового препарата
    function openNewMedicationForm() {
        currentMedicationForm = getEmptyMedicationForm();
        editingMedicationId = null;
        isMedicationFormOpen = true;
    }
    
    // Редактирование препарата
    function editMedication(medication) {
        currentMedicationForm = {
            medication: medications.find(m => m.name === medication.medication.name) || medications[0],
            administrationType: medication.administrationType,
            dosage: medication.dosage,
            hasDiluent: medication.diluents && medication.diluents.length > 0 ? 'да' : 'нет',
            // Создаем глубокую копию массива растворителей
            diluents: medication.diluents ? medication.diluents.map(d => ({...d})) : []
        };
        
        editingMedicationId = medication.id;
        isMedicationFormOpen = true;
    }
    
    // Удаление препарата
    function deleteMedication(medicationId) {
        selectedMedications = selectedMedications.filter(med => med.id !== medicationId);
        
        if (selectedDays[medicationId]) {
            delete selectedDays[medicationId];
            selectedDays = {...selectedDays}; // Триггерим реактивность
        }
        
        validationError = '';
    }
    
    // Обработка сохранения препарата
    function handleSaveMedication(formData) {
        if (editingMedicationId) {
            // Обновление существующего препарата
            selectedMedications = selectedMedications.map(med => {
                if (med.id === editingMedicationId) {
                    return {
                        ...formData,
                        id: med.id
                    };
                }
                return med;
            });
            
            editingMedicationId = null;
        } else {
            // Добавление нового препарата
            const newMedication = { 
                ...formData,
                id: Date.now() // уникальный идентификатор
            };
            
            selectedMedications = [...selectedMedications, newMedication];
        }
        
        isMedicationFormOpen = false;
    }
    
    // Переключение дней в расписании
    function toggleDay(medicationId, week, day) {
        if (!selectedDays[medicationId]) {
            selectedDays[medicationId] = {};
        }
        
        if (!selectedDays[medicationId][week]) {
            selectedDays[medicationId][week] = new Set();
        }

        if (selectedDays[medicationId][week].has(day)) {
            selectedDays[medicationId][week].delete(day);
        } else {
            selectedDays[medicationId][week].add(day);
        }

        selectedDays = {...selectedDays}; // Триггерим реактивность
        validationError = '';
    }
    
    // Выбор существующей схемы
    function selectExistingScheme(scheme) {
        // Загрузка препаратов схемы
        selectedMedications = scheme.medications.map(med => {
            const medId = med.id || Date.now() + Math.random();
            
            return {
                id: medId,
                medication: { name: med.name },
                administrationType: med.administrationType,
                dosage: med.dosage,
                hasDiluent: med.diluents && med.diluents.length > 0 ? 'да' : 'нет',
                // Создаем глубокую копию растворителей
                diluents: med.diluents ? med.diluents.map(d => ({...d})) : []
            };
        });
        
        // Восстанавливаем расписание
        selectedDays = {};
        
        if (scheme.schedule) {
            Object.entries(scheme.schedule).forEach(([medId, weeks]) => {
                selectedDays[medId] = {};
                
                Object.entries(weeks).forEach(([week, days]) => {
                    selectedDays[medId][week] = new Set(days);
                });
            });
        }
        
        isCreatingNewScheme = true;
        validationError = '';
    }
    
    // Начать создание новой схемы
    function startNewScheme() {
        isCreatingNewScheme = true;
        selectedMedications = [];
        selectedDays = {};
        validationError = '';
    }
    
    // Редактирование существующей схемы
    function editExistingScheme(scheme) {
        selectExistingScheme(scheme); // Переиспользуем функцию выбора
        currentEditingScheme = scheme;
    }
    
    // Публикация схемы лечения
    function publishTreatmentScheme() {
        // Проверка валидности расписания
        const medicationsWithoutSchedule = selectedMedications.filter(medication => 
            !selectedDays[medication.id] || 
            !Object.values(selectedDays[medication.id]).some(daySet => daySet.size > 0)
        );

        if (medicationsWithoutSchedule.length > 0) {
            const medicationNames = medicationsWithoutSchedule.map(med => med.medication.name).join(', ');
            validationError = `Не выбрано ни одного дня для препаратов: ${medicationNames}`;
            return;
        }
        
        try {
            isLoading = true;
            
            // Преобразуем Set обратно в массивы для хранения
            const formattedSchedule = {};
            
            Object.entries(selectedDays).forEach(([medId, weeks]) => {
                formattedSchedule[medId] = {};
                
                Object.entries(weeks).forEach(([week, days]) => {
                    formattedSchedule[medId][week] = Array.from(days);
                });
            });
            
            // Создание новой схемы или редакции
            const newScheme = {
                id: Date.now(),
                name: currentEditingScheme 
                    ? `${currentEditingScheme.name} (редакция от ${new Date().toLocaleDateString()})` 
                    : `Схема лечения от ${new Date().toLocaleDateString()}`,
                medications: selectedMedications.map(med => ({
                    id: med.id,
                    name: med.medication.name,
                    dosage: med.dosage,
                    administrationType: med.administrationType,
                    // Глубокая копия растворителей
                    diluents: med.diluents ? med.diluents.map(d => ({...d})) : []
                })),
                createdFor: {
                    serviceId,
                    medicalCardId
                },
                createdAt: new Date().toISOString(),
                isRevision: !!currentEditingScheme,
                originalSchemeId: currentEditingScheme ? currentEditingScheme.id : null,
                schedule: formattedSchedule
            };
            
            // Имитация сохранения (в реальном проекте здесь будет API-вызов)
            setTimeout(() => {
                existingSchemes = [...existingSchemes, newScheme];
                isLoading = false;
                toggleModal();
            }, 1000);
            
        } catch (err) {
            console.error('Ошибка публикации схемы:', err);
            isLoading = false;
        }
    }
    
    // Закрытие модального окна с формой препарата
    function closeMedicationForm() {
        isMedicationFormOpen = false;
        editingMedicationId = null;
    }

    function goBackToSchemes() {
        isCreatingNewScheme = false;
    }
</script>

<div class="treatment-scheme-container">
    <!-- Главная кнопка -->
    <button 
        on:click={toggleModal} 
        class="treatment-scheme-button"
        style="--bg-color: {mainButtonBgColor}; --text-color: {mainButtonTextColor}; --border-radius: {mainButtonBorderRadius};"
    >
        📋 Схема лечения
    </button>

    <!-- Основное модальное окно -->
    <TreatmentModal
        isOpen={isModalOpen}
        onClose={toggleModal}
        maxWidth={modalMaxWidth}
        backgroundColor={modalBgColor}
        borderRadius={modalBorderRadius}
        overlayColor={modalOverlayColor}
        confirmBeforeClose={requireConfirmation}
    >
        <div class="modal-grid">
            <!-- Колонка с формой/списком схем -->
            
            {#if !isCreatingNewScheme}
                <div class="medication-form-column">
                    <!-- Список существующих схем -->
                    <ExistingSchemes 
                        schemes={existingSchemes}
                        onSelect={selectExistingScheme}
                        onEdit={editExistingScheme}
                        bgColor={schemesBgColor}
                        titleColor={schemesTitleColor}
                        borderColor={schemesBorderColor}
                    />

                    <!-- Кнопка создания схемы -->
                    <CreateSchemeButton 
                        onClick={startNewScheme}
                        buttonBgColor={createButtonBgColor}
                        buttonTextColor={createButtonTextColor}
                        buttonHoverColor={createButtonHoverColor}
                        buttonBorderRadius={createButtonBorderRadius}
                    />
                </div>
            {/if}
            

            <!-- График приема препаратов -->
            {#if isCreatingNewScheme}
                <div class="schedule-column">
                    <div class="schedule-head">
                        <h3>Создание новой схемы лечения</h3>

                        {#if selectedMedications.length > 0}
                            {#if selectedMedications.some(med => !selectedDays[med.id] || !Object.values(selectedDays[med.id]).some(daySet => daySet.size > 0))}
                                <div class="validation-error">
                                    ⚠️ Необходимо выбрать дни приема для всех препаратов
                                </div>
                            {/if}
                        {/if}
                    </div>
                    
                    <div class="schedule-table">
                        <!-- Заголовки дней -->
                        <div class="schedule-header">
                            <div class="medication-column">Препарат</div>
                            {#each [1,2,3,4,5,6,7,8,9,10] as day}
                                <div class="day-header">{day}</div>
                            {/each}
                        </div>
                        
                        {#if selectedMedications.length > 0}
                            <!-- Строки с препаратами -->
                            {#each selectedMedications as medication (medication.id)}
                                <div class="schedule-row {!selectedDays[medication.id] || !Object.values(selectedDays[medication.id]).some(daySet => daySet.size > 0) ? 'error-highlight' : ''}">
                                    <div class="medication-cell">
                                        <div class="medication-title">
                                            <strong>{medication.medication.name}</strong> {medication.administrationType}, {medication.dosage}
                                            {#if medication.hasDiluent === 'да' && medication.diluents && medication.diluents.length > 0}
                                                {#each medication.diluents as diluent}
                                                    {' + '}{diluent.type} ({diluent.dosage}) 
                                                {/each}
                                            {/if}
                                        </div>
                                        <div class="medication-actions">
                                            <button class="btn-edit-medication" on:click={() => editMedication(medication)}>
                                                ✏️
                                            </button>
                                            <button class="btn-delete-medication" on:click={() => deleteMedication(medication.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Ячейки дней -->
                                    {#each [1,2,3,4,5,6,7,8,9,10] as day}
                                        <div 
                                            class="schedule-cell" 
                                            on:click={() => toggleDay(medication.id, 1, day)}
                                            class:selected={selectedDays[medication.id] && 
                                                            selectedDays[medication.id][1] && 
                                                            selectedDays[medication.id][1].has(day)}
                                        ></div>
                                    {/each}
                                </div>
                            {/each}
                        {:else}
                            <p class="empty">Пока назначений нет</p>
                        {/if}

                    </div>

                    <!-- Кнопки действий -->
                    <div class="schedule-actions">
                        <button class="btn-back" on:click={goBackToSchemes}>← Назад</button>

                        <button 
                            class="btn-add-medication" 
                            on:click={openNewMedicationForm}
                        >
                            + Добавить препарат
                        </button>

                        <button 
                            class="btn-continue" 
                            disabled={selectedMedications.length === 0 || isLoading || !isScheduleValid}
                            on:click={publishTreatmentScheme}
                        >
                            {#if isLoading}
                                <span class="spinner"></span> Сохранение...
                            {:else}
                                Добавить схему
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </TreatmentModal>


    
    <MedicationFormModal
        isOpen={isMedicationFormOpen}
        onClose={closeMedicationForm}
        medications={medications}
        medicationForm={currentMedicationForm}
        isEditing={!!editingMedicationId}
        onSave={handleSaveMedication}
        overlayColor="rgba(0,0,0,0)"
    />
</div>

<style>
    h3{
        font-size: 21px;
        margin: 0 0 15px 0;
        padding: 0;
    }

    .schedule-head{
        display: flex;
        align-items: center;
        justify-content: space-around;
    }

    .empty{
        text-align: center;
        font-size: 18px;
        padding: 15px;
    }

    .treatment-scheme-button {
        background-color: var(--bg-color, #007bff);
        color: var(--text-color, white);
        border: none;
        padding: 8px 12px;
        border-radius: var(--border-radius, 4px);
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .treatment-scheme-button:hover {
        opacity: 0.9;
    }

    .modal-grid {
        display: grid;
        gap: 20px;
    }

    .medication-form-column, 
    .schedule-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .schedule-table {
        border: 1px solid #ddd;
    }

    .schedule-header {
        display: grid;
        grid-template-columns: 400px repeat(10, 1fr);
        background-color: #f0f0f0;
        text-align: center;
    }

    .day-header, 
    .medication-column {
        padding: 5px;
        border-right: 1px solid #ddd;
    }

    .schedule-row {
        display: grid;
        grid-template-columns: 400px repeat(10, 1fr);
    }

    .medication-cell {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        border-right: 1px solid #ddd;
        background-color: #f8f9fa;
    }

    .schedule-cell {
        border: 1px solid #ddd;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .schedule-cell:hover {
        background-color: rgba(0,123,255,0.1);
    }

    .schedule-cell.selected {
        background-color: #007bff;
    }

    .error-highlight .medication-cell {
        background-color: #fff4f4;
        border-left: 3px solid #dc3545;
    }

    .validation-error {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 4px;
        border-left: 4px solid #ffc107;
        font-size: 14px;
    }

    .medication-actions {
        margin-top: 5px;
        display: flex;
        gap: 5px;
    }

    .btn-edit-medication, 
    .btn-delete-medication {
        padding: 2px 5px;
        font-size: 12px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        background-color: transparent;
    }

    .btn-edit-medication:hover {
        background-color: #f0f0f0;
    }

    .btn-delete-medication:hover {
        background-color: #fff5f5;
    }

    .schedule-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
    }

    .btn-continue {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
    }

    .btn-continue:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-add-medication {
        background-color: #3FAECA;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
    }

    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }

    .btn-back {
        background-color: transparent;
        border: none;
        padding: 5px 10px;
        font-size: 14px;
        color: #555;
        cursor: pointer;
        margin-right: 10px;
        border-radius: 4px;
        font-size: 18px;
    }

    .btn-back:hover {
        background-color: #f0f0f0;
    }

    .medication-title{
        font-size: 15px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>