document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notesContainer');
    const noteEditor = document.getElementById('noteEditor');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');

    let notes = JSON.parse(localStorage.getItem('mynotes')) || [];
    let currentEditingId = null;

    // 초기 노트 렌더링
    renderNotes();

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
            updatedAt: new Date().toLocaleDateString('ko-KR')
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
                    <span>${note.updatedAt}</span>
                    <button class="btn danger" onclick="deleteNote(event, '${note.id}')">삭제</button>
                </div>
            `;
            
            card.addEventListener('click', () => {
                openEditor(note);
            });
            
            notesContainer.appendChild(card);
        });
    }

    window.deleteNote = (event, id) => {
        event.stopPropagation(); // 카드 클릭 이벤트 막기
        if (confirm('이 노트를 삭제하시겠습니까?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
        }
    };

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