// Dashboard JavaScript - Calls InfinityFree backend APIs

const API_BASE = 'https://lockedin.ct.ws';
const REFRESH_INTERVAL = 30000; // 30 seconds

// Check if user is logged in
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api_data.php?type=check_auth`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.logged_in) {
            // Not logged in, redirect to login
            window.location.href = `${API_BASE}/login.php`;
            return false;
        }
        
        // User is logged in, update UI
        document.getElementById('userName').textContent = data.name || 'User';
        const avatar = document.getElementById('userAvatar');
        if (data.picture) {
            avatar.src = data.picture;
            avatar.style.display = 'block';
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = `${API_BASE}/login.php`;
        return false;
    }
}

// Tab switching
function switchTab(tabId) {
    // Update menu
    const menuItems = document.querySelectorAll('#tab-menu li');
    menuItems.forEach(li => li.classList.remove('active'));
    event.target.closest('li').classList.add('active');
    
    // Update panes
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => p.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    // Load data for tab
    loadTabData(tabId);
}

// Load data for specific tab
function loadTabData(tabId) {
    switch(tabId) {
        case 'my-notes':
            loadNotes();
            break;
        case 'bookmarks':
            loadBookmarks();
            break;
        case 'activity':
            loadActivity();
            break;
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api_data.php?type=stats`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        document.getElementById('stat-notes').textContent = data.notes_uploaded || 0;
        document.getElementById('stat-subjects').textContent = data.subjects_joined || 0;
        document.getElementById('stat-hours').textContent = data.study_hours || '0h';
        document.getElementById('stat-views').textContent = data.total_views || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load notes
async function loadNotes() {
    const container = document.getElementById('notes-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${API_BASE}/api_data.php?type=notes`, {
            credentials: 'include'
        });
        const notes = await response.json();
        
        if (!notes || notes.length === 0) {
            container.innerHTML = `
                <div class="upload-card" onclick="openUploadModal()">
                    <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                    <h3>Upload Your First Note</h3>
                    <p style="color: var(--text-muted); margin-top: 8px;">Share your knowledge with the community</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = notes.map(note => `
            <div class="note-card">
                <span style="background: var(--primary-light); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${esc(note.subject)}</span>
                <h3 style="margin-top: 12px;">${esc(note.title)}</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                    ${note.formatted_date || ''} • 👁 ${note.views || 0} views
                </p>
                <div class="note-actions">
                    <button onclick="viewNote('${esc(note.file_path)}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button onclick="deleteNote(${note.id})" style="color: #dc2626;">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `).join('') + `
            <div class="upload-card" onclick="openUploadModal()">
                <div class="upload-icon"><i class="fas fa-plus-circle"></i></div>
                <h3>Upload New Note</h3>
            </div>
        `;
    } catch (error) {
        console.error('Error loading notes:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Could not load notes</p></div>';
    }
}

// Load bookmarks
async function loadBookmarks() {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${API_BASE}/api_data.php?type=bookmarks`, {
            credentials: 'include'
        });
        const bookmarks = await response.json();
        
        if (!bookmarks || bookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-bookmark"></i>
                    <p>No bookmarks yet</p>
                    <p style="font-size: 14px; margin-top: 8px;">Browse notes and bookmark your favorites</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = bookmarks.map(note => `
            <div class="note-card">
                <span style="background: #fef3c7; color: #d97706; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${esc(note.subject)}</span>
                <h3 style="margin-top: 12px;">${esc(note.title)}</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                    By ${esc(note.uploader_name || 'Anonymous')}
                </p>
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                    Bookmarked: ${note.bookmarked_date || ''}
                </p>
                <div class="note-actions">
                    <button onclick="viewNote('${esc(note.file_path)}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Could not load bookmarks</p></div>';
    }
}

// Load activity
async function loadActivity() {
    const container = document.getElementById('activity-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${API_BASE}/api_data.php?type=activity`, {
            credentials: 'include'
        });
        const activities = await response.json();
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No activity yet</p></div>';
            return;
        }
        
        container.innerHTML = activities.map(act => `
            <div style="background: white; border: 2px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${act.color || 'var(--primary)'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                    ${act.icon || '📝'}
                </div>
                <div style="flex: 1;">
                    <p style="font-weight: 600; margin-bottom: 4px;">${act.text}</p>
                    <span style="font-size: 12px; color: var(--text-muted);">${act.time || ''}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activity:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Could not load activity</p></div>';
    }
}

// Upload modal functions
function openUploadModal() {
    document.getElementById('upload-modal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
    document.getElementById('upload-form').reset();
    document.getElementById('file-name').textContent = '';
    document.getElementById('upload-status').innerHTML = '';
}

// File upload handling
const fileDropArea = document.getElementById('file-drop-area');
const fileInput = document.getElementById('pdf-file');
const fileName = document.getElementById('file-name');

fileDropArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileName.textContent = `Selected: ${e.target.files[0].name}`;
    }
});

// Drag and drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

['dragenter', 'dragover'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, () => {
        fileDropArea.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, () => {
        fileDropArea.classList.remove('drag-over');
    });
});

fileDropArea.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    fileInput.files = files;
    if (files.length > 0) {
        fileName.textContent = `Selected: ${files[0].name}`;
    }
});

// Handle form submission
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');
    const fileInputEl = document.getElementById('pdf-file');
    
    if (!fileInputEl.files || fileInputEl.files.length === 0) {
        uploadStatus.innerHTML = '<p style="color: #dc2626; margin-top: 12px;">✗ Please select a PDF file</p>';
        return;
    }
    
    const formData = new FormData();
    formData.append('title', document.querySelector('input[name="title"]').value);
    formData.append('subject', document.querySelector('select[name="subject"]').value);
    formData.append('grade', document.querySelector('select[name="grade"]').value);
    formData.append('pdf_file', fileInputEl.files[0]);
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    uploadStatus.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`${API_BASE}/upload_note.php`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            uploadStatus.innerHTML = '<p style="color: #22c55e; margin-top: 12px;">✓ Upload successful!</p>';
            setTimeout(() => {
                closeUploadModal();
                loadNotes();
                loadStats();
                loadActivity();
            }, 1500);
        } else {
            uploadStatus.innerHTML = `<p style="color: #dc2626; margin-top: 12px;">✗ ${result.error || 'Upload failed'}</p>`;
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Note';
        }
    } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.innerHTML = '<p style="color: #dc2626; margin-top: 12px;">✗ Upload failed</p>';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Note';
    }
});

// Note actions
function viewNote(filePath) {
    window.open(filePath, '_blank');
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/delete_note.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note_id: noteId }),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✓ Note deleted successfully!');
            loadNotes();
            loadStats();
            loadActivity();
        } else {
            alert('✗ Failed to delete note: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('✗ Failed to delete note. Please try again.');
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
        await fetch(`${API_BASE}/logout.php`, { credentials: 'include' });
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
});

// Utility function
function esc(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

// Initialize dashboard
async function init() {
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) return;
    
    // Load initial data
    loadStats();
    loadNotes();
    
    // Auto-refresh stats
    setInterval(() => {
        loadStats();
    }, REFRESH_INTERVAL);
}

// Start when page loads
document.addEventListener('DOMContentLoaded', init);