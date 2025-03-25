// auth.js - Sistema completo de autenticação (ÚNICO NECESSÁRIO)
document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');
    const userEmail = document.getElementById('userEmail');

    // Monitora estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            authScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            userEmail.textContent = user.email;
            console.log("Usuário logado:", user.email);
        } else {
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
            showErrorMessage(error);
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut();
    });

    // Mostra mensagens de erro
    function showErrorMessage(error) {
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
