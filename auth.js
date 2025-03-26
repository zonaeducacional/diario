document.addEventListener('DOMContentLoaded', function() {
    // 1. Verificação inicial do Firebase
    if (!firebase || !firebase.auth || !firebase.firestore) {
        alert("Erro: Firebase não carregado corretamente. Recarregue a página.");
        return;
    }

    // 2. Elementos da UI
    const auth = firebase.auth();
    const db = firebase.firestore();
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');
    const userEmail = document.getElementById('userEmail');

    // 3. Sistema de Mensagens Robustecido
    const showMessage = (text, type = "info") => {
        // Remove mensagens anteriores de forma segura
        const oldMessages = document.querySelectorAll('.user-message');
        if (oldMessages && oldMessages.forEach) {
            oldMessages.forEach(msg => {
                if (msg && msg.remove) msg.remove();
            });
        }

        // Cria nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        
        // Configuração de estilos
        const styles = {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: type === 'success' ? '#4CAF50' : 
                          type === 'error' ? '#F44336' : '#2196F3',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: '1000',
            fontSize: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        };

        // Aplica estilos
        Object.assign(messageDiv.style, styles);

        // Adiciona conteúdo
        const icon = type === 'success' ? '✓' : 
                    type === 'error' ? '✗' : 'ℹ️';
        
        messageDiv.innerHTML = `
            <span style="margin-right:12px;font-size:20px">${icon}</span>
            <span>${text}</span>
        `;

        // Adiciona ao DOM
        if (document.body) {
            document.body.appendChild(messageDiv);
            
            // Remove após 5 segundos
            setTimeout(() => {
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    if (messageDiv && messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }, 5000);
        }
    };

    // 4. Função de Login Reforçada
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button');
        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        // Validação básica
        if (!email || !password) {
            showMessage("Preencha todos os campos", "error");
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Verificação adicional
            if (userCredential && userCredential.user) {
                console.log("Login bem-sucedido:", userCredential.user.email);
            } else {
                throw new Error("Autenticação falhou");
            }
        } catch (error) {
            console.error("Erro de login:", error);
            
            let errorMessage = "Erro ao fazer login";
            if (error.code) {
                errorMessage = {
                    'auth/invalid-email': "Email inválido",
                    'auth/user-disabled': "Usuário desativado",
                    'auth/user-not-found': "Usuário não encontrado",
                    'auth/wrong-password': "Senha incorreta",
                    'auth/too-many-requests': "Muitas tentativas. Tente mais tarde"
                }[error.code] || errorMessage;
            }
            
            showMessage(errorMessage, "error");
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = 'Entrar';
            }
        }
    });

    // ... (restante do código permanece igual)
    // [Manter todas as outras funções como createEntryElement, loadEntries, etc.]
});
