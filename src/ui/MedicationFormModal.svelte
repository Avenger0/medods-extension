<!-- src/ui/MedicationFormModal.svelte -->
<script>
    import Select from 'svelte-select';
    import { onMount } from 'svelte';
    import { medicationService } from '../utils/api.js';
    import TreatmentModal from './TreatmentModal.svelte';
    import AddMedicationModal from './AddMedicationModal.svelte';
    import DailyDosagePopup from './DailyDosagePopup.svelte';
    import MedicationInfoTrigger from './MedicationInfoTrigger.svelte';
    import { getRouteTypeByShort } from '../utils/routeTypes.js';

    export let serviceId;
    export let isOpen = false;
    export let onClose;
    export let medicationForm = {
        selectedMedications: [],
        administrationType: 'в/м',
        ivMethod: 'капельно',
        hasDiluent: 'нет',
        diluents: [],
        comment: ''
    };

    export let isEditing = false;
    export let onSave;
    export let medications;

    let intravenousDiluents = [];
    let intramuscularDiluents = [];

    onMount(async () => {
        try {
            // Загружаем растворители одновременно с препаратами
            const diluentResult = await medicationService.getAllDiluentsTypes();
            if (diluentResult && diluentResult.diluents) {
                intravenousDiluents = diluentResult.diluents.iv || [];
                intramuscularDiluents = diluentResult.diluents.im || [];
            }
        } catch (error) {
            console.error('Ошибка загрузки растворителей:', error);
        }
    });

    let highlightedMedicationId = null;
    let lastAddedIndex = -1;

    // Функция для выделения новой строки
    function highlightNewMedication(medicationId, index) {
        // Установка ID выделенного препарата
        highlightedMedicationId = medicationId;
        lastAddedIndex = index;
        
        // Возврат к обычному состоянию через 1 секунду для выделения
        setTimeout(() => {
            highlightedMedicationId = null;
        }, 1000);
        
        // Установить фокус на поле дозировки с небольшой задержкой,
        // чтобы DOM успел обновиться
        setTimeout(() => {
            const dosageInputs = document.querySelectorAll('.medication-row .dosage-input');
            if (dosageInputs.length > index) {
                dosageInputs[index].focus();
            }
        }, 50);
    }

    let isAddMedicationModalOpen = false;
    let isDailyDosagePopupOpen = false;

    let loadedMedications = [];
    let isLoading = false;
    let loadError = null;

    let warehouse = '';
    
    let selectedValues = [];
    let selectComponent;

    let currentMedicationIndex = 0; 

    let commentCharsLeft = 30;
    let isCommentLengthLow = false;

    let previousAdministrationType = medicationForm.administrationType;

    $: medicationsLimitReached = medicationForm?.selectedMedications?.length >= 5;
   
    function getAvailableAdministrationTypes(selectedMeds) {
        // Если нет выбранных препаратов или их несколько, возвращаем все типы
        if (!selectedMeds || selectedMeds.length !== 1 || !loadedMedications) {
            return ['в/м', 'в/в', 'п/к', 'др.'];
        }
        
        const selectedMed = selectedMeds[0];
        const medInfo = loadedMedications.find(m => m.id === selectedMed.id);
        
        if (medInfo && medInfo.types && medInfo.types.length > 0) {
            return medInfo.types;
        }
    
        return ['в/м', 'в/в', 'п/к', 'др.'];
    }

    $: availableAdminTypes = getAvailableAdministrationTypes(medicationForm.selectedMedications || []);

    $: {
        if (medicationForm.selectedMedications && medicationForm.selectedMedications.length === 1) {
            const availableTypes = getAvailableAdministrationTypes(medicationForm.selectedMedications);
            // Проверяем, что текущий тип введения доступен
            if (availableTypes.length > 0 && !availableTypes.includes(medicationForm.administrationType)) {
                // Устанавливаем новый тип введения без вызова handleAdminTypeChange
                medicationForm.administrationType = availableTypes[0];
                
                // Сбрасываем настройки растворителей, так как меняется тип введения
                medicationForm.hasDiluent = 'нет';
                medicationForm.diluents = [];
                
                // Обновляем метод в/в
                if (medicationForm.administrationType === 'в/в' && !medicationForm.ivMethod) {
                    medicationForm.ivMethod = 'капельно';
                } else if (medicationForm.administrationType !== 'в/в') {
                    medicationForm.ivMethod = null;
                }
            }
        }
    }
    $: {
        commentCharsLeft = 30 - (medicationForm.comment ? medicationForm.comment.length : 0);
        isCommentLengthLow = commentCharsLeft < 5;
    }

    $: modalTitle = medicationForm.selectedMedications && medicationForm.selectedMedications.length > 1 ? 'Добавление связки препаратов'  : 'Добавление препарата';

    $: saveButtonText = medicationForm.selectedMedications && medicationForm.selectedMedications.length > 1 ? (isEditing ? 'Сохранить изменения' : 'Добавить связку') : (isEditing ? 'Сохранить изменения' : 'Добавить препарат');

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

    // Загружаем лекарства при открытии модального окна
    $: {
        if (isOpen && loadedMedications.length === 0) {
            console.log("Запуск загрузки препаратов");
            loadMedications();
        }
    }

    function handleAdminTypeChange(e, newType) {

        // Если выбран тот же тип, который уже был выбран - ничего не делаем
        if (newType === medicationForm.administrationType) {
            return;
        }
        
        // Если есть растворители, запрашиваем подтверждение
        if (medicationForm.hasDiluent === 'да' && medicationForm.diluents.length > 0) {
            // Меняем тип введения
            medicationForm.administrationType = newType;
            // Очищаем растворители
            medicationForm.diluents = [];
            // Сбрасываем параметр "использовать раствор" на "нет"
            medicationForm.hasDiluent = 'нет';

        } else {
            // Если растворителей нет, просто меняем тип и сбрасываем настройки
            medicationForm.administrationType = newType;
            medicationForm.hasDiluent = 'нет';
        }
        
        // Обновляем ivMethod в зависимости от типа введения
        if (medicationForm.administrationType === 'в/в' && !medicationForm.ivMethod) {
            medicationForm.ivMethod = 'капельно';
        } else if (medicationForm.administrationType !== 'в/в') {
            medicationForm.ivMethod = null;
        }
    }

    function handleMedicationAdded(newMedication) {
        // Добавляем новый препарат в список загруженных препаратов
        loadedMedications = [...loadedMedications, newMedication];
        // После добавления, можно автоматически выбрать этот препарат
        handleSingleMedicationSelect({detail: newMedication});
    }

    function limitCommentLength(event) {
        const input = event.target;
        if (input.value.length > 30) {
            input.value = input.value.slice(0, 30);
            medicationForm.comment = input.value;
        }
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

                if (result.warehouse) {
                    warehouse = result.warehouse;
                }
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
        const diluents = medicationForm.administrationType === 'в/в' 
        ? intravenousDiluents 
        : intramuscularDiluents;
    
        // Берем первый элемент из списка или устанавливаем значение по умолчанию
        const defaultDiluent = diluents.length > 0 ? diluents[0] : 'физраствор';
        
        medicationForm.diluents = [
            ...medicationForm.diluents,
            { id: String(Date.now()), type: defaultDiluent, dosage: ''}
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

    $: filteredMedications = isLoading ? [] : getFilteredMedicationOptions();


    function getFilteredMedicationOptions() {
        // Если препараты еще не загрузились, возвращаем пустой массив
        if (!loadedMedications || loadedMedications.length === 0) {
            return [];
        }
        
        // Защита от undefined
        const selectedMeds = medicationForm?.selectedMedications || [];
        
        // Создаем массив ID уже выбранных препаратов
        const selectedIds = selectedMeds
            .filter(med => med && med.id)
            .map(med => med.id);
        
        // Фильтруем список препаратов, исключая уже выбранные по ID
        return loadedMedications.filter(med => 
            !selectedIds.includes(med.id)
        );
    }

    // Обработчик выбора одного препарата
    function handleSingleMedicationSelect(event) {
        if (!event.detail) return;
        
        const selectedMed = event.detail;
        
        // Проверяем, не выбран ли уже препарат с таким же названием
        if (medicationForm.selectedMedications && 
            medicationForm.selectedMedications.some(med => med.id === selectedMed.id)) {
            alert('Этот препарат уже добавлен в связку!');
            if (selectComponent) {
                selectComponent.handleClear();
            }
            return;
        }

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
                    hasDailyDosages: false,
                    stockQuantity: med.stockQuantity || 0,
                    price: med.price || '?',
                    activeIngredient: med.activeIngredient || '',
                    notes: med.notes || '',
                    compatibleDiluents: med.compatibleDiluents || '',
                    vidalLink: med.vidalLink || '',
                    types: med.types || {}
                }
            ];

            const newIndex = medicationForm.selectedMedications.length - 1;
            highlightNewMedication(med.id, newIndex);

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

    function getRouteClass(type) {
        const routeType = getRouteTypeByShort(type);
        return routeType ? routeType.id : 'unknown';
    }

    function getRouteTooltip(type) {
        const routeType = getRouteTypeByShort(type);
        if (routeType) {
            return `${routeType.name}: ${routeType.description}`;
        }
        return 'Тип введения не указан';
    }
</script>

<TreatmentModal
    {isOpen}
    onClose={onClose}
    maxWidth="750px"
    minHeight="500px"
    overlayAlign="right"
    overlayPadding="0 11% 0 0"
    confirmBeforeClose={true}
>
    <div class="modal-grid">
        <div class="mep-flex">
            <div class="mep-head">
                <h3>
                    {isEditing ? 'Редактирование' : modalTitle}
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
                                    items={filteredMedications}
                                    placeholder={`Добавить препарат со склада ${warehouse ? `${warehouse}` : ''}...`}
                                    on:select={handleSingleMedicationSelect}
                                    on:clear={handleClear}
                                    isFocused={selectIsFocused}
                                    {filterMedications}
                                    isSearchable={true}
                                    value={null}
                                    class="mep-medication-select"
                                    let:item
                                >
                                    <div class="medication-item-wrapper" slot="item" let:item>
                                        <div class="medication-item-details">
                                            <div class="medication-full-name" title={item.fullName}>{item.label}</div>
                                        </div>
                                        <div class="medication-routes">
                                            {#if item.types && item.types.length > 0}
                                                {#each item.types as type}
                                                    <div 
                                                        class="route-badge route-{getRouteClass(type)}" 
                                                        title={getRouteTooltip(type)}
                                                    >
                                                        {type}
                                                    </div>
                                                {/each}
                                            {/if}
                                        </div>
                                    </div>
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
                                        <div class="medication-row {med.id === highlightedMedicationId ? 'highlight-yellow' : ''}">
                                            <div class="medication-info">
                                                <span class="medication-name">
                                                    {#if !isLoading}
                                                        <MedicationInfoTrigger medication={med} medications={loadedMedications} tooltipPosition="right" />
                                                    {/if}
                                                    {med.name}
                                                </span>
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
                    
                    <!-- Показываем только доступные типы -->
                    {#if availableAdminTypes.includes('в/м')}
                        <label>
                            <input 
                                type="radio" 
                                name="admin-type"
                                value="в/м"
                                checked={medicationForm.administrationType === "в/м"}
                                on:click={(e) => handleAdminTypeChange(e, "в/м")}
                            > 
                            Внутримышечно
                        </label>
                    {/if}
                    
                    {#if availableAdminTypes.includes('в/в')}
                        <label>
                            <input 
                                type="radio" 
                                name="admin-type"
                                value="в/в"
                                checked={medicationForm.administrationType === "в/в"}
                                on:click={(e) => handleAdminTypeChange(e, "в/в")}
                            > 
                            Внутривенно
                        </label>
                    {/if}

                    {#if availableAdminTypes.includes('п/к')}
                        <label>
                            <input 
                                type="radio" 
                                name="admin-type"
                                value="п/к"
                                checked={medicationForm.administrationType === "п/к"}
                                on:click={(e) => handleAdminTypeChange(e, "п/к")}
                            > 
                            Подкожно
                        </label>
                    {/if}

                    {#if availableAdminTypes.includes('др.')}
                        <label>
                            <input 
                                type="radio" 
                                name="admin-type"
                                value="др."
                                checked={medicationForm.administrationType === "др."}
                                on:click={(e) => handleAdminTypeChange(e, "др.")}
                            > 
                            Другое
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
                                    {#if medicationForm.administrationType === 'в/в'}
                                        {#each intravenousDiluents as type}
                                            <option value={type}>{type}</option>
                                        {/each}
                                    {:else}
                                        {#each intramuscularDiluents as type}
                                            <option value={type}>{type}</option>
                                        {/each}
                                    {/if}
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

                <div class="comment">
                    <label for="medication-comment">
                        <span class="info" title="В этом поле можно указать дополнительную информацию о препарате или связке. Например: скорость введения медленно">
                            <svg fill="#4caf50" width="16" height="16" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1229.93 594.767c36.644 37.975 50.015 91.328 43.72 142.909-9.128 74.877-30.737 144.983-56.093 215.657-27.129 75.623-54.66 151.09-82.332 226.512-44.263 120.685-88.874 241.237-132.65 362.1-10.877 30.018-18.635 62.072-21.732 93.784-3.376 34.532 21.462 51.526 52.648 36.203 24.977-12.278 49.288-28.992 68.845-48.768 31.952-32.31 63.766-64.776 94.805-97.98 15.515-16.605 30.86-33.397 45.912-50.438 11.993-13.583 24.318-34.02 40.779-42.28 31.17-15.642 55.226 22.846 49.582 49.794-5.39 25.773-23.135 48.383-39.462 68.957l-1.123 1.416a1559.53 1559.53 0 0 0-4.43 5.6c-54.87 69.795-115.043 137.088-183.307 193.977-67.103 55.77-141.607 103.216-223.428 133.98-26.65 10.016-53.957 18.253-81.713 24.563-53.585 12.192-112.798 11.283-167.56 3.333-40.151-5.828-76.246-31.44-93.264-68.707-29.544-64.698-8.98-144.595 6.295-210.45 18.712-80.625 46.8-157.388 75.493-234.619l2.18-5.867 1.092-2.934 2.182-5.87 2.182-5.873c33.254-89.517 67.436-178.676 101.727-267.797 31.294-81.296 62.72-162.537 93.69-243.95 2.364-6.216 5.004-12.389 7.669-18.558l1-2.313c6.835-15.806 13.631-31.617 16.176-48.092 6.109-39.537-22.406-74.738-61.985-51.947-68.42 39.4-119.656 97.992-170.437 156.944l-6.175 7.17c-15.78 18.323-31.582 36.607-47.908 54.286-16.089 17.43-35.243 39.04-62.907 19.07-29.521-21.308-20.765-48.637-3.987-71.785 93.18-128.58 205.056-248.86 350.86-316.783 60.932-28.386 146.113-57.285 225.882-58.233 59.802-.707 116.561 14.29 157.774 56.99Zm92.038-579.94c76.703 29.846 118.04 96.533 118.032 190.417-.008 169.189-182.758 284.908-335.53 212.455-78.956-37.446-117.358-126.202-98.219-227.002 26.494-139.598 183.78-227.203 315.717-175.87Z" fill-rule="evenodd"/>
                            </svg>
                        </span>
                        Общий комментарий
                    </label>
                    <div class="comment-input-container">
                        <input 
                            type="text" 
                            id="medication-comment" 
                            class="form-control comment-input" 
                            bind:value={medicationForm.comment}
                            placeholder="Введите комментарий..."
                            maxlength="30"
                            on:input={limitCommentLength}
                        />
                        <div class="comment-char-counter {isCommentLengthLow ? 'low-chars' : ''}">
                            {commentCharsLeft}
                        </div>
                    </div>
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
                    {saveButtonText}
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
        gap: 13px;
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
    .iv-method label:first-of-type,
    .comment label:first-of-type {
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
        line-height: 24px;
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
        margin-bottom: 20px;
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
        display: flex;
        gap: 5px;
        align-items: center;
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

    .dosage-input:focus {
        outline: none;
        border-color: #3FAECA;
        box-shadow: 0 0 0 1px #3FAECA, 0 0 0 3px rgba(63, 174, 202, 0.1);
        transition: all 0.2s ease;
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

    .comment{
        border-top: 1px solid rgba(0, 0, 0, .1);
        padding: 10px 0px;
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

    label[for="medication-comment"]{
        display: flex;
        align-items: center;
    }

    .medication-item-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1px;
    }

    .medication-item-details {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: left;
    }

    .medication-routes {
        display: flex;
        gap: 5px;
        align-items: center;
        justify-content: left;
        margin-left: 15px;
    }

    .route-badge {
        width: 40px;
        height: 40px;
        display: block;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
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

    .highlight-yellow {
        background-color: rgba(255, 255, 0, 0.3); /* Выделение желтым цветом */
        transition: background-color 0.3s ease; /* Плавный переход для исчезновения */
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
        max-width: 490px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 16px;
        color: #555;
        color: #6c757d;
    }
    
    :global(.medication-manufacturer) {
        font-size: 11px;
        color: #adb5bd;
    }
</style>