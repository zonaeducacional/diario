class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initAuthListeners();
    this.bindAuthUIEvents();
  }

  initAuthListeners() {
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      const authScreen = document.getElementById('authScreen');
      const mainContent = document.getElementById('mainContent');
      
      if (user) {
        authScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
        document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
      } else {
        authScreen.classList.remove('hidden');
        mainContent.classList.add('hidden');
      }
    });
  }

  bindAuthUIEvents() {
    // Alternar entre login/registro
    document.getElementById('loginTab').addEventListener('click', () => this.toggleForms('login'));
    document.getElementById('registerTab').addEventListener('click', () => this.toggleForms('register'));

    // Login
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      auth.signInWithEmailAndPassword(email, password)
        .then(() => this.showMessage('Login realizado!', 'success'))
        .catch((error) => this.handleAuthError(error));
    });

    // Registro
    document.getElementById('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;

      if (password !== confirmPassword) {
        this.showMessage('As senhas não coincidem!', 'error');
        return;
      }

      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
          this.showMessage('Conta criada com sucesso!', 'success');
          this.toggleForms('login');
        })
        .catch((error) => this.handleAuthError(error));
    });

    // Esqueceu a senha
    document.getElementById('forgotPassword').addEventListener('click', () => {
      const email = prompt("Digite seu e-mail para redefinir a senha:");
      if (email) {
        auth.sendPasswordResetEmail(email)
          .then(() => this.showMessage('E-mail de redefinição enviado!', 'success'))
          .catch((error) => this.handleAuthError(error));
      }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      auth.signOut()
        .then(() => this.showMessage('Logout realizado!', 'success'))
        .catch((error) => this.handleAuthError(error));
    });
  }

  toggleForms(activeForm) {
    if (activeForm === 'login') {
      document.getElementById('loginForm').classList.remove('hidden');
      document.getElementById('registerForm').classList.add('hidden');
      document.getElementById('loginTab').classList.add('border-blue-500', 'text-blue-600');
      document.getElementById('loginTab').classList.remove('text-gray-500');
      document.getElementById('registerTab').classList.remove('border-blue-500', 'text-blue-600');
      document.getElementById('registerTab').classList.add('text-gray-500');
    } else {
      document.getElementById('loginForm').classList.add('hidden');
      document.getElementById('registerForm').classList.remove('hidden');
      document.getElementById('registerTab').classList.add('border-blue-500', 'text-blue-600');
      document.getElementById('registerTab').classList.remove('text-gray-500');
      document.getElementById('loginTab').classList.remove('border-blue-500', 'text-blue-600');
      document.getElementById('loginTab').classList.add('text-gray-500');
    }
  }

  handleAuthError(error) {
    console.error("Erro:", error.code, error.message);
    let message = "Erro ao autenticar";
    
    switch (error.code) {
      case 'auth/invalid-email': message = "E-mail inválido"; break;
      case 'auth/user-not-found': message = "Usuário não encontrado"; break;
      case 'auth/wrong-password': 
        message = "Senha incorreta";
        document.getElementById('loginPassword').classList.add('shake');
        setTimeout(() => document.getElementById('loginPassword').classList.remove('shake'), 500);
        break;
      case 'auth/email-already-in-use': message = "E-mail já está em uso"; break;
      case 'auth/weak-password': message = "Senha muito fraca (mínimo 6 caracteres)"; break;
      default: message = error.message;
    }
    
    this.showMessage(message, 'error');
  }

  showMessage(text, type) {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.textContent = text;
    messageDiv.className = `mt-4 text-center text-sm ${type === 'error' ? 'text-red-500' : 'text-green-500'}`;
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
  }
}

// Inicialização
new AuthManager();
