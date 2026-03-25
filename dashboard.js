// Dashboard JavaScript - Auto-refresh and dynamic data loading

const API_BASE = 'https://lockedin.ct.ws';
const REFRESH_INTERVAL = 30000; // 30 seconds

// Tab switching
function switchTab(tabId) {
    const menuItems = document.querySelectorAll('#tab-menu li');
    menuItems.forEach(li => {
        li.classList.remove('active');
        const text = li.innerText.toLowerCase().replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '-');
        if(text === tabId) li.classList.add('active');
    });

    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => p.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    loadTabData(tabId);
}

// Load data for specific tab
function loadTabData(tabId) {
    switch(tabId) {
        case 'overview':   loadStats(); loadRecentActivity(); break;
        case 'my-notes':   loadNotes();      break;
        case 'subjects':   loadSubjects();   break;
        case 'bookmarks':  loadBookmarks();  break;
        case 'activity':   loadActivity();   break;
        case 'history':    loadHistory();    break;
    }
}

// ── Authenticated fetch helper ─────────────────────────────────────────────
async function apiFetch(endpoint) {
    const res = await fetch(`${API_BASE}/${endpoint}`, { credentials: 'include' });
    if (res.status === 401) {
        // Session expired or not logged in
        window.location.replace(`${API_BASE}/login.php`);
        throw new Error('Unauthorized');
    }
    return res.json();
}

// ── Stats ──────────────────────────────────────────────────────────────────
async function loadStats() {
    try {
        const data = await apiFetch('api_data.php?type=stats');

        const map = {
            'stat-notes':     data.notes_uploaded   || 0,
            'stat-subjects':  data.subjects_joined  || 0,
            'stat-bookmarks': data.bookmarks_count  || 0,
            'stat-views':     data.total_views      || 0,
            // dashboard.html uses stat-hours instead of stat-bookmarks
            'stat-hours':     data.study_hours      || '0h',
        };
        Object.entries(map).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('Stats error:', e);
    }
}

// ── Recent activity preview (overview tab) ─────────────────────────────────
async function loadRecentActivity() {
    try {
        const activities = await apiFetch('api_data.php?type=activity');
        const container = document.getElementById('recent-activity-preview');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">No recent activity</p>';
            return;
        }
        container.innerHTML = activities.slice(0, 3).map(act =>
            `<p style="font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
                <span style="color:var(--primary)">${act.icon}</span>${act.text}
             </p>`
        ).join('');
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('Recent activity error:', e);
    }
}

// ── Full activity feed ─────────────────────────────────────────────────────
async function loadActivity() {
    try {
        const activities = await apiFetch('api_data.php?type=activity');
        const container = document.getElementById('activity-container');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-inbox" style="font-size:48px;opacity:0.25"></i></div><p>No activity yet</p></div>';
            return;
        }
        container.innerHTML = activities.map(act => `
            <div class="activity-item">
                <div class="activity-icon" style="background:${act.color};color:white;font-size:16px">${act.icon}</div>
                <div style="flex:1">
                    <p style="font-weight:500">${act.text}</p>
                    <span style="font-size:12px;color:var(--text-muted)">${act.time}</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('Activity error:', e);
    }
}

// ── Notes ──────────────────────────────────────────────────────────────────
async function loadNotes() {
    const container = document.getElementById('notes-container');
    if (!container) return;
    container.innerHTML = '<div class="spinner" style="grid-column:1/-1"></div>';

    try {
        const notes = await apiFetch('api_data.php?type=notes');

        if (!notes || notes.length === 0) {
            container.innerHTML = `
                <div class="upload-card" onclick="openUploadModal()" style="grid-column:1/-1">
                    <div class="upload-icon"><i class="fas fa-cloud-upload-alt" style="color:#3b82f6"></i></div>
                    <h3>Upload Your First Note</h3>
                    <p style="color:var(--text-muted);margin-top:8px">Share your knowledge with others</p>
                </div>`;
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="note-card">
                <span style="background:#eff6ff;color:#3b82f6;padding:4px 8px;border-radius:5px;font-size:11px">${note.subject}</span>
                <h3 style="margin-top:10px">${note.title}</h3>
                <p style="font-size:12px;color:var(--text-muted);margin:10px 0">${note.formatted_date} • 👁 ${note.views}</p>
                <div class="note-actions">
                    <span onclick="downloadNote('${note.file_path}')" title="View / Download" style="color:#3b82f6"><i class="fas fa-eye"></i></span>
                    <span onclick="deleteNote(${note.id})" title="Delete" style="color:#dc2626"><i class="fas fa-trash-alt"></i></span>
                </div>
            </div>
        `).join('') + `
            <div class="upload-card" onclick="openUploadModal()">
                <div class="upload-icon"><i class="fas fa-plus-circle" style="color:#3b82f6"></i></div>
                <h3>Upload New Note</h3>
            </div>`;
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('Notes error:', e);
    }
}

// ── Subjects ───────────────────────────────────────────────────────────────
async function loadSubjects() {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    try {
        const subjects = await apiFetch('api_data.php?type=subjects');

        const iconMap = {
            'Physics':          { icon: 'fa-bolt',            bg: '#eff6ff', color: '#3b82f6' },
            'Chemistry':        { icon: 'fa-flask',           bg: '#fdf4ff', color: '#a855f7' },
            'Math':             { icon: 'fa-square-root-alt', bg: '#fef3c7', color: '#f59e0b' },
            'Computer Science': { icon: 'fa-laptop-code',     bg: '#f0fdf4', color: '#22c55e' },
            'Biology':          { icon: 'fa-dna',             bg: '#ecfdf5', color: '#10b981' },
            'Literature':       { icon: 'fa-book-open',       bg: '#fff7ed', color: '#f97316' },
            'Economics':        { icon: 'fa-chart-line',      bg: '#f0fdf4', color: '#16a34a' },
            'History':          { icon: 'fa-landmark',        bg: '#fef9c3', color: '#ca8a04' },
            'English':          { icon: 'fa-spell-check',     bg: '#eff6ff', color: '#2563eb' },
            'Geography':        { icon: 'fa-globe',           bg: '#ecfdf5', color: '#059669' },
        };
        const def = { icon: 'fa-book', bg: '#f1f5f9', color: '#64748b' };

        container.innerHTML = subjects.map(sub => {
            const m = iconMap[sub.name] || def;
            return `
                <div class="sub-card" style="cursor:pointer"
                     onclick="window.location.href='${API_BASE}/search.php?subject='+encodeURIComponent('${sub.name}')">
                    <div class="sub-icon-wrap" style="background:${m.bg};color:${m.color}">
                        <i class="fas ${m.icon}"></i>
                    </div>
                    <h3>${sub.name}</h3>
                    <p style="font-size:13px;color:var(--text-muted)">${sub.user_notes} your notes &bull; ${sub.total_notes} total</p>
                    <span style="display:inline-flex;align-items:center;gap:5px;margin-top:10px;font-size:12px;font-weight:600;color:#3b82f6">
                        <i class="fas fa-arrow-right"></i> Browse notes
                    </span>
                </div>`;
        }).join('');
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('Subjects error:', e);
    }
}

// ── Bookmarks ──────────────────────────────────────────────────────────────
async function loadBookmarks() {
    const container = document.getElementById('bookmarks-container');
    if (!container) return;

    try {
        const bookmarks = await apiFetch('api_data.php?type=bookmarks');

        if (!bookmarks || bookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-state-icon"><i class="fas fa-bookmark" style="font-size:48px;opacity:0.25"></i></div>
                    <p>No bookmarks yet</p>
                    <p style="font-size:14px;margin-top:8px">Bookmark notes to save them for later</p>
                </div>`;
            return;
        }
        container.innerHTML = bookmarks.map(note => `
            <div class="note-card">
                <span style="background:#fef3c7;color:#d97706;padding:4px 8px;border-radius:5px;font-size:11px">${note.subject}</span>
                <h3 style="margin-top:10px">${note.title}</h3>
                <p style="font-size:12px;color:var(--text-muted);margin:10px 0">By ${note.uploader_name}</p>
                <p style="font-size:11px;color:var(--text-muted)">Bookmarked: ${note.bookmarked_date}</p>
                <div class="note-actions">
                    <span onclick="downloadNote('${note.file_path}')" title="View / Download" style="color:#3b82f6"><i class="fas fa-eye"></i></span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('Bookmarks error:', e);
    }
}

// ── History ────────────────────────────────────────────────────────────────
async function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    try {
        const history = await apiFetch('api_data.php?type=history');

        if (!history || history.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-history" style="font-size:48px;opacity:0.25"></i></div><p>No history yet</p></div>';
            return;
        }
        container.innerHTML = history.map(item => `
            <div class="history-item">
                <strong>${item.action_type.replace('_', ' ').toUpperCase()}</strong>
                <p style="margin-top:4px">${item.description}</p>
                <div class="history-time">${item.full_time} (${item.time})</div>
            </div>
        `).join('');
    } catch (e) {
        if (e.message !== 'Unauthorized') console.error('History error:', e);
    }
}

// ── Upload Modal ───────────────────────────────────────────────────────────
function openUploadModal()  { document.getElementById('upload-modal').classList.add('active'); }
function closeUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
    document.getElementById('upload-form').reset();
    const fn = document.getElementById('file-name');
    if (fn) fn.textContent = '';
    document.getElementById('upload-status').innerHTML = '';
}

// File drop area
document.addEventListener('DOMContentLoaded', function () {
    const fileDropArea = document.getElementById('file-drop-area');
    const fileInput    = document.getElementById('pdf-file');
    const fileName     = document.getElementById('file-name');

    if (fileDropArea && fileInput) {
        fileDropArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && fileName)
                fileName.textContent = `Selected: ${e.target.files[0].name}`;
        });

        ['dragenter','dragover','dragleave','drop'].forEach(ev =>
            fileDropArea.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); })
        );
        ['dragenter','dragover'].forEach(ev =>
            fileDropArea.addEventListener(ev, () => fileDropArea.classList.add('drag-over'))
        );
        ['dragleave','drop'].forEach(ev =>
            fileDropArea.addEventListener(ev, () => fileDropArea.classList.remove('drag-over'))
        );
        fileDropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            fileInput.files = files;
            if (files.length > 0 && fileName)
                fileName.textContent = `Selected: ${files[0].name}`;
        });
    }

    // ── Upload form submit ─────────────────────────────────────────────────
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const uploadBtn    = document.getElementById('upload-btn');
            const uploadStatus = document.getElementById('upload-status');
            const pdfFile      = document.getElementById('pdf-file');

            if (!pdfFile.files || pdfFile.files.length === 0) {
                uploadStatus.innerHTML = '<p style="color:#dc2626">✗ Please select a PDF file</p>';
                return;
            }

            const formData = new FormData();
            formData.append('title',    document.querySelector('input[name="title"]').value);
            formData.append('subject',  document.querySelector('select[name="subject"]').value);
            formData.append('grade',    document.querySelector('select[name="grade"]').value);
            formData.append('pdf_file', pdfFile.files[0]);

            uploadBtn.disabled    = true;
            uploadBtn.textContent = 'Uploading...';
            uploadStatus.innerHTML = '<div class="spinner"></div>';

            try {
                const response = await fetch(`${API_BASE}/upload_note.php`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });
                const result = await response.json();

                if (result.success) {
                    uploadStatus.innerHTML = '<p style="color:#22c55e">✓ Upload successful!</p>';
                    setTimeout(() => {
                        closeUploadModal();
                        loadNotes();
                        loadStats();
                        loadActivity();
                    }, 1500);
                } else {
                    uploadStatus.innerHTML = `<p style="color:#dc2626">✗ ${result.error}</p>`;
                    uploadBtn.disabled    = false;
                    uploadBtn.textContent = 'Upload Note';
                }
            } catch (err) {
                console.error('Upload error:', err);
                uploadStatus.innerHTML = '<p style="color:#dc2626">✗ Upload failed. Please try again.</p>';
                uploadBtn.disabled    = false;
                uploadBtn.textContent = 'Upload Note';
            }
        });
    }

    // ── Logout button (dashboard.html only - dashboard.php handles its own) ─
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${API_BASE}/logout.php`;
        });
    }

    // ── Initial data load ──────────────────────────────────────────────────
    loadStats();
    loadRecentActivity();
    loadNotes();

    // Auto-refresh stats every 30 s
    setInterval(() => {
        loadStats();
        loadRecentActivity();
    }, REFRESH_INTERVAL);
});

// ── Note actions ───────────────────────────────────────────────────────────
function downloadNote(filePath) {
    window.open(filePath, '_blank');
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE}/delete_note.php`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note_id: noteId }),
        });
        const result = await response.json();

        if (result.success) {
            loadNotes();
            loadStats();
            loadActivity();
            loadHistory();
        } else {
            alert('✗ Failed to delete note: ' + result.error);
        }
    } catch (err) {
        console.error('Delete error:', err);
        alert('✗ Failed to delete note. Please try again.');
    }
}