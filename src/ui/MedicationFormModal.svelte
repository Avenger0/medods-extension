<!-- src/ui/MedicationFormModal.svelte -->
<script>
    import Select from 'svelte-select';
    import { medicationService } from '../utils/api.js';
    import TreatmentModal from './TreatmentModal.svelte';

    export let isOpen = false;
    export let onClose;
    export let medicationForm = {
        selectedMedications: [], // Инициализируем как пустой массив
        administrationType: 'в/м',
        hasDiluent: 'нет',
        diluents: []
    };

    export let isEditing = false;
    export let onSave;
    
    let loadedMedications = [];
    let isLoading = false;
    let loadError = null;
    
    let selectedValues = [];

    let selectComponent;

    $: medicationsLimitReached = medicationForm?.selectedMedications?.length >= 3;

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

    // Загружаем лекарства при открытии модального окна
    $: if (isOpen && loadedMedications.length === 0) {
        loadMedications();
    }
    
    async function loadMedications() {
        try {
            isLoading = true;
            loadError = null;
            // Запрашиваем данные с сервера
            const result = await medicationService.getAvailableMedications();
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

    // Обработчик изменения выбранных лекарств
    function handleMedicationChange(event) {
        console.log('Select change event:', event);
        console.log('Select change detail:', event.detail);
        
        // Обработка в зависимости от типа события
        if (event.detail === null || (Array.isArray(event.detail) && event.detail.length === 0)) {
            // Ничего не выбрано - очищаем
            medicationForm.medications = [];
            selectedValues = [];
        } else if (Array.isArray(event.detail)) {
            // Выбрано несколько элементов
            medicationForm.medications = event.detail.slice(0, 3).map(med => ({
                id: med.id,
                name: med.shortName || med.label,
                fullName: med.fullName || med.label,
                manufacturer: med.manufacturer || '',
                dosageForm: med.dosageForm || '',
                concentration: med.concentration || ''
            }));
            
            // Обновляем selectedValues для состояния компонента
            selectedValues = event.detail.slice(0, 3);
        } else if (event.detail) {
            // Выбран один элемент
            const med = event.detail;
            medicationForm.medications = [{
                id: med.id,
                name: med.shortName || med.label,
                fullName: med.fullName || med.label,
                manufacturer: med.manufacturer || '',
                dosageForm: med.dosageForm || '',
                concentration: med.concentration || ''
            }];
            
            // Обновляем selectedValues для состояния компонента
            selectedValues = [med];
        }

        selectIsFocused = false;

        setTimeout(() => {
            const inputElements = document.querySelectorAll('.mep-medication-select input');
            inputElements.forEach(input => input.blur());
        }, 10);
    }

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
        medicationForm.selectedMedications.every(med => med.dosage && med.dosage.trim() !== '') && // Проверка на заполненность дозировок
        medicationForm.administrationType &&
        (medicationForm.hasDiluent === 'нет' || 
        (medicationForm.hasDiluent === 'да' && 
        medicationForm.diluents.length > 0 && 
        medicationForm.diluents.every(d => d.type && d.dosage)))
    );
    
    function addDiluent() {
        medicationForm.diluents = [
            ...medicationForm.diluents,
            { id: Date.now(), type: 'глюкоза', dosage: '' }
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
        
        if (medicationForm.selectedMedications.length < 3) {
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
                    dosage: '' // Добавляем поле для дозировки каждого препарата
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

    // Удаление препарата
    function removeMedication(index) {
        medicationForm.selectedMedications = medicationForm.selectedMedications.filter((_, i) => i !== index);
    }

</script>

<TreatmentModal
    {isOpen}
    onClose={onClose}
    maxWidth="650px"
    minHeight="500px"
    maxHeight="630px"
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
                                    Нельзя добавить больше 3-х препаратов в один коктейль
                                </div>
                            {:else}
                                <Select 
                                    bind:this={selectComponent}
                                    items={getFilteredMedicationOptions()}
                                    placeholder="Добавить препарат..."
                                    on:select={handleSingleMedicationSelect}
                                    on:clear={handleClear}
                                    isFocused={selectIsFocused}
                                    {filterMedications}
                                    isSearchable={true}
                                    value={null}
                                    class="mep-medication-select"
                                >
                                    <div class="empty" slot="empty">Препарат не найден, добавить свой?</div>
                                </Select>
                            {/if}

                            <div class="selected-medications">
                                {#if medicationForm.selectedMedications && medicationForm.selectedMedications.length > 0}
                                    {#each medicationForm.selectedMedications as med, i}
                                        <div class="medication-row">
                                            <div class="medication-info">
                                                <span class="medication-name"><span class="info" title="{med.fullName}">ℹ️</span> {med.name}</span>
                                            </div>
                                            <div class="medication-dosage">
                                                <input 
                                                    type="text" 
                                                    placeholder="Дозировка препарата"
                                                    bind:value={med.dosage}
                                                    class="form-control-ex dosage-input"
                                                />
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
                
                <div class="diluent-choice">
                    <label>Использовать растворитель:</label>
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
                                    <option value="р-р хартман">Раствор Хартмана</option>
                                    <option value="этиловый спирт">Этиловый спирт</option>
                                    <option value="пэг">Полиэтиленгликоль (ПЭГ)</option>
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
                            + Добавить растворитель
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

    .form-control-ex::placeholder {
        font-size: 16px !important;
    }

    .administration-type, .diluent-choice {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        margin-top: 15px;
    }

    .administration-type label, 
    .diluent-choice label {
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 5px;
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
        font-weight: 500;
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

    .medication-dosage {
        flex: 1;
    }

    .dosage-input {
        width: 100%;
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
    }

    .dosage-input {
        width: 100%;
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

    .info{
        cursor: pointer;
        user-select: none;
    }

    :global(.mep-medication-select) {
        --value-container-padding: 12px 10px; /* Измените на нужные значения */
    }

    :global(.mep-medication-select input) {
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