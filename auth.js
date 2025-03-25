// Sistema completo de autenticação e diário
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');
    const userEmail = document.getElementById('userEmail');
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
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar anotação!");
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
                    entriesList.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma anotação registrada ainda.</p>';
                    return;
                }

                snapshot.forEach(doc => {
                    const entry = doc.data();
                    const entryDate = entry.date || new Date(entry.createdAt?.seconds * 1000).toLocaleDateString();
                    
                    const entryElement = document.createElement('div');
                    entryElement.className = 'p-4 border rounded-lg hover:bg-gray-50';
                    entryElement.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-bold">${entry.subject}</h4>
                                <p class="text-sm text-gray-500">${entryDate}</p>
                            </div>
                            <button onclick="deleteEntry('${doc.id}')" 
                                    class="text-red-500 hover:text-red-700">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        <p class="mt-2 text-gray-700">${entry.content}</p>
                    `;
                    entriesList.appendChild(entryElement);
                });
            });
    }

    // Função global para deletar
    window.deleteEntry = async (entryId) => {
        if (confirm('Tem certeza que deseja excluir esta anotação?')) {
            await db.collection("entries").doc(entryId).delete();
        }
    };

    // Mostra mensagens de erro
    function showAuthError(error) {
        let message = "Erro ao fazer login";
        
        switch (error.code) {
            case 'auth/invalid-email': message = "E-mail inválido"; break;
            case 'auth/user-not-found': message = "Usuário não encontrado"; break;
            case 'auth/wrong-password': message = "Senha incorreta"; break;
            case 'auth/too-many-requests': message = "Muitas tentativas. Tente mais tarde"; break;
            default: message = error.message;
        }

        authMessage.textContent = message;
        authMessage.classList.remove('hidden');
        setTimeout(() => authMessage.classList.add('hidden'), 5000);
    }
});
