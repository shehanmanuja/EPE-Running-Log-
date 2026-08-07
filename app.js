// EXIMIUS Official Running Log Application JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const logRowsContainer = document.getElementById('log-rows-container');
    const saveBtn = document.getElementById('save-btn');
    const addRowBtn = document.getElementById('add-row-btn');
    const addRowBottomBtn = document.getElementById('add-row-bottom-btn');
    const fillSampleBtn = document.getElementById('fill-sample-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printBtn = document.getElementById('print-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    
    // Backup & Status Elements
    const saveStatusText = document.getElementById('save-status-text');
    const backupExportBtn = document.getElementById('backup-export-btn');
    const backupImportBtn = document.getElementById('backup-import-btn');
    const backupFileInput = document.getElementById('backup-file-input');
    const toastContainer = document.getElementById('toast-container');
    const toastMessage = document.getElementById('toast-message');
    
    // Inputs & Settings
    const metaNameInput = document.getElementById('meta-name');
    const metaDeptInput = document.getElementById('meta-dept');
    const metaMonthInput = document.getElementById('meta-month');
    const rateInput = document.getElementById('rate-input');
    const defaultApprovedInput = document.getElementById('default-approved');
    const defaultRowsSelect = document.getElementById('default-rows');
    const toggleViaColumnCheckbox = document.getElementById('toggle-via-column');
    const runningLogTable = document.getElementById('running-log-table');
    const colStartEndHeader = document.getElementById('col-start-end-header');
    
    // Summary Displays
    const summaryTotalDist = document.getElementById('summary-total-dist');
    const summaryRateDisplay = document.getElementById('summary-rate-display');
    const summaryTotalClaim = document.getElementById('summary-total-claim');
    
    // Stats Card Displays
    const statEntriesCount = document.getElementById('stat-entries-count');
    const statTotalKm = document.getElementById('stat-total-km');
    const statTotalClaim = document.getElementById('stat-total-claim');

    // Storage Key
    const STORAGE_KEY = 'EXIMIUS_RUNNING_LOG_DATA_V2';

    // Application State
    let logData = {
        name: '',
        department: 'IT',
        month: getCurrentMonthString(),
        rate: 27.00,
        defaultApproved: '',
        showViaColumn: true,
        rows: []
    };

    // Initialize App
    initApp();

    function initApp() {
        loadFromStorage();
        renderMetaInfo();
        updateViaColumnVisibility();
        
        // If no rows saved, initialize with default empty rows (4)
        if (!logData.rows || logData.rows.length === 0) {
            createEmptyRows(parseInt(defaultRowsSelect.value) || 4);
        } else {
            renderTableRows();
        }

        calculateTotals();
        updateSaveStatusText();
        attachEventListeners();
    }

    function getCurrentMonthString() {
        const now = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${monthNames[now.getMonth()]}`;
    }

    function updateViaColumnVisibility() {
        const show = !!logData.showViaColumn;
        if (toggleViaColumnCheckbox) {
            toggleViaColumnCheckbox.checked = show;
        }

        if (runningLogTable) {
            if (show) {
                runningLogTable.classList.remove('hide-via-column');
                if (colStartEndHeader) {
                    colStartEndHeader.colSpan = 3;
                    colStartEndHeader.textContent = 'Start / Route / End';
                }
            } else {
                runningLogTable.classList.add('hide-via-column');
                if (colStartEndHeader) {
                    colStartEndHeader.colSpan = 2;
                    colStartEndHeader.textContent = 'Start / End';
                }
            }
        }
    }

    function createEmptyRows(count) {
        logData.rows = [];
        for (let i = 0; i < count; i++) {
            logData.rows.push({
                id: generateId(),
                date: '',
                startLoc: '',
                viaLoc: '',
                endLoc: '',
                distance: '',
                details: '',
                approvedBy: logData.defaultApproved || ''
            });
        }
        renderTableRows();
    }

    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    function renderMetaInfo() {
        metaNameInput.value = logData.name || '';
        
        const deptVal = logData.department || 'IT';
        let exists = Array.from(metaDeptInput.options).some(opt => opt.value === deptVal);
        if (!exists && deptVal) {
            const customOpt = metaDeptInput.querySelector('option[value="__ADD_CUSTOM__"]');
            const newOpt = document.createElement('option');
            newOpt.value = deptVal;
            newOpt.textContent = deptVal;
            metaDeptInput.insertBefore(newOpt, customOpt);
        }
        metaDeptInput.value = deptVal;
        
        metaMonthInput.value = logData.month || getCurrentMonthString();
        rateInput.value = logData.rate !== undefined ? logData.rate : 27.00;
        if (defaultApprovedInput) {
            defaultApprovedInput.value = logData.defaultApproved || '';
        }
        summaryRateDisplay.textContent = parseFloat(logData.rate !== undefined ? logData.rate : 27).toFixed(2);
    }

    function renderTableRows() {
        logRowsContainer.innerHTML = '';

        logData.rows.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.dataset.id = row.id;

            tr.innerHTML = `
                <td class="col-date">
                    <input type="date" class="cell-input text-center cell-date" value="${escapeHtml(row.date)}">
                </td>
                <td class="col-loc">
                    <textarea class="cell-input text-left cell-start" rows="3" placeholder="Start location">${escapeHtml(row.startLoc)}</textarea>
                </td>
                <td class="col-loc col-via">
                    <textarea class="cell-input text-left cell-via" rows="3" placeholder="Optional (Stop)">${escapeHtml(row.viaLoc || '')}</textarea>
                </td>
                <td class="col-loc">
                    <textarea class="cell-input text-left cell-end" rows="3" placeholder="End location">${escapeHtml(row.endLoc)}</textarea>
                </td>
                <td class="col-dist">
                    <input type="number" step="0.1" min="0" class="cell-input text-center cell-distance" value="${row.distance !== '' ? row.distance : ''}" placeholder="0.0">
                </td>
                <td class="col-details">
                    <textarea class="cell-input text-left cell-details" rows="3" placeholder="Enter travel details & purpose (3-4 lines format)...">${escapeHtml(row.details)}</textarea>
                </td>
                <td class="col-approved">
                    <input type="text" class="cell-input text-center cell-approved" value="${escapeHtml(row.approvedBy)}" placeholder="">
                </td>
                <td class="col-action no-print">
                    <button type="button" class="btn-icon-only delete-row-btn" title="Remove row">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </td>
            `;

            logRowsContainer.appendChild(tr);
        });

        // Auto-fit height for all textareas
        setTimeout(() => {
            const textareas = logRowsContainer.querySelectorAll('textarea');
            textareas.forEach(ta => autoResizeTextarea(ta));
        }, 0);
    }

    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = '0px';
        const scrollH = textarea.scrollHeight;
        textarea.style.height = (scrollH > 0 ? scrollH : 18) + 'px';
    }

    function attachEventListeners() {
        // Meta inputs changes
        metaNameInput.addEventListener('input', (e) => {
            logData.name = e.target.value;
            saveToStorage();
        });

        metaDeptInput.addEventListener('change', (e) => {
            if (e.target.value === '__ADD_CUSTOM__') {
                const customDept = prompt('Enter New Department Name:');
                if (customDept && customDept.trim() !== '') {
                    const cleanName = customDept.trim();
                    const customOpt = metaDeptInput.querySelector('option[value="__ADD_CUSTOM__"]');
                    const newOpt = document.createElement('option');
                    newOpt.value = cleanName;
                    newOpt.textContent = cleanName;
                    metaDeptInput.insertBefore(newOpt, customOpt);
                    metaDeptInput.value = cleanName;
                    logData.department = cleanName;
                } else {
                    metaDeptInput.value = logData.department || 'IT';
                }
            } else {
                logData.department = e.target.value;
            }
            saveToStorage();
        });

        metaMonthInput.addEventListener('change', (e) => {
            logData.month = e.target.value;
            saveToStorage();
        });
        metaMonthInput.addEventListener('input', (e) => {
            logData.month = e.target.value;
            saveToStorage();
        });

        rateInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            logData.rate = val;
            summaryRateDisplay.textContent = val.toFixed(2);
            calculateTotals();
            saveToStorage();
        });

        if (defaultApprovedInput) {
            defaultApprovedInput.addEventListener('input', (e) => {
                logData.defaultApproved = e.target.value;
                saveToStorage();
            });
        }

        if (toggleViaColumnCheckbox) {
            toggleViaColumnCheckbox.addEventListener('change', (e) => {
                logData.showViaColumn = e.target.checked;
                updateViaColumnVisibility();
                saveToStorage();
            });
        }

        defaultRowsSelect.addEventListener('change', (e) => {
            const targetCount = parseInt(e.target.value);
            if (logData.rows.length < targetCount) {
                const diff = targetCount - logData.rows.length;
                for (let i = 0; i < diff; i++) {
                    logData.rows.push({
                        id: generateId(),
                        date: '',
                        startLoc: '',
                        viaLoc: '',
                        endLoc: '',
                        distance: '',
                        details: '',
                        approvedBy: logData.defaultApproved || ''
                    });
                }
                renderTableRows();
                saveToStorage();
            }
        });

        // Instant Calculation & Dynamic Table Event Listeners ('input', 'keyup', 'change')
        const handleTableInput = (e) => {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const rowId = tr.dataset.id;
            const rowObj = logData.rows.find(r => r.id === rowId);

            if (!rowObj) return;

            if (e.target.tagName.toLowerCase() === 'textarea') {
                autoResizeTextarea(e.target);
            }

            if (e.target.classList.contains('cell-date')) {
                rowObj.date = e.target.value;
            } else if (e.target.classList.contains('cell-start')) {
                rowObj.startLoc = e.target.value;
            } else if (e.target.classList.contains('cell-via')) {
                rowObj.viaLoc = e.target.value;
            } else if (e.target.classList.contains('cell-end')) {
                rowObj.endLoc = e.target.value;
            } else if (e.target.classList.contains('cell-distance')) {
                rowObj.distance = e.target.value;
                calculateTotals(); // Instant real-time calculation!
            } else if (e.target.classList.contains('cell-details')) {
                rowObj.details = e.target.value;
            } else if (e.target.classList.contains('cell-approved')) {
                rowObj.approvedBy = e.target.value;
            }

            saveToStorage();
        };

        logRowsContainer.addEventListener('input', handleTableInput);
        logRowsContainer.addEventListener('keyup', handleTableInput);
        logRowsContainer.addEventListener('change', handleTableInput);

        logRowsContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-row-btn');
            if (deleteBtn) {
                const tr = deleteBtn.closest('tr');
                const rowId = tr.dataset.id;
                logData.rows = logData.rows.filter(r => r.id !== rowId);
                renderTableRows();
                calculateTotals();
                saveToStorage();
            }
        });

        // Save Draft Button
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                saveToStorage(true);
                animateSaveButton();
            });
        }

        // Backup Export Button
        if (backupExportBtn) {
            backupExportBtn.addEventListener('click', exportDataBackup);
        }

        // Backup Import Button & File Input
        if (backupImportBtn && backupFileInput) {
            backupImportBtn.addEventListener('click', () => backupFileInput.click());
            backupFileInput.addEventListener('change', importDataBackup);
        }

        // Add Row Buttons
        addRowBtn.addEventListener('click', addNewRow);
        addRowBottomBtn.addEventListener('click', addNewRow);

        // Fill Sample Data Button (if present)
        if (fillSampleBtn) {
            fillSampleBtn.addEventListener('click', fillSampleData);
        }

        // Clear All Button
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all log entries?')) {
                createEmptyRows(parseInt(defaultRowsSelect.value) || 4);
                calculateTotals();
                saveToStorage(true);
            }
        });

        // Export PDF Button (Direct File Download)
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', exportPDF);
        }
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        window.addEventListener('beforeprint', prepareSheetForPrint);
        window.addEventListener('afterprint', restoreSheetAfterPrint);
    }

    function prepareSheetForPrint() {
        document.body.classList.add('pdf-rendering');

        // Temporarily change empty date inputs (<input type="date">) to type="text" with empty value
        // so browser "mm/dd/yyyy" text and calendar icons are not rendered into print/PDF
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.dataset.wasDate = 'true';
                input.type = 'text';
                input.value = '';
            }
        });

        // Temporarily remove placeholder text from empty input and textarea elements in table
        const inputsWithPlaceholders = document.querySelectorAll('.running-log-table input[placeholder], .running-log-table textarea[placeholder]');
        inputsWithPlaceholders.forEach(el => {
            el.dataset.origPlaceholder = el.placeholder;
            el.placeholder = '';
        });
    }

    function restoreSheetAfterPrint() {
        document.body.classList.remove('pdf-rendering');

        // Restore date inputs
        const dateInputs = document.querySelectorAll('input[data-was-date="true"]');
        dateInputs.forEach(input => {
            input.type = 'date';
            delete input.dataset.wasDate;
        });

        // Restore placeholders
        const inputsWithPlaceholders = document.querySelectorAll('.running-log-table input[data-orig-placeholder], .running-log-table textarea[data-orig-placeholder]');
        inputsWithPlaceholders.forEach(el => {
            el.placeholder = el.dataset.origPlaceholder;
            delete el.dataset.origPlaceholder;
        });
    }

    function exportPDF() {
        const sheetElement = document.getElementById('running-log-sheet');
        if (!sheetElement) return;

        const originalText = exportPdfBtn ? exportPdfBtn.innerHTML : '';
        if (exportPdfBtn) {
            exportPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Downloading PDF...';
            exportPdfBtn.disabled = true;
        }

        prepareSheetForPrint();

        const cleanMonth = (logData.month || 'Sheet').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `EXIMIUS_Running_Log_${cleanMonth}.pdf`;

        const opt = {
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const cleanup = () => {
            restoreSheetAfterPrint();
            if (exportPdfBtn) {
                exportPdfBtn.innerHTML = originalText;
                exportPdfBtn.disabled = false;
            }
        };

        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(sheetElement).save().then(() => {
                cleanup();
            }).catch(err => {
                console.error('PDF Export Error:', err);
                cleanup();
                window.print();
            });
        } else {
            cleanup();
            window.print();
        }
    }

    function addNewRow() {
        logData.rows.push({
            id: generateId(),
            date: '',
            startLoc: '',
            viaLoc: '',
            endLoc: '',
            distance: '',
            details: '',
            approvedBy: logData.defaultApproved || ''
        });
        renderTableRows();
        saveToStorage();
    }

    function calculateTotals() {
        let totalKm = 0;
        let filledCount = 0;

        logData.rows.forEach(row => {
            const dist = parseFloat(row.distance);
            if (!isNaN(dist) && dist > 0) {
                totalKm += dist;
            }
            if (row.startLoc || row.viaLoc || row.endLoc || row.details || dist > 0) {
                filledCount++;
            }
        });

        const rate = parseFloat(logData.rate) || 0;
        const totalClaim = totalKm * rate;

        // Update Sheet Footer Displays
        summaryTotalDist.textContent = totalKm.toFixed(1);
        summaryTotalClaim.textContent = formatCurrency(totalClaim);

        // Update Stats Sidebar Displays
        statEntriesCount.textContent = `${filledCount} of ${logData.rows.length}`;
        statTotalKm.textContent = `${totalKm.toFixed(1)} km`;
        statTotalClaim.textContent = `LKR ${formatCurrency(totalClaim)}`;
    }

    function formatCurrency(amount) {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function fillSampleData() {
        logData.name = '';
        logData.department = 'Engineering & Service';
        logData.month = getCurrentMonthString();
        logData.rate = 27.00;
        logData.defaultApproved = '';
        logData.showViaColumn = true;
        updateViaColumnVisibility();

        logData.rows = [
            { id: generateId(), date: '2026-10-02', startLoc: 'Head Office - Colombo', viaLoc: '', endLoc: 'Biyagama Factory', distance: 28.5, details: 'Solar Inverter Inspection Visit', approvedBy: '' },
            { id: generateId(), date: '2026-10-05', startLoc: 'Biyagama Factory', viaLoc: 'Kelaniya Site', endLoc: 'Head Office - Colombo', distance: 34.0, details: 'Return travel after testing & site inspection', approvedBy: '' },
            { id: generateId(), date: '2026-10-08', startLoc: 'Head Office', viaLoc: 'Kahawatta Substation', endLoc: 'Horana Site', distance: 58.0, details: '5kW Hybrid System Commissioning & Inspection', approvedBy: '' },
            { id: generateId(), date: '2026-10-08', startLoc: 'Horana Site', viaLoc: '', endLoc: 'Head Office', distance: 45.0, details: 'Return trip to Colombo office', approvedBy: '' },
            { id: generateId(), date: '2026-10-12', startLoc: 'Head Office', viaLoc: 'Negombo Site', endLoc: 'Katunayake EPZ', distance: 42.0, details: 'Client Progress Meeting & Survey', approvedBy: '' },
            { id: generateId(), date: '2026-10-15', startLoc: 'Head Office', viaLoc: 'Pallekele EPZ', endLoc: 'Kandy Project Site', distance: 125.0, details: 'Substation Control Panel Maintenance', approvedBy: '' },
            { id: generateId(), date: '2026-10-16', startLoc: 'Kandy Project Site', viaLoc: '', endLoc: 'Head Office', distance: 115.0, details: 'Return travel from Kandy Site', approvedBy: '' }
        ];

        // Pad with empty rows to make 4 total
        while (logData.rows.length < 4) {
            logData.rows.push({
                id: generateId(),
                date: '',
                startLoc: '',
                viaLoc: '',
                endLoc: '',
                distance: '',
                details: '',
                approvedBy: ''
            });
        }

        renderMetaInfo();
        renderTableRows();
        calculateTotals();
        saveToStorage();
    }

    function animateSaveButton() {
        if (!saveBtn) return;
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        saveBtn.style.backgroundColor = '#059669';
        setTimeout(() => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.style.backgroundColor = '';
        }, 2000);
    }

    function showToast(message) {
        if (!toastContainer || !toastMessage) return;
        toastMessage.textContent = message;
        toastContainer.classList.add('show');
        setTimeout(() => {
            toastContainer.classList.remove('show');
        }, 3200);
    }

    function saveToStorage(showNotification = false) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logData));
            updateSaveStatusText();
            if (showNotification) {
                showToast('Log entries saved successfully!');
            }
        } catch (e) {
            console.error('Failed to save to localStorage', e);
            if (showNotification) {
                showToast('Failed to save data!');
            }
        }
    }

    function updateSaveStatusText() {
        if (!saveStatusText) return;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        saveStatusText.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Saved (${dateStr}, ${timeStr})`;
    }

    function exportDataBackup() {
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logData, null, 2));
            const downloadAnchor = document.createElement('a');
            const dateStamp = new Date().toISOString().slice(0, 10);
            const monthName = (logData.month || 'Sheet').replace(/[^a-zA-Z0-9]/g, '_');
            
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `EXIMIUS_Running_Log_Backup_${monthName}_${dateStamp}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            showToast('Backup JSON file exported!');
        } catch (e) {
            console.error('Failed to export backup', e);
            alert('Failed to export backup data file.');
        }
    }

    function importDataBackup(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const importedData = JSON.parse(evt.target.result);
                if (importedData && typeof importedData === 'object' && Array.isArray(importedData.rows)) {
                    logData = { ...logData, ...importedData };
                    renderMetaInfo();
                    updateViaColumnVisibility();
                    renderTableRows();
                    calculateTotals();
                    saveToStorage(true);
                    showToast('Backup restored successfully!');
                } else {
                    alert('Invalid backup file format. Please select a valid Running Log JSON file.');
                }
            } catch (err) {
                console.error('Import error:', err);
                alert('Error parsing backup file.');
            }
            if (backupFileInput) backupFileInput.value = '';
        };
        reader.readAsText(file);
    }

    function loadFromStorage() {
        try {
            let saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                // Fallback check legacy V1 key
                saved = localStorage.getItem('EXIMIUS_RUNNING_LOG_DATA_V1');
            }
            if (saved) {
                const parsed = JSON.parse(saved);
                logData = { ...logData, ...parsed };
                
                // Sanitize old saved defaultApproved, name, and approvedBy values
                if (logData.name === 'K. A. Perera') {
                    logData.name = '';
                }
                if (logData.defaultApproved === 'M. Silva' || logData.defaultApproved === 'Manager / Sig') {
                    logData.defaultApproved = '';
                }
                if (Array.isArray(logData.rows)) {
                    logData.rows.forEach(r => {
                        if (r.approvedBy === 'M. Silva' || r.approvedBy === 'Manager / Sig') {
                            r.approvedBy = '';
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load from localStorage', e);
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
