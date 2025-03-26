// Sistema de Diário de Classe Completo
document.addEventListener('DOMContentLoaded', function() {
    // 1. Verificação do Firebase
    if (!firebase || !firebase.auth || !firebase.firestore) {
        alert("Erro: Biblioteca Firebase não carregada. Recarregue a página.");
        return;
    }

    // 2. Elementos da UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');
    const userEmail = document.getElementById('userEmail');

    // 3. Sistema de Mensagens
    const showMessage = (text, type = "info") => {
        const oldMessages = document.querySelectorAll('.user-message');
        oldMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 400px;
            padding: 15px;
            border-radius: 8px;
            background: ${type === 'success' ? '#4CAF50' : 
                        type === 'error' ? '#F44336' : 
                        '#2196F3'};
            color: white;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: fadeIn 0.3s;
            font-size: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const icon = type === 'success' ? '✓' : 
                     type === 'error' ? '✗' : 
                     'ℹ️';
        
        messageDiv.innerHTML = `
            <span style="margin-right:12px;font-size:20px">${icon}</span>
            <span>${text}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    };

    // 4. Função para criar elementos de entrada
    const createEntryElement = (id, entry) => {
        const element = document.createElement('div');
        element.className = 'entry-card';
        element.innerHTML = `
            <div class="entry-header">
                <h3>${entry.subject || 'Sem disciplina'}</h3>
                <button onclick="deleteEntry('${id}')">Excluir</button>
            </div>
            <div class="entry-meta">
                <span><strong>Data:</strong> ${entry.date || 'Não especificada'}</span>
                <span><strong>Série:</strong> ${entry.grade || 'Não especificada'}</span>
                <span><strong>Professor:</strong> ${entry.teacher || 'Não especificado'}</span>
                <span><strong>Aulas:</strong> ${entry.classes || 1}</span>
            </div>
            <div class="entry-content">
                ${entry.content || 'Sem conteúdo'}
            </div>
        `;
        return element;
    };

    // 5. Carregar Anotações
    const loadEntries = (userId) => {
        entriesList.innerHTML = '<div style="text-align:center;padding:20px">Carregando...</div>';

        db.collection("entries")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .onSnapshot(
                (snapshot) => {
                    entriesList.innerHTML = '';
                    
                    if (snapshot.empty) {
                        entriesList.innerHTML = '<div class="no-entries">Nenhuma anotação encontrada</div>';
                        return;
                    }

                    snapshot.forEach(doc => {
                        entriesList.appendChild(createEntryElement(doc.id, doc.data()));
                    });
                },
                (error) => {
                    showMessage("Erro ao carregar anotações", "error");
                }
            );
    };

    // 6. Event Listeners
    auth.onAuthStateChanged(user => {
        if (user) {
            authScreen.style.display = 'none';
            mainScreen.style.display = 'block';
            userEmail.textContent = user.email;
            loadEntries(user.uid);
        } else {
            authScreen.style.display = 'block';
            mainScreen.style.display = 'none';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button');
        button.disabled = true;

        try {
            await auth.signInWithEmailAndPassword(
                e.target.email.value,
                e.target.password.value
            );
        } catch (error) {
            showMessage(
                error.code === 'auth/wrong-password' ? 'Senha incorreta' :
                error.code === 'auth/user-not-found' ? 'Usuário não existe' :
                'Erro ao fazer login',
                "error"
            );
        } finally {
            button.disabled = false;
        }
    });

    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        button.disabled = true;

        try {
            const newEntry = {
                date: document.getElementById('entryDate').value,
                grade: document.getElementById('entryGrade').value,
                subject: document.getElementById('entrySubject').value,
                teacher: document.getElementById('entryTeacher').value,
                classes: parseInt(document.getElementById('entryClasses').value),
                content: document.getElementById('entryContent').value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            };

            await db.collection("entries").add(newEntry);
            showMessage("Anotação salva com sucesso!", "success");
            entryForm.reset();
            document.getElementById('entryDate').valueAsDate = new Date();
        } catch (error) {
            showMessage("Erro ao salvar anotação", "error");
        } finally {
            button.disabled = false;
        }
    });

    // 7. Função Global para Exclusão
    window.deleteEntry = async (id) => {
        if (confirm('Deseja excluir esta anotação?')) {
            try {
                await db.collection("entries").doc(id).delete();
                showMessage("Anotação excluída com sucesso!", "success");
            } catch (error) {
                showMessage("Erro ao excluir anotação", "error");
            }
        }
    };

    // 8. Inicialização
    if (entryForm && entryForm.entryDate) {
        entryForm.entryDate.valueAsDate = new Date();
    }
});
