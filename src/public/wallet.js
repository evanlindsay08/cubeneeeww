class WalletManager {
    constructor() {
        this.username = '';
        this.ws = null;
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        // Use secure WebSocket in production, regular in development
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        this.ws = new WebSocket(`${protocol}${window.location.host}`);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'status') {
                document.getElementById('userCount').textContent = data.content;
            } else if (data.type === 'message') {
                this.addMessageToChat(data);
            }
        };

        // Add error handling
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showNotification('Connection error. Please try again.');
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed. Attempting to reconnect...');
            setTimeout(() => this.initializeWebSocket(), 3000); // Retry connection after 3 seconds
        };
    }

    createInitialModal() {
        const modal = document.createElement('div');
        modal.className = 'wallet-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Choose Username</h3>
                <input type="text" id="usernameInput" placeholder="Enter username" maxlength="20" value="${this.username}">
                <div class="modal-buttons">
                    <button id="saveUsername">Save</button>
                    <button id="cancelUsername">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => {
            const input = document.getElementById('usernameInput');
            input?.focus();
            input?.select();
            modal.classList.add('show');
        }, 0);

        const handleSave = () => {
            const input = document.getElementById('usernameInput');
            const username = input?.value.trim();
            if (username) {
                this.setUsername(username);
                this.showNotification(`Username ${this.username ? 'updated' : 'set'}: ${username}`);
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        };

        const handleCancel = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        document.getElementById('saveUsername')?.addEventListener('click', handleSave);
        document.getElementById('cancelUsername')?.addEventListener('click', handleCancel);

        // Add enter key support
        const input = document.getElementById('usernameInput');
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSave();
            }
        });

        return modal;
    }

    async connect() {
        try {
            const modal = this.createInitialModal();
            return true;
        } catch (error) {
            console.error('Failed to show modal:', error);
            return false;
        }
    }

    setUsername(name) {
        this.username = name;
        const usernameBtn = document.querySelector('.connect-btn');
        if (usernameBtn) {
            usernameBtn.textContent = name;
        }
    }

    getUsername() {
        return this.username;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 0);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 600);
        }, 2000);
    }

    sendMessage(content) {
        if (!this.username) {
            this.showNotification('Please set a username first');
            this.connect();
            return;
        }

        // Update banned words/phrases list
        const bannedPhrases = [
            'rug', 'scam', 'bundle', 'fake', 'relaunch',
            'r3g', 'sc3m', 'f4ke',
            'dev sold', 'dev is jeet', 'dev is indian'
        ];
        
        // Check for banned phrases (case insensitive)
        const containsBannedPhrase = bannedPhrases.some(phrase => 
            content.toLowerCase().includes(phrase.toLowerCase())
        );

        if (containsBannedPhrase) {
            this.showNotification('Message contains prohibited words/phrases');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'message',
                username: this.username,
                content: content,
                timestamp: Date.now()
            };
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send message:', error);
                this.showNotification('Failed to send message. Please try again.');
                // Attempt to reconnect
                this.initializeWebSocket();
            }
        } else {
            this.showNotification('Connection lost. Reconnecting...');
            this.initializeWebSocket();
        }
    }

    addMessageToChat(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const time = new Date(message.timestamp).toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="user" style="color: ${message.userColor}">${message.username}</span>
                <span class="timestamp">${time}</span>
            </div>
            <div class="content">${message.content}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

window.walletManager = new WalletManager(); 