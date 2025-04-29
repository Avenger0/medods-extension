<!-- src/ui/CreateProcedureButton.svelte -->
<script>
    export let onClick;
    
    // Стилевые пропсы
    export let buttonBgColor = '#9b59b6';
    export let buttonTextColor = '#fff';
    export let buttonHoverColor = '#8e44ad';
    export let buttonBorderRadius = '4px'; 
</script>
  
<button 
    class="btn-add-new-procedure"
    style="--btn-bg-color: {buttonBgColor}; 
           --btn-text-color: {buttonTextColor}; 
           --btn-hover-color: {buttonHoverColor};
           --btn-border-radius: {buttonBorderRadius};"
    on:click={onClick}
>
    + Добавить процедуру
</button>
  
<style>
    .btn-add-new-procedure {
        background-color: var(--btn-bg-color, #9b59b6);
        color: var(--btn-text-color, #fff);
        border: none;
        padding: 12px 16px;
        border-radius: var(--btn-border-radius, 4px);
        margin-top: 15px;
        cursor: pointer;
        width: 100%;
        max-width: 300px;
        font-weight: 500;
        transition: background-color 0.2s ease, transform 0.1s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin: auto;
        font-size: 18px;
    }
  
    .btn-add-new-procedure:hover {
        background-color: var(--btn-hover-color, #8e44ad);
        transform: translateY(-1px);
        box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    }
    
    .btn-add-new-procedure:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
</style>