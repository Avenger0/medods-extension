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

  $: hasProcedures = scheme.procedures && Array.isArray(scheme.procedures) && scheme.procedures.length > 0;

   // Функция для получения иконки типа процедуры
   function getProcedureTypeIcon(type) {
      switch(type) {
          case 'transair':
              return '🧠'; // Иконка для Трансаира
          case 'laser':
              return '🔆'; // Иконка для лазерной терапии
          case 'vlok':
              return '💉'; // Иконка для ВЛОК
          case 'electrophoresis':
              return '⚡'; // Иконка для электрофореза
          case 'autohemotherapy':
              return '🩸'; // Иконка для аутогемотерапии
          default:
              return '⚕️'; // Иконка по умолчанию (медицинский символ)
      }
  }

  function formatProcedureDisplay(proc) {
      if (proc.type === 'autohemotherapy') {
          return `${getProcedureTypeIcon(proc.type)} ${proc.name}`;
      } else {
          return `${getProcedureTypeIcon(proc.type)} ${proc.name} ${proc.time} мин`;
      }
  }

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

      {#if hasProcedures}
          {#each scheme.procedures as proc}
              <div class="medication-details">
                  {formatProcedureDisplay(proc)}
              </div>
          {/each}
      {/if}

    </div>
  </div>
  
  <div class="scheme-actions">
    <button 
      class="btn-use-scheme"
      on:click|stopPropagation={onEdit}
    >
      Редактировать
    </button>
    {#if scheme.pdfUrl}
      <a 
        href={scheme.pdfUrl} 
        target="_blank" 
        class="pdf-icon" 
        title="Открыть PDF"
      >
        <svg height="40px" width="40px" viewBox="0 0 512 512" xml:space="preserve">
          <path style="fill:#E2E5E7;" d="M128,0c-17.6,0-32,14.4-32,32v448c0,17.6,14.4,32,32,32h320c17.6,0,32-14.4,32-32V128L352,0H128z"/>
          <path style="fill:#B0B7BD;" d="M384,128h96L352,0v96C352,113.6,366.4,128,384,128z"/>
          <polygon style="fill:#CAD1D8;" points="480,224 384,128 480,128 "/>
          <path style="fill:#F15642;" d="M416,416c0,8.8-7.2,16-16,16H48c-8.8,0-16-7.2-16-16V256c0-8.8,7.2-16,16-16h352c8.8,0,16,7.2,16,16V416z"/>
          <g>
            <path style="fill:#FFFFFF;" d="M101.744,303.152c0-4.224,3.328-8.832,8.688-8.832h29.552c16.64,0,31.616,11.136,31.616,32.48c0,20.224-14.976,31.488-31.616,31.488h-21.36v16.896c0,5.632-3.584,8.816-8.192,8.816c-4.224,0-8.688-3.184-8.688-8.816V303.152z M118.624,310.432v31.872h21.36c8.576,0,15.36-7.568,15.36-15.504c0-8.944-6.784-16.368-15.36-16.368H118.624z"/>
            <path style="fill:#FFFFFF;" d="M196.656,384c-4.224,0-8.832-2.304-8.832-7.92v-72.672c0-4.592,4.608-7.936,8.832-7.936h29.296c58.464,0,57.184,88.528,1.152,88.528H196.656z M204.72,311.088V368.4h21.232c34.544,0,36.08-57.312,0-57.312H204.72z"/>
            <path style="fill:#FFFFFF;" d="M303.872,312.112v20.336h32.624c4.608,0,9.216,4.608,9.216,9.072c0,4.224-4.608,7.68-9.216,7.68h-32.624v26.864c0,4.48-3.184,7.92-7.664,7.92c-5.632,0-9.072-3.44-9.072-7.92v-72.672c0-4.592,3.456-7.936,9.072-7.936h44.912c5.632,0,8.96,3.344,8.96,7.936c0,4.096-3.328,8.704-8.96,8.704h-37.248V312.112z"/>
          </g>
          <path style="fill:#CAD1D8;" d="M400,432H96v16h304c8.8,0,16-7.2,16-16v-16C416,424.8,408.8,432,400,432z"/>
        </svg>
      </a>
    {/if}
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
    justify-content: space-between;
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

  .pdf-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  .pdf-icon:hover {
    opacity: 0.8;
  }

  .container-medication-detail{
    max-height: 140px;
    overflow-y: auto;
    padding-right: 25px;
  }

  .btn-use-scheme:hover{
    opacity: 0.9;
  }
</style>