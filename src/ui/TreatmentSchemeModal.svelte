<script>
    export let serviceId = null;
    export let medicalCardId = null;
  
    let isModalOpen = false;
    let isExistingSchemesModalOpen = false;
    let medications = [
      { id: 1, name: 'Цефтриаксон', type: 'в/м' },
      { id: 2, name: 'Метронидазол', type: 'в/в' },
      { id: 3, name: 'Ибупрофен', type: 'в/м' }
    ];
  
    let medicationForm = {
      medication: medications[0],
      administrationType: 'в/м',
      dosage: '',
      hasDiluent: 'нет',
      diluent: '',
      diluentDosage: ''
    };
  
    let selectedMedications = [];
    let selectedDays = {};
    let existingSchemes = [
      { 
        id: 1, 
        name: 'Схема лечения №1', 
        medications: [
          { name: 'Цефтриаксон', dosage: '1г', администрationType: 'в/м' }
        ]
      },
      { 
        id: 2, 
        name: 'Схема лечения №2', 
        medications: [
          { name: 'Метронидазол', dosage: '500мг', администрationType: 'в/в' }
        ]
      }
    ];
  
    // Реактивная проверка формы
    $: isFormValid = !!(
      medicationForm.medication &&
      medicationForm.administrationType &&
      medicationForm.dosage &&
      (medicationForm.hasDiluent === 'нет' || 
       (medicationForm.hasDiluent === 'да' && 
        medicationForm.diluent && 
        medicationForm.diluentDosage))
    );
  
    function toggleModal() {
      isModalOpen = !isModalOpen;
      if (!isModalOpen) {
        resetState();
      }
    }
  
    function toggleExistingSchemesModal() {
      isExistingSchemesModalOpen = !isExistingSchemesModalOpen;
    }
  
    function resetState() {
      medicationForm = {
        medication: medications[0],
        administrationType: 'в/м',
        dosage: '',
        hasDiluent: 'нет',
        diluent: '',
        diluentDosage: ''
      };
      selectedMedications = [];
      selectedDays = {};
    }
  
    function addMedication() {
      if (isFormValid) {
        const newMedication = { 
          ...medicationForm,
          id: Date.now() // уникальный идентификатор
        };
  
        // Если нет растворителя, обнуляем его поля
        if (newMedication.hasDiluent === 'нет') {
          newMedication.diluent = '';
          newMedication.diluentDosage = '';
        }
  
        selectedMedications = [...selectedMedications, newMedication];
  
        // Сбрасываем форму
        medicationForm = {
          medication: medications[0],
          administrationType: 'в/м',
          dosage: '',
          hasDiluent: 'нет',
          diluent: '',
          diluentDosage: ''
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
      toggleExistingSchemesModal();
    }
  
    function publishTreatmentScheme() {
      console.log('Publish treatment scheme', {
        serviceId,
        medicalCardId,
        medications: selectedMedications,
        schedule: selectedDays
      });
      toggleModal();
    }
  </script>
  
  <div class="treatment-scheme-container">
    <!-- Весь предыдущий код остается без изменений -->
  </div>
  
  <style>
    /* Все предыдущие стили остаются без изменений */
  
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
  </style>