
<script>
    export let serviceId = null;
    export let medicalCardId = null;
    
    let isModalOpen = false;
    let isCreatingNewScheme = false;
    let medications = [
        { id: 1, name: 'Цефтриаксон', type: 'в/м' },
        { id: 2, name: 'Метронидазол', type: 'в/в' },
        { id: 3, name: 'Ибупрофен', type: 'в/м' }
    ];

    let isLoading = false;

    let medicationForm = {
        medication: medications[0],
        administrationType: 'в/м',
        dosage: '',
        hasDiluent: 'нет',
        diluents: [] // Массив растворителей вместо единичных полей
    };

    let currentEditingScheme = null;

    let selectedMedications = [];
    let selectedDays = {};

    let existingSchemes = [
        { 
            id: 1, 
            name: 'Схема лечения №1', 
            medications: [
                { 
                    id: 101, 
                    name: 'Цефтриаксон', 
                    dosage: '1г', 
                    администрationType: 'в/м',
                    diluents: [
                        { id: 1001, type: 'физраствор', dosage: '2мл' }
                    ]
                }
            ],
            schedule: {
                101: { 1: [1, 3, 5, 7, 9] }
            }
        },
        { 
            id: 2, 
            name: 'Схема лечения №2', 
            medications: [
                { 
                    id: 201, 
                    name: 'Метронидазол', 
                    dosage: '500мг', 
                    администрationType: 'в/в',
                    diluents: [
                        { id: 2001, type: 'глюкоза', dosage: '100мл' },
                        { id: 2002, type: 'физраствор', dosage: '50мл' }
                    ]
                }
            ],
            schedule: {
                201: { 1: [1, 2, 3, 4, 5] }
            }
        }
    ];

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
        { id: Date.now(), type: '', dosage: '' }
    ];
}

function removeDiluent(id) {
    medicationForm.diluents = medicationForm.diluents.filter(d => d.id !== id);
}

    function toggleModal() {
        isModalOpen = !isModalOpen;
        if (!isModalOpen) {
            resetState();
        }
    }

    function resetState() {
    medicationForm = {
        medication: medications[0],
        administrationType: 'в/м',
        dosage: '',
        hasDiluent: 'нет',
        diluents: []
    };
    selectedMedications = [];
    selectedDays = {};
    isCreatingNewScheme = false;
    currentEditingScheme = null;
}

    function addMedication() {
        if (isFormValid) {
            const newMedication = { 
                ...medicationForm,
                id: Date.now() // уникальный идентификатор
            };

            // Если нет растворителя, обнуляем его поля
            if (newMedication.hasDiluent === 'нет') {
                newMedication.diluents = [];
            }

            selectedMedications = [...selectedMedications, newMedication];

            // Сбрасываем форму
            medicationForm = {
                medication: medications[0],
                administrationType: 'в/м',
                dosage: '',
                hasDiluent: 'нет',
                diluents: []
            };
        }
    }

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

        // Триггерим реактивность
        selectedDays = {...selectedDays};
    }

    function selectExistingScheme(scheme) {
    console.log('Выбрана схема:', scheme);
    
    // Загрузка выбранной схемы в текущий план лечения
    selectedMedications = scheme.medications.map(med => {
        const medId = med.id || Date.now() + Math.random();
        
        return {
            id: medId,
            medication: { name: med.name },
            administrationType: med.администрationType,
            dosage: med.dosage,
            hasDiluent: med.diluents && med.diluents.length > 0 ? 'да' : 'нет',
            diluents: med.diluents || []
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
    toggleModal();
}

    function startNewScheme() {
        isCreatingNewScheme = true;
        selectedMedications = [];
        selectedDays = {};
    }

    function publishTreatmentScheme() {
    try {
        isLoading = true; // Устанавливаем флаг загрузки
        
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
                администрationType: med.administrationType,
                hasDiluent: med.hasDiluent,
                diluent: med.diluent,
                diluentDosage: med.diluentDosage
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
        
        // Имитация задержки загрузки (в реальном приложении здесь будет API-запрос)
        setTimeout(() => {
            // Добавляем в существующие схемы
            existingSchemes = [...existingSchemes, newScheme];
            
            console.log('Опубликована схема лечения', newScheme);
            
            // Сбрасываем состояние загрузки
            isLoading = false;
            
            // Закрыть модальное окно
            toggleModal();
        }, 1000); // Имитация задержки сервера в 1 секунду
        
    } catch (err) {
        console.error('Ошибка публикации схемы:', err);
        isLoading = false; // Сбрасываем флаг загрузки в случае ошибки
    }
}

function editExistingScheme(scheme) {
    console.log('Редактирование схемы:', scheme);
    
    // Загрузка препаратов схемы
    selectedMedications = scheme.medications.map(med => {
        // Используем существующий ID или генерируем новый
        const medId = med.id || Date.now() + Math.random();
        
        return {
            id: medId,
            medication: { name: med.name },
            administrationType: med.администрationType,
            dosage: med.dosage,
            hasDiluent: med.diluents && med.diluents.length > 0 ? 'да' : 'нет',
            diluents: med.diluents || []
        };
    });
    
    // Восстанавливаем расписание
    selectedDays = {};
    
    if (scheme.schedule) {
        // Преобразуем формат расписания из массивов в Set для использования в UI
        Object.entries(scheme.schedule).forEach(([medId, weeks]) => {
            selectedDays[medId] = {};
            
            Object.entries(weeks).forEach(([week, days]) => {
                selectedDays[medId][week] = new Set(days);
            });
        });
    }
    
    // Переключаемся в режим создания схемы с пометкой, что это редакция
    isCreatingNewScheme = true;
    currentEditingScheme = scheme;
}
</script>

<div class="treatment-scheme-container">
    <button on:click={toggleModal} class="treatment-scheme-button">
        📋 Схема лечения
    </button>

    {#if isModalOpen}
        <div 
            class="modal-overlay" 
            on:mousedown={(e) => {
                // Закрываем только если клик был именно по overlay
                if (e.target.classList.contains('modal-overlay')) {
                    toggleModal();
                }
            }}
        >
            <div class="modal-content" on:click|stopPropagation>
                <button class="modal-close" on:click={toggleModal}>✖</button>
                
                <div class="modal-grid">
                    <div class="medication-form-column">
                        {#if !isCreatingNewScheme}
                            <div class="existing-schemes">
                                <h2>Существующие схемы лечения</h2>
                                {#if existingSchemes.length}
                                    {#each existingSchemes as scheme}
                                    <div class="scheme-item">
                                        <strong>{scheme.name}</strong>
                                        {#each scheme.medications as med}
                                          <div class="medication-details">
                                            {med.name}, {med.dosage} ({med.администрationType})
                                          </div>
                                        {/each}
                                        <div class="scheme-actions">
                                          <button 
                                            class="btn-use-scheme"
                                            on:click|stopPropagation={() => selectExistingScheme(scheme)}
                                          >
                                            Использовать
                                          </button>
                                          <button 
                                            class="btn-edit-scheme"
                                            on:click|stopPropagation={() => editExistingScheme(scheme)}
                                          >
                                            Редактировать
                                          </button>
                                        </div>
                                      </div>
                                    {/each}
                                {:else}
                                    <p>Нет существующих схем</p>
                                {/if}
                            </div>

                            <button 
                                class="btn-add-new-scheme"
                                on:click={startNewScheme}
                            >
                                + Создать новую схему
                            </button>
                        {:else}
                            <h2>
                                {#if currentEditingScheme}
                                Редактирование схемы: {currentEditingScheme.name}
                                {:else}
                                Добавление препарата
                                {/if}
                            </h2>
                            
                            <select 
                                bind:value={medicationForm.medication}
                                class="form-control"
                            >
                                {#each medications as med}
                                    <option value={med}>{med.name}</option>
                                {/each}
                            </select>

                            <div class="administration-type">
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
                            </div>

                            <input 
                                type="text" 
                                placeholder="Дозировка препарата"
                                bind:value={medicationForm.dosage}
                                class="form-control"
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
                            
                            {#if medicationForm.hasDiluent === 'да'}
                                <div class="diluents-container">
                                    {#each medicationForm.diluents as diluent (diluent.id)}
                                        <div class="diluent-row">
                                            <select 
                                                bind:value={diluent.type}
                                                class="form-control diluent-select"
                                            >
                                                <option value="">Выберите растворитель</option>
                                                <option value="глюкоза">Глюкоза</option>
                                                <option value="физраствор">Физраствор</option>
                                            </select>
                            
                                            <input 
                                                type="text" 
                                                placeholder="Дозировка"
                                                bind:value={diluent.dosage}
                                                class="form-control diluent-dosage"
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

                            <button 
                                class="btn-add" 
                                disabled={!isFormValid}
                                on:click={addMedication}
                            >
                                Добавить препарат
                            </button>
                        {/if}
                    </div>

                    {#if isCreatingNewScheme && selectedMedications.length > 0}
                        <div class="schedule-column">
                            <h2>График приема препаратов</h2>
                            
                            <div class="schedule-table">
                                <div class="schedule-header">
                                    <div class="medication-column">Препарат</div>
                                    {#each [1,2,3,4,5,6,7,8,9,10] as day}
                                        <div class="day-header">День {day}</div>
                                    {/each}
                                </div>
                                {#each selectedMedications as medication (medication.id)}
                                    <div class="schedule-row">
                                        <div class="medication-cell">
                                            <strong>{medication.medication.name}</strong> {medication.administrationType}, {medication.dosage}
                                            {#if medication.hasDiluent === 'да' && medication.diluents.length > 0}
                                                {#each medication.diluents as diluent, index}
                                                    + {diluent.type} ({diluent.dosage}) 
                                                {/each}
                                            {/if}
                                            <!-- Остальное содержимое -->
                                        </div>
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
                            </div>

                            <button 
                            class="btn-continue" 
                            disabled={selectedMedications.length === 0 || isLoading}
                            on:click={publishTreatmentScheme}
                          >
                            {#if isLoading}
                              <span class="spinner"></span> Сохранение...
                            {:else}
                              Опубликовать схему
                            {/if}
                          </button>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>


<style>
    .treatment-scheme-button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        max-width: 1100px;
        max-height: 80%;
        position: relative;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .modal-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .medication-form-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
    }

    .schedule-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .form-control {
        width: 100%;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
    }

    .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
    }

    .administration-type, .diluent-choice {
        display: flex;
        gap: 15px;
        margin-bottom: 10px;
    }

    .administration-type label, 
    .diluent-choice label {
        display: flex;
        align-items: center;
        gap: 5px;
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

    .day-header, .medication-column {
        padding: 5px;
        border-right: 1px solid #ddd;
    }

    .schedule-row {
        display: grid;
        grid-template-columns: 400px repeat(10, 1fr);
    }

    .medication-cell {
        padding: 10px;
        border-right: 1px solid #ddd;
        background-color: #f8f9fa;
    }

    .schedule-cell {
        height: 30px;
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

    .btn-add, .btn-continue {
        background-color: #2196F3;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
    }

    .btn-add:disabled, .btn-continue:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .existing-schemes {
        margin-top: 20px;
    }

    .scheme-item {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .scheme-item:hover {
        background-color: #e9ecef;
    }

    .scheme-item:hover {
        background-color: #e9ecef;
    }

    .btn-existing-schemes {
        margin-bottom: 10px;
        width: 100%;
    }

    .existing-schemes-modal-content h2 {
        text-align: center;
        margin-bottom: 20px;
    }

    .medication-details {
        color: #6c757d;
        font-size: 0.9em;
        margin-top: 5px;
    }

    .btn-add-new-scheme {
        background-color: #28a745;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    }
    .btn-add-new-scheme {
        background-color: #28a745;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    }

    .btn-add-new-scheme {
        background-color: #28a745;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    }

    .btn-add-new-scheme {
        background-color: #28a745;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
        cursor: pointer;
        width: 100%;
    }
    .scheme-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    }

    .btn-use-scheme, .btn-edit-scheme {
    padding: 4px 8px;
    font-size: 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    }

    .btn-use-scheme {
    background-color: #007bff;
    color: white;
    }

    .btn-edit-scheme {
    background-color: #6c757d;
    color: white;
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

@keyframes spin {
  to { transform: rotate(360deg); }
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
    font-size: 10px;
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
    font-size: 12px;
    cursor: pointer;
    align-self: flex-start;
}

</style>