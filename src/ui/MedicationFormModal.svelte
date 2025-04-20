<!-- src/ui/MedicationFormModal.svelte -->
<script>
    import TreatmentModal from './TreatmentModal.svelte';
    
    export let isOpen = false;
    export let onClose;
    export let medications = [];
    export let medicationForm;
    export let isEditing = false;
    export let onSave;
    
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
    maxWidth="500px"
>
    <h2>
        {isEditing ? 'Редактирование препарата' : 'Добавление препарата'}
    </h2>
    
    <!-- Форма добавления медикамента -->
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
    
    <!-- Блок растворителей -->
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

<style>
    .form-control {
        width: 100%;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        padding: 8px;
    }

    .administration-type, .diluent-choice {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
    }

    .administration-type label, 
    .diluent-choice label {
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
    }
    
    .btn-save {
        background-color: #2196F3;
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