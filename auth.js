// Sistema de Diário Escolar - Versão Final Simplificada
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

    // 3. Sistema de Mensagens (sem console debug)
    const showMessage = (text, type = "info") => {
        // Remove mensagens anteriores
        const oldMessages = document.querySelectorAll('.user-message');
        oldMessages.forEach(msg => msg.remove());
        
        // Cria nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `user-message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            z-index: 1000;
            animation: fadeIn 0.3s;
            display: flex;
            align-items: center;
        `;
        
        messageDiv.innerHTML = `
            <span style="margin-right:8px">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'i'}
            </span>
            ${text}
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remove após 5 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    };

    // 4. Carregar Anotações
    const loadEntries = (userId) => {
        entriesList.innerHTML = '<div style="text-align:center;padding:20px">Carregando...</div>';

        db.collection("entries")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .onSnapshot(
                (snapshot) => {
                    entriesList.innerHTML = '';
                    
                    if (snapshot.empty) {
                        entriesList.innerHTML = '<div style="text-align:center;padding:20px">Nenhuma anotação encontrada</div>';
                        return;
                    }

                    snapshot.forEach(doc => {
                        const entry = doc.data();
                        const entryElement = document.createElement('div');
                        entryElement.style.cssText = `
                            background: #fff;
                            padding: 15px;
                            margin-bottom: 10px;
                            border-radius: 5px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        `;
                        entryElement.innerHTML = `
                            <h3 style="margin-top:0">${entry.subject || 'Sem matéria'}</h3>
                            <p>${entry.content || 'Sem conteúdo'}</p>
                            <small>${entry.date || 'Sem data'}</small>
                            <button onclick="deleteEntry('${doc.id}')" style="float:right">Excluir</button>
                        `;
                        entriesList.appendChild(entryElement);
                    });
                },
                (error) => {
                    showMessage("Erro ao carregar anotações", "error");
                }
            );
    };

    // 5. Event Listeners
    auth.onAuthStateChanged(user => {
        if (user) {
            authScreen.style.display = 'none';
            mainScreen.style.display = 'block';
            loadEntries(user.uid);
        } else {
            authScreen.style.display = 'block';
            mainScreen.style.display = 'none';
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
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
            await db.collection("entries").add({
                date: e.target.entryDate.value,
                subject: e.target.entrySubject.value,
                content: e.target.entryContent.value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            });
            
            showMessage("Anotação salva com sucesso!", "success");
            e.target.reset();
            e.target.entryDate.valueAsDate = new Date();
        } catch (error) {
            showMessage("Erro ao salvar anotação", "error");
        } finally {
            button.disabled = false;
        }
    });

    // 6. Função Global para Excluir
    window.deleteEntry = async (id) => {
        if (confirm('Deseja excluir esta anotação?')) {
            try {
                await db.collection("entries").doc(id).delete();
                showMessage("Anotação excluída!", "success");
            } catch (error) {
                showMessage("Erro ao excluir anotação", "error");
            }
        }
    };

    // 7. Inicialização
    if (entryForm && entryForm.entryDate) {
        entryForm.entryDate.valueAsDate = new Date();
    }
});
