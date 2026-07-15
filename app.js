document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const notesContainer = document.getElementById('notesContainer');
    const noteEditor = document.getElementById('noteEditor');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    
    // Buttons
    const addNoteBtn = document.getElementById('addNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // Inputs
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const apiKeyInput = document.getElementById('apiKeyInput');
    
    // Modals
    const viewModal = document.getElementById('viewModal');
    const settingsModal = document.getElementById('settingsModal');
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // Modal contents
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalDate = document.getElementById('modalDate');
    const editFromModalBtn = document.getElementById('editFromModalBtn');
    
    // AI Elements
    const aiSummarizeBtn = document.getElementById('aiSummarizeBtn');
    const aiOpinionBtn = document.getElementById('aiOpinionBtn');
    const aiResponseArea = document.getElementById('aiResponseArea');
    const aiResponseContent = document.getElementById('aiResponseContent');
    const closeAiBtn = document.getElementById('closeAiBtn');

    // State
    let notes = JSON.parse(localStorage.getItem('mynotes')) || [];
    let currentEditingId = null;
    let currentViewingNote = null;
    let currentSearchTerm = '';

    // Initialize Theme
    const savedTheme = localStorage.getItem('mynote-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    // Initial render
    renderNotes();
    apiKeyInput.value = localStorage.getItem('mynote-gemini-key') || '';

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('mynote-theme', newTheme);
        themeToggleBtn.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        renderNotes();
    });

    // Settings Modal
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', () => {
        localStorage.setItem('mynote-gemini-key', apiKeyInput.value.trim());
        settingsModal.classList.add('hidden');
        alert('API 키가 저장되었습니다.');
    });

    // CRUD Operations
    addNoteBtn.addEventListener('click', () => openEditor());
    cancelNoteBtn.addEventListener('click', () => closeEditor());

    saveNoteBtn.addEventListener('click', () => {
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();

        if (!title && !content) {
            alert('제목이나 내용을 입력해주세요.');
            return;
        }

        const note = {
            id: currentEditingId || Date.now().toString(),
            title: title || '제목 없음',
            content: content,
            updatedAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', {hour12: false, hour: '2-digit', minute:'2-digit'})
        };

        if (currentEditingId) {
            const index = notes.findIndex(n => n.id === currentEditingId);
            if (index !== -1) notes[index] = note;
        } else {
            notes.unshift(note);
        }

        saveNotes();
        renderNotes();
        closeEditor();
    });

    function saveNotes() {
        localStorage.setItem('mynotes', JSON.stringify(notes));
    }

    function renderNotes() {
        notesContainer.innerHTML = '';
        
        const filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(currentSearchTerm) || 
            note.content.toLowerCase().includes(currentSearchTerm)
        );

        if (filteredNotes.length === 0) {
            emptyState.classList.remove('hidden');
            if (notes.length === 0) emptyState.textContent = '아직 작성된 노트가 없습니다.';
            else emptyState.textContent = `'${currentSearchTerm}'에 대한 검색 결과가 없습니다.`;
        } else {
            emptyState.classList.add('hidden');
            filteredNotes.forEach(note => {
                const card = document.createElement('div');
                card.className = 'note-card';
                card.innerHTML = `
                    <h3>${escapeHtml(note.title)}</h3>
                    <p>${escapeHtml(note.content)}</p>
                    <div class="note-card-footer">
                        <span>${note.updatedAt.split(' ')[0]}</span>
                        <button class="btn danger" onclick="deleteNote(event, '${note.id}')">삭제</button>
                    </div>
                `;
                card.addEventListener('click', () => viewNote(note));
                notesContainer.appendChild(card);
            });
        }
    }

    window.deleteNote = (event, id) => {
        event.stopPropagation();
        if (confirm('이 노트를 삭제하시겠습니까?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
            closeModal();
        }
    };

    // Modal Operations
    function viewNote(note) {
        currentViewingNote = note;
        modalTitle.textContent = note.title;
        modalContent.textContent = note.content; 
        modalDate.textContent = note.updatedAt;
        aiResponseArea.classList.add('hidden'); // Reset AI area
        viewModal.classList.remove('hidden');
    }

    function closeModal() {
        viewModal.classList.add('hidden');
        currentViewingNote = null;
    }

    closeModalBtn.addEventListener('click', closeModal);
    closeAiBtn.addEventListener('click', () => aiResponseArea.classList.add('hidden'));
    
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) closeModal();
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });

    editFromModalBtn.addEventListener('click', () => {
        if (currentViewingNote) {
            openEditor(currentViewingNote);
            closeModal();
        }
    });

    function openEditor(note = null) {
        if (note) {
            currentEditingId = note.id;
            noteTitle.value = note.title;
            noteContent.value = note.content;
        } else {
            currentEditingId = null;
            noteTitle.value = '';
            noteContent.value = '';
        }
        noteEditor.classList.remove('hidden');
        noteTitle.focus();
        window.scrollTo(0, 0);
    }

    function closeEditor() {
        noteEditor.classList.add('hidden');
        currentEditingId = null;
    }

    // --- AI Features (Google Gemini API) ---
    async function fetchAI(promptText) {
        const apiKey = localStorage.getItem('mynote-gemini-key');
        if (!apiKey) {
            alert('AI 기능을 사용하려면 설정(⚙️)에서 API 키를 먼저 입력해주세요.');
            settingsModal.classList.remove('hidden');
            return;
        }

        aiResponseArea.classList.remove('hidden');
        aiResponseContent.innerHTML = '<i>AI가 답변을 생성하고 있습니다...</i>';
        aiSummarizeBtn.disabled = true;
        aiOpinionBtn.disabled = true;

        try {
            const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${apiKey}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            if (!response.ok) {
                throw new Error('API 요청에 실패했습니다. 키가 올바른지 확인해주세요.');
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            
            // 간단한 마크다운 처리 (볼드체, 줄바꿈)
            aiResponseContent.innerHTML = escapeHtml(text)
                .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                .replace(/\\n/g, '<br>');

        } catch (error) {
            aiResponseContent.innerHTML = \`<span style="color:var(--danger-color)">에러 발생: \${error.message}</span>\`;
        } finally {
            aiSummarizeBtn.disabled = false;
            aiOpinionBtn.disabled = false;
        }
    }

    aiSummarizeBtn.addEventListener('click', () => {
        if (!currentViewingNote) return;
        const prompt = \`다음 노트의 내용을 핵심만 3~4줄로 간결하게 요약해줘:\\n\\n제목: \${currentViewingNote.title}\\n내용: \${currentViewingNote.content}\`;
        fetchAI(prompt);
    });

    aiOpinionBtn.addEventListener('click', () => {
        if (!currentViewingNote) return;
        const prompt = \`다음 노트의 내용을 읽고, 건설적인 피드백이나 새로운 아이디어, 또는 관련된 통찰을 제공해줘:\\n\\n제목: \${currentViewingNote.title}\\n내용: \${currentViewingNote.content}\`;
        fetchAI(prompt);
    });

    function escapeHtml(unsafe) {
        if(!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});