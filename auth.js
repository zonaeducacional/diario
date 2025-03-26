// Sistema de Autenticação e Diário - Versão Final Corrigida
document.addEventListener('DOMContentLoaded', function() {
    // Verificação de inicialização do Firebase
    if (!firebase || !firebase.auth || !firebase.firestore) {
        console.error("Firebase não foi carregado corretamente!");
        return;
    }

    // Elementos da UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const userEmail = document.getElementById('userEmail');
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');

    // ======================
    // FUNÇÃO SHOWMESSAGE FIXA
    // ======================
    const showMessage = (text, type = "info") => {
        const colors = {
            success: "green",
            error: "red",
            info: "blue"
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 8px;
            background-color: ${type === 'success' ? '#d1fae5' : 
                           type === 'error' ? '#fee2e2' : '#dbeafe'};
            color: ${type === 'success' ? '#065f46' : 
                   type === 'error' ? '#b91c1c' : '#1e40af'};
            border: 1px solid ${type === 'success' ? '#a7f3d0' : 
                              type === 'error' ? '#fecaca' : '#bfdbfe'};
            z-index: 1000;
            display: flex;
            align-items: center;
        `;
        
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 'ℹ️';
        
        messageDiv.innerHTML = `${icon} <span style="margin-left: 10px;">${text}</span>`;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    };

    // ======================
    // FUNÇÕES AUXILIARES
    // ======================
    const debugLog = (message) => {
        console.log(message);
        if (!document.getElementById('debug-console')) {
            const debugConsole = document.createElement('div');
            debugConsole.id = 'debug-console';
            debugConsole.style.cssText = `
                position: fixed; bottom: 0; right: 0; 
                background: rgba(0,0,0,0.8); color: white; 
                padding: 10px; z-index: 1000; 
                max-height: 200px; overflow: auto;
                font-family: monospace; width: 300px;
            `;
            document.body.appendChild(debugConsole);
        }
        
        const p = document.createElement('p');
        p.textContent = message;
        document.getElementById('debug-console').appendChild(p);
    };

    const formatDate = (date) => {
        if (!date) return 'Data não disponível';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const createEntryElement = (id, entry) => {
        const element = document.createElement('div');
        element.className = 'entry-card bg-white rounded-lg shadow-md p-5 mb-4 hover:shadow-lg transition';
        element.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg text-gray-800">${entry.subject}</h3>
                    <p class="text-sm text-gray-500 mt-1">
                        <i class="far fa-calendar-alt mr-1"></i>
                        ${entry.date || formatDate(entry.createdAt?.toDate())}
                    </p>
                </div>
                <button onclick="deleteEntry('${id}')" 
                        class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div class="mt-3 text-gray-700 whitespace-pre-line">${entry.content}</div>
        `;
        return element;
    };

    // ======================
    // FUNÇÕES PRINCIPAIS
    // ======================
    const loadEntries = (userId) => {
        debugLog(`Carregando anotações para usuário: ${userId}`);
        entriesList.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i></div>';

        db.collection("entries")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .onSnapshot(
                (snapshot) => {
                    debugLog(`Snapshot recebido. ${snapshot.size} documentos.`);
                    
                    if (snapshot.empty) {
                        entriesList.innerHTML = `
                            <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                                <i class="fas fa-book-open text-blue-400 text-2xl mb-2"></i>
                                <p class="text-gray-500">Nenhuma anotação encontrada.</p>
                            </div>
                        `;
                        return;
                    }

                    entriesList.innerHTML = '';
                    snapshot.docs.forEach(doc => {
                        const entry = doc.data();
                        entriesList.appendChild(createEntryElement(doc.id, entry));
                    });
                },
                (error) => {
                    debugLog(`Erro no listener: ${error.message}`);
                    showMessage("Erro ao carregar anotações", "error");
                }
            );
    };

    // ======================
    // EVENT LISTENERS
    // ======================
    auth.onAuthStateChanged((user) => {
        debugLog(`Estado de autenticação alterado: ${user ? user.email : 'null'}`);
        
        if (user) {
            authScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            userEmail.textContent = user.email;
            loadEntries(user.uid);
        } else {
            authScreen.classList.remove('hidden');
            mainScreen.classList.add('hidden');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            debugLog(`Tentando login com: ${email}`);
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            debugLog(`Erro no login: ${error.code} - ${error.message}`);
            showMessage(
                error.code === 'auth/wrong-password' ? 'Senha incorreta' :
                error.code === 'auth/user-not-found' ? 'Usuário não encontrado' :
                'Erro ao fazer login',
                "error"
            );
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        debugLog('Usuário solicitou logout');
        auth.signOut();
    });

    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const button = e.target.querySelector('button[type="submit"]');
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            const newEntry = {
                date: document.getElementById('entryDate').value,
                subject: document.getElementById('entrySubject').value,
                content: document.getElementById('entryContent').value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            };

            debugLog(`Tentando salvar anotação: ${JSON.stringify(newEntry)}`);
            const docRef = await db.collection("entries").add(newEntry);
            debugLog(`Anotação salva com ID: ${docRef.id}`);
            
            showMessage("Anotação salva com sucesso!", "success");
            entryForm.reset();
            document.getElementById('entryDate').valueAsDate = new Date();
            
        } catch (error) {
            debugLog(`Erro ao salvar: ${error.message}`);
            showMessage("Erro ao salvar anotação", "error");
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    });

    // ======================
    // FUNÇÃO GLOBAL DELETE
    // ======================
    window.deleteEntry = async (entryId) => {
        if (confirm('Tem certeza que deseja excluir esta anotação?')) {
            try {
                await db.collection("entries").doc(entryId).delete();
                showMessage("Anotação excluída com sucesso!", "success");
            } catch (error) {
                debugLog(`Erro ao excluir: ${error.message}`);
                showMessage("Erro ao excluir anotação", "error");
            }
        }
    };

    // ======================
    // INICIALIZAÇÃO
    // ======================
    if (document.getElementById('entryDate')) {
        document.getElementById('entryDate').valueAsDate = new Date();
    }
    debugLog('Sistema iniciado. Aguardando autenticação...');
});
