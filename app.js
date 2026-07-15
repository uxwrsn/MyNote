document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM 요소 가져오기
    const notesContainer = document.getElementById('notesContainer');
    const noteEditor = document.getElementById('noteEditor');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    
    const addNoteBtn = document.getElementById('addNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const apiKeyInput = document.getElementById('apiKeyInput');
    
    const viewModal = document.getElementById('viewModal');
    const settingsModal = document.getElementById('settingsModal');
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalDate = document.getElementById('modalDate');
    const editFromModalBtn = document.getElementById('editFromModalBtn');
    
    const aiSummarizeBtn = document.getElementById('aiSummarizeBtn');
    const aiOpinionBtn = document.getElementById('aiOpinionBtn');
    const aiResponseArea = document.getElementById('aiResponseArea');
    const aiResponseContent = document.getElementById('aiResponseContent');
    const closeAiBtn = document.getElementById('closeAiBtn');

    // 2. 상태 변수 및 안전한 데이터 로드
    let notes = [];
    try {
        const stored = localStorage.getItem('mynotes');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                notes = parsed.filter(n => n !== null && typeof n === 'object');
            }
        }
    } catch (e) {
        console.error("데이터 로드 실패:", e);
        notes = [];
    }
    
    let currentEditingId = null;
    let currentViewingNote = null;
    let currentSearchTerm = '';

    // 3. 테마 초기화
    try {
        const savedTheme = localStorage.getItem('mynote-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if(themeToggleBtn) themeToggleBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
        if(apiKeyInput) apiKeyInput.value = localStorage.getItem('mynote-gemini-key') || '';
    } catch(e) {}

    // 4. 이벤트 리스너 등록
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('mynote-theme', newTheme);
            themeToggleBtn.textContent = newTheme === 'light' ? '🌙' : '☀️';
        });
    }

    if(settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if(settingsModal) settingsModal.classList.remove('hidden');
        });
    }

    if(closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            if(settingsModal) settingsModal.classList.add('hidden');
        });
    }

    if(saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            if(apiKeyInput) localStorage.setItem('mynote-gemini-key', apiKeyInput.value.trim());
            if(settingsModal) settingsModal.classList.add('hidden');
            alert('API 키가 저장되었습니다.');
        });
    }

    if(addNoteBtn) {
        addNoteBtn.addEventListener('click', () => openEditor());
    }

    if(cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', () => closeEditor());
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase();
            renderNotes();
        });
    }

    if(saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            if(!noteTitle || !noteContent) return;
            const title = noteTitle.value.trim();
            const content = noteContent.value.trim();

            if (!title && !content) {
                alert('제목이나 내용을 입력해주세요.');
                return;
            }

            const now = new Date();
            const note = {
                id: currentEditingId || Date.now().toString(),
                title: title || '제목 없음',
                content: content,
                updatedAt: now.toLocaleDateString('ko-KR') + ' ' + now.toLocaleTimeString('ko-KR', {hour12: false, hour: '2-digit', minute:'2-digit'})
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
    }

    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if(closeAiBtn) {
        closeAiBtn.addEventListener('click', () => {
            if(aiResponseArea) aiResponseArea.classList.add('hidden');
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) closeModal();
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });

    if(editFromModalBtn) {
        editFromModalBtn.addEventListener('click', () => {
            if (currentViewingNote) {
                openEditor(currentViewingNote);
                closeModal();
            }
        });
    }

    if(aiSummarizeBtn) {
        aiSummarizeBtn.addEventListener('click', () => {
            if (!currentViewingNote) return;
            const prompt = "다음 노트의 내용을 핵심만 3~4줄로 간결하게 요약해줘:\\n\\n제목: " + currentViewingNote.title + "\\n내용: " + currentViewingNote.content;
            fetchAI(prompt);
        });
    }

    if(aiOpinionBtn) {
        aiOpinionBtn.addEventListener('click', () => {
            if (!currentViewingNote) return;
            const prompt = "다음 노트의 내용을 읽고, 건설적인 피드백이나 새로운 아이디어, 또는 관련된 통찰을 제공해줘:\\n\\n제목: " + currentViewingNote.title + "\\n내용: " + currentViewingNote.content;
            fetchAI(prompt);
        });
    }

    // 5. 핵심 함수들
    function saveNotes() {
        localStorage.setItem('mynotes', JSON.stringify(notes));
    }

    function renderNotes() {
        try {
            if(!notesContainer) return;
            notesContainer.innerHTML = '';
            
            const filteredNotes = notes.filter(note => {
                if(!note) return false;
                const titleStr = typeof note.title === 'string' ? note.title : '';
                const contentStr = typeof note.content === 'string' ? note.content : '';
                return titleStr.toLowerCase().includes(currentSearchTerm) || 
                       contentStr.toLowerCase().includes(currentSearchTerm);
            });

            if (filteredNotes.length === 0) {
                if(emptyState) {
                    emptyState.classList.remove('hidden');
                    if (notes.length === 0) emptyState.textContent = '아직 작성된 노트가 없습니다.';
                    else emptyState.textContent = "'" + currentSearchTerm + "'에 대한 검색 결과가 없습니다.";
                }
            } else {
                if(emptyState) emptyState.classList.add('hidden');
                filteredNotes.forEach(note => {
                    const card = document.createElement('div');
                    card.className = 'note-card';
                    
                    const dateStr = note.updatedAt ? String(note.updatedAt).split(' ')[0] : '날짜 없음';
                    const titleStr = typeof note.title === 'string' ? note.title : '제목 없음';
                    const contentStr = typeof note.content === 'string' ? note.content : '';
                    
                    let htmlContent = "<h3>" + escapeHtml(titleStr) + "</h3>";
                    htmlContent += "<p>" + escapeHtml(contentStr) + "</p>";
                    htmlContent += "<div class='note-card-footer'>";
                    htmlContent += "<span>" + dateStr + "</span>";
                    htmlContent += "<button class='btn danger' onclick='deleteNote(event, \"" + note.id + "\")'>삭제</button>";
                    htmlContent += "</div>";
                    
                    card.innerHTML = htmlContent;
                    card.addEventListener('click', () => viewNote(note));
                    notesContainer.appendChild(card);
                });
            }
        } catch (e) {
            console.error("렌더링 에러:", e);
        }
    }

    window.deleteNote = (event, id) => {
        event.stopPropagation();
        if (confirm('이 노트를 삭제하시겠습니까?')) {
            notes = notes.filter(n => n && n.id !== id);
            saveNotes();
            renderNotes();
            closeModal();
        }
    };

    function viewNote(note) {
        currentViewingNote = note;
        if(modalTitle) modalTitle.textContent = note.title || '제목 없음';
        if(modalContent) modalContent.textContent = note.content || ''; 
        if(modalDate) modalDate.textContent = note.updatedAt || '날짜 없음';
        if(aiResponseArea) aiResponseArea.classList.add('hidden');
        if(viewModal) viewModal.classList.remove('hidden');
    }

    function closeModal() {
        if(viewModal) viewModal.classList.add('hidden');
        currentViewingNote = null;
    }

    function openEditor(note = null) {
        if (note) {
            currentEditingId = note.id;
            if(noteTitle) noteTitle.value = note.title || '';
            if(noteContent) noteContent.value = note.content || '';
        } else {
            currentEditingId = null;
            if(noteTitle) noteTitle.value = '';
            if(noteContent) noteContent.value = '';
        }
        if(noteEditor) noteEditor.classList.remove('hidden');
        if(noteTitle) noteTitle.focus();
        window.scrollTo(0, 0);
    }

    function closeEditor() {
        if(noteEditor) noteEditor.classList.add('hidden');
        currentEditingId = null;
    }

    // AI API Fetch
    async function fetchAI(promptText) {
        const apiKey = localStorage.getItem('mynote-gemini-key');
        if (!apiKey) {
            alert('AI 기능을 사용하려면 설정(⚙️)에서 API 키를 먼저 입력해주세요.');
            if(settingsModal) settingsModal.classList.remove('hidden');
            return;
        }

        if(aiResponseArea) aiResponseArea.classList.remove('hidden');
        if(aiResponseContent) aiResponseContent.innerHTML = '<i>AI가 답변을 생성하고 있습니다...</i>';
        if(aiSummarizeBtn) aiSummarizeBtn.disabled = true;
        if(aiOpinionBtn) aiOpinionBtn.disabled = true;

        try {
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const detailedMsg = (errorData && errorData.error && errorData.error.message) ? errorData.error.message : response.statusText;
                throw new Error('API 오류 (' + response.status + '): ' + detailedMsg);
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            
            if(aiResponseContent) {
                aiResponseContent.innerHTML = escapeHtml(text)
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
            }
        } catch (error) {
            if(aiResponseContent) {
                aiResponseContent.innerHTML = "<span style='color:var(--danger-color)'>에러 발생: " + error.message + "</span>";
            }
        } finally {
            if(aiSummarizeBtn) aiSummarizeBtn.disabled = false;
            if(aiOpinionBtn) aiOpinionBtn.disabled = false;
        }
    }

    function escapeHtml(unsafe) {
        if(!unsafe) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    renderNotes();
});