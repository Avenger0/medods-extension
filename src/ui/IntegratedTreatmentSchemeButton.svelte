<!-- src/ui/IntegratedTreatmentSchemeButton.svelte -->
<script>
    // Импортируем компоненты
    import ExistingSchemes from './ExistingSchemes.svelte';
    import MedicationFormModal from './MedicationFormModal.svelte';
    import CreateSchemeButton from './CreateSchemeButton.svelte';
    import TreatmentModal from './TreatmentModal.svelte';
    import VersionChecker from '../utils/versionCheck.js';
    import OutdatedVersionOverlay from './OutdatedVersionOverlay.svelte';

    import ProcedureFormModal from './ProcedureFormModal.svelte';
    import ProcedureItem from './ProcedureItem.svelte';
    import CreateProcedureButton from './CreateProcedureButton.svelte';

    let isVersionChecking = true;
    let isVersionOutdated = false;
    let currentVersion = appVersion.toString();
    let latestVersion = null;
    
    
    import { medicationService, treatmentService, procedureService} from '../utils/api.js';
    import { appVersion } from '../utils/version.js';
    import { onMount } from 'svelte';
    
    // Пропсы для интеграции
    export let serviceId = null;
    export let medicalCardId = null;
    
    // Стилевые пропсы - модальное окно
    export let modalMaxWidth = '1100px';
    export let modalBgColor = 'white';
    export let modalBorderRadius = '8px';
    export let modalOverlayColor = 'rgba(0,0,0,0.2)';
    
    // Стилевые пропсы - список схем
    export let schemesBgColor = '#f8f9fa';
    export let schemesTitleColor = '#333';
    export let schemesBorderColor = '#e9ecef';
    
    // Стилевые пропсы - элементы схем
    export let schemeItemBgColor = '#f8f9fa';
    export let schemeItemHoverColor = '#e9ecef';
    export let schemeItemBorderColor = '#e9ecef';
    export let schemeTitleColor = '#333';
    export let schemeDetailsColor = '#6c757d';
    
    // Стилевые пропсы - кнопки действий со схемами
    export let useButtonBgColor = '#007bff';
    export let useButtonTextColor = '#fff';
    export let editButtonBgColor = '#6c757d';
    export let editButtonTextColor = '#fff';
    
    // Стилевые пропсы - кнопки создания новой схемы
    export let createButtonBgColor = '#28a745';
    export let createButtonTextColor = '#fff';
    export let createButtonHoverColor = '#218838';
    export let createButtonBorderRadius = '4px';
    
    // Стилевые пропсы - главная кнопка
    export let mainButtonBgColor = '#007bff';
    export let mainButtonTextColor = 'white';
    export let mainButtonBorderRadius = '4px';
    
    const checkSvg = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    // Состояние интерфейса
    let isModalOpen = false;
    let isCreatingNewScheme = false;
    let isMedicationFormOpen = false;
    let isProcedureFormOpen = false;
    let isLoading = false;
    let validationError = '';
    let tableReady = false;

    let isDiagnosisWarningVisible = false;
    let diagnosisWarningText = "";

    let requireConfirmation = false;

    let isButtonLoading = false;

    $: requireConfirmation = selectedMedications.length > 0 && isCreatingNewScheme;

    // Данные препаратов и форм
    let medications = [];
    let isLoadingMedications = false;

    // Вызываем загрузку при первом открытии модального окна
    $: if (isModalOpen && medications.length === 0 && !isLoadingMedications) {
        loadMedications();
    }

    // Функция для проверки диагноза
    async function checkDiagnosis() {
        try {
            const result = await treatmentService.checkDiagnosis(serviceId);
            if (!result.status) {
                isDiagnosisWarningVisible = true;
                diagnosisWarningText = result.text;
            } else {
                isDiagnosisWarningVisible = false;
            }
        } catch (error) {
            console.error('Ошибка при проверке диагноза:', error);
        }
    }

    // Функция для загрузки медикаментов с API
    async function loadMedications() {
        try {
            isLoadingMedications = true;
            const response = await medicationService.cachedRequest('getAvailableMedications', {serviceId});
            medications = response.medications.map(med => ({
                id: med.id,
                name: med.shortName,
                fullName: med.fullName,
                type: med.type && med.type.length > 0 ? med.type[0] : 'в/м',
                availableTypes: med.type || ['в/м', 'в/в']
            }));

        } catch (error) {
            console.error('Ошибка загрузки медикаментов:', error);
        } finally {
            isLoadingMedications = false;
        }
    }
    
    // Текущая форма препарата
    let currentMedicationForm = {
        medication: null,
        administrationType: 'в/м',
        dosage: '',
        hasDiluent: 'нет',
        diluents: []
    };
    
    // ID редактируемого препарата
    let editingMedicationId = null;
    let currentEditingScheme = null;

    // Массив для хранения выбранных процедур
    let selectedProcedures = [];

    // Выбранные препараты и расписание
    let selectedMedications = [];
    let selectedDays = {}; // Теперь будет иметь вложенную структуру: medicationId -> subMedId -> weeks -> days

    
    let existingSchemes = [];
    let isLoadingSchematics = false;
    let schematicsError = null;



    // Замените существующую логику загрузки схем
    let isFirstLoad = true;

    // Добавьте проверку на наличие запроса в процессе
    async function loadSchematics() {
        if (isLoadingSchematics) return; // Предотвращаем повторный запрос, если загрузка уже идет
        
        try {
            isLoadingSchematics = true;
            schematicsError = null;
            console.log(`Загрузка схем для приема ${serviceId}`);
            
            const response = await treatmentService.getSchematicsForService(serviceId);
            
            if (response && response.schematics && Array.isArray(response.schematics)) {
                existingSchemes = response.schematics;
                console.log(`Загружено ${existingSchemes.length} схем`);
            } else {
                existingSchemes = [];
                console.warn('Неверный формат данных:', response);
            }
        } catch (error) {
            console.error('Ошибка загрузки схем:', error);
            existingSchemes = [];
        } finally {
            isLoadingSchematics = false;
        }
    }
        
    // Проверка валидности расписания
    $: isScheduleValid = 
        (selectedMedications.length > 0 ? 
            selectedMedications.every(medication => 
                medication.selectedMedications.every(subMed => 
                    selectedDays[medication.id] && 
                    selectedDays[medication.id][subMed.id] && 
                    Object.values(selectedDays[medication.id][subMed.id]).some(daySet => daySet.size > 0)
                )
            ) : true
        ) && 
        (selectedProcedures.length > 0 ? 
            selectedProcedures.every(proc => 
                selectedDays['procedure_' + proc.id] && 
                Object.values(selectedDays['procedure_' + proc.id]).some(daySet => daySet.size > 0)
            ) : true
        ) &&
        // Хотя бы что-то должно быть добавлено
        (selectedMedications.length > 0 || selectedProcedures.length > 0);
    
    // Функция для открытия/закрытия главного модального окна
    async function toggleModal() {
        // Если модальное окно закрывается, просто закрываем
        if (isModalOpen) {
            isModalOpen = false;
            resetState();
            return;
        }

        isButtonLoading = true;

        try {
            await checkVersion();
            
            // Если версия актуальна или проверка не выполнена, открываем модальное окно
            if (!isVersionOutdated) {
                isButtonLoading = false;
                isModalOpen = true;
                
                if (serviceId) {
                    loadSchematics();
                    await checkDiagnosis();
                }
            } else {
                // Показываем модальное окно с предупреждением об устаревшей версии
                showOutdatedVersionModal();
            }
        } catch (error) {
            console.error('Ошибка при открытии модального окна:', error);
        } finally {
            isButtonLoading = false;
        }

       
    }

    function selectAllDaysForMedication(medication) {
        // Проверяем, есть ли у препарата подпрепараты (коктейль)
        if (medication.selectedMedications && medication.selectedMedications.length > 0) {
            // Для каждого подпрепарата в коктейле
            medication.selectedMedications.forEach(subMed => {
                // Пропускаем препараты с дозировкой по дням
                if (subMed.hasDailyDosages) {
                    return;
                }
                
                if (!selectedDays[medication.id]) {
                    selectedDays[medication.id] = {};
                }
                
                if (!selectedDays[medication.id][subMed.id]) {
                    selectedDays[medication.id][subMed.id] = {};
                }
                
                if (!selectedDays[medication.id][subMed.id][1]) {
                    selectedDays[medication.id][subMed.id][1] = new Set();
                }
                
                // Выбираем первые 10 дней
                for (let day = 1; day <= 10; day++) {
                    selectedDays[medication.id][subMed.id][1].add(day);
                }
            });
        }
        
        // Триггерим реактивность
        selectedDays = {...selectedDays};
        validationError = '';
    }

    // Функция для показа модального окна с предупреждением
    function showOutdatedVersionModal() {
        const modalElement = document.createElement('div');
        document.body.appendChild(modalElement);
        
        new OutdatedVersionOverlay({
            target: modalElement,
            props: {
                currentVersion,
                latestVersion
            }
        });
    }
    
    // Сброс состояния при закрытии
    function resetState() {
        currentMedicationForm = getEmptyMedicationForm();
        selectedMedications = [];
        selectedProcedures = []; // Сбрасываем процедуры
        selectedDays = {};
        isCreatingNewScheme = false;
        currentEditingScheme = null;
        validationError = '';
        isFirstLoad = true; // Сбрасываем флаг при закрытии модального окна
    }
        
    // Создание пустой формы препарата
    function getEmptyMedicationForm() {
        return {
            selectedMedications: [], // Всегда возвращаем массив
            administrationType: 'в/м',
            hasDiluent: 'нет',
            diluents: []
        };
    }
    
    // Открыть форму добавления нового препарата
    function openNewMedicationForm() {
        currentMedicationForm = getEmptyMedicationForm();
        editingMedicationId = null;
        isMedicationFormOpen = true;
    }

    // Создаем экземпляр проверки версий
    const versionChecker = new VersionChecker();

    // Функция для проверки версии
    async function checkVersion() {
        isVersionChecking = true;
        try {
            const result = await versionChecker.checkVersion();
            
            isVersionOutdated = result.isOutdated;
            latestVersion = result.latestVersion;
            
            if (isVersionOutdated) {
                console.warn(`Используется устаревшая версия расширения: ${currentVersion}. Актуальная версия: ${latestVersion}`);
            }
        } catch (error) {
            console.error('Ошибка при проверке версии:', error);
        } finally {
            isVersionChecking = false;
        }
    }
    
    function editMedication(medication) {
        // Защита от undefined
        let medsToPut = [];
        
        if (medication.selectedMedications && Array.isArray(medication.selectedMedications)) {
            // Создаем глубокую копию с сохранением всех необходимых полей
            medsToPut = medication.selectedMedications.map(med => ({
                id: med.id,
                name: med.name,
                fullName: med.fullName,
                dosage: med.dosage,
                manufacturer: med.manufacturer || '',
                dosageForm: med.dosageForm || '',
                concentration: med.concentration || '',
                hasDailyDosages: med.hasDailyDosages || false,
                dailyDosages: med.dailyDosages ? JSON.parse(JSON.stringify(med.dailyDosages)) : {}
            }));
        } else if (medication.medication) {
            const nameMatch = medication.medication.name.match(/(.+?)\s*\(([^)]+)\)/);
            
            medsToPut = [{
                id: medication.medication.id || Date.now(),
                name: nameMatch ? nameMatch[1].trim() : medication.medication.name,
                fullName: medication.medication.fullName || medication.medication.name,
                dosage: nameMatch ? nameMatch[2] : (medication.dosage || ''),
                manufacturer: medication.medication.manufacturer || '',
                dosageForm: medication.medication.dosageForm || '',
                concentration: medication.medication.concentration || ''
            }];
        }
        
         // Проверяем, действительно ли нужны растворители
        const hasDiluent = medication.diluents && medication.diluents.length > 0 ? 'да' : 'нет';
        
        // Готовим список растворителей только если hasDiluent = 'да'
        const diluentsList = hasDiluent === 'да' 
            ? (medication.diluents ? medication.diluents.map(d => ({...d})) : [])
            : [];

        currentMedicationForm = {
            selectedMedications: medsToPut,
            administrationType: medication.administrationType,
            ivMethod: medication.ivMethod || (medication.administrationType === 'в/в' ? 'капельно' : null),
            hasDiluent: hasDiluent,
            diluents: diluentsList,
            comment: medication.comment || ''
        };
        
        editingMedicationId = medication.id;
        isMedicationFormOpen = true;
    }

    // Удаление препарата
    function deleteMedication(medicationId) {
        selectedMedications = selectedMedications.filter(med => med.id !== medicationId);
        
        if (selectedDays[medicationId]) {
            delete selectedDays[medicationId];
            selectedDays = {...selectedDays}; // Триггерим реактивность
        }
        
        validationError = '';

        setTimeout(equalizeRowHeights, 100);
    }
    
    // Обработка сохранения препарата
    function handleSaveMedication(formData) {
        // Защита от undefined
        if (!formData || !formData.selectedMedications) {
            console.error('Отсутствуют данные о выбранных препаратах');
            return;
        }

        // Убедимся, что при hasDiluent='нет', массив растворителей пустой
        const diluentsList = formData.hasDiluent === 'нет' ? [] : (formData.diluents ? [...formData.diluents] : []);

        if (editingMedicationId) {
            // Обновление существующего препарата
            selectedMedications = selectedMedications.map(med => {
                if (med.id === editingMedicationId) {
                    // Проверяем наличие массива selectedMedications
                    const medsArray = formData.selectedMedications || [];
                    
                    // Формируем название препарата с дозировкой
                    const medNameWithDosage = medsArray.length > 0 
                        ? medsArray.map(m => `${m.name || ''} (${m.hasDailyDosages ? 'по дням' : (m.dosage || '')})`) 
                        : 'Неизвестный препарат';
                        
                    return {
                        ...med,
                        selectedMedications: medsArray.map(m => ({
                            ...m,
                            hasDailyDosages: m.hasDailyDosages || false,
                            dailyDosages: m.dailyDosages || {}
                        })),
                        medication: {
                            name: medNameWithDosage.join(' + ')
                        },
                        administrationType: formData.administrationType,
                        ivMethod: formData.administrationType === 'в/в' ? formData.ivMethod : null,
                        dosage: "",
                        hasDiluent: formData.hasDiluent,
                        diluents: diluentsList,
                        comment: formData.comment || ''
                    };
                }
                return med;
            });
            
            editingMedicationId = null;
        } else {
            // Защита от пустого массива
            if (formData.selectedMedications.length === 0) {
                console.warn('Попытка добавить препарат без выбранных медикаментов');
                return;
            }
            
            // Формируем название препарата с дозировкой
            const medNameWithDosage = formData.selectedMedications.map(m => 
                `${m.name || ''} (${m.hasDailyDosages ? 'по дням' : (m.dosage || '')})`
            );
            
            // Добавление нового "коктейля" препаратов
            const newMedication = {
                id: String(Date.now()) + '_' + Math.random().toString(36).substring(2, 9),
                selectedMedications: formData.selectedMedications.map(m => ({
                    ...m,
                    hasDailyDosages: m.hasDailyDosages || false,
                    dailyDosages: m.dailyDosages || {}
                })),
                medication: {
                    id: formData.selectedMedications[0]?.id || Date.now(), 
                    name: medNameWithDosage.join(' + ')
                },
                administrationType: formData.administrationType,
                ivMethod: formData.administrationType === 'в/в' ? formData.ivMethod : null, // Добавляем ivMethod
                dosage: "", // Общее поле дозировки не используем
                hasDiluent: formData.hasDiluent,
                diluents: diluentsList,
                comment: formData.comment || ''
            };
            
            selectedMedications = [...selectedMedications, newMedication];
        }
        
        isMedicationFormOpen = false;

        selectedMedications.forEach(med => {
            if (med.selectedMedications) {
                med.selectedMedications.forEach(subMed => {
                    // Если у препарата есть дозировки по дням
                    if (subMed.hasDailyDosages && subMed.dailyDosages) {
                        // Очищаем существующие выбранные дни для этого подпрепарата
                        if (selectedDays[med.id] && selectedDays[med.id][subMed.id]) {
                            // Удаляем все выбранные дни
                            for (const week in selectedDays[med.id][subMed.id]) {
                                selectedDays[med.id][subMed.id][week].clear();
                            }
                        }

                        // Добавляем только дни, для которых указаны дозировки
                        Object.keys(subMed.dailyDosages).forEach(dayStr => {
                            const day = parseInt(dayStr, 10);
                            if (!isNaN(day)) {
                                // Создаем структуру, если необходимо
                                if (!selectedDays[med.id]) {
                                    selectedDays[med.id] = {};
                                }
                                if (!selectedDays[med.id][subMed.id]) {
                                    selectedDays[med.id][subMed.id] = {};
                                }
                                if (!selectedDays[med.id][subMed.id][1]) {
                                    selectedDays[med.id][subMed.id][1] = new Set();
                                }
                                
                                // Автоматически выбираем день
                                selectedDays[med.id][subMed.id][1].add(day);
                            }
                        });
                    }
                });
            }
        });

        selectedMedications.forEach(med => {
            if (med.selectedMedications) {
                med.selectedMedications.forEach(subMed => {
                    if (subMed.hasDailyDosages && subMed.dailyDosages) {
                        // Для каждого дня с дозировкой
                        Object.keys(subMed.dailyDosages).forEach(dayStr => {
                            const day = parseInt(dayStr, 10);
                            if (!isNaN(day)) {
                                // Создаем структуру, если необходимо
                                if (!selectedDays[med.id]) {
                                    selectedDays[med.id] = {};
                                }
                                if (!selectedDays[med.id][subMed.id]) {
                                    selectedDays[med.id][subMed.id] = {};
                                }
                                if (!selectedDays[med.id][subMed.id][1]) {
                                    selectedDays[med.id][subMed.id][1] = new Set();
                                }
                                
                                // Автоматически выбираем день
                                selectedDays[med.id][subMed.id][1].add(day);
                            }
                        });
                    }
                });
            }
        });

        // Триггерим реактивность
        selectedDays = {...selectedDays};

    }

    // Обработчики для процедур
    function openProcedureForm() {
        isProcedureFormOpen = true;
    }
    
    function closeProcedureForm() {
        isProcedureFormOpen = false;
    }
    
    function handleSaveProcedure(procedureData) {
        selectedProcedures = [...selectedProcedures, procedureData];
        
        // Создаем пустое расписание для процедуры
        if (!selectedDays['procedure_' + procedureData.id]) {
            selectedDays['procedure_' + procedureData.id] = {
                1: new Set()
            };
        }
        
        // Если это аутогемотерапия и есть дозировки по дням, 
        // добавляем эти дни в расписание
        if (procedureData.type === 'autohemotherapy' && 
            procedureData.settings && 
            procedureData.settings.dailyDosages) {
                
            const key = 'procedure_' + procedureData.id;
            Object.keys(procedureData.settings.dailyDosages).forEach(day => {
                if (!selectedDays[key][1]) {
                    selectedDays[key][1] = new Set();
                }
                selectedDays[key][1].add(parseInt(day));
            });
        }
        
        // Обновляем реактивную переменную
        selectedDays = {...selectedDays};
        
        isProcedureFormOpen = false;
        
        // Если требуется форсированное обновление таблицы
        if (procedureData.forceUpdate) {
            setTimeout(equalizeRowHeights, 100);
        } else {
            setTimeout(equalizeRowHeights, 100);
        }
    }
    
    function deleteProcedure(procedureId) {
        selectedProcedures = selectedProcedures.filter(proc => proc.id !== procedureId);
        
        // Удаляем расписание для процедуры
        const key = 'procedure_' + procedureId;
        if (selectedDays[key]) {
            delete selectedDays[key];
            selectedDays = {...selectedDays}; // Триггерим реактивность
        }
        
        validationError = '';
        setTimeout(equalizeRowHeights, 100);
    }
    
    // Проверка выбранного дня для процедуры
    function isProcedureDaySelected(procedureId, day) {
        const key = 'procedure_' + procedureId;
        return selectedDays[key] && 
               selectedDays[key][1] && 
               selectedDays[key][1].has(day);
    }
    
    // Переключение дня для процедуры
    function toggleProcedureDay(procedureId, day) {
        const key = 'procedure_' + procedureId;
        const procedure = selectedProcedures.find(p => p.id === procedureId);
        
        // Добавим форсированное обновление в конце
        const forceUpdate = () => {
            // Создаем копию массива процедур для триггера реактивности
            selectedProcedures = [...selectedProcedures];
            // Обновляем расписание
            selectedDays = {...selectedDays};
            validationError = '';
            // Запускаем перестроение таблицы
            setTimeout(equalizeRowHeights, 100);
        };

// Особая обработка для аутогемотерапии с дозировками
if (procedure && procedure.type === 'autohemotherapy' && 
    procedure.settings && procedure.settings.dailyDosages) {
    
    // Проверяем, выбран ли уже этот день
    if (!selectedDays[key]) {
        selectedDays[key] = {
            1: new Set()
        };
    }
    
    const dayIsSelected = selectedDays[key][1].has(day);
    
    if (dayIsSelected) {
        // Если день уже выбран, спрашиваем о его удалении
        const hasDosage = procedure.settings.dailyDosages[day];
        
        if (hasDosage) {
            const confirmed = confirm(`День ${day} имеет дозировки. Хотите удалить этот день из схемы?`);
            
            if (!confirmed) {
                return;
            }
            
            // Удаляем день из расписания и из дозировок
            selectedDays[key][1].delete(day);
            delete procedure.settings.dailyDosages[day];

            forceUpdate();
        } else {
            // Просто удаляем день из расписания
            selectedDays[key][1].delete(day);

            forceUpdate();
        }
    } else {
        // Добавляем день и предлагаем указать дозировку
        selectedDays[key][1].add(day);
        
        // Значения дозировок по умолчанию
        let bloodDosage = "2 мл";
        let diluentDosage = procedure.settings.diluent && procedure.settings.diluent.enabled ? "1 мл" : null;
        
        // Запрашиваем дозировку крови
        const userBloodDosage = prompt(`Укажите дозировку крови для дня ${day}:`, bloodDosage);
        if (userBloodDosage) {
            bloodDosage = userBloodDosage;
            
            // Если есть растворитель, запрашиваем его дозировку
            if (procedure.settings.diluent && procedure.settings.diluent.enabled) {
                const userDiluentDosage = prompt(`Укажите дозировку ${procedure.settings.diluent.type} для дня ${day}:`, diluentDosage);
                if (userDiluentDosage) {
                    diluentDosage = userDiluentDosage;
                }
            }
            
            // Сохраняем дозировки
            if (!procedure.settings.dailyDosages) {
                procedure.settings.dailyDosages = {};
            }
            
            procedure.settings.dailyDosages[day] = {
                blood: bloodDosage
            };
            
            if (diluentDosage) {
                procedure.settings.dailyDosages[day].diluent = diluentDosage;
            }
        }

        forceUpdate();
    }
        } else {
            // Стандартная логика для других процедур
            if (!selectedDays[key]) {
                selectedDays[key] = {};
            }
            
            if (!selectedDays[key][1]) {
                selectedDays[key][1] = new Set();
            }
            
            if (selectedDays[key][1].has(day)) {
                selectedDays[key][1].delete(day);
            } else {
                selectedDays[key][1].add(day);
            }

            forceUpdate();
        }
    }
    
    function toggleDay(medicationId, subMedId, week, day) {
        if (!selectedDays[medicationId]) {
            selectedDays[medicationId] = {};
        }
        
        if (!selectedDays[medicationId][subMedId]) {
            selectedDays[medicationId][subMedId] = {};
        }
        
        if (!selectedDays[medicationId][subMedId][week]) {
            selectedDays[medicationId][subMedId][week] = new Set();
        }

        // Ищем информацию о препарате
        const medication = selectedMedications.find(med => med.id === medicationId);
        const subMed = medication?.selectedMedications?.find(m => m.id === subMedId);
        
        // Проверяем, использует ли препарат дозировки по дням
        if (subMed?.hasDailyDosages) {
            // Если уже есть дозировка для этого дня, не даем снять отметку
            if (selectedDays[medicationId][subMedId][week].has(day) && subMed.dailyDosages[day]) {
                const confirmed = confirm(`День ${day} имеет индивидуальную дозировку "${subMed.dailyDosages[day]}". Чтобы снять отметку с этого дня, нужно сначала удалить дозировку. Перейти к редактированию дозировок?`);
                
                if (confirmed) {
                    editMedication(medication);
                }
                return; // В любом случае не меняем отметку дня
            } 
            // Полностью запрещаем добавление дня через таблицу для препаратов с дозировками по дням
            else {
                alert(`Препарат "${subMed.name}" использует индивидуальные дозировки по дням. Для отметки дней используйте форму редактирования дозировок.`);
                editMedication(medication);
                return;
            }
        }

        // Стандартная логика переключения только для препаратов без дозировок по дням
        if (selectedDays[medicationId][subMedId][week].has(day)) {
            selectedDays[medicationId][subMedId][week].delete(day);
        } else {
            selectedDays[medicationId][subMedId][week].add(day);
        }

        selectedDays = {...selectedDays}; // Триггерим реактивность
        validationError = '';
    }
    
    // Выбор существующей схемы
    function selectExistingScheme(scheme) {
        // Загрузка препаратов схемы
        selectedMedications = scheme.medications.map(med => {
            const medId = med.id || String(Date.now()) + '_' + Math.random().toString(36).substring(2, 9);

            
            // Получаем список препаратов для коктейля
            let selectedMeds = [];
            if (med.selectedMedications && Array.isArray(med.selectedMedications)) {
                selectedMeds = med.selectedMedications.map(subMed => ({
                    ...subMed,
                    hasDailyDosages: subMed.hasDailyDosages || false, 
                    dailyDosages: subMed.dailyDosages || {}
                }));
            } else {
                // Если список препаратов отсутствует (для обратной совместимости)
                selectedMeds = [{
                    id: med.id,
                    name: med.name.split(' (')[0], // Извлекаем имя без дозировки
                    fullName: med.fullName || med.name,
                    dosage: med.dosage || (med.name.match(/\(([^)]+)\)/) ? med.name.match(/\(([^)]+)\)/)[1] : ''),
                    manufacturer: med.manufacturer || '',
                    dosageForm: med.dosageForm || '',
                    concentration: med.concentration || '',
                    hasDailyDosages: false,
                    dailyDosages: {}
                }];
            }
            
            return {
                id: medId,
                medication: { name: med.name },
                administrationType: med.administrationType,
                ivMethod: med.ivMethod || (med.administrationType === 'в/в' ? 'капельно' : null), // Восстанавливаем ivMethod
                dosage: med.dosage,
                hasDiluent: med.diluents && med.diluents.length > 0 ? 'да' : 'нет',
                diluents: med.diluents ? med.diluents.map(d => ({...d})) : [],
                selectedMedications: selectedMeds,
                comment: med.comment || ''
            };
        });
        
        if (scheme.procedures && Array.isArray(scheme.procedures)) {
            selectedProcedures = scheme.procedures.map(proc => ({
                id: proc.id || ('procedure_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)),
                type: proc.type,
                name: proc.name,
                time: proc.time,
                isTimeOnly: proc.isTimeOnly === undefined ? (proc.type !== 'electrophoresis') : proc.isTimeOnly,
                comment: proc.comment || '',
                frequency: proc.frequency,
                settings: proc.settings ? {...proc.settings} : null
            }));
        } else {
            // Если схема не содержит процедур, создаем пустой массив
            selectedProcedures = [];
        }

        // Восстанавливаем расписание
        selectedDays = {};
        
        if (scheme.schedule) {
            Object.entries(scheme.schedule).forEach(([id, value]) => {
                // Проверяем, это процедура или лекарство
                if (id.startsWith('procedure_')) {
                    // Для процедур
                    selectedDays[id] = {};
                    
                    Object.entries(value).forEach(([week, days]) => {
                        selectedDays[id][week] = new Set(days);
                    });
                } else {
                    // Для лекарств (старая логика)
                    selectedDays[id] = {};
                    
                    // Проверяем старый или новый формат расписания
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        // Новый формат с подпрепаратами
                        Object.entries(value).forEach(([subMedId, weeks]) => {
                            selectedDays[id][subMedId] = {};
                            
                            Object.entries(weeks).forEach(([week, days]) => {
                                selectedDays[id][subMedId][week] = new Set(days);
                            });
                        });
                    } else {
                        // Старый формат - преобразуем к новому
                        // Находим первый subMed для этого medId
                        const medication = selectedMedications.find(m => m.id === id);
                        if (medication && medication.selectedMedications && medication.selectedMedications.length > 0) {
                            const subMedId = medication.selectedMedications[0].id;
                            selectedDays[id][subMedId] = {};
                            
                            Object.entries(value).forEach(([week, days]) => {
                                selectedDays[id][subMedId][week] = new Set(days);
                            });
                        }
                    }
                }
            });
        }

        selectedMedications.forEach(med => {
            if (med.selectedMedications) {
                med.selectedMedications.forEach(subMed => {
                    if (subMed.hasDailyDosages && subMed.dailyDosages) {
                        // Для каждого дня с дозировкой
                        Object.keys(subMed.dailyDosages).forEach(dayStr => {
                            const day = parseInt(dayStr, 10);
                            if (!isNaN(day)) {
                                // Создаем структуру, если необходимо
                                if (!selectedDays[med.id]) {
                                    selectedDays[med.id] = {};
                                }
                                if (!selectedDays[med.id][subMed.id]) {
                                    selectedDays[med.id][subMed.id] = {};
                                }
                                if (!selectedDays[med.id][subMed.id][1]) {
                                    selectedDays[med.id][subMed.id][1] = new Set();
                                }
                                
                                // Автоматически выбираем день
                                selectedDays[med.id][subMed.id][1].add(day);
                            }
                        });
                    }
                });
            }
        });

        selectedDays = {...selectedDays};
        
        isCreatingNewScheme = true;
        validationError = '';
    }
    
    // Начать создание новой схемы
    function startNewScheme() {
        isCreatingNewScheme = true;
        selectedMedications = [];
        selectedDays = {};
        validationError = '';
    }
    
    // Редактирование существующей схемы
    function editExistingScheme(scheme) {
        selectExistingScheme(scheme); // Переиспользуем функцию выбора
        currentEditingScheme = scheme;

        setTimeout(() => {
            // Дополнительная проверка после асинхронной загрузки
            selectedMedications.forEach(med => {
                if (med.selectedMedications) {
                    med.selectedMedications.forEach(subMed => {
                        if (subMed.hasDailyDosages && subMed.dailyDosages) {
                            // Для каждого дня с дозировкой
                            Object.keys(subMed.dailyDosages).forEach(dayStr => {
                                const day = parseInt(dayStr, 10);
                                if (!isNaN(day)) {
                                    // Создаем структуру, если необходимо
                                    if (!selectedDays[med.id]) {
                                        selectedDays[med.id] = {};
                                    }
                                    if (!selectedDays[med.id][subMed.id]) {
                                        selectedDays[med.id][subMed.id] = {};
                                    }
                                    if (!selectedDays[med.id][subMed.id][1]) {
                                        selectedDays[med.id][subMed.id][1] = new Set();
                                    }
                                    
                                    // Автоматически выбираем день
                                    selectedDays[med.id][subMed.id][1].add(day);
                                }
                            });
                        }
                    });
                }
            });
            
            // Обновляем состояние для триггера реактивности
            selectedDays = {...selectedDays};
        }, 100);
    }
    
    // Публикация схемы лечения
    async function publishTreatmentScheme() {
        // Проверка валидности расписания для медикаментов и процедур
        const medicationsWithoutSchedule = [];
        const proceduresWithoutSchedule = [];
        
        selectedMedications.forEach(med => {
            const subMedsWithoutSchedule = med.selectedMedications.filter(subMed => 
                !selectedDays[med.id] || 
                !selectedDays[med.id][subMed.id] || 
                !Object.values(selectedDays[med.id][subMed.id] || {}).some(daySet => daySet.size > 0)
            );
            
            if (subMedsWithoutSchedule.length === med.selectedMedications.length) {
                medicationsWithoutSchedule.push(med);
            }
        });

        // Проверка валидности расписания для процедур
        selectedProcedures.forEach(proc => {
            const procId = 'procedure_' + proc.id;
            
            if (!selectedDays[procId] || 
                !Object.values(selectedDays[procId]).some(daySet => daySet.size > 0)) {
                proceduresWithoutSchedule.push(proc);
            }
        });

        // Формируем сообщение об ошибке, если необходимо
        if (medicationsWithoutSchedule.length > 0 || proceduresWithoutSchedule.length > 0) {
            let errorMessage = "Не выбрано ни одного дня для: ";
            
            if (medicationsWithoutSchedule.length > 0) {
                const medicationNames = medicationsWithoutSchedule.map(med => med.medication.name).join(', ');
                errorMessage += `препаратов (${medicationNames})`;
                
                if (proceduresWithoutSchedule.length > 0) {
                    errorMessage += ' и ';
                }
            }
            
            if (proceduresWithoutSchedule.length > 0) {
                const procedureNames = proceduresWithoutSchedule.map(proc => proc.name).join(', ');
                errorMessage += `процедур (${procedureNames})`;
            }
            
            validationError = errorMessage;
            return;
        }
    
        try {
            isLoading = true;
            
            // Преобразуем Set обратно в массивы для хранения
            const formattedSchedule = {};
            
            // Обрабатываем как лекарства, так и процедуры
            Object.entries(selectedDays).forEach(([id, value]) => {
                if (id.startsWith('procedure_')) {
                    // Для процедур
                    formattedSchedule[id] = {};
                    
                    Object.entries(value).forEach(([week, days]) => {
                        formattedSchedule[id][week] = Array.from(days);
                    });
                } else {
                    // Для лекарств
                    formattedSchedule[id] = {};
                    
                    Object.entries(value).forEach(([subMedId, weeks]) => {
                        formattedSchedule[id][subMedId] = {};
                        
                        Object.entries(weeks).forEach(([week, days]) => {
                            formattedSchedule[id][subMedId][week] = Array.from(days);
                        });
                    });
                }
            });
                
            // Создание новой схемы или редакции
            const newScheme = {
                id: String(Date.now()),
                name: (() => {
                    if (!currentEditingScheme) {
                        // Новая схема
                        return `Схема лечения от ${new Date().toLocaleDateString()}`;
                    }
                    
                    // Определяем базовое имя схемы (без редакций)
                    let nameBase = currentEditingScheme.name;
                    // Образец регулярного выражения для поиска пометки о редакции
                    const revisionRegex = /\(ред. от [\d\.]+( #\d+)?\)/;
                    
                    if (revisionRegex.test(nameBase)) {
                        // Удаляем пометку о редакции из имени
                        nameBase = nameBase.replace(revisionRegex, '').trim();
                    }
                    
                    // Определяем номер редакции
                    let revisionNumber = 1; // По умолчанию первая редакция
                    
                    // Если у оригинальной схемы уже есть поле revisionNumber, увеличиваем его
                    if (currentEditingScheme.revisionNumber) {
                        revisionNumber = currentEditingScheme.revisionNumber + 1;
                    } else if (currentEditingScheme.isRevision) {
                        // Если это редакция, но нет номера, пытаемся извлечь из имени
                        const match = currentEditingScheme.name.match(/#(\d+)/);
                        if (match && match[1]) {
                            revisionNumber = parseInt(match[1], 10) + 1;
                        }
                    }
                    
                    return `${nameBase} (ред. от ${new Date().toLocaleDateString()} #${revisionNumber})`;
                })(),
                medications: selectedMedications.map(med => ({
                    id: med.id,
                    name: med.medication.name,
                    dosage: med.dosage,
                    administrationType: med.administrationType,
                    ivMethod: med.ivMethod,
                    diluents: med.diluents ? med.diluents.map(d => ({...d})) : [],
                    selectedMedications: med.selectedMedications ? med.selectedMedications.map(subMed => ({
                        id: subMed.id,
                        name: subMed.name,
                        fullName: subMed.fullName,
                        dosage: subMed.dosage,
                        manufacturer: subMed.manufacturer || '',
                        dosageForm: subMed.dosageForm || '',
                        concentration: subMed.concentration || '',
                        hasDailyDosages: subMed.hasDailyDosages || false,
                        dailyDosages: subMed.dailyDosages || {}
                    })) : [],
                    comment: med.comment || ''
                })),
                procedures: selectedProcedures.map(proc => {
                    // Получаем фактический ID, используемый в расписании
                    const procIdParts = proc.id.split('_');
                    const procId = procIdParts.length > 1 ? proc.id : 'procedure_' + proc.id;
                    
                    const autohemotherapySettings = proc.type === 'autohemotherapy' ? {
                        diluent: proc.settings.diluent,
                        doctor: proc.settings.doctor || '',
                        dailyDosages: proc.settings.dailyDosages || {}
                    } : null;

                    return {
                        id: procId,
                        type: proc.type,
                        name: proc.name,
                        time: proc.time,
                        isTimeOnly: proc.isTimeOnly,
                        comment: proc.comment || '',
                        frequency: proc.frequency,
                        settings: proc.type === 'autohemotherapy' ? 
                        autohemotherapySettings : 
                        proc.settings ? {
                            polarity: proc.settings.polarity,
                            hasDiluent: proc.settings.hasDiluent,
                            diluent: proc.settings.hasDiluent === 'да' && proc.settings.diluent 
                                ? { 
                                    type: proc.settings.diluent.type,
                                    dosage: proc.settings.diluent.dosage || ''
                                }
                                : null
                        } : null
                    };
                }),
                createdFor: {
                    serviceId,
                    medicalCardId
                },
                createdAt: new Date().toISOString(),
                isRevision: !!currentEditingScheme,
                originalSchemeId: currentEditingScheme ? currentEditingScheme.id : null,
                schedule: formattedSchedule
            };
            
            // Отправляем на сервер
            const result = await treatmentService.saveSchematic(newScheme);
            
            if (result && result.success) {
                // Перезагружаем страницу после успешного сохранения
                setTimeout(() => {
                    window.location.reload();
                }, 500); // Небольшая задержка для улучшения UX
            } else {
                throw new Error(result?.message || "Не удалось сохранить схему");
            }
                
        } catch (err) {
            console.error('Ошибка публикации схемы:', err);
            validationError = `Ошибка сохранения: ${err.message || "Пожалуйста, попробуйте позже"}`;
            isLoading = false;
            
            // Показываем уведомление об ошибке пользователю
            alert(`Не удалось сохранить схему лечения. Пожалуйста, попробуйте позже.\n\nТехническая информация: ${err.message}`);
        }
        }
        
    // Закрытие модального окна с формой препарата
    function closeMedicationForm() {
        isMedicationFormOpen = false;
        editingMedicationId = null;
    }

    function goBackToSchemes() {

        if (hasUnsavedChanges()) {
            const confirmed = confirm("У вас есть несохраненные изменения. Вы уверены, что хотите вернуться к списку схем?");
            
            if (!confirmed) {
                return;
            }
        }

        // Полностью сбрасываем состояние схемы
        selectedMedications = [];
        selectedProcedures = []; // Важно сбросить и процедуры
        selectedDays = {};
        validationError = '';
        
        // Возвращаемся к списку схем
        isCreatingNewScheme = false;
    }

    function hasUnsavedChanges() {
        return selectedMedications.length > 0 || selectedProcedures.length > 0;
    }

    function equalizeRowHeights() {
        // Сначала скрываем таблицу во время выравнивания
        tableReady = false;
        
        setTimeout(() => {
            const rows = document.querySelectorAll('.schedule-row, .procedure-row');
            
            // Сбрасываем высоту строк для корректного расчета
            rows.forEach(row => {
                row.style.height = 'auto';
            });
            
            // Находим максимальную высоту
            let maxHeight = 0;
            rows.forEach(row => {
                const height = row.offsetHeight;
                if (height > maxHeight) {
                    maxHeight = height;
                }
            });
            
            // Устанавливаем одинаковую высоту для всех строк
            if (maxHeight > 0) {
                rows.forEach(row => {
                    row.style.height = `${maxHeight}px`;
                    
                    // Также устанавливаем высоту для ячеек с днями
                    const cells = row.querySelectorAll('.schedule-cell');
                    cells.forEach(cell => {
                        cell.style.height = `${maxHeight}px`;
                    });
                });
            }
            
            // Отображаем таблицу после выравнивания
            setTimeout(() => {
                tableReady = true;
            }, 50);
        }, 50);
    }

    function getDayTitle(medicationId, subMedId, day) {
        const medication = selectedMedications.find(med => med.id === medicationId);
        const subMed = medication?.selectedMedications?.find(m => m.id === subMedId);
        
        if (subMed?.hasDailyDosages && subMed?.dailyDosages && subMed.dailyDosages[day]) {
            return `День ${day}: ${subMed.name} - ${subMed.dailyDosages[day]}`;
        }
        
        if (day > 10) {
            return 'Внимание: продолжительное лечение. Рекомендуется не превышать 10-дневный курс, если нет особых показаний';
        }
        
        return `День ${day}`;
    }


    // Вызываем функцию при изменении selectedMedications
    $: if (selectedMedications) {
        equalizeRowHeights();
    }
    
    onMount(() => {
        tableReady = false;
        equalizeRowHeights();
    });
</script>


<div class="treatment-scheme-container">
    <!-- Главная кнопка -->
    <button 
        on:click={toggleModal} 
        class="treatment-scheme-button"
        style="--bg-color: {mainButtonBgColor}; --text-color: {mainButtonTextColor}; --border-radius: {mainButtonBorderRadius};"
        disabled={isButtonLoading}
    >
         {#if isButtonLoading}
            <span class="button-spinner"></span>
        {:else}
            📋 Схема лечения
        {/if}
    </button>

    <!-- Основное модальное окно -->
    <TreatmentModal
        overlayAlign="right"
        overlayPadding="0 75px 0 0"
        isOpen={isModalOpen}
        onClose={toggleModal}
        maxWidth={modalMaxWidth}
        backgroundColor={modalBgColor}
        borderRadius={modalBorderRadius}
        overlayColor={modalOverlayColor}
        confirmBeforeClose={requireConfirmation}
        minHeight="450px"
        maxHeight="720px"
        height="100%"
        padding="50px 20px 20px 20px;"
    >
        <div class="modal-grid">
            <!-- Колонка с формой/списком схем -->
            
            {#if !isCreatingNewScheme}
                <div class="medication-form-column">
                    <!-- Список существующих схем -->
                    <ExistingSchemes 
                        schemes={existingSchemes}
                        onSelect={selectExistingScheme}
                        onEdit={editExistingScheme}
                        bgColor={schemesBgColor}
                        titleColor={schemesTitleColor}
                        borderColor={schemesBorderColor}
                        isLoading={isLoadingSchematics}
                        error={schematicsError}
                    />
                    
                    <div class="btn-action">
                        {#if isDiagnosisWarningVisible}
                            <div class="diagnosis-warning">
                                <div class="warning-content">
                                    <div class="warning-icon">⚠️</div>
                                    <div class="warning-text">{diagnosisWarningText}</div>
                                    <button class="close-warning" on:click={() => isDiagnosisWarningVisible = false}>✕</button>
                                </div>
                            </div>
                        {/if}
                        <CreateSchemeButton 
                            onClick={startNewScheme}
                            buttonBgColor={createButtonBgColor}
                            buttonTextColor={createButtonTextColor}
                            buttonHoverColor={createButtonHoverColor}
                            buttonBorderRadius={createButtonBorderRadius}
                        />
                    </div>
                </div>
            {/if}
            

            <!-- График приема препаратов -->
            {#if isCreatingNewScheme}
                <div class="schedule-column">
                    <div class="schedule-top">
                        <div class="schedule-head">
                            <h3>Создание новой схемы лечения</h3>
    
                            {#if (selectedMedications.length > 0 || selectedProcedures.length > 0) && !isScheduleValid}
                                <div class="validation-error">
                                    {#if selectedMedications.length > 0 && selectedProcedures.length <= 0 }
                                        ⚠️ Необходимо выбрать дни приема <strong>для всех препаратов</strong>!
                                    {:else if selectedMedications.length <= 0 && selectedProcedures.length > 0 }
                                        ⚠️ Необходимо выбрать дни приема <strong>для всех процедур</strong>!
                                    {:else}
                                        ⚠️ Необходимо выбрать дни приема <strong>для всех препаратов и процедур!</strong>
                                    {/if}
                                        
                                    
                                </div>
                            {/if}
                        </div>
                        <div class="schedule-table-container">
                            <div class="table-placeholder" class:hidden={tableReady}>
                                <div class="loading-spinner"></div>
                                <span>Формирование таблицы...</span>
                            </div>
                            <div class="schedule-table" class:ready={tableReady}>
                                <!-- Заголовки дней -->
                                <div class="schedule-header">
                                    <div class="medication-column">Процедура / День</div>
                                    {#each [1,2,3,4,5,6,7,8,9,10,11,12,13,14] as day}
                                        <div class="day-header">{day}</div>
                                    {/each}
                                </div>
                                
                                {#if selectedMedications.length > 0 || selectedProcedures.length > 0}
                                    
                                    {#if selectedMedications.length > 0}
                                        {#each selectedMedications as medication (medication.id)}
                                            {#each medication.selectedMedications as subMed, subIndex (subMed.id)}
                                                <div class="schedule-row {!selectedDays[medication.id] || !selectedDays[medication.id][subMed.id] || !Object.values(selectedDays[medication.id][subMed.id] || {}).some(daySet => daySet.size > 0) ? 'error-highlight' : ''}">
                                                    <div class="sub-medication-cell">
                                                        <div class="sub-medication-info">
                                                            <div style="display: grid; ">
                                                                {#if medication.selectedMedications.length === 1}
                                                                    <span class="sub-medication-name">{subMed.name} {subMed.dosage ? `(${subMed.dosage})` : ''}</span>
                                                                    <div class="single-med-admin-info">
                                                                        {#if medication.hasDiluent === 'да' && medication.diluents && medication.diluents.length > 0}
                                                                            {#each medication.diluents as diluent}
                                                                                {' + '}{diluent.type} ({diluent.dosage})
                                                                            {/each}
                                                                        {/if}
                                                                        {medication.administrationType}
                                                                        {#if medication.administrationType === 'в/в' && medication.ivMethod}
                                                                            ({medication.ivMethod})
                                                                        {/if}

                                                                        {#if medication.comment && medication.comment.trim() !== ''}
                                                                            <span class="medication-comment"> • {medication.comment}</span>
                                                                        {/if}
                                                                    </div>
                                                                {:else}
                                                                    <span class="sub-medication-cocktail-name">• {subMed.name} {subMed.dosage ? `(${subMed.dosage})` : ''}</span>
                                                                {/if}
                                                            </div>

                                                            <!-- Если это единственный препарат, добавляем информацию о введении здесь -->
                                                            {#if medication.selectedMedications.length === 1}
                                                                <div class="medication-actions">
                                                                    <button class="btn-select-all-days" title="Выделить все дни (10)" 
                                                                            on:click={() => selectAllDaysForMedication(medication)}>
                                                                        📅
                                                                    </button>
                                                                    <button class="btn-edit-medication" on:click={() => editMedication(medication)}>
                                                                        ✏️
                                                                    </button>
                                                                    <button class="btn-delete-medication" on:click={() => deleteMedication(medication.id)}>
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Ячейки дней -->
                                                    {#each [1,2,3,4,5,6,7,8,9,10,11,12,13,14] as day}
                                                        <div 
                                                            class="schedule-cell {day > 10 ? 'extended-treatment-day' : ''}" 
                                                            on:click={() => toggleDay(medication.id, subMed.id, 1, day)}
                                                            class:selected={selectedDays[medication.id] && 
                                                                        selectedDays[medication.id][subMed.id] && 
                                                                        selectedDays[medication.id][subMed.id][1] && 
                                                                        selectedDays[medication.id][subMed.id][1].has(day)}
                                                            title={getDayTitle(medication.id, subMed.id, day)}
                                                        >
                                                            {#if selectedDays[medication.id] && selectedDays[medication.id][subMed.id] && selectedDays[medication.id][subMed.id][1] && selectedDays[medication.id][subMed.id][1].has(day)}
                                                                <!-- Дополнительно показываем индикатор для дней с индивидуальной дозировкой -->
                                                                <div class="day-content">
                                                                    {@html checkSvg}
                                                                    {#if subMed.hasDailyDosages && subMed.dailyDosages && subMed.dailyDosages[day]}
                                                                        <div class="day-dosage-indicator" title="Дозировка: {subMed.dailyDosages[day]}">{subMed.dailyDosages[day]}</div>
                                                                    {/if}
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    {/each}
                                                </div>
                                            {/each}

                                            {#if medication.selectedMedications.length > 1}
                                                <!-- Если это коктейль, добавляем общую информацию после всех препаратов -->
                                                <div class="schedule-row administration-info-row">
                                                    <div class="administration-cell">
                                                        <div class="administration-info">
                                                            {#if medication.hasDiluent === 'да' && medication.diluents && medication.diluents.length > 0}
                                                                {#each medication.diluents as diluent}
                                                                    {' + '}{diluent.type} ({diluent.dosage})
                                                                {/each}
                                                            {/if}
                                                            {medication.administrationType}
                                                            {#if medication.administrationType === 'в/в' && medication.ivMethod}
                                                                ({medication.ivMethod})
                                                            {/if}

                                                            {#if medication.comment && medication.comment.trim() !== ''}
                                                                <span class="medication-comment"> • {medication.comment}</span>
                                                            {/if}
                                                        </div>
                                                        <div class="medication-actions">
                                                            <button class="btn-select-all-days" title="Выделить все дни (10) для всех препаратов" 
                                                                    on:click={() => selectAllDaysForMedication(medication)}>
                                                                📅
                                                            </button>
                                                            <button class="btn-edit-medication" on:click={() => editMedication(medication)}>
                                                                ✏️
                                                            </button>
                                                            <button class="btn-delete-medication" on:click={() => deleteMedication(medication.id)}>
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <!-- Пустые ячейки для дней (чтобы сохранить структуру сетки) -->
                                                    {#each [1,2,3,4,5,6,7,8,9,10,11,12,13,14] as day}
                                                        <div class="empty-cell"></div>
                                                    {/each}
                                                </div>
                                            {/if}
                                        {/each}
                                    {/if}

                                    {#if selectedProcedures.length > 0}
                                        {#each selectedProcedures as procedure (procedure.id)}
                                            <ProcedureItem 
                                                procedure={procedure}
                                                onDelete={deleteProcedure}
                                                isDaySelected={(day) => {
                                                    const key = 'procedure_' + procedure.id;
                                                    return selectedDays[key] && 
                                                        selectedDays[key][1] && 
                                                        selectedDays[key][1].has(day);
                                                }}
                                                onDayToggle={(day) => toggleProcedureDay(procedure.id, day)}
                                            />
                                        {/each}
                                    {/if}

                                {:else}
                                    <p class="empty">Пусто</p>
                                {/if}

                            </div>
                        </div>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-back" on:click={goBackToSchemes}>← Назад</button>
                        
                        <div class="add-buttons">
                            <button 
                                class="btn-add-medication" 
                                on:click={openNewMedicationForm}
                            >
                                + Добавить препарат
                            </button>
                            
                            <button 
                                class="btn-add-procedure" 
                                on:click={openProcedureForm}
                            >
                                + Добавить процедуру
                            </button>
                        </div>
                    
                        <button 
                            class="btn-continue" 
                            disabled={(selectedMedications.length === 0 && selectedProcedures.length === 0) || isLoading || !isScheduleValid}
                            on:click={publishTreatmentScheme}
                        >
                            {#if isLoading}
                                <span class="spinner"></span> Сохранение...
                            {:else}
                                Создать схему
                            {/if}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </TreatmentModal>

    <MedicationFormModal
        serviceId={serviceId}
        isOpen={isMedicationFormOpen}
        onClose={closeMedicationForm}
        medications={medications}
        medicationForm={currentMedicationForm}
        isEditing={!!editingMedicationId}
        onSave={handleSaveMedication}
        overlayColor="rgba(0,0,0,0)"
    />

    <ProcedureFormModal
        isOpen={isProcedureFormOpen}
        onClose={closeProcedureForm}
        onSave={handleSaveProcedure}
        overlayColor="rgba(0,0,0,0)"
        serviceId={serviceId}
    />
</div>

<style>
    h3{
        font-size: 21px;
        margin: 0 0 15px 0;
        padding: 0;
    }

    .sub-medication-name{
        font-size: 16px;
    }

    .sub-medication-cocktail-name{
        font-size: 14px;
        padding: 0 0 0 0px;
        font-weight: bold;
    }

    .btn-action{
        text-align: center;
    }

    .schedule-head{
        display: flex;
        align-items: center;
        justify-content: space-around;
    }

    .empty{
        font-style: italic;
        color: #6c757d;
        text-align: center;
        padding: 15px 0;
        font-size: 15px;
        opacity: 0.6;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 500px;
    }

    .treatment-scheme-button {
        background-color: var(--bg-color, #007bff);
        color: var(--text-color, white);
        border: none;
        padding: 8px 12px;
        border-radius: var(--border-radius, 4px);
        cursor: pointer;
        transition: opacity 0.2s ease;
        width: 170px;
        font-size: 15px;
    }

    .treatment-scheme-button:hover {
        opacity: 0.9;
    }

    .modal-grid {
        display: grid;
        gap: 20px;
        height: 100%;
        padding: 25px 0 0 0;
    }

    .medication-form-column, 
    .schedule-column {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
    }

    .schedule-table {
        border: 1px solid #ddd;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: translateY(10px);
    }

    .schedule-table.ready {
        opacity: 1;
        transform: translateY(0);
    }

    .table-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        opacity: 1;
        transition: opacity 0.3s ease;
    }

    .table-placeholder.hidden {
        opacity: 0;
        pointer-events: none;
    }

    .schedule-header {
        display: grid;
        grid-template-columns: 400px repeat(14, 1fr);
        background-color: #f0f0f0;
        text-align: center;
        position: sticky;
        top: -20px;
        z-index: 2; /* Чтобы заголовок был над содержимым при прокрутке */
    }

    .day-header, 
    .medication-column {
        padding: 5px;
        border-right: 1px solid #ddd;
    }

    .schedule-row {
        display: grid;
        grid-template-columns: 400px repeat(14, 1fr);
        align-items: stretch; /* Растягивает все ячейки по высоте */
    }

    .schedule-cell {
        border: 1px solid #ddd;
        cursor: pointer;
        transition: background-color 0.3s;
        align-self: stretch;
        display: flex;
        align-items: center;
        justify-content: center; /* Центрируем содержимое */
    }

    .schedule-cell:hover {
        background-color: rgba(0,123,255,0.1);
    }

    .schedule-cell.selected {
        background-color: #3FAECA;
    }

    .extended-treatment-day {
        position: relative;
        background-color: #e7c7c266;
    }

    .extended-treatment-day:hover {
        background-color: rgba(255, 244, 230, 0.7);
    }

    .extended-treatment-day.selected {
        background-color: #3FAECA;
    }

    .schedule-cell svg {
        width: 25px;
        height: 25px;
    }

    .validation-error {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 4px;
        border-left: 4px solid #ffc107;
        font-size: 14px;
    }

    .medication-actions {
        display: flex;
        gap: 5px;
    }

    .btn-edit-medication, 
    .btn-delete-medication {
        text-decoration: none;
        text-transform: none;
        padding: 2px 5px;
        font-size: 16px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        background-color: transparent;
        font-style: normal;
    }

    .btn-edit-medication:hover {
        background-color: #f0f0f0;
    }

    .btn-delete-medication:hover {
        background-color: #fff5f5;
    }

    .schedule-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .btn-continue {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
    }

    .btn-continue:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-add-medication {
        background-color: #3FAECA;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
    }

    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }

    .btn-back {
        background-color: transparent;
        border: none;
        padding: 5px 10px;
        font-size: 14px;
        color: #555;
        cursor: pointer;
        margin-right: 10px;
        border-radius: 4px;
        font-size: 18px;
    }

    .btn-back:hover {
        background-color: #f0f0f0;
    }

    .loading-spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid rgba(0,123,255,0.3);
        border-radius: 50%;
        border-top-color: #007bff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 12px;
    }

    .sub-medication-cell {
        display: flex;
        align-items: center;
        padding: 5px 10px 5px 25px; /* Отступ слева для визуальной иерархии */
        border-right: 1px solid #ddd;
        background-color: rgba(248, 249, 250, 0.7);
        overflow-wrap: break-word;
        word-break: break-word;
        height: 100%;
    }

    .administration-info-row {
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
        font-style: italic;
        font-size: 14px;
    }

    .administration-cell {
        grid-column: 1;
        padding: 5px 120px 5px 40px;
        border-right: 1px solid #ddd;
        color: #555;
        display: flex;
        align-items: center;
        gap: 10px;
        border: none;
        position: relative;
    }

    .administration-cell .medication-actions{
        content: "";
        display: block;
        width: max-content;
        height: 20px;
        position: absolute;
        right: 10px;
        margin: auto;
        text-align: center;
        font-size: 12px;
    }

    .empty-cell {
        border: none;
        background-color: #f9f9f9;
    }

    .sub-medication-info{
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;

    }
    
    .single-med-admin-info {
        display: block;
        font-style: italic;
        color: #555;
        margin-top: 4px;
        font-size: 13px;
    }


    .add-buttons {
        display: flex;
        gap: 10px;
    }
    
    .btn-add-procedure {
        background-color: #9b59b6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
    }
    
    .btn-add-procedure:hover {
        background-color: #8e44ad;
    }
    
    .procedure-section-divider {
        padding: 10px 15px;
        background-color: #f8f9fa;
        border-top: 1px solid #e9ecef;
        border-bottom: 1px solid #e9ecef;
        text-align: center;
    }
    
    .procedure-section-divider h4 {
        margin: 0;
        font-size: 18px;
        color: #6c757d;
    }

    .day-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
    }

    .day-dosage-indicator {
        position: absolute;
        background-color: #ff9800;
        color: #fff;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 10px;
        bottom: 0;
        right: 0;
        padding: 0px 2px;
    }

    .medication-comment {
        font-style: italic;
        font-size: 0.9em;
        color: #666;
        margin-left: 5px;
    }

    .btn-select-all-days {
        background: none;
        border: none;
        color: #3FAECA;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 5px;
        border-radius: 3px;
        font-style: normal;
    }

    .btn-select-all-days:hover {
        background-color: #e6f7fb;
    }

    .diagnosis-warning {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        border-radius: 4px;
        padding: 10px;
        margin-top: 5px;
        width: 500px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        margin: auto;
        margin-bottom: 25px;
    }

    .warning-content {
        display: flex;
        align-items: center;
    }

    .warning-icon {
        flex-shrink: 0;
        margin-right: 10px;
        font-size: 20px;
    }

    .warning-text {
        flex-grow: 1;
        font-size: 14px;
        color: #856404;
    }

    .close-warning {
        background: none;
        border: none;
        color: #856404;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        margin-left: 10px;
    }

    .button-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
    }

    .treatment-scheme-button:disabled {
        opacity: 0.7;
        cursor: wait;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>