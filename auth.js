// Sistema de Diário Escolar - Versão Estável
document.addEventListener('DOMContentLoaded', function() {
    // 1. VERIFICAÇÃO INICIAL
    if (!firebase || !firebase.auth || !firebase.firestore) {
        console.error("Firebase não carregado corretamente!");
        alert("Erro: Firebase não foi carregado. Recarregue a página.");
        return;
    }

    // 2. ELEMENTOS DA UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');

    // 3. SISTEMA DE MENSAGENS À PROVA DE FALHAS
    const displayMessage = (text, type = "info") => {
        // Remove mensagens anteriores
        const oldMessages = document.querySelectorAll('.custom-message');
        oldMessages.forEach(msg => msg.remove());
        
        // Cria nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `custom-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-icon">${
                    type === 'success' ? '✓' : 
                    type === 'error' ? '✗' : 'i'
                }</span>
                <span>${text}</span>
            </div>
        `;
        
        // Estilos inline para garantir funcionamento
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            background: ${
                type === 'success' ? '#d4edda' :
                type === 'error' ? '#f8d7da' :
                '#d1ecf1'
            };
            color: ${
                type === 'success' ? '#155724' :
                type === 'error' ? '#721c24' :
                '#0c5460'
            };
            border: 1px solid ${
                type === 'success' ? '#c3e6cb' :
                type === 'error' ? '#f5c6cb' :
                '#bee5eb'
            };
            z-index: 1000;
            animation: fadeIn 0.3s;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remove após 5 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    };

    // 4. FUNÇÕES PRINCIPAIS
    const loadEntries = (userId) => {
        console.log(`Carregando anotações para: ${userId}`);
        entriesList.innerHTML = '<div class="loading">Carregando...</div>';

        db.collection("entries")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .onSnapshot(
                (snapshot) => {
                    console.log(`Dados recebidos: ${snapshot.size} itens`);
                    entriesList.innerHTML = '';
                    
                    snapshot.forEach(doc => {
                        const entry = doc.data();
                        const entryElement = document.createElement('div');
                        entryElement.className = 'entry';
                        entryElement.innerHTML = `
                            <h3>${entry.subject || 'Sem matéria'}</h3>
                            <p>${entry.content || 'Sem conteúdo'}</p>
                            <small>${entry.date || 'Sem data'}</small>
                            <button onclick="deleteEntry('${doc.id}')">Excluir</button>
                        `;
                        entriesList.appendChild(entryElement);
                    });
                },
                (error) => {
                    console.error("Erro ao carregar:", error);
                    displayMessage("Erro ao carregar anotações", "error");
                }
            );
    };

    // 5. EVENT LISTENERS
    auth.onAuthStateChanged(user => {
        console.log(`Estado alterado: ${user ? user.email : 'null'}`);
        
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
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error("Erro no login:", error);
            displayMessage(
                error.code === 'auth/wrong-password' ? 'Senha incorreta' :
                error.code === 'auth/user-not-found' ? 'Usuário não existe' :
                'Erro ao fazer login',
                "error"
            );
        }
    });

    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button');
        button.disabled = true;

        try {
            await db.collection("entries").add({
                date: e.target.entryDate.value,
                subject: e.target.entrySubject.value,
                content: e.target.entryContent.value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            });
            
            displayMessage("Anotação salva com sucesso!", "success");
            e.target.reset();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            displayMessage("Erro ao salvar anotação", "error");
        } finally {
            button.disabled = false;
        }
    });

    // 6. FUNÇÃO GLOBAL PARA EXCLUSÃO
    window.deleteEntry = async (id) => {
        if (confirm('Deseja excluir esta anotação?')) {
            try {
                await db.collection("entries").doc(id).delete();
                displayMessage("Anotação excluída!", "success");
            } catch (error) {
                console.error("Erro ao excluir:", error);
                displayMessage("Erro ao excluir", "error");
            }
        }
    };

    // 7. INICIALIZAÇÃO
    console.log("Sistema pronto");
    if (entryForm && entryForm.entryDate) {
        entryForm.entryDate.valueAsDate = new Date();
    }
});
