<!-- src/ui/ExistingSchemes.svelte -->
<script>
    import SchemeItem from './SchemeItem.svelte';
    
    // Входные параметры
    export let schemes = [];
    export let onSelect;
    export let onEdit;

    export let isLoading = false;
    export let error = null;
    
    // Стилевые пропсы
    export let bgColor = '#f8f9fa';
    export let titleColor = '#333';
    export let borderColor = '#e9ecef';
  </script>
  
  <div class="existing-schemes" style="--bg-color: {bgColor}; --title-color: {titleColor}; --border-color: {borderColor};">
    <h2>📋 Существующие схемы лечения для этого приема</h2>
    
    {#if isLoading}
        <div class="loading-indicator">Загрузка схем лечения...</div>
    {:else if error}
        <div class="error-message">Ошибка: {error}</div>
    {:else if schemes.length}
        <div class="schemes-list">
            {#each schemes as scheme (scheme.id)}
            <SchemeItem 
                {scheme} 
                onSelect={() => onSelect(scheme)}
                onEdit={() => onEdit(scheme)}
            />
            {/each}
        </div>
    {:else}
        <p class="no-schemes">Нет существующих схем для этого приема</p>
    {/if}
  </div>
  
  <style>
    .existing-schemes {
        background-color: var(--bg-color, #f8f9fa);
        border-radius: 6px;
        padding: 15px;
        border: 1px solid var(--border-color, #e9ecef);
    }

    h2 {
      margin-top: 0;
      color: var(--title-color, #333);
      font-size: 1.2rem;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--border-color, #e9ecef);
      padding-bottom: 10px;
    }
    
    .schemes-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        max-height: 750px;
        overflow-y: auto;
        padding-right: 5px;
    }
    .no-schemes {
      font-style: italic;
      color: #6c757d;
      text-align: center;
      padding: 15px 0;
    }
    .loading-indicator {
        padding: 15px;
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
  </style>