<!-- src/ui/CreateSchemeButton.svelte -->
<script>
    export let onClick;
    
    // Стилевые пропсы
    export let buttonBgColor = '#28a745';
    export let buttonTextColor = '#fff';
    export let buttonHoverColor = '#218838';
    export let buttonBorderRadius = '4px'; 
  </script>
  
  <button 
    class="btn-add-new-scheme"
    style="--btn-bg-color: {buttonBgColor}; 
           --btn-text-color: {buttonTextColor}; 
           --btn-hover-color: {buttonHoverColor};
           --btn-border-radius: {buttonBorderRadius};"
    on:click={onClick}
  >
    + Создать новую схему
  </button>
  
  <style>
    .btn-add-new-scheme {
      background-color: var(--btn-bg-color, #28a745);
      color: var(--btn-text-color, #fff);
      border: none;
      padding: 12px 16px;
      border-radius: var(--btn-border-radius, 4px);
      margin-top: 15px;
      cursor: pointer;
      width: 100%;
      font-weight: 500;
      transition: background-color 0.2s ease, transform 0.1s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  
    .btn-add-new-scheme:hover {
      background-color: var(--btn-hover-color, #218838);
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    }
    
    .btn-add-new-scheme:active {
      transform: translateY(1px);
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
  </style>