// Sistema completo de autenticação e diário - Versão 2.0
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Telas
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    
    // Elementos de login
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');
    const userEmail = document.getElementById('userEmail');
    
    // Elementos do diário
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');

    // Debug (pode remover depois que tudo estiver funcionando)
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

    function debugLog(message) {
        const p = document.createElement('p');
        p.textContent = message;
        debugConsole.appendChild(p);
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
        }
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

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
        auth.signOut();
    });

    // Salvar nova anotação
    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const button = e.target.querySelector('button[type="submit"]');
        const originalButtonText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        const newEntry = {
            date: document.getElementById('entryDate').value,
            subject: document.getElementById('entrySubject').value,
            content: document.getElementById('entryContent').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: auth.currentUser.uid
        };

        debugLog('Tentando salvar anotação: ' + JSON.stringify(newEntry));

        try {
            const docRef = await db.collection("entries").add(newEntry);
            debugLog(`Anotação salva com ID: ${docRef.id}`);
            entryForm.reset();
            document.getElementById('entryDate').valueAsDate = new Date();
        } catch (error) {
            debugLog(`Erro ao salvar: ${error.code} - ${error.message}`);
            showMessage("Erro ao salvar anotação!", "error");
        } finally {
            button.disabled = false;
            button.innerHTML = originalButtonText;
        }
    });

    // Carregar anotações
    function loadEntries(userId) {
        debugLog(`Carregando anotações para usuário: ${userId}`);
        entriesList.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i></div>';

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
            });

        return unsubscribe;
    }

    // Função auxiliar para criar elementos de anotação
    function createEntryElement(id, entry) {
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
    }

    // Formatar data
    function formatDate(date) {
        if (!date) return 'Data não disponível';
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Função global para deletar
    window.deleteEntry = async (entryId) => {
        if (confirm('Tem certeza que deseja excluir esta anotação?')) {
            try {
                debugLog(`Tentando excluir anotação: ${entryId}`);
                await db.collection("entries").doc(entryId).delete();
                debugLog(`Anotação ${entryId} excluída com sucesso`);
            } catch (error) {
                debugLog(`Erro ao excluir: ${error.message}`);
                showMessage("Erro ao excluir anotação!", "error");
            }
        }
    };

    // Mostrar mensagens
    function showAuthError(error) {
        let message = "Erro ao fazer login";
        
        switch (error.code) {
            case 'auth/invalid-email': message = "E-mail inválido"; break;
            case 'auth/user-not-found': message = "Usuário não encontrado"; break;
            case 'auth/wrong-password': message = "Senha incorreta"; break;
            case 'auth/too-many-requests': message = "Muitas tentativas. Tente mais tarde"; break;
            default: message = error.message;
        }

        showMessage(message, "error");
    }

    function showMessage(text, type) {
        const color = type === "error" ? "red" : "green";
        const icon = type === "error" ? "exclamation-circle" : "check-circle";
        
        authMessage.innerHTML = `
            <div class="inline-flex items-center bg-${color}-50 text-${color}-700 px-4 py-2 rounded-lg border border-${color}-200">
                <i class="fas fa-${icon} mr-2"></i> ${text}
            </div>
        `;
        authMessage.classList.remove('hidden');
        setTimeout(() => authMessage.classList.add('hidden'), 5000);
    }

    // Inicializa data atual
    document.getElementById('entryDate').valueAsDate = new Date();
    debugLog('Sistema iniciado. Aguardando autenticação...');
});
