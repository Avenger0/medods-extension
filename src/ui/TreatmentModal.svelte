<!-- src/ui/TreatmentModal.svelte -->
<script>
    export let isOpen = false;
    export let onClose;
    export let maxWidth = '1100px';
    export let maxHeight = '80%';
    export let backgroundColor = 'white';
    export let borderRadius = '8px';
    export let padding = '20px';
    export let boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    export let zIndex = 1000;
    export let overlayColor = 'rgba(0,0,0,0.5)';
    
    // Закрывать модальное окно только при клике на оверлей
    function handleOverlayClick(e) {
      if (e.target.classList.contains('modal-overlay')) {
        onClose();
      }
    }
  </script>
  
  {#if isOpen}
    <div 
      class="modal-overlay" 
      style="--overlay-color: {overlayColor}; --z-index: {zIndex};"
      on:mousedown={handleOverlayClick}
    >
      <div 
        class="modal-content" 
        style="
          --max-width: {maxWidth}; 
          --max-height: {maxHeight}; 
          --bg-color: {backgroundColor}; 
          --border-radius: {borderRadius}; 
          --padding: {padding};
          --box-shadow: {boxShadow};
        "
        on:click|stopPropagation
      >
        <button class="modal-close" on:click={onClose}>✖</button>
        
        <slot></slot>
      </div>
    </div>
  {/if}
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--overlay-color, rgba(0,0,0,0.5));
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: var(--z-index, 1000);
      overflow-y: auto;
    }
  
    .modal-content {
      background: var(--bg-color, white);
      border-radius: var(--border-radius, 8px);
      max-width: var(--max-width, 1100px);
      max-height: var(--max-height, 80%);
      width: calc(100% - 40px);
      position: relative;
      padding: var(--padding, 20px);
      box-shadow: var(--box-shadow, 0 4px 6px rgba(0,0,0,0.1));
      overflow-y: auto;
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
      transition: color 0.2s ease;
      z-index: 1;
    }
    
    .modal-close:hover {
      color: #333;
    }
  </style>