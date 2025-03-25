document.addEventListener('DOMContentLoaded', function() {
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');

    // Monitora estado de autenticação
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            authScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
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
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            showMessage(getErrorMessage(error));
        }
    });

    function showMessage(message) {
        authMessage.textContent = message;
        authMessage.classList.remove('hidden');
        setTimeout(() => authMessage.classList.add('hidden'), 3000);
    }

    function getErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email': return "E-mail inválido";
            case 'auth/user-not-found': return "Usuário não cadastrado";
            case 'auth/wrong-password': return "Senha incorreta";
            default: return "Erro ao fazer login";
        }
    }
});
