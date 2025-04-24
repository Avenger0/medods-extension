<!-- src/ui/SchemeItem.svelte -->
<script>
  // Входные параметры
  export let scheme = {};
  export let onSelect;
  export let onEdit;
  
  // Стилевые пропсы
  export let itemBgColor = '#f8f9fa';
  export let itemHoverColor = '#e9ecef';
  export let itemBorderColor = '#e9ecef';
  export let titleColor = '#333';
  export let detailsColor = '#6c757d';
  
  // Кнопки
  export let useButtonBgColor = '#007bff';
  export let useButtonTextColor = '#fff';
  export let editButtonBgColor = '#6c757d';
  export let editButtonTextColor = '#fff';
</script>

<div class="scheme-item" 
  style="--item-bg-color: {itemBgColor}; 
         --item-hover-color: {itemHoverColor}; 
         --item-border-color: {itemBorderColor};
         --title-color: {titleColor};
         --details-color: {detailsColor};
         --use-btn-bg: {useButtonBgColor};
         --use-btn-text: {useButtonTextColor};
         --edit-btn-bg: {editButtonBgColor};
         --edit-btn-text: {editButtonTextColor};">
         
  <div class="scheme-title">
    <strong>{scheme.name}</strong>
    <div class="container-medication-detail">
      {#each scheme.medications as med}
        <div class="medication-details">
          {med.name}
          {#if med.diluents && med.diluents.length > 0}
            <span class="diluent-info">
              {' + '}{med.diluents.map(d => `${d.type} (${d.dosage})`).join(' + ')}
            </span>
          {/if}
          → {med.administrationType}
          {#if med.administrationType === 'в/в' && med.ivMethod}
            ({med.ivMethod})
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <div class="scheme-actions">
    <button 
      class="btn-use-scheme"
      on:click|stopPropagation={onEdit}
    >
      Редактировать
    </button>
  </div>
</div>

<style>
  .scheme-item {
    display: grid;
    max-height: 250px;
    background-color: var(--item-bg-color, #f8f9fa);
    border: 1px solid var(--item-border-color, #e9ecef);
    border-radius: 4px;
    padding: 12px;
    transition: background-color 0.2s ease, transform 0.1s ease;
  }

  .scheme-item:hover {
    background-color: var(--item-hover-color, #e9ecef);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .scheme-title {
    color: var(--title-color, #333);
  }

  .medication-details {
    color: var(--details-color, #6c757d);
    font-size: 0.9em;
    padding: 7px 0px;
  }

  .medication-details:not(:last-child) {
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }
  
  .diluent-info {
    font-style: italic;
  }

  .scheme-actions {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 10px;
  }

  .btn-use-scheme, .btn-edit-scheme {
    padding: 6px 10px;
    font-size: 13px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s ease;
    max-height: 30px;
  }

  .btn-use-scheme {
    background-color: var(--use-btn-bg, #007bff);
    color: var(--use-btn-text, #fff);
  }

  .btn-edit-scheme {
    background-color: var(--edit-btn-bg, #6c757d);
    color: var(--edit-btn-text, #fff);
  }

  .container-medication-detail{
    max-height: 140px;
    overflow-y: auto;
    padding-right: 25px;
  }

  .btn-use-scheme:hover, .btn-edit-scheme:hover {
    opacity: 0.9;
  }
</style>