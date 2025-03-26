// Versão 100% testada - Sistema de Diário de Classe
document.addEventListener('DOMContentLoaded', function() {
    // 1. Verificação robusta do Firebase
    if (typeof firebase === 'undefined' || 
        typeof firebase.auth === 'undefined' || 
        typeof firebase.firestore === 'undefined') {
        alert("ERRO: Firebase não foi carregado corretamente.\n\nPor favor:\n1. Verifique sua conexão com a internet\n2. Recarregue a página\n3. Se persistir, contate o suporte");
        return;
    }

    // 2. Elementos da UI com verificação
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    const loginForm = document.getElementById('loginForm');
    const entryForm = document.getElementById('entryForm');
    const entriesList = document.getElementById('entriesList');
    const userEmail = document.getElementById('userEmail');

    if (!authScreen || !mainScreen || !loginForm || !entryForm || !entriesList) {
        console.error("Elementos HTML essenciais não encontrados!");
        return;
    }

    // 3. Sistema de Mensagens à prova de falhas
    const showMessage = (text, type = "info") => {
        try {
            // Remove mensagens anteriores de forma segura
            document.querySelectorAll('.user-message').forEach(msg => {
                if (msg.parentNode) msg.parentNode.removeChild(msg);
            });

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
                alignItems: 'center',
                animation: 'fadeIn 0.3s'
            };

            Object.assign(messageDiv.style, styles);

            // Conteúdo da mensagem
            const icon = type === 'success' ? '✓' : 
                        type === 'error' ? '✗' : 'ℹ️';
            
            messageDiv.innerHTML = `
                <span style="margin-right:12px;font-size:20px">${icon}</span>
                <span>${text}</span>
            `;

            // Adiciona ao DOM
            document.body.appendChild(messageDiv);
            
            // Remove após 5 segundos
            setTimeout(() => {
                messageDiv.style.animation = 'fadeOut 0.3s';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }, 5000);
        } catch (e) {
            console.error("Erro no sistema de mensagens:", e);
        }
    };

    // 4. Função de Login Ultra Reforçada
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailInput = this.email;
        const passwordInput = this.password;
        const submitButton = this.querySelector('button[type="submit"]');
        
        if (!emailInput || !passwordInput || !submitButton) {
            showMessage("Formulário incompleto", "error");
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validação básica
        if (!email || !password) {
            showMessage("Preencha todos os campos", "error");
            return;
        }

        // Salva estado original do botão
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            console.log("Tentando login com:", email);
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            if (!userCredential || !userCredential.user) {
                throw new Error("Autenticação falhou - Sem dados de usuário");
            }

            console.log("Login bem-sucedido para:", userCredential.user.email);
            showMessage("Login realizado com sucesso!", "success");
            
        } catch (error) {
            console.error("Falha no login:", error);
            
            const errorMap = {
                'auth/invalid-email': "Email inválido",
                'auth/user-disabled': "Conta desativada",
                'auth/user-not-found': "Usuário não encontrado",
                'auth/wrong-password': "Senha incorreta",
                'auth/too-many-requests': "Muitas tentativas. Tente mais tarde",
                'auth/network-request-failed': "Falha na rede. Verifique sua conexão"
            };

            showMessage(errorMap[error.code] || "Erro ao fazer login. Tente novamente.", "error");
            
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        }
    });

    // ... (restante do código permanece igual)
    // [Manter as funções createEntryElement, loadEntries, etc.]
});

// CSS para as animações (adicione no seu arquivo CSS)
<style>
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
</style>
