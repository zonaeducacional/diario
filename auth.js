// Sistema completo de autenticação e diário
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

    // Monitora estado de autenticação
    auth.onAuthStateChanged(user => {
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
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            showAuthError(error);
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut();
    });

    // Salvar nova anotação
    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newEntry = {
            date: document.getElementById('entryDate').value,
            subject: document.getElementById('entrySubject').value,
            content: document.getElementById('entryContent').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: auth.currentUser.uid
        };

        try {
            await db.collection("entries").add(newEntry);
            entryForm.reset();
            document.getElementById('entryDate').valueAsDate = new Date(); // Reseta para data atual
        } catch (error) {
            console.error("Erro ao salvar:", error);
            showMessage("Erro ao salvar anotação!", "error");
        }
    });

    // Carregar anotações
    function loadEntries(userId) {
        db.collection("entries")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .onSnapshot(snapshot => {
                entriesList.innerHTML = '';
                
                if (snapshot.empty) {
                    entriesList.innerHTML = `
                        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                            <i class="fas fa-book-open text-blue-400 text-2xl mb-2"></i>
                            <p class="text-gray-500">Nenhuma anotação registrada ainda.</p>
                        </div>
                    `;
                    return;
                }

                snapshot.forEach(doc => {
                    const entry = doc.data();
                    const entryDate = entry.date || formatDate(entry.createdAt?.toDate());
                    
                    const entryElement = document.createElement('div');
                    entryElement.className = 'entry-card bg-white rounded-lg shadow-md p-5 border border-gray-100';
                    entryElement.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold text-lg text-gray-800">${entry.subject}</h4>
                                <p class="text-sm text-gray-500">
                                    <i class="far fa-calendar-alt mr-1"></i> ${entryDate}
                                </p>
                            </div>
                            <button onclick="deleteEntry('${doc.id}')" 
                                    class="text-red-500 hover:text-red-700 p-1">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <p class="mt-3 text-gray-700 whitespace-pre-line">${entry.content}</p>
                    `;
                    entriesList.appendChild(entryElement);
                });
            });
    }

    // Formatar data
    function formatDate(date) {
        if (!date) return '';
        return date.toLocaleDateString('pt-BR');
    }

    // Função global para deletar
    window.deleteEntry = async (entryId) => {
        if (confirm('Tem certeza que deseja excluir esta anotação?')) {
            try {
                await db.collection("entries").doc(entryId).delete();
            } catch (error) {
                console.error("Erro ao deletar:", error);
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
            <div class="inline-flex items-center bg-${color}-50 text-${color}-700 px-4 py-2 rounded">
                <i class="fas fa-${icon} mr-2"></i> ${text}
            </div>
        `;
        authMessage.classList.remove('hidden');
        setTimeout(() => authMessage.classList.add('hidden'), 5000);
    }

    // Inicializa data atual
    document.getElementById('entryDate').valueAsDate = new Date();
});
