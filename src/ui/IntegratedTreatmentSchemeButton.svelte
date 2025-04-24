<!-- src/ui/IntegratedTreatmentSchemeButton.svelte -->
<script>
    // Импортируем компоненты
    import ExistingSchemes from './ExistingSchemes.svelte';
    import MedicationFormModal from './MedicationFormModal.svelte';
    import CreateSchemeButton from './CreateSchemeButton.svelte';
    import TreatmentModal from './TreatmentModal.svelte';
    import { medicationService, treatmentService } from '../utils/api.js';
    
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
    let medications = [];
    let isLoadingMedications = false;

    // Вызываем загрузку при первом открытии модального окна
    $: if (isModalOpen && medications.length === 0 && !isLoadingMedications) {
        loadMedications();
    }

    // Функция для загрузки медикаментов с API
    async function loadMedications() {
        try {
            isLoadingMedications = true;
            const response = await medicationService.cachedRequest('getAvailableMedications', {});
            medications = response.medications.map(med => ({
                id: med.id,
                name: med.shortName,
                fullName: med.fullName,
                type: med.type && med.type.length > 0 ? med.type[0] : 'в/м',
                availableTypes: med.type || ['в/м', 'в/в']
            }));
        } catch (error) {
            console.error('Ошибка загрузки медикаментов:', error);
        } finally {
            isLoadingMedications = false;
        }
    }
    
    // Текущая форма препарата
    let currentMedicationForm = {
        medication: null,
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
    
    let existingSchemes = [];
    let isLoadingSchematics = false;
    let schematicsError = null;



    // Замените существующую логику загрузки схем
    let isFirstLoad = true;

    // Добавьте проверку на наличие запроса в процессе
    async function loadSchematics() {
        if (isLoadingSchematics) return; // Предотвращаем повторный запрос, если загрузка уже идет
        
        try {
            isLoadingSchematics = true;
            schematicsError = null;
            console.log(`Загрузка схем для приема ${serviceId}`);
            
            const response = await treatmentService.getSchematicsForService(serviceId);
            
            if (response && response.schematics && Array.isArray(response.schematics)) {
                existingSchemes = response.schematics;
                console.log(`Загружено ${existingSchemes.length} схем`);
            } else {
                existingSchemes = [];
                console.warn('Неверный формат данных:', response);
            }
        } catch (error) {
            console.error('Ошибка загрузки схем:', error);
            existingSchemes = [];
        } finally {
            isLoadingSchematics = false;
        }
    }
        
    // Проверка валидности расписания
    $: isScheduleValid = selectedMedications.length > 0 && 
        selectedMedications.every(medication => 
            selectedDays[medication.id] && 
            Object.values(selectedDays[medication.id]).some(daySet => daySet.size > 0)
        );
    
    // Функция для открытия/закрытия главного модального окна
    function toggleModal() {
        isModalOpen = !isModalOpen;
        
        if (isModalOpen && serviceId) {
            loadSchematics();
        }
        
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
        isFirstLoad = true; // Сбрасываем флаг при закрытии модального окна
    }
        
    // Создание пустой формы препарата
    function getEmptyMedicationForm() {
        return {
            selectedMedications: [], // Всегда возвращаем массив
            administrationType: 'в/м',
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
// Редактирование препарата
function editMedication(medication) {
    // Защита от undefined
    let medsToPut = [];
    
    if (medication.selectedMedications && Array.isArray(medication.selectedMedications)) {
        medsToPut = [...medication.selectedMedications]; // Глубокая копия
    } else if (medication.medication) {
        // Если нет selectedMedications, создаем из medication
        medsToPut = [{
            id: medication.medication.id || '',
            name: medication.medication.name || '',
            fullName: medication.medication.fullName || '',
            manufacturer: medication.medication.manufacturer || '',
            dosageForm: medication.medication.dosageForm || '',
            concentration: medication.medication.concentration || '',
            dosage: medication.dosage || '' // Используем общую дозировку
        }];
    }
    
    currentMedicationForm = {
        selectedMedications: medsToPut,
        administrationType: medication.administrationType,
        hasDiluent: medication.diluents && medication.diluents.length > 0 ? 'да' : 'нет',
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
    // Исправим функцию handleSaveMedication
// Обработка сохранения препарата
function handleSaveMedication(formData) {
    // Защита от undefined
    if (!formData || !formData.selectedMedications) {
        console.error('Отсутствуют данные о выбранных препаратах');
        return;
    }

    if (editingMedicationId) {
        // Обновление существующего препарата
        selectedMedications = selectedMedications.map(med => {
            if (med.id === editingMedicationId) {
                // Проверяем наличие массива selectedMedications
                const medsArray = formData.selectedMedications || [];
                
                // Формируем название препарата с дозировкой
                const medNameWithDosage = medsArray.length > 0 
                    ? medsArray.map(m => `${m.name || ''} (${m.dosage || ''})`) 
                    : 'Неизвестный препарат';
                
                return {
                    ...med,
                    selectedMedications: medsArray, 
                    medication: {
                        name: medNameWithDosage.join(' + ')
                    },
                    administrationType: formData.administrationType,
                    dosage: "", // Общее поле дозировки не используем
                    hasDiluent: formData.hasDiluent,
                    diluents: formData.diluents ? [...formData.diluents] : []
                };
            }
            return med;
        });
        
        editingMedicationId = null;
    } else {
        // Защита от пустого массива
        if (formData.selectedMedications.length === 0) {
            console.warn('Попытка добавить препарат без выбранных медикаментов');
            return;
        }
        
        // Формируем название препарата с дозировкой
        const medNameWithDosage = formData.selectedMedications.map(m => 
            `${m.name || ''} (${m.dosage || ''})`
        );
        
        // Добавление нового "коктейля" препаратов
        const newMedication = {
            id: Date.now() + Math.random(),
            selectedMedications: formData.selectedMedications,
            medication: {
                id: formData.selectedMedications[0]?.id || Date.now(), 
                name: medNameWithDosage.join(' + ')
            },
            administrationType: formData.administrationType,
            dosage: "", // Общее поле дозировки не используем
            hasDiluent: formData.hasDiluent,
            diluents: formData.diluents ? [...formData.diluents] : []
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
    async function publishTreatmentScheme() {
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
                id: currentEditingScheme ? Date.now() : Date.now(),
                name: (() => {
                    if (!currentEditingScheme) {
                        // Новая схема
                        return `Схема лечения от ${new Date().toLocaleDateString()}`;
                    }
                    
                    // Определяем базовое имя схемы (без редакций)
                    let nameBase = currentEditingScheme.name;
                    // Образец регулярного выражения для поиска пометки о редакции
                    const revisionRegex = /\(ред. от [\d\.]+( #\d+)?\)/;
                    
                    if (revisionRegex.test(nameBase)) {
                        // Удаляем пометку о редакции из имени
                        nameBase = nameBase.replace(revisionRegex, '').trim();
                    }
                    
                    // Определяем номер редакции
                    let revisionNumber = 1; // По умолчанию первая редакция
                    
                    // Если у оригинальной схемы уже есть поле revisionNumber, увеличиваем его
                    if (currentEditingScheme.revisionNumber) {
                        revisionNumber = currentEditingScheme.revisionNumber + 1;
                    } else if (currentEditingScheme.isRevision) {
                        // Если это редакция, но нет номера, пытаемся извлечь из имени
                        const match = currentEditingScheme.name.match(/#(\d+)/);
                        if (match && match[1]) {
                            revisionNumber = parseInt(match[1], 10) + 1;
                        }
                    }
                    
                    return `${nameBase} (ред. от ${new Date().toLocaleDateString()} #${revisionNumber})`;
                })(),
                medications: selectedMedications.map(med => ({
                    id: med.id,
                    name: med.medication.name,
                    dosage: med.dosage,
                    administrationType: med.administrationType,
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
            
            // Отправляем на сервер
            const result = await treatmentService.saveSchematic(newScheme);
            
            if (result && result.success) {
                    // Перезагружаем страницу после успешного сохранения
                    setTimeout(() => {
                        window.location.reload();
                    }, 500); // Небольшая задержка для улучшения UX
                } else {
                    throw new Error(result?.message || "Не удалось сохранить схему");
                }
            
        } catch (err) {
            console.error('Ошибка публикации схемы:', err);
            validationError = `Ошибка сохранения: ${err.message || "Пожалуйста, попробуйте позже"}`;
            isLoading = false;
            
            // Показываем уведомление об ошибке пользователю
            alert(`Не удалось сохранить схему лечения. Пожалуйста, попробуйте позже.\n\nТехническая информация: ${err.message}`);
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
        overlayAlign="right"
        overlayPadding="0 75px 0 0"
        isOpen={isModalOpen}
        onClose={toggleModal}
        maxWidth={modalMaxWidth}
        backgroundColor={modalBgColor}
        borderRadius={modalBorderRadius}
        overlayColor={modalOverlayColor}
        confirmBeforeClose={requireConfirmation}
        minHeight="450px"
        maxHeight="450px"
        height="100%"
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
                        isLoading={isLoadingSchematics}
                        error={schematicsError}
                    />
                    <div class="btn-action">
                        <CreateSchemeButton 
                            onClick={startNewScheme}
                            buttonBgColor={createButtonBgColor}
                            buttonTextColor={createButtonTextColor}
                            buttonHoverColor={createButtonHoverColor}
                            buttonBorderRadius={createButtonBorderRadius}
                        />
                    </div>
                </div>
            {/if}
            

            <!-- График приема препаратов -->
            {#if isCreatingNewScheme}
                <div class="schedule-column">
                    <div class="schedule-top">
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
                                {#each [1,2,3,4,5,6,7,8,9,10,11,12,13,14] as day}
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
                                        {#each [1,2,3,4,5,6,7,8,9,10,11,12,13,14] as day}
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
                    </div>

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

    .btn-action{
        text-align: center;
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
        height: 100%;
    }

    .medication-form-column, 
    .schedule-column {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
    }

    .schedule-table {
        border: 1px solid #ddd;
    }

    .schedule-header {
        display: grid;
        grid-template-columns: 400px repeat(14, 1fr);
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
        grid-template-columns: 400px repeat(14, 1fr);
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