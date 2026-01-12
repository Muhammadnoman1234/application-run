// State management
let state = {
    activeTab: 'feed',
    activeWing: 'standard',
    isModalOpen: false,
    currentOrder: null,
    user: JSON.parse(localStorage.getItem('c2c_user') || 'null'),
    db: {
        users: JSON.parse(localStorage.getItem('c2c_users') || '[]'),
        orders: JSON.parse(localStorage.getItem('c2c_orders') || '[]'),
        runners: JSON.parse(localStorage.getItem('c2c_runners') || '[]'),
        chats: JSON.parse(localStorage.getItem('c2c_chats') || '[]'),
        wallet: parseFloat(localStorage.getItem('c2c_wallet') || '450.00')
    }
};

// Handle Splash Screen
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) splash.classList.remove('active');
        if (state.user) {
            switchTab('feed');
        } else {
            switchTab('auth-choice');
        }
    }, 2500);
});

// Tab Switching
function switchTab(tabId) {
    // Hide Nav if on Auth screens
    const authScreens = ['splash', 'auth-choice', 'login', 'signup'];
    const nav = document.querySelector('.glass-nav');
    if (nav) nav.style.display = authScreens.includes(tabId) ? 'none' : 'flex';

    // Update Nav UI
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(`'${tabId}'`)) {
            item.classList.add('active');
        }
    });

    // Update Screen Visibility
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(tabId);
    if (targetScreen) targetScreen.classList.add('active');

    state.activeTab = tabId;

    // Refresh dynamic content
    if (tabId === 'chat') { checkAgentWelcome(); renderChats(); }
    if (tabId === 'orders') renderOrders();
    if (tabId === 'admin-dashboard') renderAdminDashboard();
    if (tabId === 'profile') renderProfile();

    // Re-create icons
    lucide.createIcons();
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('c2c_user');
    switchTab('auth-choice');
    showToast("Logged out successfully.");
}

// Auth Handlers
function handleSignup() {
    const name = document.getElementById('reg-name').value;
    const uni = document.getElementById('reg-uni').value;
    const id = document.getElementById('reg-id').value;
    const phone = document.getElementById('reg-phone').value;
    const pass = document.getElementById('reg-pass').value;

    if (!name || !id || !pass) {
        alert("Please fill all required fields!");
        return;
    }

    const newUser = { name, uni, id, phone, pass };
    state.db.users.push(newUser);
    localStorage.setItem('c2c_users', JSON.stringify(state.db.users));

    state.user = newUser;
    localStorage.setItem('c2c_user', JSON.stringify(newUser));

    showToast("Account Created! 🎓");
    switchTab('feed');
}

function handleLogin() {
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;

    const user = state.db.users.find(u => (u.id === id || u.phone === id) && u.pass === pass);

    if (user) {
        state.user = user;
        localStorage.setItem('c2c_user', JSON.stringify(user));
        showToast(`Welcome back, ${user.name}!`);
        switchTab('feed');
    } else if (id === "admin" && pass === "admin") {
        state.user = { name: "Developer", id: "admin", uni: "Technical" };
        switchTab('feed');
    } else {
        alert("Invalid credentials! Try signup.");
    }
}

// Wing Switching
function setWing(wing) {
    state.activeWing = wing;
    document.getElementById('btn-standard').classList.toggle('active', wing === 'standard');
    document.getElementById('btn-women').classList.toggle('active', wing === 'women');
    document.body.classList.toggle('women-wing-active', wing === 'women');

    const standardContent = document.querySelectorAll('.standard-content');
    const womenContent = document.querySelectorAll('.women-only-content');

    if (wing === 'women') {
        standardContent.forEach(el => el.style.display = 'none');
        womenContent.forEach(el => {
            el.style.display = 'block';
            el.classList.add('active');
        });
    } else {
        standardContent.forEach(el => el.style.display = 'block');
        womenContent.forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });
    }
}

function openOrderModal(itemName, itemPrice) {
    state.currentOrder = { name: itemName, price: itemPrice };
    document.getElementById('modal-title').innerText = `Deliver ${itemName}`;
    document.getElementById('total-price').innerText = `PKR ${itemPrice + 30}`;
    document.getElementById('order-modal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('active');
}

function confirmOrder() {
    const deptInput = document.getElementById('order-location');
    const dept = deptInput ? deptInput.value : '';

    if (!dept) {
        alert("Please enter your drop-off location!");
        return;
    }

    const total = state.currentOrder.price + 30;
    if (state.db.wallet < total) {
        alert("Insufficient Wallet Balance!");
        return;
    }

    const newOrder = {
        id: Date.now(),
        item: state.currentOrder.name,
        price: state.currentOrder.price,
        total: total,
        dept: dept,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Live',
        progress: 20
    };

    state.db.orders.push(newOrder);
    state.db.wallet -= total;

    localStorage.setItem('c2c_orders', JSON.stringify(state.db.orders));
    localStorage.setItem('c2c_wallet', state.db.wallet.toString());

    closeOrderModal();
    showToast(`Order Placed! PKR ${total} deducted.`);
    renderOrders();
}

function handleJoinSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('runner-name').value;
    const id = document.getElementById('runner-id').value;

    const newRunner = { name, id, date: new Date().toLocaleDateString() };
    state.db.runners.push(newRunner);
    localStorage.setItem('c2c_runners', JSON.stringify(state.db.runners));

    showToast(`Application Sent!`);
    setTimeout(() => {
        switchTab('profile');
        document.getElementById('runner-form').reset();
    }, 2000);
}

function handleAdminLogin(event) {
    event.preventDefault();
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;

    // Strict Admin Credential Check as requested
    // Strict Admin Credential Check as requested
    // Allows 'admin' OR 'Muhammad noman' as username
    if ((user === "Muhammad noman" || user === "admin") && pass === "Noman12345678@") {
        renderAdminDashboard();
        switchTab('admin-dashboard');
        showToast("Access Granted: Welcome Admin Noman");
    } else {
        alert("🔒 Unauthorized Access: This panel is restricted.");
    }
}

function renderAdminDashboard() {
    const oList = document.getElementById('admin-orders-list');
    const rList = document.getElementById('admin-runners-list');

    document.getElementById('total-orders-count').innerText = state.db.orders.length;

    // Simulate Random Locations for Runners
    const locations = ["NED Main Gate", "Student Cafe", "Library", "CS Dept", "Physics Lab", "Auditorium"];

    // Mock Runners if empty
    if (state.db.runners.length === 0) {
        state.db.runners = [
            { name: 'Ahmed', status: 'Active', loc: 'NED Cafe', battery: 85 },
            { name: 'Sarah', status: 'Delivering', loc: 'CS Dept', battery: 60 },
            { name: 'Bilal', status: 'Idle', loc: 'Main Gate', battery: 92 }
        ];
    }

    document.getElementById('total-runners-count').innerText = state.db.runners.length;

    // Render Runner Tracker
    const runnerListHTML = state.db.runners.map(r => `
        <div class="tracker-card">
            <div>
                <div style="font-weight:bold;">${r.name}</div>
                <div style="font-size:0.8rem; color:var(--text-dim);">📍 ${r.loc || locations[Math.floor(Math.random() * locations.length)]}</div>
            </div>
            <div style="text-align:right;">
                <div class="status-pill" style="background:${r.status === 'Active' ? 'var(--primary)' : '#333'}; color:${r.status === 'Active' ? '#000' : '#fff'}">${r.status}</div>
                <div style="font-size:0.75rem; margin-top:4px;">🔋 ${r.battery || 80}%</div>
            </div>
        </div>
    `).join('');

    const runnerContainer = document.getElementById('admin-runners-list');
    if (runnerContainer) runnerContainer.innerHTML = runnerListHTML;

    oList.innerHTML = state.db.orders.map(o => `
        <div class="adm-item glass" style="margin-bottom:10px; padding:10px; border-radius:10px; background:var(--card-bg);">
            <strong>${o.item}</strong> - ${o.status}
            <div style="font-size:0.8rem; color:var(--text-dim);">${o.dept}</div>
            <button onclick="deleteOrder(${o.id})" style="float:right; color:red; border:none; background:transparent;">Delete</button>
        </div>
    `).join('');
}

function deleteOrder(id) {
    state.db.orders = state.db.orders.filter(o => o.id !== id);
    localStorage.setItem('c2c_orders', JSON.stringify(state.db.orders));
    renderAdminDashboard();
}

function renderOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    container.innerHTML = state.db.orders.length ? state.db.orders.map(o => `
        <div class="order-card active" style="background:var(--card-bg); border:1px solid var(--glass); border-radius:24px; padding:20px; margin-bottom:16px; position:relative;">
            <div class="status-pill live" style="position:absolute; top:20px; right:20px;">${o.status}</div>
            <div class="order-info">
                <h4 style="font-size:1.2rem; margin-bottom:4px;">${o.item}</h4>
                <p style="color:var(--text-dim); font-size:0.9rem;">Drop-off: ${o.dept}</p>
                <div class="progress-bar" style="height:6px; background:var(--glass); border-radius:10px; margin:20px 0 10px 0;">
                    <div class="progress-fill" style="width:${o.progress}%; height:100%; background:var(--primary); border-radius:10px;"></div>
                </div>
            </div>
        </div>
    `).reverse().join('') : '<div style="text-align:center; padding:40px; color:var(--text-dim);">No active orders yet.</div>';
}

function renderProfile() {
    const nameEl = document.getElementById('profile-name');
    if (nameEl && state.user) nameEl.innerText = state.user.name;
    const walletEl = document.querySelector('.menu-link i[data-lucide="wallet"]')?.parentElement;
    if (walletEl) walletEl.innerHTML = `<i data-lucide="wallet"></i> My Wallet <span style="margin-left:auto; font-weight:800; color:var(--primary);">PKR ${state.db.wallet.toFixed(2)}</span>`;
    lucide.createIcons();
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    // User Message
    const newMsg = {
        text: msg,
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.db.chats.push(newMsg);
    localStorage.setItem('c2c_chats', JSON.stringify(state.db.chats));
    renderChats();
    input.value = '';

    // Agent Response
    setTimeout(() => {
        handleAgentResponse(msg);
    }, 1000);
}

// Enable Enter key to send
document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function handleAgentResponse(userMsg) {
    const lowerMsg = userMsg.toLowerCase();
    let replyText = "";
    let isHtml = false;

    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
        replyText = `👋 Hi! I'm your <b>Edrunner Bot</b>. How can I help?<br><br>
        1. <span class="chat-link" onclick="fillChat('Track Order')">📦 Track Order</span><br>
        2. <span class="chat-link" onclick="fillChat('Find Food')">🍔 Find Food</span><br>
        3. <span class="chat-link" onclick="fillChat('Contact Admin')">📞 Contact Admin</span>`;
        isHtml = true;
    } else if (lowerMsg.includes('order') || lowerMsg.includes('track')) {
        const lastOrder = state.db.orders[state.db.orders.length - 1];
        if (lastOrder) {
            replyText = `📦 Your order <b>${lastOrder.item}</b> is currenly: <span class="status-pill live">${lastOrder.status}</span>`;
            isHtml = true;
        } else {
            replyText = "You have no active orders. Check the 'Home' tab to crave something!";
        }
    } else if (lowerMsg.includes('food') || lowerMsg.includes('find')) {
        replyText = "🍔 Navigating you to the <b>Food Feed</b> to see the latest deals...";
        isHtml = true;
        setTimeout(() => switchTab('feed'), 1500);
    } else if (lowerMsg.includes('admin') || lowerMsg.includes('contact')) {
        replyText = "📞 Bringing you to WhatsApp Support...";
        setTimeout(startWhatsAppDeployment, 1500);
    } else if (lowerMsg.includes('menu')) {
        replyText = `🤖 <b>Bot Menu:</b><br>
        - Track Order<br>
        - Find Food<br>
        - Support`;
        isHtml = true;
    } else {
        replyText = "🤖 I didn't get that. Type 'Menu' to see options.";
    }

    const agentMsg = {
        text: replyText,
        sender: 'admin',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHtml: isHtml
    };

    state.db.chats.push(agentMsg);
    localStorage.setItem('c2c_chats', JSON.stringify(state.db.chats));
    renderChats();
}

function fillChat(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    input.focus();
}

function openWhatsApp() {
    const text = encodeURIComponent("Hello Edrunner! I need assistance with the app.");
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

let isRecording = false;
function startRecording() {
    const micBtn = document.querySelector('.mic-btn');
    const input = document.getElementById('chat-input');
    if (!isRecording) {
        isRecording = true;
        micBtn.classList.add('recording');
        input.placeholder = "Recording... (5s)";
        setTimeout(() => { if (isRecording) stopRecording(); }, 5000);
    } else {
        stopRecording();
    }
}

function stopRecording() {
    const micBtn = document.querySelector('.mic-btn');
    const input = document.getElementById('chat-input');
    isRecording = false;
    micBtn.classList.remove('recording');
    input.placeholder = "Ask 'Who is near Cafe?'...";

    const voiceMsg = {
        text: "🎤 Voice Message (0:04)",
        sender: 'user',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'voice'
    };
    state.db.chats.push(voiceMsg);
    localStorage.setItem('c2c_chats', JSON.stringify(state.db.chats));
    renderChats();
}

function renderChats() {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    chatContainer.innerHTML = state.db.chats.map(m => `
        <div class="chat-bubble ${m.sender === 'user' ? 'sent' : 'received'} ${m.type === 'voice' ? 'voice-bubble' : ''}">
            ${m.type === 'voice' ? '<i data-lucide="play"></i>' : ''} 
            ${m.isHtml ? m.text : m.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            <span class="chat-time">${m.time}</span>
        </div>
    `).join('');
    chatContainer.scrollTop = chatContainer.scrollHeight;
    lucide.createIcons();

    // Add event listeners for chat-links since they are dynamically added
    document.querySelectorAll('.chat-link').forEach(link => {
        link.style.color = 'var(--primary)';
        link.style.textDecoration = 'underline';
        link.style.cursor = 'pointer';
        link.style.fontWeight = 'bold';
    });
}

function triggerSOS() {
    if (confirm("🚨 EMERGENCY SOS?")) {
        showToast("SOS SENT! 🛡️");
    }
}

function rechargeWallet() {
    document.getElementById('topup-modal').classList.add('active');
}

function closeTopUpModal() {
    document.getElementById('topup-modal').classList.remove('active');
}

function processPayment(method) {
    let msg = `Enter Amount to Top Up via ${method}:`;
    if (method === 'EasyPaisa') {
        msg = `📲 Send to 0349-0872984\n\nEnter Amount to Top Up:`;
    }

    const amt = prompt(msg, "500");
    if (amt && !isNaN(amt)) {
        showToast("Processing Payment...");
        setTimeout(() => {
            state.db.wallet += parseFloat(amt);
            localStorage.setItem('c2c_wallet', state.db.wallet.toString());
            renderProfile();
            closeTopUpModal();
            showToast(`✅ PKR ${amt} added via ${method}!`);
        }, 1500);
    }
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (t) {
        t.innerText = msg;
        t.classList.add('active');
        setTimeout(() => t.classList.remove('active'), 3000);
    }
}


function checkAgentWelcome() {
    if (state.db.chats.length === 0) {
        state.db.chats.push({
            text: `🤖 <b>Agent Online:</b> Welcome to Edrunner! Select an option:<br><br>
             1. <span class="chat-link" onclick="fillChat('Track Order')">📦 Track Order</span><br>
             2. <span class="chat-link" onclick="fillChat('Find Food')">🍔 Find Food</span><br>
             3. <span class="chat-link" onclick="fillChat('Contact Admin')">📞 Contact Admin</span>`,
            sender: 'admin',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isHtml: true
        });
        localStorage.setItem('c2c_chats', JSON.stringify(state.db.chats));
    }
}

function startWhatsAppDeployment() {
    showToast("⚙️ Initiating WhatsApp Deployment...");
    setTimeout(() => {
        const text = encodeURIComponent("🚀 Deployment Request: I want to connect this Edrunner App to my WhatsApp Business Number. Please authorize.");
        window.open(`https://wa.me/?text=${text}`, '_blank');
        showToast("✅ Deployment Interface Opened!");
    }, 1500);
}

lucide.createIcons();
