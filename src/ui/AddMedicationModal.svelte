<!-- src/ui/AddMedicationModal.svelte -->
<script>
    import TreatmentModal from './TreatmentModal.svelte';
    import { medicationService } from '../utils/api.js';

    export let isOpen = false;
    export let onClose;
    export let onMedicationAdded;

    let newMedication = {
        fullName: '',
        shortName: '',
        activeIngredient: '', // Добавляем поле для действующего вещества
        dosage: '',
        type: {
            intravenous: false,
            intramuscular: false
        },
        vidalLink: ''
    };

    let isLoading = false;
    let error = null;

    $: isFormValid = newMedication.fullName.trim() !== '' && 
                newMedication.shortName.trim() !== '' && 
                newMedication.activeIngredient.trim() !== '' && // Добавляем проверку нового поля
                newMedication.dosage.trim() !== '' && 
                (newMedication.type.intravenous || newMedication.type.intramuscular);

    async function handleSubmit() {
        if (!isFormValid) return;

        try {
            isLoading = true;
            error = null;
            
            // Форматируем типы ввода для API
            const types = [];
            if (newMedication.type.intravenous) types.push('в/в');
            if (newMedication.type.intramuscular) types.push('в/м');
            
            const medicationData = {
                fullName: newMedication.fullName,
                shortName: newMedication.shortName,
                activeIngredient: newMedication.activeIngredient, // Добавляем новое поле
                dosage: newMedication.dosage,
                type: types,
                vidalLink: newMedication.vidalLink || ''
            };
            
            const result = await medicationService.createMedication(medicationData);
            
            if (result && result.success) {
                // Добавляем новый препарат в список и закрываем модальное окно
                if (typeof onMedicationAdded === 'function') {
                    onMedicationAdded({
                        id: result.id || Date.now(),
                        fullName: newMedication.fullName,
                        shortName: newMedication.shortName,
                        type: types,
                        value: result.id || Date.now(),
                        label: newMedication.fullName
                    });
                }
                onClose();
            } else {
                throw new Error(result?.message || "Не удалось создать препарат");
            }
        } catch (err) {
            console.error('Ошибка создания препарата:', err);
            error = err.message || "Произошла ошибка при создании препарата";
        } finally {
            isLoading = false;
        }
    }
</script>

<TreatmentModal
    {isOpen}
    {onClose}
    maxWidth="500px"
    minHeight="auto"
    maxHeight="90vh"
    height="auto"
    overlayAlign="center"
>
    <div class="add-medication-modal">
        <h3>Добавить новый препарат</h3>
        
        {#if error}
            <div class="error-message">{error}</div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="fullName">Торговое название*</label>
                <input 
                    type="text" 
                    id="fullName" 
                    class="form-control" 
                    bind:value={newMedication.fullName}
                    required
                />
            </div>
            
            <div class="form-group">
                <label for="shortName">Короткое название (в схеме)*</label>
                <input 
                    type="text" 
                    id="shortName" 
                    class="form-control" 
                    bind:value={newMedication.shortName}
                    required
                />
            </div>

            <div class="form-group">
                <label for="activeIngredient">Действующее вещество*</label>
                <input 
                    type="text" 
                    id="activeIngredient" 
                    class="form-control" 
                    bind:value={newMedication.activeIngredient}
                    required
                />
            </div>
            
            <div class="form-group">
                <label for="dosage">Дозировка*</label>
                <input 
                    type="text" 
                    id="dosage" 
                    class="form-control" 
                    bind:value={newMedication.dosage}
                    required
                />
            </div>
            
            <div class="form-group">
                <label>Способ введения* (хотя бы один)</label>
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input 
                            type="checkbox" 
                            bind:checked={newMedication.type.intravenous}
                        />
                        Внутривенно (в/в)
                    </label>
                    <label class="checkbox-label">
                        <input 
                            type="checkbox" 
                            bind:checked={newMedication.type.intramuscular}
                        />
                        Внутримышечно (в/м)
                    </label>
                </div>
                {#if !newMedication.type.intravenous && !newMedication.type.intramuscular}
                    <small class="error-text">Выберите хотя бы один способ введения</small>
                {/if}
            </div>
            
            <div class="form-group">
                <label for="vidalLink">Ссылка на Vidal (не обязательно)</label>
                <input 
                    type="url" 
                    id="vidalLink" 
                    class="form-control" 
                    bind:value={newMedication.vidalLink}
                    placeholder="https://www.vidal.ru/..."
                />
            </div>
            
            <div class="button-row">
                <button 
                    type="button" 
                    class="btn-cancel" 
                    on:click={onClose}
                >
                    Отмена
                </button>
                <button 
                    type="submit" 
                    class="btn-save" 
                    disabled={!isFormValid || isLoading}
                >
                    {#if isLoading}
                        <span class="spinner"></span> Сохранение...
                    {:else}
                        Добавить препарат
                    {/if}
                </button>
            </div>
        </form>
    </div>
</TreatmentModal>

<style>
    h3 {
        font-size: 21px;
        margin: 0 0 20px 0;
        padding: 0;
    }
    
    .add-medication-modal {
        padding: 10px;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .form-control {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
    }
    
    .checkbox-group {
        display: flex;
        gap: 20px;
        margin-top: 5px;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: normal;
        cursor: pointer;
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
    
    .error-message {
        padding: 10px;
        color: #dc3545;
        background-color: #f8d7da;
        border-radius: 4px;
        margin-bottom: 15px;
    }
    
    .error-text {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
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
</style>