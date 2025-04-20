<script>
    import { createEventDispatcher } from 'svelte';
  
    export let medications = [];
  
    const dispatch = createEventDispatcher();
  
    let selectedMedication = null;
    let administrationType = '';
    let dosage = '';
    let diluent = '';
    let diluentDosage = '';
  
    function addMedication() {
      if (selectedMedication && administrationType && dosage) {
        dispatch('add', {
          medication: selectedMedication,
          administrationType,
          dosage,
          diluent,
          diluentDosage
        });
      }
    }
  </script>
  
  <div class="medication-form">
    <h3>Добавление препарата</h3>
    
    <select bind:value={selectedMedication}>
      <option value={null}>Выберите препарат</option>
      {#each medications as med}
        <option value={med}>{med.name}</option>
      {/each}
    </select>
  
    <select bind:value={administrationType}>
      <option value="">Способ введения</option>
      <option value="в/м">В/м</option>
      <option value="в/в">В/в</option>
    </select>
  
    <input 
      type="text" 
      bind:value={dosage} 
      placeholder="Дозировка препарата"
    />
  
    <select bind:value={diluent}>
      <option value="">Растворитель</option>
      <option value="глюкоза">Глюкоза</option>
      <option value="физраствор">Физраствор</option>
    </select>
  
    <input 
      type="text" 
      bind:value={diluentDosage} 
      placeholder="Дозировка растворителя"
    />
  
    <button on:click={addMedication}>Добавить препарат</button>
  </div>
  
  <style>
    .medication-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  
    select, input, button {
      padding: 8px;
      margin: 5px 0;
    }
  </style>