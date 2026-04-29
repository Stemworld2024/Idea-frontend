// =============================================================
// DATA STORE
// =============================================================
const DEFAULT_DATA = {
    openterra: [
        { idea: 'Solar Canopy Grid', description: 'Deploy solar panel canopies over parking lots to generate clean energy and provide vehicle shade across urban centres.', fileName: 'solar-canopy-proposal.pdf', fileData: null, owner: 'Priya Mehta', status: 'Prototype Dev' },
        { idea: 'Biochar Soil Boost', description: 'Integrate biochar into agricultural soil to sequester carbon while improving water retention and crop yields by up to 25%.', fileName: 'biochar-research.docx', fileData: null, owner: 'James Okafor', status: 'Research' },
        { idea: 'Tidal Micro-Turbines', description: 'Install arrays of small tidal turbines in coastal estuaries to harvest consistent predictable energy without large infrastructure.', fileName: 'tidal-turbines-spec.pdf', fileData: null, owner: 'Sofia Reyes', status: 'Research' },
        { idea: 'Urban Heat Corridors', description: 'Plant strategic native tree corridors in city heat islands, reducing surface temperatures by 3–5°C and lowering AC energy demand.', fileName: 'heat-corridor-plan.pptx', fileData: null, owner: 'Ananya Singh', status: 'Prototype Dev' },
        { idea: 'Green Roof Mandates', description: 'Policy proposal requiring all new commercial buildings over 5,000 sqft to incorporate living roofs, reducing runoff and insulation costs.', fileName: 'green-roof-policy.pdf', fileData: null, owner: 'Luca Bianchi', status: 'Research' },
        { idea: 'Mycelium Packaging', description: 'Replace single-use plastics in e-commerce with mycelium-grown packaging that biodegrades within 30 days in home compost.', fileName: 'mycelium-rnd.pdf', fileData: null, owner: 'Hana Watanabe', status: 'Research' },
    ],
    stemworld: [
        { idea: 'CRISPR Crop Shield', description: 'Engineer drought-resistant gene sequences into staple crops using CRISPR-Cas9 to ensure food security in arid regions.', fileName: 'crispr-crop-whitepaper.pdf', fileData: null, owner: 'Dr. Amara Cole', status: 'Research' },
        { idea: 'Quantum Sensor Net', description: 'Deploy a distributed network of quantum sensors for real-time environmental monitoring at molecular resolution across watersheds.', fileName: 'quantum-sensor-report.xlsx', fileData: null, owner: 'Rafael Torres', status: 'Prototype Dev' },
        { idea: 'Neural Prosthetics 2.0', description: 'Next-generation BCI implants with 10× higher electrode density, enabling fine motor control and sensory feedback for amputees.', fileName: 'bci-v2-design-brief.docx', fileData: null, owner: 'Dr. Yuki Tanaka', status: 'Research' },
        { idea: 'Photocatalytic Air Gel', description: 'Nanostructured gel panels installed on building facades that break down NOx and VOC pollutants using ambient sunlight alone.', fileName: 'air-gel-spec-sheet.pdf', fileData: null, owner: 'Nadia Popescu', status: 'Prototype Dev' },
        { idea: 'Soft Robotics Farm', description: 'Deploy pneumatic soft-robot harvesters to pick delicate produce like strawberries, reducing labour costs and crop damage.', fileName: 'soft-robot-farm-plan.pptx', fileData: null, owner: 'Carlos Mendez', status: 'Research' },
        { idea: 'Exoplanet Biosignature DB', description: 'A curated open-access database of atmospheric biosignatures from exoplanet spectroscopy to accelerate astrobiology research.', fileName: 'biosig-db-draft.txt', fileData: null, owner: 'Dr. Isla Grant', status: 'Research' },
    ],
    others: []
};

const BASE_URL = 'http://127.0.0.1:3000';

let data = {
    openterra: [],
    stemworld: [],
    others: []
};

const tabs = ['openterra', 'stemworld', 'others'];

async function loadData() {
    try {
        console.log('Fetching data from:', `${BASE_URL}/data`);
        const response = await fetch(`${BASE_URL}/data`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        console.log('Data loaded successfully:', data);
        tabs.forEach(t => {
            console.log('Rendering tab:', t);
            refreshTable(t);
        });
    } catch (e) {
        console.error('Data loading failed:', e);
        showToast('❌', 'Failed to load data from server.');
    }
}

// =============================================================
// RUNTIME STATE
// =============================================================
let currentModal = null;  // which tab ("openterra" | "stemworld")
let editIndex = null;  // data[tab] index when editing; null when adding
let pendingFile = null;  // File object from <input type="file">
let pendingFileData = null; // Cloudinary URL
let pendingCloudinaryId = null; // Cloudinary Public ID


const sortState = {
    openterra: { col: -1, asc: true },
    stemworld: { col: -1, asc: true },
    others: { col: -1, asc: true },
};

// =============================================================
// HELPERS
// =============================================================
const AVATAR_COLORS = [
    ['#4ade80', '#052e16'], ['#38bdf8', '#0c1a2e'], ['#f472b6', '#2d0a1b'],
    ['#facc15', '#2a1a00'], ['#a78bfa', '#1a0d2e'], ['#fb923c', '#2a0e00'],
];
function avatarColor(name) {
    const n = name || '??';
    return AVATAR_COLORS[(n.charCodeAt(0) || 65) % AVATAR_COLORS.length];
}
function statusClass(s) {
    if (s === 'Prototype Dev') return 'finished';
    if (s === 'Research') return 'inprogress';
    return 'pending';
}
function esc(v) {
    return String(v || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function autoExpand(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

// =============================================================
// RENDER TABLE
// =============================================================
function renderTable(tabId, rows) {
    const tbody = document.getElementById('tbody-' + tabId);
    const countEl = document.getElementById('count-' + tabId);

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon"><i data-lucide="search" style="width:40px;height:40px;opacity:0.3;"></i></div><p>No ideas match your search.</p></div></td></tr>';
        countEl.textContent = '0 ideas';
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = rows.map(function (r) {
        const realIdx = data[tabId].indexOf(r);
        const initials = (r.owner || '??').split(' ').filter(w => w).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
        const ac = avatarColor(r.owner);
        const sc = statusClass(r.status);

        return '<tr>' +
            '<td class="td-idea"><textarea class="inline-input" oninput="autoExpand(this)" onblur="saveField(\'' + tabId + '\',' + realIdx + ',\'idea\', this.value)">' + esc(r.idea) + '</textarea></td>' +
            '<td class="td-desc"><textarea class="inline-input" oninput="autoExpand(this)" onblur="saveField(\'' + tabId + '\',' + realIdx + ',\'description\', this.value)">' + esc(r.description) + '</textarea></td>' +
            '<td class="td-doc">' + (r.fileName
                ? '<div style="display:flex;align-items:center;">' +
                '<div class="file-chip-container">' +
                '<div class="file-chip" onclick="openDocument(\'' + tabId + '\',' + realIdx + ')" title="Open ' + esc(r.fileName) + '">' +
                '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                '<span>' + esc(r.fileName) + '</span>' +
                '</div>' +
                '<button class="btn-cancel-chip" onclick="deleteDocument(\'' + tabId + '\',' + realIdx + ')" title="Remove Document">×</button>' +
                '</div>' +
                '<button class="btn-doc-dl" onclick="downloadDocument(\'' + tabId + '\',' + realIdx + ')" title="Download">' +
                '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                '</button>' +
                '</div>'
                : '<button type="button" class="btn-inline-upload" onclick="triggerInlineUpload(\'' + tabId + '\',' + realIdx + ')">' +
                '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                'Upload' +
                '</button>') + '</td>' +
            (tabId === 'stemworld' ? '<td class="td-cat">' +
                '<select class="status-select" style="background-color:#f1f5f9;color:#475569;border-color:#e2e8f0;padding-right:32px;width:100%;" onchange="saveField(\'' + tabId + '\',' + realIdx + ',\'category\', this.value)">' +
                '<option value="">Select Category</option>' +
                ['Marketing', 'Sales', 'Finance', 'Software', 'Hardware', 'Office Infrastructure'].map(cat =>
                    '<option value="' + cat + '"' + (r.category === cat ? ' selected' : '') + '>' + cat + '</option>'
                ).join('') +
                '</select>' +
                '</td>' : '') +
            '<td class="td-owner-cell"><div class="td-owner"><div class="avatar" style="background:' + ac[0] + ';color:' + ac[1] + ';cursor:pointer;" onclick="openEditModal(\'' + tabId + '\',' + realIdx + ')" title="Full Detail View">' + initials + '</div><textarea class="inline-input" rows="1" oninput="autoExpand(this)" onblur="saveField(\'' + tabId + '\',' + realIdx + ',\'owner\', this.value)">' + esc(r.owner) + '</textarea></div></td>' +
            '<td class="td-status-cell">' +
            '<select class="status-select ' + sc + '" onchange="updateStatus(\'' + tabId + '\',' + realIdx + ', this.value)">' +
            '<option value="">Select Status</option>' +
            '<option value="Prototype Dev"' + (r.status === 'Prototype Dev' ? ' selected' : '') + '>Prototype Dev</option>' +
            '<option value="Research"' + (r.status === 'Research' ? ' selected' : '') + '>Research</option>' +
            '</select>' +
            '</td>' +
            '<td class="td-comment"><textarea class="inline-input" placeholder="Add comment..." oninput="autoExpand(this)" onblur="saveField(\'' + tabId + '\',' + realIdx + ',\'comment\', this.value)">' + esc(r.comment || '') + '</textarea></td>' +
            '<td class="td-actions">' +
            '<button class="btn-row-delete" onclick="deleteRow(\'' + tabId + '\',' + realIdx + ')" title="Delete Idea">' +
            '<i data-lucide="trash-2" style="width:14px;height:14px;"></i>' +
            '</button>' +
            '</td>' +
            '</tr>';
    }).join('');

    countEl.textContent = rows.length + ' idea' + (rows.length !== 1 ? 's' : '');

    // Auto-expand all textareas after render
    setTimeout(() => {
        const els = document.querySelectorAll('#tbody-' + tabId + ' .inline-input');
        els.forEach(autoExpand);
    }, 0);
}

async function deleteRow(tabId, realIdx) {
    const record = data[tabId][realIdx];
    if (!record || !record._id) {
        showToast('❌', 'Cannot delete: ID missing.');
        return;
    }

    if (confirm('Are you sure you want to delete this idea?')) {
        try {
            const response = await fetch(`${BASE_URL}/ideas/${record._id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                data[tabId].splice(realIdx, 1);
                const rows = getFilteredRows(tabId);
                renderTable(tabId, rows);
                renderStats(tabId);
                showToast('🗑️', 'Idea deleted successfully.');
            } else {
                throw new Error('Delete failed');
            }
        } catch (e) {
            console.error('Delete failed', e);
            showToast('❌', 'Failed to delete idea from server.');
        }
    }
}

function renderStats(tabId) {
    var rows = data[tabId];
    var total = rows.length;
    var prototype = rows.filter(function (r) { return r.status === 'Prototype Dev'; }).length;
    var research = rows.filter(function (r) { return r.status === 'Research'; }).length;

    document.getElementById('stats-' + tabId).innerHTML =
        chip('bar-chart-2', 'rgba(124, 58, 237, 0.05)', total, '#fff', 'Total Ideas', '#7c3aed') +
        chip('flask-conical', 'rgba(124, 58, 237, 0.12)', prototype, '#fff', 'Prototype Dev', '#7c3aed') +
        chip('microscope', 'rgba(147, 51, 234, 0.12)', research, '#fff', 'Research', '#9333ea');

    lucide.createIcons();
}
function chip(iconName, bg, num, color, label, iconColor) {
    return '<div class="stat-chip">' +
        '<div class="stat-chip-icon" style="color:' + (iconColor || 'inherit') + '"><i data-lucide="' + iconName + '" style="width:20px;height:20px;"></i></div>' +
        '<div class="stat-chip-body"><div class="stat-chip-num">' + num + '</div>' +
        '<div class="stat-chip-label">' + label + '</div></div></div>';
}

// =============================================================
// FILTER
// =============================================================
function getFilteredRows(tabId) {
    if (!data[tabId]) return [];  // safety guard

    var searchEl = document.querySelector('.search-input[data-target="' + tabId + '"]');
    var filterEl = document.querySelector('.filter-select[data-target="' + tabId + '"]');
    var q = searchEl ? searchEl.value.toLowerCase().trim() : '';
    var s = filterEl ? filterEl.value : '';

    return data[tabId].filter(function (r) {
        var matchQ = !q ||
            (r.idea || '').toLowerCase().includes(q) ||
            (r.description || '').toLowerCase().includes(q) ||
            (r.owner || '').toLowerCase().includes(q);
        var matchS = !s || r.status === s;
        return matchQ && matchS;
    });
}

function refreshTable(tabId) {
    renderTable(tabId, getFilteredRows(tabId));
    renderStats(tabId);
}

// =============================================================
// TABS
// =============================================================
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

        // Switch dynamic theme class
        var main = document.getElementById('main-content');
        var body = document.body;
        main.className = 'theme-' + btn.dataset.tab;
        body.className = 'theme-' + btn.dataset.tab;
    });
});

// Search & filter
document.querySelectorAll('.search-input').forEach(function (el) {
    el.addEventListener('input', function () { refreshTable(el.dataset.target); });
});
document.querySelectorAll('.filter-select').forEach(function (el) {
    el.addEventListener('change', function () { refreshTable(el.dataset.target); });
});

// =============================================================
// SORT
// =============================================================
var SORT_KEYS = ['idea', 'description', null, 'owner', 'status'];
function sortTable(tabId, col) {
    var st = sortState[tabId];
    st.asc = (st.col === col) ? !st.asc : true;
    st.col = col;
    var key = SORT_KEYS[col];
    if (!key) return;

    data[tabId].sort(function (a, b) {
        var va = (a[key] || '').toLowerCase();
        var vb = (b[key] || '').toLowerCase();
        return st.asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    document.querySelectorAll('#tab-' + tabId + ' thead th').forEach(function (th) {
        th.classList.remove('sorted');
        var ic = th.querySelector('.sort-icon');
        if (ic) ic.textContent = '↕';
    });
    var hdr = document.querySelector('#tab-' + tabId + ' thead th[data-col="' + col + '"]');
    if (hdr) {
        hdr.classList.add('sorted');
        var ic = hdr.querySelector('.sort-icon');
        if (ic) ic.textContent = st.asc ? '↑' : '↓';
    }
    refreshTable(tabId);
}

// =============================================================
// FILE UPLOAD
// =============================================================
async function handleFileChange() {
    var input = document.getElementById('f-doc-file');
    pendingFile = input.files[0] || null;
    document.getElementById('file-name-display').textContent =
        pendingFile ? pendingFile.name : 'No file chosen';

    if (pendingFile) {
        showToast('⏳', 'Uploading file...');
        const formData = new FormData();
        formData.append('tab', currentModal || 'others');
        formData.append('file', pendingFile);
        try {
            const response = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                pendingFileData = result.url; // Store the Cloudinary URL
                pendingCloudinaryId = result.public_id; // Store the Cloudinary ID
                showToast('✅', 'File uploaded successfully.');
            }

        } catch (e) {
            console.error('Upload failed', e);
            showToast('❌', 'File upload failed.');
        }
    }
}

// =============================================================
// MODAL — ADD MODE
// =============================================================
function openAddModal(tabId) {
    currentModal = tabId;
    editIndex = null;
    pendingFile = null;

    document.getElementById('modal-title').textContent =
        'Add Idea — ' + (tabId === 'openterra' ? 'Open Tera' : tabId === 'stemworld' ? 'Stemworld' : 'Others');
    document.getElementById('modal-submit-btn').textContent = 'Add Idea';

    // Clear all fields
    document.getElementById('f-idea').value = '';
    document.getElementById('f-owner').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('f-status').value = 'Prototype Dev';
    document.getElementById('f-comment').value = '';
    document.getElementById('f-category').value = '';
    document.getElementById('f-doc-file').value = '';
    document.getElementById('file-name-display').textContent = 'No file chosen';
    pendingFileData = null;
    pendingCloudinaryId = null;


    // Toggle Category visibility
    document.getElementById('category-group').style.display = (tabId === 'stemworld' ? 'block' : 'none');

    document.getElementById('modal-overlay').classList.add('open');
}

// =============================================================
// MODAL — EDIT MODE
// =============================================================
function openEditModal(tabId, realIdx) {
    var r = data[tabId][realIdx];
    if (!r) return;

    currentModal = tabId;
    editIndex = realIdx;
    pendingFile = null;

    document.getElementById('modal-title').textContent =
        'Edit Idea — ' + (tabId === 'openterra' ? 'Open Tera' : tabId === 'stemworld' ? 'Stemworld' : 'Others');
    document.getElementById('modal-submit-btn').textContent = 'Save Changes';

    // Pre-fill with existing data
    document.getElementById('f-idea').value = r.idea || '';
    document.getElementById('f-owner').value = r.owner || '';
    document.getElementById('f-desc').value = r.description || '';
    document.getElementById('f-status').value = r.status || 'Prototype Dev';
    document.getElementById('f-comment').value = r.comment || '';
    document.getElementById('f-category').value = r.category || '';
    document.getElementById('f-doc-file').value = '';
    document.getElementById('file-name-display').textContent =
        r.fileName ? r.fileName + ' (replace by uploading new file)' : 'No file chosen';
    pendingFileData = r.fileData || null;
    pendingCloudinaryId = r.cloudinaryId || null;


    // Toggle Category visibility
    document.getElementById('category-group').style.display = (tabId === 'stemworld' ? 'block' : 'none');

    document.getElementById('modal-overlay').classList.add('open');
}

// =============================================================
// MODAL — CLOSE
// =============================================================
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    currentModal = null;
    editIndex = null;
    pendingFile = null;
    pendingFileData = null;
    pendingCloudinaryId = null;
}

document.getElementById('modal-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// =============================================================
// SUBMIT — handles Add AND Edit
// =============================================================
async function submitIdea() {
    var idea = document.getElementById('f-idea').value.trim();
    var owner = document.getElementById('f-owner').value.trim();

    if (!idea) { showToast('⚠️', 'Idea Name is required.'); return; }
    if (!owner) { showToast('⚠️', 'Owner is required.'); return; }
    if (!currentModal || !data[currentModal]) {
        showToast('❌', 'Something went wrong. Please try again.');
        return;
    }

    var tab = currentModal;
    var fileName = pendingFile ? pendingFile.name : (editIndex !== null ? (data[tab][editIndex].fileName || '') : '');
    var fileData = pendingFileData || (editIndex !== null ? (data[tab][editIndex].fileData || null) : null);

    var record = {
        tab: tab,
        idea: idea,
        description: document.getElementById('f-desc').value.trim(),
        fileName: fileName,
        fileData: fileData,
        cloudinaryId: pendingCloudinaryId || (editIndex !== null ? (data[tab][editIndex].cloudinaryId || null) : null),
        owner: owner,
        status: document.getElementById('f-status').value,
        comment: document.getElementById('f-comment').value.trim(),
        category: (tab === 'stemworld' ? document.getElementById('f-category').value : '')
    };

    try {
        let response;
        if (editIndex !== null) {
            const id = data[tab][editIndex]._id;
            response = await fetch(`${BASE_URL}/ideas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
        } else {
            response = await fetch(`${BASE_URL}/ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
        }

        const result = await response.json();
        if (response.ok) {
            if (editIndex !== null) {
                data[tab][editIndex] = result;
                showToast('✏️', '"' + idea + '" updated!');
            } else {
                data[tab].unshift(result);
                showToast('✅', 'Idea added successfully!');
            }
            closeModal();
            refreshTable(tab);
        } else {
            throw new Error(result.error || 'Server error');
        }
    } catch (e) {
        console.error('Submit failed', e);
        showToast('❌', 'Failed to save idea to server.');
    }
}

// =============================================================
// EXCEL EXPORT (SheetJS)
// =============================================================
function buildSheetData(rows) {
    var out = [['Idea', 'Description', 'Document', 'Owner', 'Status']];
    rows.forEach(function (r) {
        out.push([r.idea, r.description, r.fileName || '', r.owner, r.status]);
    });
    return out;
}

function exportExcel(tabId) {
    var rows = getFilteredRows(tabId);
    if (!rows.length) { showToast('⚠️', 'No rows to export.'); return; }
    var ws = XLSX.utils.aoa_to_sheet(buildSheetData(rows));
    ws['!cols'] = [20, 40, 28, 20, 14].map(function (w) { return { wch: w }; });
    var wb = XLSX.utils.book_new();
    var sheetName = tabId === 'openterra' ? 'Open Tera' : tabId === 'stemworld' ? 'Stemworld' : 'Others';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, tabId + '-ideas.xlsx');
    showToast('📥', 'Exported ' + rows.length + ' row' + (rows.length !== 1 ? 's' : '') + ' to Excel.');
}

async function updateStatus(tabId, realIdx, newStatus) {
    if (!data[tabId] || !data[tabId][realIdx]) return;
    const record = data[tabId][realIdx];
    if (!record._id) return;

    try {
        const response = await fetch(`${BASE_URL}/ideas/${record._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            data[tabId][realIdx].status = newStatus;
            showToast('🔄', 'Status updated to "' + newStatus + '"');
            refreshTable(tabId);
        }
    } catch (e) {
        console.error('Status update failed', e);
        showToast('❌', 'Failed to update status.');
    }
}

async function saveField(tabId, realIdx, field, newValue) {
    if (!data[tabId] || !data[tabId][realIdx]) return;
    const record = data[tabId][realIdx];
    if (!record._id) return;

    // Only update if changed
    if (record[field] === newValue) return;

    try {
        const response = await fetch(`${BASE_URL}/ideas/${record._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: newValue })
        });
        if (response.ok) {
            data[tabId][realIdx][field] = newValue;
            showToast('✅', 'Updated ' + field);
            if (field === 'status') renderStats(tabId);
        }
    } catch (e) {
        console.error('Field update failed', e);
        showToast('❌', 'Failed to update ' + field);
    }
}

function openDocument(tabId, realIdx) {
    var r = data[tabId][realIdx];
    if (!r || !r.fileData) return;

    showToast('📄', 'Opening ' + r.fileName + '...');
    if (r.fileData && r.fileData.startsWith('http')) {
        window.open(r.fileData, '_blank');
    } else {
        window.open(`${BASE_URL}/download/${r.fileData}`, '_blank');
    }
}


function downloadDocument(tabId, realIdx) {
    var r = data[tabId][realIdx];
    if (!r || !r.fileData) return;

    showToast('📥', 'Downloading ' + r.fileName + '...');
    
    let url = r.fileData;
    if (!url.startsWith('http')) {
        url = `${BASE_URL}/download/${url}`;
    } else if (url.includes('cloudinary.com')) {
        // Force download for Cloudinary by adding fl_attachment
        url = url.replace('/upload/', '/upload/fl_attachment/');
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = r.fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function deleteDocument(tabId, realIdx) {
    if (!confirm('Are you sure you want to remove this document?')) return;

    const r = data[tabId][realIdx];
    if (!r._id) return;

    if (r.cloudinaryId) {
        fetch(`${BASE_URL}/delete-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: r.cloudinaryId })
        }).catch(err => console.error('Failed to delete from Cloudinary', err));
    }

    try {
        const response = await fetch(`${BASE_URL}/ideas/${r._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: null, fileData: null, cloudinaryId: null })
        });
        if (response.ok) {
            data[tabId][realIdx].fileName = null;
            data[tabId][realIdx].fileData = null;
            data[tabId][realIdx].cloudinaryId = null;
            refreshTable(tabId);
            showToast('🗑️', 'Document removed');
        }
    } catch (e) {
        console.error('Document delete failed', e);
        showToast('❌', 'Failed to remove document.');
    }
}


var inlineUploadContext = null;
function triggerInlineUpload(tabId, realIdx) {
    inlineUploadContext = { tabId, realIdx };
    document.getElementById('inline-file-input').click();
}

async function handleInlineFileChange(input) {
    if (!inlineUploadContext || !input.files[0]) return;
    var file = input.files[0];
    var { tabId, realIdx } = inlineUploadContext;
    const r = data[tabId][realIdx];
    if (!r._id) return;

    showToast('⏳', 'Uploading file...');
    const formData = new FormData();
    formData.append('tab', tabId);
    formData.append('file', file);
    try {
        const response = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            const updateResponse = await fetch(`${BASE_URL}/ideas/${r._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: result.url,
                    cloudinaryId: result.public_id
                })
            });

            if (updateResponse.ok) {
                data[tabId][realIdx].fileName = file.name;
                data[tabId][realIdx].fileData = result.url; // Cloudinary URL
                data[tabId][realIdx].cloudinaryId = result.public_id; // Cloudinary ID
                refreshTable(tabId);
                showToast('📁', 'Document uploaded successfully.');
            }
        }

    } catch (e) {
        console.error('Upload failed', e);
        showToast('❌', 'File upload failed.');
    }
    input.value = ''; // Reset input
}

// =============================================================
// TOAST
// =============================================================
var toastTimer;
function showToast(icon, msg) {
    clearTimeout(toastTimer);
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-msg').textContent = msg;
    var el = document.getElementById('toast');
    el.classList.add('show');
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
}

// =============================================================
// INIT
// =============================================================
// Initial load
loadData();

// Final icon init
window.addEventListener('load', function () {
    lucide.createIcons();

    // Display user email
    const email = localStorage.getItem('userEmail');
    if (email) {
        document.getElementById('user-email-display').textContent = email;
    }
});

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = 'auth.html';
}
