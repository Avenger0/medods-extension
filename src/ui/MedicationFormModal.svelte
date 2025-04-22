<!-- src/ui/MedicationFormModal.svelte -->
<script>
    import Select from 'svelte-select';
    import { medicationService } from '../utils/api.js';
    import TreatmentModal from './TreatmentModal.svelte';

    export let isOpen = false;
    export let onClose;
    export let medicationForm;
    export let isEditing = false;
    export let onSave;
    
    let loadedMedications = [];
    let isLoading = false;
    let loadError = null;
    
    $: selectedValue = medicationForm && medicationForm.medication 
        ? loadedMedications.find(med => med.id === medicationForm.medication.id) 
        : null;

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

    // Обработчик изменения выбранного лекарства
    function handleMedicationChange(event) {
        
        const selectedMed = event.detail;
        medicationForm.medication = {
            id: selectedMed.id,
            name: selectedMed.shortName,
            fullName: selectedMed.fullName,
            manufacturer: selectedMed.manufacturer,
            dosageForm: selectedMed.dosageForm,
            concentration: selectedMed.concentration
        };

        selectIsFocused = false;

        setTimeout(() => {
            // Находим все элементы ввода внутри селекта и снимаем с них фокус
            const inputElements = document.querySelectorAll('.mep-medication-select input');
            inputElements.forEach(input => input.blur());
        }, 10);
        
        // Если у медикамента только один тип введения, устанавливаем его автоматически
        if (selectedMed.types && selectedMed.types.length === 1) {
            medicationForm.administrationType = selectedMed.types[0];
        }
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
        medicationForm.medication &&
        medicationForm.administrationType &&
        medicationForm.dosage &&
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
</script>

<TreatmentModal
    {isOpen}
    onClose={onClose}
    maxWidth="650px"
    height="420px"
>
    <h3>
        {isEditing ? 'Редактирование препарата' : 'Добавление препарата'}
    </h3>
    
        <!-- Форма добавления медикамента -->
        {#if isLoading}
        <div class="loading-indicator">Загрузка списка препаратов...</div>
    {:else if loadError}
        <div class="error-message">Ошибка: {loadError}</div>
    {:else}
        <div class="mep-medication-select-container">
            <Select 
                items={loadedMedications}
                placeholder="Найти препарат..."
                on:select={handleMedicationChange}
                isFocused={selectIsFocused}
                listOpen={false}
                {filterMedications}
                isSearchable={true}
                value={selectedValue}
                class="mep-medication-select"
            >
                <div class="empty" slot="empty">Препараты не найдены..</div>
            </Select>
            
            {#if medicationForm.medication && medicationForm.medication.fullName}
                <div class="selected-medication-info">
                    Вы назначаете →&nbsp;<span class="full-name">{medicationForm.medication.name}</span>
                </div>
            {/if}
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

    <input 
        type="text" 
        placeholder="Дозировка препарата"
        bind:value={medicationForm.dosage}
        class="form-control-ex"
    />
    
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
</TreatmentModal>

<!-- Компонент для отображения элемента в списке -->
<script context="module">
    function MedicationItem(item) {
        return `
            <div class="medication-item">
                <div class="medication-short-name">${item.shortName}</div>
                <div class="medication-full-name">${item.fullName}</div>
                ${item.manufacturer ? `<div class="medication-manufacturer">${item.manufacturer}</div>` : ''}
            </div>
        `;
    }
</script>

<style>
    h3{
        font-size: 21px;
        margin: 0 0 15px 0;
        padding: 0;
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
        margin-top: 20px;
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

     /* Добавляем новые стили */
     .mep-medication-select-container {
        margin-bottom: 15px;
    }
    
    .select-label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .mep-medication-select {
        width: 100%;
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
    
    .selected-medication-info {
        margin-top: 5px;
        padding: 8px;
        background-color: #f8f9fa;
        border-radius: 4px;
        font-size: 14px;
        display: flex;
    }
    
    .full-name {
        display: block;
        font-weight: 700;
    }
    
    .empty{
        color: gray;
        padding: 15px;
        text-align: center;
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