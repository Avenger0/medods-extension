<!-- src/ui/MedicationFormModal.svelte -->
<script>
    import Select from 'svelte-select';
    import { medicationService } from '../utils/api.js';
    import TreatmentModal from './TreatmentModal.svelte';
    import AddMedicationModal from './AddMedicationModal.svelte';
    import DailyDosagePopup from './DailyDosagePopup.svelte';

    export let serviceId;
    export let isOpen = false;
    export let onClose;
    export let medicationForm = {
        selectedMedications: [], // Инициализируем как пустой массив
        administrationType: 'в/м',
        ivMethod: 'капельно', // Значение по умолчанию для метода в/в
        hasDiluent: 'нет',
        diluents: []
    };

    export let isEditing = false;
    export let onSave;
    
    let isAddMedicationModalOpen = false;
    let isDailyDosagePopupOpen = false;

    let loadedMedications = [];
    let isLoading = false;
    let loadError = null;
    
    let selectedValues = [];
    let selectComponent;

    let currentMedicationIndex = 0; 

    $: medicationsLimitReached = medicationForm?.selectedMedications?.length >= 5;

    // Обновление selectedValues при изменении medicationForm
    $: {
        if (medicationForm && medicationForm.medications && Array.isArray(medicationForm.medications)) {
            selectedValues = medicationForm.medications.map(med => 
                loadedMedications.find(m => m.id === med.id || m.name === med.name)
            ).filter(Boolean);
        } else if (medicationForm && medicationForm.medication) {
            // Обратная совместимость со старой структурой
            const matchedMed = loadedMedications.find(m => 
                m.id === medicationForm.medication.id || 
                m.name === medicationForm.medication.name
            );
            selectedValues = matchedMed ? [matchedMed] : [];
        } else {
            selectedValues = [];
        }
    }

    $: if (medicationForm.hasDiluent === 'нет' && medicationForm.diluents.length > 0) {
        medicationForm.diluents = [];
    }

    $: if (isOpen && medicationForm) {
        // Установим значение по умолчанию для ivMethod, если его нет, но выбрано в/в
        if (medicationForm.administrationType === 'в/в' && !medicationForm.ivMethod) {
            medicationForm.ivMethod = 'капельно';
        }
    }

    $: if (medicationForm) {
        // При изменении типа введения
        if (medicationForm.administrationType !== 'в/в') {
            medicationForm.ivMethod = null; // Сбрасываем метод, если это не в/в
        } else if (!medicationForm.ivMethod) {
            medicationForm.ivMethod = 'капельно'; // Устанавливаем по умолчанию, если это в/в
        }
    }

    // Загружаем лекарства при открытии модального окна
    $: if (isOpen && loadedMedications.length === 0) {
        loadMedications();
    }
    
    function handleMedicationAdded(newMedication) {
        // Добавляем новый препарат в список загруженных препаратов
        loadedMedications = [...loadedMedications, newMedication];
        // После добавления, можно автоматически выбрать этот препарат
        handleSingleMedicationSelect({detail: newMedication});
    }

    async function loadMedications() {
        try {
            isLoading = true;
            loadError = null;
            // Запрашиваем данные с сервера
            const result = await medicationService.getAvailableMedications(serviceId);
            console.log('Загружены препараты:', result);
            
            // Проверяем формат данных
            if (result && result.medications && Array.isArray(result.medications)) {
                loadedMedications = result.medications.map(med => ({
                    id: med.id,
                    value: med.id,
                    label: med.fullName || med.name,
                    shortName: med.shortName || med.name,
                    fullName: med.fullName,
                    types: med.type || ['в/м', 'в/в'],
                    ...med
                }));
            } else {
                loadError = "Неверный формат данных от API";
                console.error('Неверный формат данных:', result);
            }
        } catch (error) {
            console.error('Ошибка загрузки медикаментов:', error);
            loadError = error.message || "Ошибка загрузки данных";
        } finally {
            isLoading = false;
        }
    }

    let selectIsFocused = false;

     // Функция для фильтрации медикаментов при поиске
     function filterMedications(items, searchTerm) {
        if (!searchTerm) return items;
        return items.filter(item => 
            item.shortName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Реактивная проверка формы
    $: isFormValid = !!(
        medicationForm.selectedMedications && 
        medicationForm.selectedMedications.length > 0 &&
        medicationForm.selectedMedications.every(med => 
            // Проверяем, что либо есть обычная дозировка, либо есть дозировки по дням
            (med.dosage && med.dosage.trim() !== '' && !med.hasDailyDosages) || 
            (med.hasDailyDosages && med.dailyDosages && Object.keys(med.dailyDosages).length > 0)
        ) && 
        medicationForm.administrationType &&
        (medicationForm.administrationType !== 'в/в' || medicationForm.ivMethod) && // Проверяем, что для в/в указан метод
        (medicationForm.hasDiluent === 'нет' || 
        (medicationForm.hasDiluent === 'да' && 
        medicationForm.diluents.length > 0 && 
        medicationForm.diluents.every(d => d.type && d.dosage)))
    );
    
    function addDiluent() {
        medicationForm.diluents = [
            ...medicationForm.diluents,
            { id: String(Date.now()), type: 'физраствор', dosage: '' }
        ];
    }
    
    function removeDiluent(id) {
        medicationForm.diluents = medicationForm.diluents.filter(d => d.id !== id);
    }
    
    function handleSave() {
        if (isFormValid) {
            // Создаем глубокую копию с растворителями
            const formDataToSave = {
                ...medicationForm,
                ivMethod: medicationForm.administrationType === 'в/в' ? medicationForm.ivMethod : null,
                diluents: medicationForm.diluents.map(d => ({...d}))
            };
            onSave(formDataToSave);
        }
    }

    // Обработчик очистки выбора
    function handleClear() {
        // Сбрасываем ввод, но не трогаем уже выбранные препараты
        setTimeout(() => {
            const inputElements = document.querySelectorAll('.mep-medication-select input');
            inputElements.forEach(input => {
                input.value = '';
                input.blur();
            });
        }, 10);
    }

    // Функция для фильтрации доступных препаратов
    // (исключает уже выбранные)
    function getFilteredMedicationOptions() {
        // Защита от undefined
        const selectedMeds = medicationForm?.selectedMedications || [];
        
        const selectedIds = selectedMeds.map(med => med?.id || '');
        return loadedMedications.filter(med => !selectedIds.includes(med.id));
    }

    // Обработчик выбора одного препарата
    function handleSingleMedicationSelect(event) {
        if (!event.detail) return;
        
        // Если еще не достигнут лимит
        if (!medicationForm.selectedMedications) {
            medicationForm.selectedMedications = [];
        }
        
        if (medicationForm.selectedMedications.length < 5) {
            const med = event.detail;
            
            medicationForm.selectedMedications = [
                ...medicationForm.selectedMedications, 
                {
                    id: med.id,
                    name: med.shortName || med.label,
                    fullName: med.fullName || med.label,
                    manufacturer: med.manufacturer || '',
                    dosageForm: med.dosageForm || '',
                    concentration: med.concentration || '',
                    dosage: '',
                    dailyDosages: {},
                    hasDailyDosages: false
                }
            ];

            if (selectComponent) {
                selectComponent.handleClear();
            }
        }
        
        // Сбрасываем выбор для возможности выбора следующего препарата
        setTimeout(() => {
            const inputElements = document.querySelectorAll('.mep-medication-select input');
            inputElements.forEach(input => {
                input.value = '';
                input.blur();
            });
        }, 10);
    }

    function removeMedication(index) {
        medicationForm.selectedMedications = medicationForm.selectedMedications.filter((_, i) => i !== index);
    }

    function openDailyDosagePopup(index) {
        currentMedicationIndex = index;
        isDailyDosagePopupOpen = true;
    }

    function handleDailyDosageUpdate(event) {
        const { dailyDosages, hasDailyDosages } = event.detail;
        
        // Обновляем дозировки для текущего препарата
        medicationForm.selectedMedications = medicationForm.selectedMedications.map((med, index) => {
            if (index === currentMedicationIndex) {
                // Проверяем, что есть хотя бы одна непустая дозировка
                const hasValidDailyDosages = 
                    hasDailyDosages && 
                    dailyDosages && 
                    Object.values(dailyDosages).some(d => d && d.trim() !== '');
                
                // Если включены дозировки по дням, очищаем общую дозировку
                return {
                    ...med,
                    dailyDosages: hasValidDailyDosages ? dailyDosages : {},
                    hasDailyDosages: hasValidDailyDosages,
                    dosage: hasValidDailyDosages ? '' : med.dosage
                };
            }
            return med;
        });
    }

</script>

<TreatmentModal
    {isOpen}
    onClose={onClose}
    maxWidth="750px"
    minHeight="500px"
    maxHeight="650px"
    height="100%"
    overlayAlign="right"
    overlayPadding="0 11% 0 0"
>
    <div class="modal-grid">
        <div class="mep-flex">
            <div class="mep-head">
                <h3>
                    {isEditing ? 'Редактирование препарата' : 'Добавление препарата'}
                </h3>
                {#if isLoading}
                    <div class="loading-indicator">Загрузка списка препаратов...</div>
                {:else if loadError}
                    <div class="error-message">Ошибка: {loadError}</div>
                {:else}
                    <div class="mep-medication-select-container">
                        <div class="multi-select-container">
                            {#if medicationsLimitReached}
                                <div class="medications-limit-warning">
                                    Нельзя добавить <strong>больше пяти</strong> препаратов в один коктейль 🍹
                                </div>
                            {:else}
                                <Select 
                                    bind:this={selectComponent}
                                    items={getFilteredMedicationOptions()}
                                    placeholder="Добавить препарат со склада..."
                                    on:select={handleSingleMedicationSelect}
                                    on:clear={handleClear}
                                    isFocused={selectIsFocused}
                                    {filterMedications}
                                    isSearchable={true}
                                    value={null}
                                    class="mep-medication-select"
                                >
                                    <div class="empty" slot="empty">
                                        Препарат не найден, 
                                        <a href="#" on:click|preventDefault={() => isAddMedicationModalOpen = true} class="add-link">
                                            добавить новый препарат?
                                        </a>
                                    </div>
                                </Select>
                            {/if}

                            <div class="selected-medications">
                                {#if medicationForm.selectedMedications && medicationForm.selectedMedications.length > 0}
                                    {#each medicationForm.selectedMedications as med, i}
                                        <div class="medication-row">
                                            <div class="medication-info">
                                                <span class="medication-name"><span class="info" title="{med.fullName}"><svg fill="#3faeca" width="16" height="16" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1229.93 594.767c36.644 37.975 50.015 91.328 43.72 142.909-9.128 74.877-30.737 144.983-56.093 215.657-27.129 75.623-54.66 151.09-82.332 226.512-44.263 120.685-88.874 241.237-132.65 362.1-10.877 30.018-18.635 62.072-21.732 93.784-3.376 34.532 21.462 51.526 52.648 36.203 24.977-12.278 49.288-28.992 68.845-48.768 31.952-32.31 63.766-64.776 94.805-97.98 15.515-16.605 30.86-33.397 45.912-50.438 11.993-13.583 24.318-34.02 40.779-42.28 31.17-15.642 55.226 22.846 49.582 49.794-5.39 25.773-23.135 48.383-39.462 68.957l-1.123 1.416a1559.53 1559.53 0 0 0-4.43 5.6c-54.87 69.795-115.043 137.088-183.307 193.977-67.103 55.77-141.607 103.216-223.428 133.98-26.65 10.016-53.957 18.253-81.713 24.563-53.585 12.192-112.798 11.283-167.56 3.333-40.151-5.828-76.246-31.44-93.264-68.707-29.544-64.698-8.98-144.595 6.295-210.45 18.712-80.625 46.8-157.388 75.493-234.619l2.18-5.867 1.092-2.934 2.182-5.87 2.182-5.873c33.254-89.517 67.436-178.676 101.727-267.797 31.294-81.296 62.72-162.537 93.69-243.95 2.364-6.216 5.004-12.389 7.669-18.558l1-2.313c6.835-15.806 13.631-31.617 16.176-48.092 6.109-39.537-22.406-74.738-61.985-51.947-68.42 39.4-119.656 97.992-170.437 156.944l-6.175 7.17c-15.78 18.323-31.582 36.607-47.908 54.286-16.089 17.43-35.243 39.04-62.907 19.07-29.521-21.308-20.765-48.637-3.987-71.785 93.18-128.58 205.056-248.86 350.86-316.783 60.932-28.386 146.113-57.285 225.882-58.233 59.802-.707 116.561 14.29 157.774 56.99Zm92.038-579.94c76.703 29.846 118.04 96.533 118.032 190.417-.008 169.189-182.758 284.908-335.53 212.455-78.956-37.446-117.358-126.202-98.219-227.002 26.494-139.598 183.78-227.203 315.717-175.87Z" fill-rule="evenodd"/>
                                                  </svg></span> {med.name}</span>
                                            </div>
                                            <div class="medication-dosage">
                                                {#if med.hasDailyDosages && Object.keys(med.dailyDosages).length > 0}
                                                    <div class="daily-dosage-indicator">
                                                        <span class="badge">Дозировка по дням</span>
                                                        <button class="edit-daily-btn" on:click={() => openDailyDosagePopup(i)}>
                                                            Изменить
                                                        </button>
                                                    </div>
                                                {:else}
                                                    <input 
                                                        type="text" 
                                                        placeholder="Общая дозировка"
                                                        bind:value={med.dosage}
                                                        class="form-control-ex dosage-input"
                                                        disabled={med.hasDailyDosages}
                                                    />
                                                    <button 
                                                        class="daily-dosage-btn" 
                                                        on:click={() => openDailyDosagePopup(i)} 
                                                        disabled={med.dosage && med.dosage.trim() !== ''}
                                                        title={med.dosage && med.dosage.trim() !== '' ? 'Сначала удалите общую дозировку' : 'Настроить дозировку по дням'}
                                                    >
                                                        Дозировка по дням
                                                    </button>
                                                {/if}
                                            </div>                            
                                            <button class="medication-remove test" on:click={() => removeMedication(i)} tabindex="-1">×</button>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

                <div class="administration-type">
                    <label>Способ введения:</label>
                    {#if medicationForm.medication && medicationForm.medication.id}
                        {#each loadedMedications.find(m => m.id === medicationForm.medication.id)?.types || ['в/м', 'в/в'] as type}
                            <label>
                                <input 
                                    type="radio" 
                                    value={type}
                                    bind:group={medicationForm.administrationType}
                                > 
                                {type === 'в/м' ? 'Внутримышечно' : type === 'в/в' ? 'Внутривенно' : type}
                            </label>
                        {/each}
                    {:else}
                        <label>
                            <input 
                                type="radio" 
                                value="в/м"
                                bind:group={medicationForm.administrationType}
                            > 
                            Внутримышечно
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                value="в/в"
                                bind:group={medicationForm.administrationType}
                            > 
                            Внутривенно
                        </label>
                    {/if}
                </div>

                <!-- Добавляем новый блок для выбора метода введения (только для в/в) -->
                {#if medicationForm.administrationType === 'в/в'}
                    <div class="iv-method">
                        <label>Метод введения:</label>
                        <label>
                            <input 
                                type="radio" 
                                value="капельно"
                                bind:group={medicationForm.ivMethod}
                            > 
                            Капельно
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                value="струйно"
                                bind:group={medicationForm.ivMethod}
                            > 
                            Струйно
                        </label>
                    </div>
                {/if}
                
                <div class="diluent-choice">
                    <label>Использовать раствор:</label>
                    <label>
                        <input 
                            type="radio" 
                            value="нет"
                            bind:group={medicationForm.hasDiluent}
                        > 
                        Нет
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            value="да"
                            bind:group={medicationForm.hasDiluent}
                        > 
                        Да
                    </label>
                </div>
                
                <!-- Блок растворителей -->
                {#if medicationForm.hasDiluent === 'да'}
                    <div class="diluents-container">
                        {#each medicationForm.diluents as diluent (diluent.id)}
                            <div class="diluent-row">
                                <select 
                                    bind:value={diluent.type}
                                    class="form-control-ex diluent-select"
                                >
                                    <option value="глюкоза">Глюкоза</option>
                                    <option value="физраствор">Физраствор</option>
                                    <option value="вода для инъекций">Вода для инъекций</option>
                                    <option value="р-р рингер">Раствор Рингера</option>
                                    <option value="р-р рингер-локка">Раствор Рингера-Локка</option>
                                    <option value="2% натрия гидрокарбонад (сода) 200 мл">2% натрия гидрокарбонад (сода) 200 мл</option>
                                </select>
                
                                <input 
                                    type="text" 
                                    placeholder="Дозировка"
                                    bind:value={diluent.dosage}
                                    class="form-control-ex diluent-dosage"
                                />
                                
                                <button 
                                    class="btn-remove-diluent"
                                    on:click={() => removeDiluent(diluent.id)}
                                >
                                    ✖
                                </button>
                            </div>
                        {/each}
                        
                        <button 
                            class="btn-add-diluent" 
                            on:click={addDiluent}
                        >
                            + Добавить раствор
                        </button>
                    </div>
                {/if}
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
                    {isEditing ? 'Сохранить изменения' : 'Добавить препарат'}
                </button>
            </div>             
        </div>
    </div>
    <AddMedicationModal 
        isOpen={isAddMedicationModalOpen}
        onClose={() => isAddMedicationModalOpen = false}
        onMedicationAdded={handleMedicationAdded}
    />
    <DailyDosagePopup 
        isOpen={isDailyDosagePopupOpen}
        dailyDosages={medicationForm.selectedMedications[currentMedicationIndex]?.dailyDosages || {}}
        baseDosage={medicationForm.selectedMedications[currentMedicationIndex]?.dosage || ''}
        medicationName={medicationForm.selectedMedications[currentMedicationIndex]?.name || ''}
        on:close={() => isDailyDosagePopupOpen = false}
        on:update={handleDailyDosageUpdate}
    />
</TreatmentModal>

<style>
    h3{
        font-size: 21px;
        margin: 0 0 15px 0;
        padding: 0;
    }

    .modal-grid {
        display: grid;
        gap: 20px;
        height: 100%;
    }

    .form-control-ex {
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px !important;
    }

    .form-control-ex::placeholder{
        font-size: 16px !important;
    }

    .administration-type, .diluent-choice {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        margin-top: 15px;
    }

    .administration-type label, 
    .diluent-choice label,
    .iv-method label{
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
    }
    
    .administration-type label:first-of-type,
    .diluent-choice label:first-of-type,
    .iv-method label:first-of-type {
        font-size: 15px;
        color: gray;
        font-style: italic;
    }

    .diluents-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
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

    .btn-remove-diluent {
        background: #dc3545;
        color: white;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        font-size: 16px !important;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .btn-add-diluent {
        background: #6c757d;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 16px !important;
        cursor: pointer;
        align-self: flex-start;
        margin-top: 5px;
    }
    
    .button-row {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    
    .btn-save, .btn-cancel {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        border: none;
        font-size: 18px;
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

    .mep-medication-select-container {
        margin-bottom: 15px;
    }

    .mep-flex{
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
    }
    
    .loading-indicator {
        padding: 10px;
        text-align: center;
        color: #6c757d;
    }
    
    .error-message {
        padding: 10px;
        color: #dc3545;
        background-color: #f8d7da;
        border-radius: 4px;
        margin-bottom: 15px;
    }

    .empty{
        color: gray;
        padding: 15px;
        text-align: center;
    }

    .multi-select-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 15px;
    }

    .selected-medications {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 15px;
    }

    .medication-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 10px;
    }

    .medication-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .medication-name {
        font-size: 16px;
        font-weight: normal;
    }

    .medication-remove {
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 8px;
    }

    .medication-remove:hover {
        color: #f5222d;
    }

    .medication-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
    }

    .medication-info {
        flex: 2;
    }

    .medication-name {
        font-weight: 500;
    }

    .medication-dosage {
        flex: 2;
        display: flex;
        align-items: center;
        justify-content: right;
    }

    .dosage-input {
        width: 100%;
        max-width: 165px;
    }

    .medication-remove {
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .medication-remove:hover {
        color: #f5222d;
    }

    .medications-limit-warning {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        border-radius: 4px;
        border-left: 4px solid #ffc107;
        margin-bottom: 10px;
        font-size: 14px;
    }

    .info {
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        margin-right: 4px;
        vertical-align: middle;
    }

    .info svg {
        width: 16px;
        height: 16px;
    }

    .iv-method {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        margin-top: 15px;
    }

    .add-link {
        color: #3FAECA;
        text-decoration: none;
        font-weight: 500;
    }

    .add-link:hover {
        text-decoration: underline;
    }

    .daily-dosage-btn {
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        margin-left: 5px;
        cursor: pointer;
        color: #555;
    }

    .daily-dosage-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #e0e0e0;
    }

    .daily-dosage-btn:hover {
        background-color: #e0e0e0;
    }

    .edit-daily-btn {
        background-color: #3FAECA;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
    }

    .edit-daily-btn:hover {
        opacity: 0.9;
    }

    .daily-dosage-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .badge {
        background-color: #e9f5f8;
        color: #3FAECA;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        border: 1px solid #d1edf3;
    }

    :global(.mep-medication-select) {
        --value-container-padding: 12px 10px; /* Измените на нужные значения */
    }

    :global(.mep-medication-select input) {
        font-size: 16px !important; 
    }

    :global(.mep-medication-select input::placeholder) {
        font-size: 16px !important; 
    }
    
    :global(.medication-item) {
        padding: 5px 0;
    }
    
    :global(.medication-short-name) {
        font-weight: bold;
    }
    
    :global(.medication-full-name) {
        font-size: 12px;
        color: #6c757d;
    }
    
    :global(.medication-manufacturer) {
        font-size: 11px;
        color: #adb5bd;
    }
</style>