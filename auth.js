// Sistema completo de autenticação e diário - Versão 2.1
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o Firebase está carregado
    if (!firebase || !firebase.auth || !firebase.firestore) {
        console.error("Firebase não foi carregado corretamente!");
        return;
    }

    // Inicializa Firebase
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Elementos da UI
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');
    const userEmail = document.getElementById('userEmail');
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');

    // Debug Console (remova em produção)
    const debugConsole = document.getElementById('debug-console') || createDebugConsole();
    
    function createDebugConsole() {
        const console = document.createElement('div');
        console.id = 'debug-console';
        console.style.cssText = `
            position: fixed; bottom: 0; right: 0; 
            background: rgba(0,0,0,0.8); color: white; 
            padding: 10px; z-index: 1000; 
            max-height: 200px; overflow: auto;
            font-family: monospace; width: 300px;
        `;
        document.body.appendChild(console);
        return console;
    }

    function debugLog(message) {
        console.log(message); // Também mostra no console normal
        const p = document.createElement('p');
        p.textContent = message;
        debugConsole.appendChild(p);
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }

    // Monitora estado de autenticação
    auth.onAuthStateChanged(user => {
        debugLog(`Estado de autenticação alterado: ${user ? user.email : 'null'}`);
        
        if (user) {
            // Usuário logado
            authScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            userEmail.textContent = user.email;
            loadEntries(user.uid);
        } else {
            // Usuário não logado
            authScreen.classList.remove('hidden');
            mainScreen.classList.add('hidden');
            entriesList.innerHTML = '';
        }
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showAuthError({ code: 'auth/missing-fields', message: 'Preencha todos os campos' });
            return;
        }

        try {
            debugLog(`Tentando login com: ${email}`);
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            debugLog(`Erro no login: ${error.code} - ${error.message}`);
            showAuthError(error);
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        debugLog('Usuário solicitou logout');
        auth.signOut().catch(error => {
            debugLog(`Erro no logout: ${error.message}`);
        });
    });

    // Salvar nova anotação
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const button = e.target.querySelector('button[type="submit"]');
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

        debugLog('Tentando salvar: ' + JSON.stringify(newEntry));
        
        // Adiciona com tratamento de erro específico
        await db.collection("entries").add(newEntry);
        showMessage("Anotação salva com sucesso!", "success");
        entryForm.reset();
        
    } catch (error) {
        debugLog(`Erro ao salvar: ${error.code} - ${error.message}`);
        
        if (error.code === 'permission-denied') {
            showMessage("Sem permissão para salvar. Recarregue a página e tente novamente.", "error");
        } else {
            showMessage("Erro ao salvar anotação", "error");
        }
    } finally {
        button.disabled = false;
        button.innerHTML = 'Salvar';
    }
});

    // Carregar anotações
    function loadEntries(userId) {
        debugLog(`Carregando anotações para usuário: ${userId}`);
        entriesList.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i></div>';

        try {
            const unsubscribe = db.collection("entries")
                .where("userId", "==", userId)
                .orderBy("createdAt", "desc")
                .onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
                    debugLog(`Snapshot recebido. ${snapshot.size} documentos.`);
                    
                    // Filtra apenas documentos confirmados pelo servidor
                    const confirmedDocs = snapshot.docs.filter(doc => !doc.metadata.hasPendingWrites);
                    
                    if (confirmedDocs.length === 0) {
                        entriesList.innerHTML = `
                            <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                                <i class="fas fa-book-open text-blue-400 text-2xl mb-2"></i>
                                <p class="text-gray-500">Nenhuma anotação encontrada.</p>
                            </div>
                        `;
                        return;
                    }

                    entriesList.innerHTML = '';
                    confirmedDocs.forEach(doc => {
                        const entry = doc.data();
                        const entryElement = createEntryElement(doc.id, entry);
                        entriesList.appendChild(entryElement);
                    });
                }, (error) => {
                    debugLog(`Erro no listener: ${error.message}`);
                    showMessage("Erro ao carregar anotações", "error");
                    
                    // Mostra mensagem específica para erro de índice
                    if (error.message.includes("requires an index")) {
                        entriesList.innerHTML = `
                            <div class="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-center">
                                <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-2"></i>
                                <p class="text-gray-700">Configuração incompleta no servidor.</p>
                                <p class="text-sm text-gray-500 mt-2">Por favor, aguarde alguns minutos ou contate o administrador.</p>
                            </div>
                        `;
                    }
                });

            return unsubscribe;
        } catch (error) {
            debugLog(`Erro ao configurar listener: ${error.message}`);
            showMessage("Erro ao carregar anotações", "error");
        }
    }

    // [Restante das funções auxiliares (createEntryElement, formatDate, deleteEntry, showAuthError, showMessage) permanecem iguais]
    // ... (inclua todas as outras funções do código original)

    // Inicializa data atual
    if (document.getElementById('entryDate')) {
        document.getElementById('entryDate').valueAsDate = new Date();
    }
    debugLog('Sistema iniciado. Aguardando autenticação...');
});
