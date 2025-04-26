<!-- src/ui/OutdatedVersionOverlay.svelte -->
<script>
    export let currentVersion;
    export let latestVersion;
    
    // Функция для закрытия модального окна
    function closeModal() {
        // Находим ближайший родительский элемент и удаляем его из DOM
        const modalContainer = document.querySelector('.outdated-overlay');
        if (modalContainer && modalContainer.parentNode) {
            modalContainer.parentNode.removeChild(modalContainer);
        }
    }
</script>

<div class="outdated-overlay">
    <div class="outdated-content">
        <button class="close-button" on:click={closeModal}>✕</button>
        <div class="warning-icon">⚠️</div>
        <h2>Требуется обновление расширения</h2>
        <p>Вы используете устаревшую версию расширения Medods Extension Plus.</p>
        
        <div class="version-info">
            <div>Ваша версия: <span class="version current">{currentVersion}</span></div>
            <div>Актуальная версия: <span class="version latest">{latestVersion}</span></div>
        </div>
        
        <p class="update-instructions">
            Для продолжения работы необходимо обновить расширение до последней версии. Пожалуйста, обратитесь к администратору или технической поддержке для получения обновления.
        </p>
        
        <div class="buttons-row">
            <button class="cancel-button" on:click={closeModal}>
                Закрыть
            </button>
        </div>
    </div>
</div>

<style>
    .outdated-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    
    .outdated-content {
        position: relative;
        background-color: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #999;
    }
    
    .close-button:hover {
        color: #333;
    }
    
    .warning-icon {
        font-size: 48px;
        margin-bottom: 20px;
    }
    
    h2 {
        color: #d9534f;
        margin-bottom: 20px;
    }
    
    .version-info {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
        font-family: monospace;
        font-size: 16px;
    }
    
    .version {
        font-weight: bold;
    }
    
    .current {
        color: #dc3545;
    }
    
    .latest {
        color: #28a745;
    }
    
    .update-instructions {
        margin-bottom: 25px;
        line-height: 1.5;
    }
    
    .buttons-row {
        display: flex;
        justify-content: center;
        gap: 15px;
    }
    
    .update-button {
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: bold;
        transition: background-color 0.2s;
    }
    
    .update-button:hover {
        background-color: #0056b3;
    }
    
    .cancel-button {
        display: inline-block;
        background-color: #6c757d;
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .cancel-button:hover {
        background-color: #5a6268;
    }
</style>