import { startRouter } from './controller/router.js';

window.addEventListener('error', function(event) {
    // Игнорируем ошибки fileupload
    if (event.message && event.message.includes('fileupload')) {
        console.log('🛡️ Проигнорирована ошибка fileupload');
        event.preventDefault();
        event.stopPropagation();
        return true;
    }
}, true);

console.log('✅ Content script работает');
startRouter();