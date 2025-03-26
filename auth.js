// Sistema de Autenticação e Diário - Versão Final
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Telas
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    
    // Elementos de login
    const loginForm = document.getElementById('loginForm');
    const userEmail = document.getElementById('userEmail');
    
    // Elementos do diário
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');

    // Debug Console
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
        console.log(message);
        const p = document.createElement('p');
        p.textContent = message;
        debugConsole.appendChild(p);
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }

    // Função para exibir mensagens
    function showMessage(text, type = "info") {
        const colors = {
            success: "green",
            error: "red",
            info: "blue"
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg border border-${colors[type]}-300 bg-${colors[type]}-50 text-${colors[type]}-700`;
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${text}</span>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    // Monitora estado de autenticação
    auth.onAuthStateChanged(user => {
        debugLog(`Estado de autenticação alterado: ${user ? user.email : 'null'}`);
        
        if (user) {
            authScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            userEmail.textContent = user.email;
            
            // Força refresh do token para garantir permissões
            user.getIdToken(true).then(() => {
                loadEntries(user.uid);
            });
        } else {
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

        try {
            debugLog(`Tentando login com: ${email}`);
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            debugLog(`Erro no login: ${error.code} - ${error.message}`);
            showMessage(formatAuthError(error), "error");
        }
    });

    // Formata erros de autenticação
    function formatAuthError(error) {
        switch (error.code) {
            case 'auth/invalid-email': return "E-mail inválido";
            case 'auth/user-not-found': return "Usuário não encontrado";
            case 'auth/wrong-password': return "Senha incorreta";
            case 'auth/too-many-requests': return "Muitas tentativas. Tente mais tarde";
            default: return error.message;
        }
    }

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
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        const entryDate = document.getElementById('entryDate').value;
        const entrySubject = document.getElementById('entrySubject').value.trim();
        const entryContent = document.getElementById('entryContent').value.trim();

        if (!entryDate || !entrySubject || !entryContent) {
            showMessage("Preencha todos os campos!", "error");
            button.disabled = false;
            button.innerHTML = originalText;
            return;
        }

        try {
            const newEntry = {
                date: entryDate,
                subject: entrySubject,
                content: entryContent,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: auth.currentUser.uid
            };

            debugLog('Tentando salvar: ' + JSON.stringify(newEntry));
            
            const docRef = await db.collection("entries").add(newEntry);
            debugLog(`Anotação salva com ID: ${docRef.id}`);
            
            showMessage("Anotação salva com sucesso!", "success");
            entryForm.reset();
            document.getElementById('entryDate').valueAsDate = new Date();
            
        } catch (error) {
            debugLog(`Erro ao salvar: ${error.code} - ${error.message}`);
            showMessage(`Falha ao salvar: ${error.message}`, "error");
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    });

    // Carregar anotações
    function loadEntries(userId) {
        debugLog(`Carregando anotações para usuário: ${userId}`);
        
        entriesList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
                <p class="mt-2 text-gray-500">Carregando suas anotações...</p>
            </div>
        `;

        const q = query(
            collection(db, "entries"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                debugLog(`Snapshot recebido. ${snapshot.size} documentos.`);
                
                if (snapshot.empty) {
                    entriesList.innerHTML = `
                        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                            <i class="fas fa-book-open text-blue-400 text-2xl mb-2"></i>
                            <p class="text-gray-500">Nenhuma anotação encontrada.</p>
                            <p class="text-sm text-gray-400 mt-2">Clique em "+ Nova Anotação" para começar</p>
                        </div>
                    `;
                    return;
                }

                entriesList.innerHTML = '';
                snapshot.docs.forEach(doc => {
                    const entry = doc.data();
                    const entryElement = createEntryElement(doc.id, entry);
                    entriesList.appendChild(entryElement);
                });
            },
            (error) => {
                debugLog(`Erro no listener: ${error.message}`);
                
                entriesList.innerHTML = `
                    <div class="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
                        <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
                        <p class="text-gray-700">Erro ao carregar anotações</p>
                        <button onclick="window.location.reload()" 
                                class="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                            Recarregar Página
                        </button>
                    </div>
                `;
            }
        );

        return unsubscribe;
    }

    // Criar elemento de anotação
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
                await deleteDoc(doc(db, "entries", entryId));
                showMessage("Anotação excluída com sucesso!", "success");
            } catch (error) {
                debugLog(`Erro ao excluir: ${error.message}`);
                showMessage("Erro ao excluir anotação!", "error");
            }
        }
    };

    // Inicializa data atual
    if (document.getElementById('entryDate')) {
        document.getElementById('entryDate').valueAsDate = new Date();
    }
    debugLog('Sistema iniciado. Aguardando autenticação...');
});
