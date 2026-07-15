document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notesContainer');
    const noteEditor = document.getElementById('noteEditor');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // 모달 관련 요소
    const viewModal = document.getElementById('viewModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalDate = document.getElementById('modalDate');
    const editFromModalBtn = document.getElementById('editFromModalBtn');

    let notes = JSON.parse(localStorage.getItem('mynotes')) || [];
    let currentEditingId = null;
    let currentViewingNote = null;

    // 테마 초기화
    const savedTheme = localStorage.getItem('mynote-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeBtn(savedTheme);

    // 초기 노트 렌더링
    renderNotes();

    // 다크 모드 토글
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('mynote-theme', newTheme);
        updateThemeBtn(newTheme);
    });

    function updateThemeBtn(theme) {
        themeToggleBtn.textContent = theme === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드';
    }

    // 새 노트 작성 버튼
    addNoteBtn.addEventListener('click', () => {
        openEditor();
    });

    // 취소 버튼
    cancelNoteBtn.addEventListener('click', () => {
        closeEditor();
    });

    // 저장 버튼
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
        notes.forEach(note => {
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
            
            card.addEventListener('click', () => {
                viewNote(note);
            });
            
            notesContainer.appendChild(card);
        });
    }

    window.deleteNote = (event, id) => {
        event.stopPropagation();
        if (confirm('이 노트를 삭제하시겠습니까?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
            closeModal(); // 혹시 모달이 열려있다면 닫기
        }
    };

    // 긴 노트 보기 (모달)
    function viewNote(note) {
        currentViewingNote = note;
        modalTitle.textContent = note.title;
        modalContent.textContent = note.content; 
        modalDate.textContent = note.updatedAt;
        viewModal.classList.remove('hidden');
    }

    function closeModal() {
        viewModal.classList.add('hidden');
        currentViewingNote = null;
    }

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) closeModal();
    });

    // 모달에서 수정 버튼 클릭
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

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});