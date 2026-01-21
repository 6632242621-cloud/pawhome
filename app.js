// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://pawhome.onrender.com/api';
let currentUserId = null; // จะถูกอัพเดตหลังจากล็อกอิน

// WebSocket Configuration
let socket = null;
let isSocketConnected = false;

// Initialize Socket.IO connection
function initializeSocket() {
    if (socket && isSocketConnected) return;
    
    const SOCKET_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://pawhome.onrender.com';
    
    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });

    socket.on('connect', () => {
        console.log('🔌 WebSocket Connected:', socket.id);
        isSocketConnected = true;
        
        // Join with user ID only if available
        if (currentUserId) {
            console.log('👤 Joining as user:', currentUserId);
            socket.emit('user:join', currentUserId);
        }
    });

    socket.on('connection:success', (data) => {
        console.log('✅ User joined successfully:', data);
    });

    socket.on('disconnect', () => {
        console.log('🔌 WebSocket Disconnected');
        isSocketConnected = false;
    });

    socket.on('connect_error', (error) => {
        console.error('❌ WebSocket Connection Error:', error);
        isSocketConnected = false;
    });

    // Listen for new messages
    socket.on('message:new', (message) => {
        console.log('📨 ===== NEW MESSAGE EVENT RECEIVED =====');
        console.log('📨 New message received:', message);
        console.log('📨 Message match_id:', message.match_id);
        console.log('📨 Message sender_id:', message.sender_id);
        console.log('📨 ======================================');
        handleNewMessage(message);
    });

    // Listen for new message notifications
    socket.on('notification:new_message', (data) => {
        console.log('🔔 ===== NOTIFICATION EVENT RECEIVED =====');
        console.log('🔔 New message notification:', data);
        console.log('🔔 Notification match_id:', data.match_id);
        console.log('🔔 ========================================');
        showNewMessageNotification(data);
    });

    // Listen for typing indicators
    socket.on('typing:user', (data) => {
        showTypingIndicator(data);
    });

    socket.on('typing:stop', (data) => {
        hideTypingIndicator(data);
    });

    socket.on('message:error', (data) => {
        console.error('❌ Message error:', data);
        alert(data.error);
    });
}

// Helper functions for socket
function handleNewMessage(message) {
    console.log('📨 Processing message:', message);
    console.log('Current match ID:', currentMatchId, 'Message match ID:', message.match_id);
    console.log('Sender ID:', message.sender_id, 'Current User ID:', currentUserId);
    console.log('Match ID check:', currentMatchId, '==', message.match_id, '=', currentMatchId == message.match_id);
    
    // If viewing this chat, add message to chat window (DON'T update badge)
    if (currentMatchId && message.match_id == currentMatchId) {
        console.log('✅ Adding message to current chat (no badge update)');
        addMessageToChat(message);
        return; // Don't update badge if we're in this chat
    }
    
    // If NOT in chat and NOT from current user, badge will be updated via notification event
    console.log('Not in this chat - badge will be updated by notification event');
}

function addMessageToChat(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const isSent = message.sender_id == currentUserId;
    const messageHTML = `
        <div class="message ${isSent ? 'sent' : ''}">
            ${!isSent ? `<img src="${currentChatUser.image}" alt="${message.sender_name}" class="message-avatar">` : ''}
            <div class="message-wrapper">
                <div class="message-content">${escapeHtml(message.message)}</div>
                <div class="message-time">${formatMessageTime(message.created_at)}</div>
            </div>
        </div>
    `;
    
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNewMessageNotification(data) {
    console.log('🔔 Notification received:', data);
    
    // Only show notification and badge if not in this chat
    if (currentMatchId !== data.match_id) {
        console.log('✅ Showing notification (not in this chat)');
        
        // Update unread count
        updateUnreadCount(data.match_id);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ข้อความใหม่จาก PawHome', {
                body: data.preview,
                icon: '/favicon.ico'
            });
        }
        
        // Play notification sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCyAzvLZiTYIGWi78OihUBAKUKbk77ZlHAY5kdfy0n0vBCN1xe/glEILFF+z6OuwVxQKRp/h8r1uIAUsgs/z2Ik1CBlouvHpoVAQClCm5O+2ZRwGOZHX8tJ9LwQjdcXv4JRCCxRfs+jrtFcUCkae4fK9biAFLILP89iJNQgZaLrx6aFQEApQpuTvtmUcBjmR1/LSfS8EI3XF7+CUQgsUX7Pn67RXFApGnuHyvW4gBSyCz/PYiTUIGWi68emeURIKUKTj77RnGwY5kdfy0n0vBCN1xe/glEILFF+z5+u0VxQKRp7h8r1uIAUsgs/z2Ik1CBlouvHpoVAQClCm5O+2ZRwGOZHX8tJ9LwQjdcXv4JRCCxRfs+frtFcUCkae4fK9biAFLILP89iJNQgZaLrx6aFQEApQpuTvtmUcBjmR1/LSfS8EI3XF7+CUQgsUX7Pn67RXFApGnuHyvW4gBSyCz/PYiTUIGWi68emeURIKUKTj77RnGwY5kdfy0n0vBCN1xe/glEILFF+z5+u0VxQKRp7h8r1uIAUsgs/z2Ik1CBlouvHpoVAQClCm5O+2ZRwGOZHX8tJ9LwQjdcXv4JRCCxRfs+frtFcUCkae4fK9biAFLILP89iJNQgZaLrx6aFQEApQpuTvtmUcBjmR1/LSfS8EI3XF7+CUQgsUX7Pn67RXFApGnuHyvW4gBSyCz/PYiTUIGWi68emeURIKUKTj77RnGwY5kdfy0n0vBCN1xe/glEILFF+z5+u0VxQKRp7h8r1uIAUsgs/z2Ik1CBlouvHpoVAQClCm5O+2ZRwGOZHX8tJ9LwQjdcXv4JRCCxRfs+frtFcUCkae4fK9biAFLILP89iJNQgZaLrx6aFQEApQpuTvtmUcBjmR1/LSfS8EI3XF7+CUQgsUX7Pn67RXFApGnuHyvW4gBSyCz/PYiTUIGWi68emeURIKUKTj77RnGwY5kdfy0n0vBCN1xe/glEILFF+z5+u0VxQKRp7h8r1uIAUsgs/z2Ik1CBlouvHpoVAQClCm5O+2ZRwGOZHX8tJ9LwQjdcXv4JRCCxRfs+frtFcUCkae4fK9biAFLILP89iJNQgZaLrx6aFQEApQpuTvtmUcBjmR1/LSfS8EI3XF7+CUQg==');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play prevented:', e));
        } catch (e) {
            console.log('Audio notification not supported:', e);
        }
    } else {
        console.log('⏭️ Skipping notification (already in this chat)');
    }
}

function updateUnreadCount(matchId) {
    console.log('📊 Updating unread count for match:', matchId);
    
    if (!unreadCounts[matchId]) {
        unreadCounts[matchId] = 0;
    }
    unreadCounts[matchId]++;
    
    console.log('📊 New unread count:', unreadCounts[matchId]);
    
    // อัพเดท badge ที่ match card
    const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
    console.log('🎯 Found match card:', matchCard);
    
    if (matchCard) {
        let badge = matchCard.querySelector('.unread-badge');
        if (badge) {
            badge.textContent = unreadCounts[matchId];
            console.log('✅ Updated existing badge');
        } else {
            badge = document.createElement('div');
            badge.className = 'unread-badge';
            badge.textContent = unreadCounts[matchId];
            matchCard.style.position = 'relative';
            matchCard.appendChild(badge);
            console.log('✅ Created new badge');
        }
    }
    
    // อัพเดท badge ที่ nav button
    updateNavBadge();
}

function updateNavBadge() {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    const matchesNav = document.querySelector('[data-page="matches"]');
    
    if (matchesNav) {
        let badge = matchesNav.querySelector('.notification-badge');
        
        if (totalUnread > 0) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'notification-badge';
                matchesNav.style.position = 'relative';
                matchesNav.appendChild(badge);
            }
            badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }
}

function showTypingIndicator(data) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'message';
    indicator.innerHTML = `
        <img src="${currentChatUser.image}" alt="${data.username}" class="message-avatar">
        <div class="message-wrapper">
            <div class="message-content" style="padding: 10px 16px;">
                <span class="typing-dots">
                    <span></span><span></span><span></span>
                </span>
            </div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator(data) {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Sample Data
let petFinderData = [
    {
        id: 1,
        name: "Luna",
        age: "2 ปี",
        breed: "Golden Retriever",
        image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500",
        tags: ["Friendly", "Vaccinated", "House-trained"],
        description: "น้องลูน่าเป็นน้องหมาที่เป็นมิตรมากๆ ชอบเล่นกับเด็กๆ และสัตว์เลี้ยงตัวอื่นๆ เหมาะกับครอบครัวที่มีเด็ก",
        caregiver: {
            name: "คุณสมชาย ใจดี",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
            location: "กรุงเทพมหานคร",
            phone: "081-234-5678",
            type: "Shelter",
            verified: true
        }
    },
    {
        id: 2,
        name: "Max",
        age: "3 ปี",
        breed: "Siberian Husky",
        image: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=500",
        tags: ["Active", "Vaccinated", "Trained"],
        description: "น้องแม็กซ์เป็นน้องหมาที่มีพลังงานสูง ชอบวิ่งเล่น เหมาะกับคนที่ชอบออกกำลังกาย",
        caregiver: {
            name: "มูลนิธิรักสัตว์",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
            location: "นนทบุรี",
            phone: "082-345-6789",
            type: "Foundation",
            verified: true
        }
    },
    {
        id: 3,
        name: "Mimi",
        age: "1 ปี",
        breed: "Persian Cat",
        image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500",
        tags: ["Calm", "Indoor", "Vaccinated"],
        description: "น้องมิมิเป็นแมวเปอร์เซียสีขาว สงบ ชอบนอนกลิ้งเล่น เหมาะกับการเลี้ยงในห้อง",
        caregiver: {
            name: "คุณมาลี รักแมว",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
            location: "สมุทรปราการ",
            phone: "089-456-7890",
            type: "Individual",
            verified: false
        }
    },
    {
        id: 4,
        name: "Coco",
        age: "4 เดือน",
        breed: "Beagle",
        image: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=500",
        tags: ["Playful", "Curious", "Vaccinated"],
        description: "น้องโคโค่ยังเป็นลูกหมา ขี้เล่น อยากรู้อยากเห็น เหมาะกับคนที่มีเวลาดูแล",
        caregiver: {
            name: "ฟาร์มสุนัข Happy Dogs",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
            location: "ปทุมธานี",
            phone: "083-567-8901",
            type: "Farm",
            verified: true
        }
    },
    {
        id: 5,
        name: "Simba",
        age: "2 ปี",
        breed: "Maine Coon",
        image: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=500",
        tags: ["Gentle", "Large", "Vaccinated"],
        description: "น้องซิมบ้าเป็นแมวพันธุ์เมนคูน ขนาดใหญ่แต่อ่อนโยน เป็นมิตรกับทุกคน",
        caregiver: {
            name: "คุณวิไล ชอบแมว",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
            location: "ชลบุรี",
            phone: "086-678-9012",
            type: "Individual",
            verified: true
        }
    }
];

const breedingData = [
    {
        id: 101,
        name: "Bella",
        age: "3 ปี",
        breed: "Golden Retriever",
        image: "https://images.unsplash.com/photo-1612536980122-c31e3a00f902?w=500",
        gender: "Female",
        healthCheck: {
            vaccinated: true,
            dewormed: true,
            healthCertificate: true,
            geneticTested: true
        },
        geneticMatch: 95,
        description: "น้องเบลล่าสายพันธุ์ดี มีประวัติครอบครัวชัดเจน สุขภาพแข็งแรง"
    },
    {
        id: 102,
        name: "Rocky",
        age: "4 ปี",
        breed: "German Shepherd",
        image: "https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=500",
        gender: "Male",
        healthCheck: {
            vaccinated: true,
            dewormed: true,
            healthCertificate: true,
            geneticTested: true
        },
        geneticMatch: 88,
        description: "น้องร็อคกี้เป็นสุนัขสายพันธุ์แท้ มีใบรับรอง สุขภาพแข็งแรง"
    },
    {
        id: 103,
        name: "Princess",
        age: "2 ปี",
        breed: "British Shorthair",
        image: "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=500",
        gender: "Female",
        healthCheck: {
            vaccinated: true,
            dewormed: true,
            healthCertificate: true,
            geneticTested: true
        },
        geneticMatch: 92,
        description: "น้องปริ้นเซสแมวบริติชชอตแฮร์สายพันธุ์ดี สุขภาพสมบูรณ์"
    }
];

const servicesData = [
    {
        id: 1,
        name: "Pawfect Grooming",
        type: "grooming",
        image: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=200",
        distance: "0.5 km",
        rating: 4.8,
        reviews: 124,
        category: "อาบน้ำ-ตัดขน"
    },
    {
        id: 2,
        name: "Happy Pets Clinic",
        type: "clinic",
        image: "https://images.unsplash.com/photo-1530041539828-114de669390e?w=200",
        distance: "1.2 km",
        rating: 4.9,
        reviews: 256,
        category: "คลินิกสัตว์แพทย์"
    },
    {
        id: 3,
        name: "Luxury Pet Hotel",
        type: "hotel",
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200",
        distance: "2.5 km",
        rating: 4.7,
        reviews: 89,
        category: "โรงแรมสัตว์เลี้ยง"
    },
    {
        id: 4,
        name: "Pet Spa & Wellness",
        type: "grooming",
        image: "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=200",
        distance: "0.8 km",
        rating: 4.6,
        reviews: 78,
        category: "อาบน้ำ-ตัดขน"
    },
    {
        id: 5,
        name: "24/7 Emergency Vet",
        type: "clinic",
        image: "https://images.unsplash.com/photo-1581888227599-779811939961?w=200",
        distance: "1.5 km",
        rating: 4.9,
        reviews: 312,
        category: "คลินิกสัตว์แพทย์"
    },
    {
        id: 6,
        name: "Cozy Pet Resort",
        type: "hotel",
        image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
        distance: "3.0 km",
        rating: 4.5,
        reviews: 67,
        category: "โรงแรมสัตว์เลี้ยง"
    }
];

const matchesData = [
    {
        id: 1,
        name: "Luna",
        image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=200",
        lastMessage: "Looking forward to meeting you! 🐾",
        time: "2 mins ago",
        unread: 2
    },
    {
        id: 2,
        name: "Max",
        image: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=200",
        lastMessage: "Thank you for your interest!",
        time: "1 hour ago",
        unread: 0
    },
    {
        id: 3,
        name: "Mimi",
        image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200",
        lastMessage: "Purr purr 😺",
        time: "Yesterday",
        unread: 1
    },
    {
        id: 4,
        name: "Bella",
        image: "https://images.unsplash.com/photo-1612536980122-c31e3a00f902?w=200",
        lastMessage: "Ready for breeding consultation",
        time: "2 days ago",
        unread: 0
    }
];

// Global Variables
let currentCardIndex = 0;
let currentBreedingIndex = 0;
let breedingPets = []; // เปลี่ยนจาก breedingData มาใช้ breedingPets แทน
let currentPet = null;
let likedPets = [];
let matchedPets = [];
let currentUser = null;
let userStats = {
    likes: 0,
    matches: 0,
    chats: 0
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Authentication Functions
function checkAuth() {
    const user = localStorage.getItem('pawHomeUser');
    if (user) {
        currentUser = JSON.parse(user);
        currentUserId = currentUser.id; // อัพเดต currentUserId จาก localStorage
        console.log('✅ User authenticated, ID:', currentUserId);
        showMainApp();
        initNotifications(); // เริ่มระบบ notifications ถ้ามี user อยู่แล้ว
        
        // Join socket after user is authenticated
        if (socket && isSocketConnected && currentUserId) {
            socket.emit('user:join', currentUserId);
        }
    } else {
        showAuthPage();
    }
}

function showAuthPage() {
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    // Always show login form by default
    showLogin();
}

function showMainApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize Socket.IO
    initializeSocket();
    
    // Initialize app components
    initNavigation();
    adjustNavigationByRole(); // Show admin/business menu based on role
    initPetFinder();
    initBreeding();
    initServices();
    initMatches();
    initChatInput();
    initProfile();
    initAdmin(); // Initialize admin panel
    initBusinessDashboard(); // Initialize business dashboard
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelector('.auth-logo').style.display = 'block'; // Show logo on login page
    window.history.pushState({ page: 'login' }, 'Login', '#login');
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.auth-logo').style.display = 'none'; // Hide logo on register page
    window.history.pushState({ page: 'register' }, 'Register', '#register');
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    const hash = window.location.hash;
    if (hash === '#register' || event.state?.page === 'register') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.querySelector('.auth-logo').style.display = 'none';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.querySelector('.auth-logo').style.display = 'block';
    }
});

// Initialize on page load
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash === '#register') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    } else {
        // Default to login
        window.history.replaceState({ page: 'login' }, 'Login', '#login');
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            currentUserId = result.user.id; // อัพเดต currentUserId ด้วย
            console.log('✅ Login successful, User ID:', currentUserId);
            localStorage.setItem('pawHomeUser', JSON.stringify(result.user));
            alert('เข้าสู่ระบบสำเร็จ!');
            showMainApp();
            initNotifications(); // เริ่มระบบ notifications หลัง login
            
            // Join socket after login
            if (socket && isSocketConnected && currentUserId) {
                socket.emit('user:join', currentUserId);
            }
        } else {
            alert(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const role = document.getElementById('registerRole').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validation
    if (!role) {
        alert('กรุณาเลือกประเภทผู้ใช้งาน');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('รหัสผ่านไม่ตรงกัน');
        return;
    }
    
    if (password.length < 6) {
        alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: name,
                email: email,
                password: password,
                role: role
            })
        });
        
        const text = await response.text();
        console.log('API Response:', text);
        
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            alert('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาเปิด Console (F12) เพื่อดูรายละเอียด');
            return;
        }
        
        if (result.success) {
            currentUser = result.user;
            currentUserId = result.user.id; // อัพเดต currentUserId ด้วย
            localStorage.setItem('pawHomeUser', JSON.stringify(result.user));
            alert('ลงทะเบียนสำเร็จ!');
            showMainApp();
            initNotifications(); // เริ่มระบบ notifications หลัง register
        } else {
            alert(result.message || 'ลงทะเบียนไม่สำเร็จ');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
    }
}

function handleLogout() {
    if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('pawHomeUser');
        currentUser = null;
        userStats = { likes: 0, matches: 0, chats: 0 };
        
        // Clear profile image
        const avatarContainer = document.querySelector('.profile-avatar');
        if (avatarContainer) {
            const existingImg = avatarContainer.querySelector('img');
            if (existingImg) {
                existingImg.remove();
            }
            const icon = avatarContainer.querySelector('i');
            if (icon) {
                icon.style.display = 'block';
            }
        }
        
        showAuthPage();
    }
}

// Profile Functions
async function initProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileEmailInfo').textContent = currentUser.email;
    
    // Display role
    const roleText = getRoleDisplayName(currentUser.role);
    document.getElementById('profileRoleText').textContent = roleText;
    
    // Generate role-based quick actions
    generateQuickActions(currentUser.role);
    
    // Load user profile data
    await loadUserProfile();
    
    // Load stats from localStorage
    const savedStats = localStorage.getItem('pawHomeStats_' + currentUser.email);
    if (savedStats) {
        userStats = JSON.parse(savedStats);
    }
    
    updateStats();
}

function getRoleDisplayName(role) {
    const roleNames = {
        'pet-owner': '🐾 Pet Owner - เจ้าของ/ผู้ต้องการสัตว์เลี้ยง',
        'caregiver': '❤️ Caregiver/Rescuer - ผู้ดูแล/ช่วยเหลือสัตว์',
        'business': '🏪 Business - เจ้าของร้าน/ผู้ให้บริการ'
    };
    return roleNames[role] || 'User';
}

function generateQuickActions(role) {
    const quickActionsContainer = document.getElementById('quickActions');
    let actions = [];
    
    switch(role) {
        case 'pet-owner':
            // Pet Owner: รวมฟีเจอร์หาสัตว์, ใช้บริการ, หาคู่ผสมพันธุ์
            actions = [
                { icon: 'fa-paw', text: 'หาสัตว์เลี้ยง', class: 'primary', page: 'pet-finder' },
                { icon: 'fa-heart', text: 'หาคู่ผสมพันธุ์', class: 'warning', page: 'breeding' },
                { icon: 'fa-store', text: 'หาบริการ', class: 'info', page: 'services' },
                { icon: 'fa-bookmark', text: 'รายการที่บันทึก', class: 'success', action: 'savedItems' },
                { icon: 'fa-history', text: 'ประวัติ', class: 'primary', action: 'history' },
                { icon: 'fa-star', text: 'รีวิวของฉัน', class: 'warning', action: 'myReviews' },
                { icon: 'fa-dna', text: 'ตรวจพันธุกรรม', class: 'info', action: 'genetic' },
                { icon: 'fa-calendar-check', text: 'นัดหมาย', class: 'success', action: 'appointments' }
            ];
            break;
            
        case 'caregiver':
            // Caregiver/Rescuer: รวมฟีเจอร์หาบ้านให้สัตว์ + ช่วยเหลือสัตว์จร
            actions = [
                { icon: 'fa-plus-circle', text: 'ลงประกาศสัตว์', class: 'primary', action: 'addPet' },
                { icon: 'fa-camera', text: 'รายงานสัตว์จร', class: 'warning', action: 'reportStray' },
                { icon: 'fa-list', text: 'สัตว์ของฉัน', class: 'success', action: 'myPets' },
                { icon: 'fa-map-marked-alt', text: 'แผนที่สัตว์จร', class: 'info', action: 'strayMap' },
                { icon: 'fa-hands-helping', text: 'ขอความช่วยเหลือ', class: 'warning', action: 'requestHelp' },
                { icon: 'fa-chart-line', text: 'สถิติ', class: 'primary', action: 'stats' },
                { icon: 'fa-hospital', text: 'คลินิกใกล้เคียง', class: 'success', page: 'services' },
                { icon: 'fa-comments', text: 'ข้อความ', class: 'info', page: 'matches' }
            ];
            break;
            
        case 'business':
            // Business: จัดการร้าน, สินค้า, ยอดขาย
            actions = [
                { icon: 'fa-store-alt', text: 'จัดการร้าน', class: 'primary', action: 'manageShop' },
                { icon: 'fa-box-open', text: 'สินค้า/บริการ', class: 'success', action: 'products' },
                { icon: 'fa-chart-bar', text: 'รายงานยอดขาย', class: 'info', action: 'salesReport' },
                { icon: 'fa-comments-dollar', text: 'คำสั่งซื้อ', class: 'warning', action: 'orders' },
                { icon: 'fa-users', text: 'ลูกค้า', class: 'primary', action: 'customers' },
                { icon: 'fa-percentage', text: 'โปรโมชั่น', class: 'success', action: 'promotions' },
                { icon: 'fa-star', text: 'รีวิว', class: 'warning', action: 'reviews' },
                { icon: 'fa-cog', text: 'ตั้งค่า', class: 'info', action: 'settings' }
            ];
            break;
    }
    
    quickActionsContainer.innerHTML = actions.map(action => `
        <button class="action-card ${action.class}" onclick="${action.page ? `switchToPage('${action.page}')` : `handleAction('${action.action}')`}">
            <i class="fas ${action.icon}"></i>
            <span>${action.text}</span>
        </button>
    `).join('');
}

function switchToPage(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageName) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(pageName).classList.add('active');
}

function handleAction(actionName) {
    // Create modal for detailed actions
    showActionModal(actionName);
}

async function showActionModal(actionName) {
    // Load my pets data if needed
    let myPetsHtml = '';
    if (actionName === 'myPets') {
        try {
            const response = await fetch(`${API_BASE_URL}/pets/my-pets/${currentUserId}`);
            const result = await response.json();
            
            if (result.success && result.pets && result.pets.length > 0) {
                myPetsHtml = result.pets.map(pet => `
                    <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                        <img src="${pet.image_url}" style="width: 80px; height: 80px; border-radius: 10px; object-fit: cover;">
                        <div style="flex: 1;">
                            <strong style="font-size: 16px;">${pet.name}</strong><br>
                            <small style="color: #7f8c8d;">${pet.breed} • ${pet.age}</small><br>
                            <span style="display: inline-block; margin-top: 5px; padding: 4px 12px; background: ${pet.status === 'available' ? '#4ECDC4' : '#95a5a6'}; color: white; border-radius: 12px; font-size: 12px;">
                                ${pet.status === 'available' ? 'เปิดหาบ้าน' : pet.status === 'adopted' ? 'หาบ้านแล้ว' : 'ปิดประกาศ'}
                            </span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="editMyPet(${pet.id})" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                <i class="fas fa-edit"></i> แก้ไข
                            </button>
                            <button onclick="deleteMyPet(${pet.id})" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                myPetsHtml = `
                    <div style="text-align: center; padding: 40px; color: #95a5a6;">
                        <i class="fas fa-paw" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p>ยังไม่มีสัตว์เลี้ยงที่ลงประกาศ</p>
                        <button onclick="closeActionModal(); showAddPetModal();" style="margin-top: 15px; padding: 12px 30px; background: #FF6B6B; color: white; border: none; border-radius: 10px; cursor: pointer;">
                            <i class="fas fa-plus"></i> เพิ่มสัตว์เลี้ยง
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading my pets:', error);
            myPetsHtml = '<p style="color: #e74c3c; text-align: center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        }
    }
    
    const actionDetails = {
        'savedItems': {
            title: 'รายการที่บันทึก',
            icon: 'fa-bookmark',
            content: `
                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 15px;">สัตว์เลี้ยงที่ถูกใจ (${likedPets.length})</h4>
                    ${likedPets.length > 0 ? likedPets.map(pet => `
                        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                            <img src="${pet.image}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover;">
                            <div>
                                <strong>${pet.name}</strong><br>
                                <small>${pet.breed}</small>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: #95a5a6; padding: 20px;">ยังไม่มีรายการ</p>'}
                    
                    <h4 style="margin: 20px 0 15px;">บริการที่บันทึก</h4>
                    <p style="text-align: center; color: #95a5a6; padding: 20px;">ยังไม่มีรายการ</p>
                </div>
            `
        },
        'customers': {
            title: 'ลูกค้า',
            icon: 'fa-users',
            content: `
                <p>รายชื่อลูกค้าของคุณ</p>
                <div style="margin-top: 20px;">
                    <div style="display: flex; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                        <i class="fas fa-user-circle" style="font-size: 40px; color: #667eea;"></i>
                        <div style="flex: 1;">
                            <strong>คุณสมชาย ใจดี</strong>
                            <p style="color: #7f8c8d; margin: 5px 0;">ลูกค้าประจำ - 12 ครั้ง</p>
                            <small style="color: #95a5a6;">เข้าใช้บริการล่าสุด: 25 ธ.ค. 2025</small>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                        <i class="fas fa-user-circle" style="font-size: 40px; color: #4ECDC4;"></i>
                        <div style="flex: 1;">
                            <strong>คุณมาลี รักสัตว์</strong>
                            <p style="color: #7f8c8d; margin: 5px 0;">ลูกค้าใหม่ - 3 ครั้ง</p>
                            <small style="color: #95a5a6;">เข้าใช้บริการล่าสุด: 28 ธ.ค. 2025</small>
                        </div>
                    </div>
                </div>
            `
        },
        'promotions': {
            title: 'โปรโมชั่น',
            icon: 'fa-percentage',
            content: `
                <p>จัดการโปรโมชั่นและส่วนลด</p>
                <div style="margin-top: 20px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 15px;">
                        <h3 style="margin: 0 0 10px;">ส่วนลดปีใหม่ 20%</h3>
                        <p style="margin: 5px 0; opacity: 0.9;">ใช้ได้ถึง 31 ม.ค. 2026</p>
                        <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold;">
                            NEWYEAR2026
                        </div>
                    </div>
                    <button onclick="alert('สร้างโปรโมชั่นใหม่')" style="width: 100%; padding: 12px; background: #FF6B6B; color: white; border: none; border-radius: 10px; cursor: pointer;">+ สร้างโปรโมชั่นใหม่</button>
                </div>
            `
        },
        'reviews': {
            title: 'รีวิวร้าน',
            icon: 'fa-star',
            content: `
                <div style="margin-top: 20px;">
                    <div style="background: linear-gradient(135deg, #FFE66D 0%, #f39c12 100%); color: #333; padding: 20px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; font-weight: bold;">4.8</div>
                        <div style="color: #f39c12; font-size: 24px;">★★★★★</div>
                        <div style="margin-top: 5px;">จาก 156 รีวิว</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong>คุณสมชาย</strong>
                            <span style="color: #f39c12;">★★★★★</span>
                        </div>
                        <p style="color: #7f8c8d;">บริการดีมากครับ พนักงานใจดี น้องหมาชอบมาก!</p>
                        <small style="color: #95a5a6;">25 ธันวาคม 2025</small>
                    </div>
                </div>
            `
        },
        'settings': {
            title: 'ตั้งค่าร้าน',
            icon: 'fa-cog',
            content: `
                <div style="margin-top: 20px;">
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px;">เวลาทำการ</h4>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>จันทร์ - ศุกร์</span>
                                <span>09:00 - 18:00</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>เสาร์ - อาทิตย์</span>
                                <span>10:00 - 17:00</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px;">การแจ้งเตือน</h4>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <span>ออเดอร์ใหม่</span>
                                <input type="checkbox" checked>
                            </label>
                            <label style="display: flex; justify-content: space-between; align-items: center;">
                                <span>รีวิวใหม่</span>
                                <input type="checkbox" checked>
                            </label>
                        </div>
                    </div>
                    
                    <button onclick="alert('บันทึกการตั้งค่า')" style="width: 100%; padding: 15px; background: #4ECDC4; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">บันทึกการตั้งค่า</button>
                </div>
            `
        },
        'showLiked': {
            title: 'รายการสัตว์ที่ถูกใจ',
            icon: 'fa-heart',
            content: `
                <p>รายการสัตว์เลี้ยงที่คุณกดถูกใจทั้งหมด (${likedPets.length} รายการ)</p>
                <div style="margin-top: 20px;">
                    ${likedPets.length > 0 ? likedPets.map(pet => `
                        <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                            <img src="${pet.image}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover;">
                            <div>
                                <strong>${pet.name}</strong><br>
                                <small>${pet.breed}</small>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: #95a5a6;">ยังไม่มีรายการ</p>'}
                </div>
            `
        },
        'addPet': {
            title: 'เพิ่มโปรไฟล์สัตว์เลี้ยง',
            icon: 'fa-plus-circle',
            content: `
                <p>ลงประกาศหาบ้านให้น้องๆ</p>
                <form style="margin-top: 20px;">
                    <input type="text" placeholder="ชื่อสัตว์เลี้ยง" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <input type="text" placeholder="พันธุ์" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <input type="number" placeholder="อายุ (ปี)" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <textarea placeholder="รายละเอียด" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; height: 80px; margin-bottom: 10px;"></textarea>
                    <button type="button" onclick="alert('บันทึกข้อมูลเรียบร้อย!')" style="width: 100%; padding: 15px; background: #FF6B6B; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">บันทึก</button>
                </form>
            `
        },
        'myPets': {
            title: 'สัตว์เลี้ยงของฉัน',
            icon: 'fa-list',
            content: `
                <p>จัดการสัตว์เลี้ยงที่ลงประกาศ</p>
                <div style="margin-top: 20px;">
                    ${myPetsHtml}
                </div>
            `
        },
        'stats': {
            title: 'สถิติการเข้าชม',
            icon: 'fa-chart-line',
            content: `
                <div style="margin-top: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 15px;">
                        <div style="font-size: 36px; font-weight: bold;">1,234</div>
                        <div>การเข้าชมทั้งหมด</div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #FF6B6B;">56</div>
                            <div style="color: #7f8c8d; font-size: 14px;">วันนี้</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #4ECDC4;">342</div>
                            <div style="color: #7f8c8d; font-size: 14px;">สัปดาห์นี้</div>
                        </div>
                    </div>
                </div>
            `
        },
        'reportStray': {
            title: 'รายงานสัตว์จร',
            icon: 'fa-camera',
            content: `
                <p>พบสัตว์จรและต้องการความช่วยเหลือ</p>
                <form style="margin-top: 20px;">
                    <select style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                        <option>สุนัข</option>
                        <option>แมว</option>
                        <option>อื่นๆ</option>
                    </select>
                    <input type="text" placeholder="ตำแหน่งที่พบ" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <textarea placeholder="รายละเอียด (สภาพ, อาการบาดเจ็บ)" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; height: 80px; margin-bottom: 10px;"></textarea>
                    <label style="display: block; padding: 30px; border: 2px dashed #ecf0f1; border-radius: 10px; text-align: center; cursor: pointer; margin-bottom: 10px;">
                        <i class="fas fa-camera" style="font-size: 32px; color: #95a5a6;"></i>
                        <div style="margin-top: 10px; color: #7f8c8d;">อัพโหลดรูปภาพ</div>
                    </label>
                    <button type="button" onclick="alert('รายงานเรียบร้อย! ทีมงานจะติดต่อกลับเร็วๆ นี้')" style="width: 100%; padding: 15px; background: #FF6B6B; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">ส่งรายงาน</button>
                </form>
            `
        },
        'strayMap': {
            title: 'แผนที่สัตว์จร',
            icon: 'fa-map-marked-alt',
            content: `
                <p>จุดที่พบสัตว์จรในพื้นที่ใกล้เคียง</p>
                <div style="margin-top: 20px; background: #f8f9fa; height: 300px; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: #95a5a6;">
                    <div style="text-align: center;">
                        <i class="fas fa-map" style="font-size: 64px; margin-bottom: 15px;"></i>
                        <p>แผนที่จะแสดงที่นี่</p>
                        <small>รองรับ Google Maps API</small>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <div style="display: flex; gap: 10px; padding: 12px; background: #fff3cd; border-radius: 10px; margin-bottom: 10px;">
                        <i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>
                        <div>
                            <strong>รายงานล่าสุด</strong><br>
                            <small>สุนัขจรที่ถนนสุขุมวิท - 5 นาทีที่แล้ว</small>
                        </div>
                    </div>
                </div>
            `
        },
        'requestHelp': {
            title: 'ขอความช่วยเหลือ',
            icon: 'fa-hands-helping',
            content: `
                <p>ขอความช่วยเหลือจากชุมชนและองค์กร</p>
                <div style="margin-top: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <strong>🏥 ต้องการรักษาพยาบาล</strong>
                        <p style="color: #7f8c8d; margin: 10px 0;">ขอความช่วยเหลือค่ารักษาฉุกเฉิน</p>
                        <button onclick="alert('ส่งคำขอเรียบร้อย')" style="padding: 8px 20px; background: #FF6B6B; color: white; border: none; border-radius: 8px; cursor: pointer;">ขอความช่วยเหลือ</button>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <strong>🏠 หาที่พักชั่วคราว</strong>
                        <p style="color: #7f8c8d; margin: 10px 0;">หาบ้านพักชั่วคราวให้น้อง</p>
                        <button onclick="alert('ส่งคำขอเรียบร้อย')" style="padding: 8px 20px; background: #4ECDC4; color: white; border: none; border-radius: 8px; cursor: pointer;">ขอความช่วยเหลือ</button>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <strong>🍖 ขอบริจาคอาหาร</strong>
                        <p style="color: #7f8c8d; margin: 10px 0;">ขออาหารสำหรับสัตว์จร</p>
                        <button onclick="alert('ส่งคำขอเรียบร้อย')" style="padding: 8px 20px; background: #FFE66D; color: #333; border: none; border-radius: 8px; cursor: pointer;">ขอความช่วยเหลือ</button>
                    </div>
                </div>
            `
        },
        'savedServices': {
            title: 'บริการที่บันทึก',
            icon: 'fa-bookmark',
            content: `
                <p>บริการที่คุณบันทึกไว้</p>
                <div style="margin-top: 20px; text-align: center; padding: 40px; color: #95a5a6;">
                    <i class="fas fa-bookmark" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>ยังไม่มีบริการที่บันทึก</p>
                    <button onclick="switchToPage('services')" style="margin-top: 15px; padding: 12px 30px; background: #4ECDC4; color: white; border: none; border-radius: 10px; cursor: pointer;">ค้นหาบริการ</button>
                </div>
            `
        },
        'history': {
            title: 'ประวัติการใช้บริการ',
            icon: 'fa-history',
            content: `
                <div style="margin-top: 20px;">
                    <div style="display: flex; gap: 15px; padding: 15px; border-left: 4px solid #4ECDC4; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                        <i class="fas fa-cut" style="font-size: 32px; color: #4ECDC4;"></i>
                        <div style="flex: 1;">
                            <strong>Pawfect Grooming</strong>
                            <p style="color: #7f8c8d; margin: 5px 0;">อาบน้ำตัดขน</p>
                            <small style="color: #95a5a6;">15 ธันวาคม 2025</small>
                        </div>
                        <div style="text-align: right;">
                            <strong style="color: #4ECDC4;">฿450</strong>
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; padding: 15px; border-left: 4px solid #FF6B6B; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                        <i class="fas fa-stethoscope" style="font-size: 32px; color: #FF6B6B;"></i>
                        <div style="flex: 1;">
                            <strong>Happy Pets Clinic</strong>
                            <p style="color: #7f8c8d; margin: 5px 0;">ตรวจสุขภาพ</p>
                            <small style="color: #95a5a6;">10 ธันวาคม 2025</small>
                        </div>
                        <div style="text-align: right;">
                            <strong style="color: #FF6B6B;">฿800</strong>
                        </div>
                    </div>
                </div>
            `
        },
        'myReviews': {
            title: 'รีวิวของคุณ',
            icon: 'fa-star',
            content: `
                <p>รีวิวที่คุณเขียนไว้</p>
                <div style="margin-top: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong>Pawfect Grooming</strong>
                            <span style="color: #f39c12;">★★★★★</span>
                        </div>
                        <p style="color: #7f8c8d;">บริการดีมาก พนักงานใจดี น้องชอบมาก!</p>
                        <small style="color: #95a5a6;">15 ธันวาคม 2025</small>
                    </div>
                </div>
            `
        },
        'genetic': {
            title: 'ตรวจสอบพันธุกรรม',
            icon: 'fa-dna',
            content: `
                <p>ผลการตรวจสอบความเข้ากันได้ทางพันธุกรรม</p>
                <div style="margin-top: 20px;">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 15px;">
                        <div style="font-size: 48px; font-weight: bold;">95%</div>
                        <div>Genetic Match Score</div>
                        <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Excellent Compatibility</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 15px;">
                        <h4 style="margin-bottom: 15px;">การวิเคราะห์</h4>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>สายเลือด</span>
                                <strong style="color: #00d2a0;">✓ เข้ากันได้ดี</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>โครงสร้างร่างกาย</span>
                                <strong style="color: #00d2a0;">✓ เหมาะสม</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>ความเสี่ยงทางพันธุกรรม</span>
                                <strong style="color: #00d2a0;">✓ ต่ำ</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },
        'appointments': {
            title: 'นัดหมาย',
            icon: 'fa-calendar-check',
            content: `
                <p>การนัดหมายของคุณ</p>
                <div style="margin-top: 20px;">
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong>นัดพบ Bella</strong>
                            <span style="color: #ffc107;">รอยืนยัน</span>
                        </div>
                        <p style="margin: 5px 0;"><i class="fas fa-calendar"></i> 5 มกราคม 2026</p>
                        <p style="margin: 5px 0;"><i class="fas fa-clock"></i> 14:00 น.</p>
                        <p style="margin: 5px 0;"><i class="fas fa-map-marker-alt"></i> สวนลุมพินี</p>
                    </div>
                    <button onclick="alert('จองนัดหมายใหม่')" style="width: 100%; padding: 12px; background: #4ECDC4; color: white; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px;">+ จองนัดหมายใหม่</button>
                </div>
            `
        },
        'manageShop': {
            title: 'จัดการร้านค้า',
            icon: 'fa-store-alt',
            content: `
                <p>ข้อมูลร้านค้าของคุณ</p>
                <form style="margin-top: 20px;">
                    <input type="text" placeholder="ชื่อร้าน" value="My Pet Shop" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <textarea placeholder="รายละเอียดร้าน" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; height: 80px; margin-bottom: 10px;">บริการดูแลสัตว์เลี้ยงครบวงจร</textarea>
                    <input type="text" placeholder="ที่อยู่" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <input type="tel" placeholder="เบอร์โทร" style="width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 10px; margin-bottom: 10px;">
                    <button type="button" onclick="alert('บันทึกข้อมูลเรียบร้อย!')" style="width: 100%; padding: 15px; background: #FF6B6B; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">บันทึก</button>
                </form>
            `
        },
        'products': {
            title: 'สินค้า/บริการ',
            icon: 'fa-box-open',
            content: `
                <p>จัดการสินค้าและบริการของร้าน</p>
                <div style="margin-top: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>อาบน้ำตัดขน</strong>
                                <p style="color: #7f8c8d; margin: 5px 0;">฿350 - ฿800</p>
                            </div>
                            <button style="padding: 8px 15px; background: #4ECDC4; color: white; border: none; border-radius: 8px; cursor: pointer;">แก้ไข</button>
                        </div>
                    </div>
                    <button onclick="alert('เพิ่มสินค้า/บริการใหม่')" style="width: 100%; padding: 12px; background: #FF6B6B; color: white; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px;">+ เพิ่มสินค้า/บริการ</button>
                </div>
            `
        },
        'salesReport': {
            title: 'รายงานยอดขาย',
            icon: 'fa-chart-bar',
            content: `
                <div style="margin-top: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold;">฿24,500</div>
                            <div style="font-size: 14px; opacity: 0.9;">รายได้เดือนนี้</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #4ECDC4 0%, #44a08d 100%); color: white; padding: 20px; border-radius: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold;">156</div>
                            <div style="font-size: 14px; opacity: 0.9;">ออเดอร์ทั้งหมด</div>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; height: 200px; display: flex; align-items: center; justify-content: center; color: #95a5a6;">
                        <div style="text-align: center;">
                            <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 10px;"></i>
                            <p>กราฟรายได้จะแสดงที่นี่</p>
                        </div>
                    </div>
                </div>
            `
        },
        'orders': {
            title: 'คำสั่งซื้อ',
            icon: 'fa-comments-dollar',
            content: `
                <p>คำสั่งซื้อและการจอง</p>
                <div style="margin-top: 20px;">
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong>#ORD-001</strong>
                            <span style="color: #ffc107; font-weight: bold;">รอยืนยัน</span>
                        </div>
                        <p style="margin: 5px 0;">อาบน้ำตัดขน - สุนัขพันธุ์กลาง</p>
                        <p style="margin: 5px 0;"><strong>฿450</strong></p>
                        <p style="margin: 5px 0; color: #7f8c8d;"><i class="fas fa-calendar"></i> 2 มกราคม 2026, 10:00 น.</p>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="alert('ยืนยันออเดอร์แล้ว')" style="flex: 1; padding: 8px; background: #00d2a0; color: white; border: none; border-radius: 8px; cursor: pointer;">ยืนยัน</button>
                            <button onclick="alert('ปฏิเสธแล้ว')" style="flex: 1; padding: 8px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;">ปฏิเสธ</button>
                        </div>
                    </div>
                </div>
            `
        }
    };
    
    const detail = actionDetails[actionName];
    if (!detail) return;
    
    // Create modal
    const modalHTML = `
        <div class="modal active" id="actionModal" onclick="if(event.target.id==='actionModal') closeActionModal()">
            <div class="modal-content" style="max-width: 600px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 20px 20px 0 0;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <i class="fas ${detail.icon}" style="font-size: 32px;"></i>
                            <h2 style="margin: 0;">${detail.title}</h2>
                        </div>
                        <button onclick="closeActionModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">×</button>
                    </div>
                </div>
                <div style="padding: 30px; max-height: 60vh; overflow-y: auto;">
                    ${detail.content}
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('actionModal');
    if (existingModal) existingModal.remove();
    
    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeActionModal() {
    const modal = document.getElementById('actionModal');
    if (modal) modal.remove();
}

function updateStats() {
    const likesEl = document.getElementById('statLikes');
    const matchesEl = document.getElementById('statMatches');
    
    if (likesEl) likesEl.textContent = userStats.likes;
    if (matchesEl) matchesEl.textContent = userStats.matches;
    
    // Save stats
    if (currentUser) {
        localStorage.setItem('pawHomeStats_' + currentUser.email, JSON.stringify(userStats));
    }
}

// My Likes Functions
let currentLikesType = 'pet_finder'; // Track current likes type

async function showMyLikes() {
    const modal = document.getElementById('myLikesModal');
    modal.style.display = 'flex';
    
    // Setup tab listeners
    const likesTabs = document.querySelectorAll('[data-likes-type]');
    likesTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            likesTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentLikesType = tab.dataset.likesType;
            await loadMyLikes(currentLikesType);
        });
    });
    
    // Load default tab
    await loadMyLikes(currentLikesType);
}

async function loadMyLikes(likesType = 'pet_finder') {
    try {
        const endpoint = likesType === 'breeding' 
            ? `${API_BASE_URL}/breeding/my-likes/${currentUserId}`
            : `${API_BASE_URL}/likes/my-likes/${currentUserId}`;
            
        const response = await fetch(endpoint);
        const result = await response.json();
        
        const grid = document.getElementById('myLikesGrid');
        const empty = document.getElementById('myLikesEmpty');
        
        const likes = likesType === 'breeding' 
            ? (result.pets || [])
            : (result.likes || []);
        
        if (result.success && likes.length > 0) {
            grid.style.display = 'grid';
            empty.style.display = 'none';
            
            grid.innerHTML = likes.map(like => `
                <div class="match-card" style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <img src="${like.image_url}" alt="${like.name}" style="width: 100%; height: 200px; object-fit: cover;">
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 5px;">${like.name}</h3>
                        <p style="color: #7f8c8d; margin: 0 0 10px;">${like.breed}${like.age ? ' • ' + like.age : ''}</p>
                        ${like.tags ? `
                            <div style="margin-bottom: 10px;">
                                ${(like.tags || []).map(tag => `
                                    <span style="display: inline-block; background: #e8f5e9; color: #4caf50; padding: 4px 8px; border-radius: 5px; font-size: 12px; margin-right: 5px; margin-bottom: 5px;">${tag}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                        <p style="color: #95a5a6; font-size: 14px;">${like.description ? like.description.substring(0, 100) + '...' : ''}</p>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="closeMyLikesModal(); showPage('${likesType === 'breeding' ? 'breeding' : 'pet-finder'}');" style="flex: 1; padding: 10px; background: #FF6B6B; color: white; border: none; border-radius: 8px; cursor: pointer;">
                                <i class="fas fa-${likesType === 'breeding' ? 'heart' : 'paw'}"></i> ดูเพิ่มเติม
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            grid.style.display = 'none';
            empty.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading likes:', error);
        alert('ไม่สามารถโหลดข้อมูลได้');
    }
}

function closeMyLikesModal() {
    document.getElementById('myLikesModal').style.display = 'none';
}

// My Pets Functions
async function editMyPet(petId) {
    try {
        const response = await fetch(`${API_BASE_URL}/pets/get/${petId}`);
        const result = await response.json();
        
        if (result.success && result.pet) {
            const pet = result.pet;
            closeActionModal(); // ปิด modal เดิม
            
            // แสดง Admin Pet Modal สำหรับแก้ไข
            document.getElementById('petModalTitle').textContent = 'แก้ไขข้อมูลสัตว์เลี้ยง';
            document.getElementById('petEditId').value = pet.id;
            document.getElementById('petName').value = pet.name;
            document.getElementById('petAge').value = pet.age;
            document.getElementById('petBreed').value = pet.breed;
            document.getElementById('petImageUrl').value = pet.image_url;
            document.getElementById('petTags').value = Array.isArray(pet.tags) ? pet.tags.join(', ') : '';
            document.getElementById('petDescription').value = pet.description;
            document.getElementById('petStatus').value = pet.status;
            document.getElementById('adminPetModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading pet:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}

async function deleteMyPet(petId) {
    if (!confirm('ต้องการลบสัตว์เลี้ยงนี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/pets/delete/${petId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('ลบสัตว์เลี้ยงสำเร็จ!');
            closeActionModal();
            // เปิด modal ใหม่เพื่อ refresh ข้อมูล
            await handleAction('myPets');
        } else {
            alert(result.message || 'ไม่สามารถลบได้');
        }
    } catch (error) {
        console.error('Error deleting pet:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

// Navigate to page
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageId) {
            btn.classList.add('active');
        }
    });
}

// Navigation
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.dataset.page;
            
            // Update active states
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');
        });
    });
}

// Adjust navigation based on user role
function adjustNavigationByRole() {
    if (!currentUser || !currentUser.role) return;
    
    const role = currentUser.role;
    const navButtons = {
        'pet-finder': document.querySelector('[data-page="pet-finder"]'),
        'breeding': document.querySelector('[data-page="breeding"]'),
        'services': document.querySelector('[data-page="services"]'),
        'matches': document.querySelector('[data-page="matches"]'),
        'profile': document.querySelector('[data-page="profile"]')
    };
    
    // Hide all first
    Object.values(navButtons).forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
    
    // Show based on role
    switch(role) {
        case 'pet-owner':
            // Pet Owner: หาสัตว์, ใช้บริการ, หาคู่ผสมพันธุ์
            // Show: Pet Finder, Breeding, Services, Matches, Profile
            if (navButtons['pet-finder']) navButtons['pet-finder'].style.display = 'flex';
            if (navButtons['breeding']) navButtons['breeding'].style.display = 'flex';
            if (navButtons['services']) navButtons['services'].style.display = 'flex';
            if (navButtons['matches']) navButtons['matches'].style.display = 'flex';
            if (navButtons['profile']) navButtons['profile'].style.display = 'flex';
            break;
            
        case 'caregiver':
            // Caregiver/Rescuer: หาบ้านให้สัตว์, ช่วยสัตว์จร
            // Show: Pet Finder (to post pets), Matches, Services (clinics), Profile
            if (navButtons['pet-finder']) navButtons['pet-finder'].style.display = 'flex';
            if (navButtons['matches']) navButtons['matches'].style.display = 'flex';
            if (navButtons['services']) navButtons['services'].style.display = 'flex';
            if (navButtons['profile']) navButtons['profile'].style.display = 'flex';
            break;
            
        case 'business':
            // Business: ให้บริการ, จัดการร้าน
            // Show: Services (competitors), Matches (customer inquiries), Profile
            if (navButtons['services']) navButtons['services'].style.display = 'flex';
            if (navButtons['matches']) navButtons['matches'].style.display = 'flex';
            if (navButtons['profile']) navButtons['profile'].style.display = 'flex';
            break;
    }
    
    // Set default active page
    const firstVisibleNav = Object.values(navButtons).find(btn => btn && btn.style.display !== 'none');
    if (firstVisibleNav) {
        firstVisibleNav.click();
    }
}

// Load pets from API
async function loadPetsFromAPI() {
    try {
        // ดึงข้อมูล pets ที่เคยดูไปแล้วจาก database
        const viewedResponse = await fetch(`${API_BASE_URL}/likes/viewed/${currentUserId}`);
        const viewedResult = await viewedResponse.json();
        const viewedPets = viewedResult.success ? viewedResult.viewed_pet_ids : [];
        
        // ดึงข้อมูล pets ทั้งหมด
        const response = await fetch(`${API_BASE_URL}/pets/list`);
        const result = await response.json();
        
        if (result.success && result.pets) {
            // กรองเฉพาะสัตว์ที่ยังไม่เคยกด
            const filteredPets = result.pets.filter(pet => !viewedPets.includes(pet.id));
            
            petFinderData = filteredPets.map(pet => {
                // Validate image URL
                const imageUrl = pet.image || pet.image_url;
                const isValidImage = imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/'));
                
                return {
                    id: pet.id,
                    name: pet.name,
                    age: pet.age,
                    breed: pet.breed,
                    image: isValidImage ? imageUrl : null,
                    tags: pet.tags || [],
                    description: pet.description,
                    caregiver: {
                        name: pet.caregiver_name || 'ไม่ระบุ',
                        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
                        location: 'กรุงเทพมหานคร',
                        phone: '-',
                        type: 'Individual',
                        verified: false
                    }
                };
            });
            console.log('โหลดข้อมูลสัตว์เลี้ยงสำเร็จ:', petFinderData.length, 'ตัว');
        } else {
            console.error('ไม่สามารถโหลดข้อมูลได้:', result.message);
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// Pet Finder Functions
async function initPetFinder() {
    await loadPetsFromAPI();
    renderPetCard();
    
    const likeBtn = document.getElementById('likeBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    likeBtn.addEventListener('click', () => swipeRight());
    rejectBtn.addEventListener('click', () => swipeLeft());
    
    // Touch events for swipe
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    const cardStack = document.getElementById('cardStack');
    
    cardStack.addEventListener('touchstart', (e) => {
        const card = e.target.closest('.pet-card');
        if (!card) return;
        
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    
    cardStack.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const card = document.querySelector('.pet-card');
        if (!card) return;
        
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        card.style.transform = `translateX(${diff}px) rotate(${diff * 0.1}deg)`;
        
        if (diff > 50) {
            card.classList.add('swiping-right');
            card.classList.remove('swiping-left');
        } else if (diff < -50) {
            card.classList.add('swiping-left');
            card.classList.remove('swiping-right');
        } else {
            card.classList.remove('swiping-left', 'swiping-right');
        }
    });
    
    cardStack.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const card = document.querySelector('.pet-card');
        if (!card) return;
        
        const diff = currentX - startX;
        
        if (diff > 100) {
            swipeRight();
        } else if (diff < -100) {
            swipeLeft();
        } else {
            card.style.transform = '';
            card.classList.remove('swiping-left', 'swiping-right');
        }
        
        isDragging = false;
    });
}

function renderPetCard() {
    const cardStack = document.getElementById('cardStack');
    cardStack.innerHTML = '';
    
    if (currentCardIndex >= petFinderData.length) {
        document.querySelector('.no-more-cards').style.display = 'block';
        return;
    }
    
    const pet = petFinderData[currentCardIndex];
    currentPet = pet;
    
    // Default images
    const defaultPetImage = 'https://via.placeholder.com/400x300?text=No+Image';
    const defaultUserImage = 'https://via.placeholder.com/80?text=User';
    
    // Validate and clean image URLs
    const isValidUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        url = url.trim();
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
    };
    
    const petImage = isValidUrl(pet.image) ? pet.image : defaultPetImage;
    const caregiverImage = isValidUrl(pet.caregiver?.image) ? pet.caregiver.image : defaultUserImage;
    
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <img src="${petImage}" alt="${pet.name}" onerror="this.src='${defaultPetImage}'">
                <div class="pet-info">
                    <div class="pet-header">
                        <div>
                            <span class="pet-name">${pet.name}</span>
                            <span class="pet-age">, ${pet.age || 'ไม่ระบุอายุ'}</span>
                        </div>
                    </div>
                    <span class="pet-breed">${pet.breed || 'ไม่ระบุสายพันธุ์'}</span>
                    <div class="pet-tags">
                        ${pet.tags && pet.tags.length > 0 ? pet.tags.map(tag => `
                            <span class="tag">
                                <i class="fas fa-check"></i>
                                ${tag}
                            </span>
                        `).join('') : ''}
                    </div>
                    <p class="pet-description">${pet.description || 'ไม่มีคำอธิบาย'}</p>
                    <button class="flip-btn" onclick="flipCard(event)">
                        <i class="fas fa-info-circle"></i> ข้อมูลผู้ดูแล
                    </button>
                </div>
            </div>
            <div class="card-back">
                <div class="caregiver-info">
                    <button class="flip-back-btn" onclick="flipCard(event)">
                        <i class="fas fa-arrow-left"></i> กลับ
                    </button>
                    <div class="caregiver-header">
                        <img src="${caregiverImage}" alt="${pet.caregiver?.name || 'Caregiver'}" class="caregiver-avatar" onerror="this.src='${defaultUserImage}'">
                        <div>
                            <h3>${pet.caregiver?.name || pet.caregiver_name || 'ไม่ระบุชื่อ'}</h3>
                            ${pet.caregiver?.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> ยืนยันตัวตนแล้ว</span>' : ''}
                        </div>
                    </div>
                    <div class="caregiver-type">
                        <i class="fas fa-home"></i> ${pet.caregiver?.type === 'Shelter' ? 'บ้านพักสัตว์' : pet.caregiver?.type === 'Foundation' ? 'มูลนิธิ' : pet.caregiver?.type === 'Farm' ? 'ฟาร์ม' : 'ผู้ดูแลส่วนบุคคล'}
                    </div>
                    <div class="caregiver-details">
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${pet.caregiver?.location || pet.location || 'ไม่ระบุสถานที่'}</span>
                        </div>
                    </div>
                    <div class="match-info-notice">
                        <i class="fas fa-lock"></i>
                        <p>ข้อมูลติดต่อจะแสดงหลังจากแมทกันแล้ว</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    cardStack.appendChild(card);
}

function flipCard(event) {
    event.stopPropagation();
    const card = event.target.closest('.pet-card');
    if (card) {
        card.classList.toggle('flipped');
    }
}

function swipeLeft() {
    const card = document.querySelector('.pet-card');
    if (!card) return;
    
    card.style.transition = 'transform 0.5s';
    card.style.transform = 'translateX(-150%) rotate(-30deg)';
    
    // บันทึก reject ลง database
    if (currentPet) {
        fetch(`${API_BASE_URL}/likes/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                pet_id: currentPet.id
            })
        }).then(res => res.json())
          .then(result => console.log('Rejected:', result))
          .catch(error => console.error('Error rejecting:', error));
    }
    
    setTimeout(() => {
        currentCardIndex++;
        renderPetCard();
    }, 500);
}

async function swipeRight() {
    const card = document.querySelector('.pet-card');
    if (!card) return;
    
    card.style.transition = 'transform 0.5s';
    card.style.transform = 'translateX(150%) rotate(30deg)';
    
    likedPets.push(currentPet);
    userStats.likes++;
    updateStats();
    
    // บันทึก Like ลง database
    try {
        const response = await fetch(`${API_BASE_URL}/likes/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                pet_id: currentPet.id
            })
        });
        const result = await response.json();
        console.log('Like saved:', result);
        
        // ถ้า match แสดง modal
        if (result.has_match) {
            showMatchModal(currentPet);
            matchedPets.push(currentPet);
            userStats.matches++;
            updateStats();
        }
    } catch (error) {
        console.error('Error saving like:', error);
    }
    
    // แสดงการ์ดใบถัดไป
    setTimeout(() => {
        currentCardIndex++;
        renderPetCard();
    }, 500);
}

// Breeding Functions
async function initBreeding() {
    await loadBreedingPets();
    renderBreedingCard();
    
    const likeBtn = document.getElementById('breedingLikeBtn');
    const rejectBtn = document.getElementById('breedingRejectBtn');
    
    likeBtn.addEventListener('click', () => breedingSwipeRight());
    rejectBtn.addEventListener('click', () => breedingSwipeLeft());
}

// โหลดข้อมูลสัตว์เลี้ยงในระบบ breeding จาก API
async function loadBreedingPets() {
    try {
        if (!currentUserId) {
            console.warn('WARNING: currentUserId is not set!');
            breedingPets = [];
            return;
        }
        
        console.log('Loading breeding pets for user:', currentUserId);
        const response = await fetch(`${API_BASE_URL}/breeding/list/${currentUserId}`);
        
        if (!response.ok) {
            console.error('API Response not OK:', response.status);
            breedingPets = [];
            return;
        }
        
        const result = await response.json();
        console.log('Breeding API result:', result);
        
        if (result.success && result.data) {
            breedingPets = result.data.map(pet => ({
                id: pet.id,
                name: pet.name,
                age: pet.age,
                breed: pet.breed,
                image: pet.image_url,
                gender: pet.gender,
                healthCheck: {
                    vaccinated: pet.vaccinated,
                    dewormed: pet.dewormed,
                    healthCertificate: pet.health_certificate,
                    geneticTested: pet.genetic_tested
                },
                geneticMatch: pet.genetic_match_score,
                description: pet.description
            }));
            currentBreedingIndex = 0;
            console.log('Loaded breeding pets:', breedingPets.length);
        } else {
            breedingPets = [];
        }
    } catch (error) {
        console.error('Error loading breeding pets:', error);
        breedingPets = [];
    }
}

function renderBreedingCard() {
    const cardStack = document.getElementById('breedingStack');
    cardStack.innerHTML = '';
    
    if (currentBreedingIndex >= breedingPets.length) {
        cardStack.innerHTML = '<div class="no-more-cards" style="display: block;"><i class="fas fa-paw"></i><p>ไม่มีข้อมูลเพิ่มเติม</p></div>';
        return;
    }
    
    const pet = breedingPets[currentBreedingIndex];
    
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <img src="${pet.image}" alt="${pet.name}">
                <div class="pet-info">
                    <div class="pet-header">
                        <div>
                            <span class="pet-name">${pet.name}</span>
                            <span class="pet-age">, ${pet.age}</span>
                        </div>
                    </div>
                    <span class="pet-breed">${pet.breed} - ${pet.gender}</span>
                    
                    <div class="health-check">
                        <h4><i class="fas fa-heartbeat"></i> Health Check</h4>
                        <div class="health-items">
                            <div class="health-item">
                                <i class="fas fa-check-circle"></i>
                                Vaccinated
                            </div>
                            <div class="health-item">
                                <i class="fas fa-check-circle"></i>
                                Dewormed
                            </div>
                            <div class="health-item">
                                <i class="fas fa-check-circle"></i>
                                Health Cert
                            </div>
                            <div class="health-item">
                                <i class="fas fa-check-circle"></i>
                                Genetic Test
                            </div>
                        </div>
                    </div>
                    
                    <button class="flip-btn" onclick="flipBreedingCard(event)">
                        <i class="fas fa-dna"></i> ดู Genetic Match
                    </button>
                </div>
            </div>
            <div class="card-back">
                <div class="caregiver-info">
                    <button class="flip-back-btn" onclick="flipBreedingCard(event)">
                        <i class="fas fa-arrow-left"></i> กลับ
                    </button>
                    
                    <div class="genetic-match-detail">
                        <div class="genetic-header">
                            <i class="fas fa-dna"></i>
                            <h3>Genetic Match Analysis</h3>
                        </div>
                        
                        <div class="genetic-match">
                            <div>Genetic Match Score</div>
                            <div class="genetic-score">${pet.geneticMatch}%</div>
                            <div class="compatibility-label">
                                ${pet.geneticMatch >= 90 ? 'Excellent Compatibility' : 
                                  pet.geneticMatch >= 80 ? 'Very Good Match' : 
                                  'Good Match'}
                            </div>
                        </div>
                        
                        <div class="genetic-details">
                            <h4><i class="fas fa-clipboard-list"></i> รายละเอียดเพิ่มเติม</h4>
                            <p class="pet-description">${pet.description}</p>
                            
                            <div class="breeding-benefits">
                                <div class="benefit-item">
                                    <i class="fas fa-star"></i>
                                    <span>สายพันธุ์แท้ มีใบรับรอง</span>
                                </div>
                                <div class="benefit-item">
                                    <i class="fas fa-heart"></i>
                                    <span>สุขภาพแข็งแรง ตรวจสอบแล้ว</span>
                                </div>
                                <div class="benefit-item">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>รับประกันคุณภาพลูก</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    cardStack.appendChild(card);
}

function flipBreedingCard(event) {
    event.stopPropagation();
    const card = event.target.closest('.pet-card');
    if (card) {
        card.classList.toggle('flipped');
    }
}

function breedingSwipeLeft() {
    const card = document.querySelector('#breedingStack .pet-card');
    if (!card) return;
    
    card.style.transition = 'transform 0.5s';
    card.style.transform = 'translateX(-150%) rotate(-30deg)';
    
    const pet = breedingPets[currentBreedingIndex];
    
    // บันทึกการ reject ลง database
    fetch(`${API_BASE_URL}/breeding/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: currentUserId,
            breeding_pet_id: pet.id
        })
    }).catch(err => console.error('Error rejecting breeding pet:', err));
    
    setTimeout(() => {
        currentBreedingIndex++;
        renderBreedingCard();
    }, 500);
}

async function breedingSwipeRight() {
    const card = document.querySelector('#breedingStack .pet-card');
    if (!card) return;
    
    card.style.transition = 'transform 0.5s';
    card.style.transform = 'translateX(150%) rotate(30deg)';
    
    const pet = breedingPets[currentBreedingIndex];
    userStats.likes++;
    
    try {
        // บันทึกการ like ลง database
        const response = await fetch(`${API_BASE_URL}/breeding/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUserId,
                breeding_pet_id: pet.id
            })
        });
        
        const result = await response.json();
        
        setTimeout(() => {
            if (result.matched) {
                showMatchModal(pet);
                userStats.matches++;
            }
            updateStats();
            currentBreedingIndex++;
            renderBreedingCard();
        }, 500);
    } catch (error) {
        console.error('Error liking breeding pet:', error);
        setTimeout(() => {
            currentBreedingIndex++;
            renderBreedingCard();
        }, 500);
    }
}

// Modal functions for adding breeding pet
function showAddBreedingPetModal() {
    document.getElementById('addBreedingPetModal').style.display = 'flex';
    document.getElementById('addBreedingPetForm').reset();
}

function closeAddBreedingPetModal() {
    document.getElementById('addBreedingPetModal').style.display = 'none';
}

async function handleAddBreedingPet(event) {
    event.preventDefault();
    
    const petData = {
        user_id: currentUserId,
        name: document.getElementById('breedingPetName').value,
        age: document.getElementById('breedingPetAge').value,
        breed: document.getElementById('breedingPetBreed').value,
        gender: document.getElementById('breedingPetGender').value,
        image_url: document.getElementById('breedingPetImage').value,
        description: document.getElementById('breedingPetDescription').value,
        genetic_match_score: parseInt(document.getElementById('breedingPetGeneticScore').value) || 85,
        vaccinated: document.getElementById('breedingPetVaccinated').checked,
        dewormed: document.getElementById('breedingPetDewormed').checked,
        health_certificate: document.getElementById('breedingPetHealthCert').checked,
        genetic_tested: document.getElementById('breedingPetGeneticTest').checked
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/breeding/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(petData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('เพิ่มสัตว์เลี้ยงเข้าระบบผสมพันธุ์สำเร็จ!');
            closeAddBreedingPetModal();
            // Reload breeding pets
            await loadBreedingPets();
            renderBreedingCard();
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error adding breeding pet:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มสัตว์เลี้ยง');
    }
}

// Services Functions
// Services Functions
let allServices = [];

async function initServices() {
    await loadServices();
    
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderServices(tab.dataset.filter);
        });
    });
    
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterServices(query);
        });
    }
}

async function loadServices() {
    try {
        const response = await fetch(`${API_BASE_URL}/services/list`);
        const result = await response.json();
        
        if (result.success) {
            allServices = result.services;
            renderServices('all');
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

function renderServices(filter) {
    const servicesList = document.getElementById('servicesList');
    let filteredServices = allServices;
    
    if (filter !== 'all') {
        filteredServices = allServices.filter(s => s.type === filter);
    }
    
    if (filteredServices.length === 0) {
        servicesList.innerHTML = '<p style="text-align: center; color: #666; padding: 50px;">ยังไม่มีบริการในหมวดนี้</p>';
        return;
    }
    
    servicesList.innerHTML = filteredServices.map(service => `
        <div class="service-card">
            <img src="${service.image_url}" alt="${service.name}" class="service-image">
            <div class="service-info">
                <div class="service-header">
                    <span class="service-name">${service.name}</span>
                    <span class="service-type">${service.category || getServiceTypeName(service.type)}</span>
                </div>
                ${service.price ? `<div class="service-price">${service.price}</div>` : ''}
                <div class="service-rating">
                    <span class="stars">
                        ${'★'.repeat(Math.floor(service.rating))}${'☆'.repeat(5 - Math.floor(service.rating))}
                    </span>
                    <span>${service.rating}</span>
                    <span class="rating-count">(${service.reviews_count})</span>
                </div>
                ${service.description ? `<p class="service-description">${service.description.substring(0, 100)}...</p>` : ''}
            </div>
        </div>
    `).join('');
}

function filterServices(query) {
    const filteredServices = allServices.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.category && s.category.toLowerCase().includes(query)) ||
        (s.description && s.description.toLowerCase().includes(query))
    );
    
    const servicesList = document.getElementById('servicesList');
    
    if (filteredServices.length === 0) {
        servicesList.innerHTML = '<p style="text-align: center; color: #666; padding: 50px;">ไม่พบบริการที่ค้นหา</p>';
        return;
    }
    
    servicesList.innerHTML = filteredServices.map(service => `
        <div class="service-card">
            <img src="${service.image_url}" alt="${service.name}" class="service-image">
            <div class="service-info">
                <div class="service-header">
                    <span class="service-name">${service.name}</span>
                    <span class="service-type">${service.category || getServiceTypeName(service.type)}</span>
                </div>
                ${service.price ? `<div class="service-price">${service.price}</div>` : ''}
                <div class="service-rating">
                    <span class="stars">
                        ${'★'.repeat(Math.floor(service.rating))}${'☆'.repeat(5 - Math.floor(service.rating))}
                    </span>
                    <span>${service.rating}</span>
                    <span class="rating-count">(${service.reviews_count})</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Matches Functions
// Matches & Chat Functions
let currentMatchType = 'pet_finder'; // Track current match type
let currentMatchId = null;
let currentChatUser = null;
let chatRefreshInterval = null;
let unreadCounts = {}; // Store unread message counts per match

async function initMatches() {
    await loadMatches(currentMatchType);
    
    // เพิ่ม event listeners สำหรับ tabs
    const matchTabs = document.querySelectorAll('.match-tab');
    matchTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            matchTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMatchType = tab.dataset.type;
            await loadMatches(currentMatchType);
        });
    });
}

async function loadMatches(matchType = 'pet_finder') {
    if (!currentUserId) return;
    
    try {
        // Load matches
        const response = await fetch(`${API_BASE_URL}/matches/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: currentUserId,
                match_type: matchType
            })
        });
        
        const result = await response.json();
        
        // Unread counts are managed by WebSocket notifications
        // No need to fetch from API
        
        if (result.success) {
            renderMatches(result.matches, matchType);
            updateNavBadge(); // อัพเดท badge ที่ nav button
        } else {
            console.error('Error loading matches:', result.message);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

function renderMatches(matches, matchType) {
    const matchesGrid = document.getElementById('matchesGrid');
    
    if (matches.length === 0) {
        const emptyText = matchType === 'breeding' 
            ? 'ยังไม่มี Match จากระบบผสมพันธุ์ ลองกดถูกใจสัตว์เลี้ยงดูสิ! 💕'
            : 'ยังไม่มี Match เลย ลองกดถูกใจสัตว์เลี้ยงดูสิ! 💕';
        matchesGrid.innerHTML = `<p style="text-align: center; color: #95a5a6; padding: 50px;">${emptyText}</p>`;
        return;
    }
    
    matchesGrid.innerHTML = matches.map(match => {
        const petName = match.pet_name || match.my_pet_name || 'Unknown';
        const userName = match.matched_user_name || match.match_username || 'Unknown User';
        
        // ตรวจสอบ role และเลือกรูปที่ถูกต้อง
        // ถ้า current user เป็นเจ้าของสัตว์ (pet_owner_id) → แสดงรูปของอีกฝ่าย (pet owner ที่สนใจ)
        // ถ้า current user เป็น pet owner → แสดงรูปของเจ้าของสัตว์ (caregiver)
        let userImage;
        if (match.pet_owner_id == currentUserId) {
            // Current user คือ caregiver (เจ้าของสัตว์) → แสดงรูป pet owner ที่สนใจ
            userImage = match.matched_user_image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200';
        } else {
            // Current user คือ pet owner → แสดงรูป caregiver (เจ้าของสัตว์)
            userImage = match.matched_user_image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200';
        }
        
        const unreadCount = unreadCounts[match.id] || 0;
        
        return `
            <div class="match-card" data-match-id="${match.id}" onclick="openChat(${match.id}, '${userName}', '${userImage}', '${petName}')">
                <img src="${userImage}" alt="${userName}">
                <div class="match-info">
                    <div class="match-name">${userName}</div>
                    <div class="match-status">${petName} • ${formatDate(match.created_at)}</div>
                </div>
                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'วันนี้';
    if (days === 1) return 'เมื่อวาน';
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
}

// Chat Functions
async function openChat(matchId, userName, userImage, petName) {
    currentMatchId = matchId;
    currentChatUser = { name: userName, image: userImage, petName: petName };
    
    const modal = document.getElementById('chatModal');
    document.getElementById('chatUserName').textContent = `${userName} (${petName})`;
    document.getElementById('chatUserImage').src = userImage;
    
    // Clear unread count for this match
    if (unreadCounts[matchId]) {
        delete unreadCounts[matchId];
        
        // ลบ badge จาก match card
        const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
        if (matchCard) {
            const badge = matchCard.querySelector('.unread-badge');
            if (badge) {
                badge.remove();
            }
        }
        
        // อัพเดท nav badge
        updateNavBadge();
    }
    
    // Join chat room via WebSocket
    if (socket && isSocketConnected) {
        socket.emit('chat:join', matchId);
        // Load messages via WebSocket
        socket.emit('messages:load', matchId);
        
        // Listen for loaded messages
        socket.once('messages:loaded', (messages) => {
            renderChatMessages(messages);
        });
    } else {
        // Fallback to HTTP if socket not connected
        await loadChatMessages();
    }
    
    modal.classList.add('active');
    
    // Stop auto-refresh (we're using WebSocket now)
    if (chatRefreshInterval) {
        clearInterval(chatRefreshInterval);
        chatRefreshInterval = null;
    }
    
    // Mark messages as read
    await markMessagesAsRead();
}

async function loadChatMessages() {
    if (!currentMatchId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ match_id: currentMatchId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderChatMessages(result.messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderChatMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    const scrollAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop === chatMessages.clientHeight;
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; color: #adb5bd;">
                <i class="fas fa-comments" style="font-size: 64px; margin-bottom: 20px; opacity: 0.3;"></i>
                <p style="font-size: 16px; font-weight: 500;">ยังไม่มีข้อความ</p>
                <p style="font-size: 14px; margin-top: 8px; opacity: 0.7;">เริ่มต้นบทสนทนาได้เลย!</p>
            </div>
        `;
        return;
    }
    
    chatMessages.innerHTML = messages.map(msg => {
        const isSent = msg.sender_id == currentUserId;
        return `
            <div class="message ${isSent ? 'sent' : ''}">
                ${!isSent ? `<img src="${currentChatUser.image}" alt="${msg.sender_name}" class="message-avatar">` : ''}
                <div class="message-wrapper">
                    <div class="message-content">${escapeHtml(msg.message)}</div>
                    <div class="message-time">${formatMessageTime(msg.created_at)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Auto-scroll to bottom if was already at bottom
    if (scrollAtBottom || messages.length === 1) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function markMessagesAsRead() {
    if (!currentMatchId) return;
    
    try {
        await fetch(`${API_BASE_URL}/chat/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                match_id: currentMatchId,
                user_id: currentUserId
            })
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

function closeChat() {
    console.log('🚪 Closing chat, current match ID:', currentMatchId);
    
    // Leave chat room via WebSocket
    if (socket && isSocketConnected && currentMatchId) {
        socket.emit('chat:leave', currentMatchId);
    }
    
    document.getElementById('chatModal').classList.remove('active');
    currentMatchId = null;
    currentChatUser = null;
    
    console.log('✅ Chat closed, currentMatchId reset to:', currentMatchId);
    
    // Clear refresh interval (if any)
    if (chatRefreshInterval) {
        clearInterval(chatRefreshInterval);
        chatRefreshInterval = null;
    }
    
    // Reload matches to update unread counts
    loadMatches(currentMatchType);
}

function initChatInput() {
    const chatInput = document.getElementById('chatInput');
    let typingTimeout = null;
    
    // Handle Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
            return;
        }
    });
    
    // Handle typing indicator
    chatInput.addEventListener('input', (e) => {
        if (socket && isSocketConnected && currentMatchId) {
            // Emit typing start
            socket.emit('typing:start', {
                match_id: currentMatchId,
                user_id: currentUserId,
                username: currentUser.username
            });
            
            // Clear previous timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // Set timeout to emit typing stop
            typingTimeout = setTimeout(() => {
                socket.emit('typing:stop', {
                    match_id: currentMatchId,
                    user_id: currentUserId
                });
            }, 1000);
        }
    });
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !currentMatchId) return;
    
    // Send via WebSocket if connected
    if (socket && isSocketConnected) {
        socket.emit('message:send', {
            match_id: currentMatchId,
            sender_id: currentUserId,
            message: message
        });
        
        input.value = '';
        
        // Stop typing indicator
        socket.emit('typing:stop', {
            match_id: currentMatchId,
            user_id: currentUserId
        });
    } else {
        // Fallback to HTTP
        try {
            const response = await fetch(`${API_BASE_URL}/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    match_id: currentMatchId,
                    sender_id: currentUserId,
                    message: message
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                input.value = '';
                await loadChatMessages();
            } else {
                alert('ส่งข้อความไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('เกิดข้อผิดพลาด');
        }
    }
}

// Match Modal Functions
function showMatchModal(pet) {
    const modal = document.getElementById('matchModal');
    document.getElementById('matchPetName').textContent = `You matched with ${pet.name}!`;
    document.getElementById('matchImage1').src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200'; // Your pet
    document.getElementById('matchImage2').src = pet.image;
    
    modal.classList.add('active');
}

function closeMatchModal() {
    document.getElementById('matchModal').classList.remove('active');
}

function goToChat() {
    closeMatchModal();
    document.querySelector('[data-page="matches"]').click();
}

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // If it's chatModal, use closeChat() to properly reset state
            if (modal.id === 'chatModal') {
                closeChat();
            } else {
                modal.classList.remove('active');
            }
        }
    });
});

// ============================================
// ADMIN PANEL FUNCTIONS
// ============================================

// Show/Hide Admin Menu based on role
function adjustNavigationByRole() {
    console.log('adjustNavigationByRole called'); // Debug
    console.log('currentUser:', currentUser); // Debug
    const adminNav = document.getElementById('adminNav');
    const businessNav = document.getElementById('businessNav');
    const petFinderNav = document.getElementById('petFinderNav');
    const breedingNav = document.getElementById('breedingNav');
    const matchesNav = document.getElementById('matchesNav');
    console.log('adminNav element:', adminNav); // Debug
    
    // Show admin menu for admin role
    if (currentUser && currentUser.role === 'admin') {
        console.log('User is admin, showing admin menu'); // Debug
        if (adminNav) {
            adminNav.style.display = 'flex';
        }
    } else {
        console.log('User is not admin, hiding admin menu'); // Debug
        if (adminNav) {
            adminNav.style.display = 'none';
        }
    }
    
    // Show business menu for business role and hide pet-related menus
    if (currentUser && currentUser.role === 'business') {
        console.log('User is business, showing business menu');
        if (businessNav) {
            businessNav.style.display = 'flex';
            businessNav.classList.add('active');
        }
        // Hide only pet adoption menus, keep matches for customer communication
        if (petFinderNav) petFinderNav.style.display = 'none';
        if (breedingNav) breedingNav.style.display = 'none';
        // Keep matches visible for business to chat with customers
        if (matchesNav) matchesNav.style.display = 'flex';
        
        // Show business dashboard by default
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById('business-dashboard')?.classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        if (businessNav) businessNav.classList.add('active');
    } else {
        if (businessNav) {
            businessNav.style.display = 'none';
        }
        // Show all menus for normal users
        if (petFinderNav) petFinderNav.style.display = 'flex';
        if (breedingNav) breedingNav.style.display = 'flex';
        if (matchesNav) matchesNav.style.display = 'flex';
    }
}

// Initialize Admin Panel
function initAdmin() {
    if (currentUser && currentUser.role === 'admin') {
        loadAdminStats();
        loadAdminPets();
        initAdminTabs();
    }
}

// Admin Tab Navigation
function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`admin-${tabName}`).classList.add('active');
            
            // Load data for the tab
            if (tabName === 'pets') loadAdminPets();
            else if (tabName === 'users') loadAdminUsers();
            else if (tabName === 'likes') loadAdminLikes();
            else if (tabName === 'matches') loadAdminMatches();
        });
    });
}

// Load Admin Statistics
async function loadAdminStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('adminTotalUsers').textContent = result.stats.total_users || 0;
            document.getElementById('adminTotalPets').textContent = result.stats.total_pets || 0;
            document.getElementById('adminTotalLikes').textContent = result.stats.total_likes || 0;
            document.getElementById('adminTotalMatches').textContent = result.stats.total_matches || 0;
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Load Admin Pets Table
async function loadAdminPets() {
    try {
        const response = await fetch(`${API_BASE_URL}/pets/list`);
        const result = await response.json();
        
        if (result.success && result.pets) {
            const tbody = document.getElementById('adminPetsTableBody');
            tbody.innerHTML = result.pets.map(pet => `
                <tr>
                    <td>${pet.id}</td>
                    <td><img src="${pet.image_url}" alt="${pet.name}"></td>
                    <td>${pet.name}</td>
                    <td>${pet.age}</td>
                    <td>${pet.breed}</td>
                    <td><span class="status-badge ${pet.status}">${pet.status}</span></td>
                    <td>${pet.caregiver_name || '-'}</td>
                    <td>
                        <div class="admin-actions">
                            <button class="admin-action-btn edit" onclick="editPet(${pet.id})" title="แก้ไข">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-action-btn delete" onclick="deletePet(${pet.id})" title="ลบ">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin pets:', error);
    }
}

// Load Admin Users Table
async function loadAdminUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const result = await response.json();
        
        if (result.success && result.users) {
            const tbody = document.getElementById('adminUsersTableBody');
            tbody.innerHTML = result.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email || '-'}</td>
                    <td><span class="role-badge ${user.role}">${user.role}</span></td>
                    <td>${new Date(user.created_at).toLocaleDateString('th-TH')}</td>
                    <td>
                        <div class="admin-actions">
                            <button class="admin-action-btn delete" onclick="deleteUser(${user.id})" title="ลบ"
                                ${user.id === currentUserId ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
    }
}

// Load Admin Likes Table
async function loadAdminLikes() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/likes`);
        const result = await response.json();
        
        if (result.success && result.likes) {
            const tbody = document.getElementById('adminLikesTableBody');
            tbody.innerHTML = result.likes.map(like => `
                <tr>
                    <td>${like.id}</td>
                    <td>${like.username}</td>
                    <td>${like.pet_name}</td>
                    <td>${new Date(like.created_at).toLocaleDateString('th-TH')}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin likes:', error);
    }
}

// Load Admin Matches Table
async function loadAdminMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/matches`);
        const result = await response.json();
        
        if (result.success && result.matches) {
            const tbody = document.getElementById('adminMatchesTableBody');
            tbody.innerHTML = result.matches.map(match => `
                <tr>
                    <td>${match.id}</td>
                    <td>${match.user1_name}</td>
                    <td>${match.user2_name}</td>
                    <td>${match.pet_name}</td>
                    <td><span class="status-badge ${match.status}">${match.status}</span></td>
                    <td>${new Date(match.created_at).toLocaleDateString('th-TH')}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin matches:', error);
    }
}

// Show Add Pet Modal
function showAddPetModal() {
    document.getElementById('petModalTitle').textContent = 'เพิ่มสัตว์เลี้ยงใหม่';
    document.getElementById('adminPetForm').reset();
    document.getElementById('petEditId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('adminPetModal').classList.add('active');
    
    // Add image preview listeners
    setupImagePreview();
}

// Setup image preview
function setupImagePreview() {
    const fileInput = document.getElementById('petImageFile');
    const urlInput = document.getElementById('petImageUrl');
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    // File input change
    if (fileInput) {
        fileInput.removeEventListener('change', handleFilePreview);
        fileInput.addEventListener('change', handleFilePreview);
    }
    
    // URL input change
    if (urlInput) {
        urlInput.removeEventListener('input', handleUrlPreview);
        urlInput.addEventListener('input', handleUrlPreview);
    }
}

function handleFilePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

function handleUrlPreview(event) {
    const url = event.target.value;
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (url && url.startsWith('http')) {
        previewImg.src = url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

// Close Admin Pet Modal
function closeAdminPetModal() {
    document.getElementById('adminPetModal').classList.remove('active');
}

// Edit Pet
async function editPet(petId) {
    try {
        const response = await fetch(`${API_BASE_URL}/pets/get/${petId}`);
        const result = await response.json();
        
        if (result.success && result.pet) {
            const pet = result.pet;
            document.getElementById('petModalTitle').textContent = 'แก้ไขข้อมูลสัตว์เลี้ยง';
            document.getElementById('petEditId').value = pet.id;
            document.getElementById('petName').value = pet.name;
            document.getElementById('petSpecies').value = pet.species || '';
            document.getElementById('petGender').value = pet.gender || '';
            document.getElementById('petAge').value = pet.age || '';
            document.getElementById('petBreed').value = pet.breed || '';
            document.getElementById('petWeight').value = pet.weight || '';
            document.getElementById('petHealthStatus').value = pet.health_status || '';
            document.getElementById('petLocation').value = pet.location || '';
            document.getElementById('petContactPhone').value = pet.contact_phone || '';
            document.getElementById('petImageUrl').value = pet.image || '';
            document.getElementById('petTags').value = Array.isArray(pet.tags) ? pet.tags.join(', ') : '';
            document.getElementById('petDescription').value = pet.description || '';
            document.getElementById('petStatus').value = pet.status || 'available';
            
            // Show image preview if exists
            if (pet.image) {
                document.getElementById('previewImg').src = pet.image;
                document.getElementById('imagePreview').style.display = 'block';
            }
            
            document.getElementById('adminPetModal').classList.add('active');
            setupImagePreview();
        }
    } catch (error) {
        console.error('Error loading pet:', error);
        alert('ไม่สามารถโหลดข้อมูลได้');
    }
}

// Handle Save Pet
async function handleSavePet(event) {
    event.preventDefault();
    
    const petId = document.getElementById('petEditId').value;
    const tags = document.getElementById('petTags').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    
    try {
        // Check if user uploaded a file
        const imageFile = document.getElementById('petImageFile').files[0];
        let imageUrl = document.getElementById('petImageUrl').value;
        
        // Upload image if file selected
        if (imageFile) {
            const formData = new FormData();
            formData.append('petImage', imageFile);
            
            const uploadResponse = await fetch(`${API_BASE_URL}/pets/upload-image`, {
                method: 'POST',
                body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success) {
                imageUrl = uploadResult.imageUrl;
            } else {
                alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + uploadResult.message);
                return;
            }
        }
        
        if (!imageUrl) {
            alert('กรุณาเลือกรูปภาพหรือใส่ URL รูปภาพ');
            return;
        }
        
        const petData = {
            user_id: currentUserId,
            name: document.getElementById('petName').value,
            species: document.getElementById('petSpecies').value,
            gender: document.getElementById('petGender').value,
            age: parseInt(document.getElementById('petAge').value),
            breed: document.getElementById('petBreed').value,
            weight: parseFloat(document.getElementById('petWeight').value) || null,
            health_status: document.getElementById('petHealthStatus').value || null,
            location: document.getElementById('petLocation').value,
            contact_phone: document.getElementById('petContactPhone').value,
            image: imageUrl,
            tags: tags,
            description: document.getElementById('petDescription').value,
            status: document.getElementById('petStatus').value
        };
        
        const url = petId ? `${API_BASE_URL}/pets/update/${petId}` : `${API_BASE_URL}/pets/add`;
        const method = petId ? 'PUT' : 'POST';
        if (petId) petData.id = petId;
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(petData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(petId ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มสัตว์เลี้ยงสำเร็จ!');
            closeAdminPetModal();
            loadAdminPets();
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error saving pet:', error);
        alert('ไม่สามารถบันทึกข้อมูลได้');
    }
}

// Delete Pet
async function deletePet(petId) {
    if (!confirm('ต้องการลบสัตว์เลี้ยงนี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/pets/delete/${petId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('ลบสำเร็จ!');
            loadAdminPets();
        } else {
            alert(result.message || 'ไม่สามารถลบได้');
        }
    } catch (error) {
        console.error('Error deleting pet:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

// Delete User
async function deleteUser(userId) {
    if (!confirm('ต้องการลบผู้ใช้นี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('ลบผู้ใช้สำเร็จ!');
            loadAdminUsers();
        } else {
            alert(result.message || 'ไม่สามารถลบได้');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

// ===============================================
// BUSINESS DASHBOARD FUNCTIONS
// ===============================================

async function initBusinessDashboard() {
    if (currentUser && currentUser.role === 'business') {
        await loadBusinessStats();
        await loadBusinessServices();
    }
}

async function loadBusinessStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/services/my-services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const services = result.services;
            document.getElementById('businessServicesCount').textContent = services.length;
            
            // Calculate average rating
            const totalRating = services.reduce((sum, s) => sum + parseFloat(s.rating || 0), 0);
            const avgRating = services.length > 0 ? (totalRating / services.length).toFixed(1) : '0.0';
            document.getElementById('businessRating').textContent = avgRating;
            
            // Mock views count
            document.getElementById('businessViewsCount').textContent = services.length * 127;
        }
    } catch (error) {
        console.error('Error loading business stats:', error);
    }
}

async function loadBusinessServices() {
    try {
        const response = await fetch(`${API_BASE_URL}/services/my-services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
        });
        
        const result = await response.json();
        const grid = document.getElementById('businessServicesGrid');
        
        if (result.success && result.services.length > 0) {
            grid.innerHTML = result.services.map(service => `
                <div class="business-service-card">
                    <img src="${service.image_url}" alt="${service.name}">
                    <div class="business-service-info">
                        <h3>${service.name}</h3>
                        <span class="service-type-badge">${getServiceTypeName(service.type)}</span>
                        ${service.price ? `<div class="service-price">${service.price}</div>` : ''}
                        ${service.description ? `<p class="service-description">${service.description.substring(0, 80)}...</p>` : ''}
                        <div class="business-service-actions">
                            <button class="service-btn service-btn-edit" onclick="editService(${service.id})">
                                <i class="fas fa-edit"></i> แก้ไข
                            </button>
                            <button class="service-btn service-btn-delete" onclick="deleteService(${service.id})">
                                <i class="fas fa-trash"></i> ลบ
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<p style="text-align: center; color: #666;">ยังไม่มีบริการ คลิกเพิ่มบริการเพื่อเริ่มต้น</p>';
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

function getServiceTypeName(type) {
    const types = {
        'grooming': 'ร้านตัดขนสัตว์',
        'veterinary': 'คลินิกสัตว์',
        'daycare': 'โรงเรียนสอนสัตว์',
        'training': 'ฝึกสัตว์',
        'pet-food': 'ร้านอาหารสัตว์เลี้ยง',
        'other': 'อื่นๆ'
    };
    return types[type] || type;
}

function showAddServiceModal() {
    document.getElementById('serviceModalTitle').textContent = 'เพิ่มบริการใหม่';
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    document.getElementById('serviceModal').style.display = 'flex';
}

async function editService(serviceId) {
    try {
        const response = await fetch(`${API_BASE_URL}/services/my-services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
        });
        
        const result = await response.json();
        const service = result.services.find(s => s.id == serviceId);
        
        if (service) {
            document.getElementById('serviceModalTitle').textContent = 'แก้ไขบริการ';
            document.getElementById('serviceId').value = service.id;
            document.getElementById('serviceName').value = service.name;
            document.getElementById('serviceType').value = service.type;
            document.getElementById('serviceImageUrl').value = service.image_url;
            document.getElementById('servicePrice').value = service.price || '';
            document.getElementById('serviceCategory').value = service.category || '';
            document.getElementById('serviceDescription').value = service.description || '';
            document.getElementById('serviceModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading service:', error);
    }
}

async function handleSaveService(event) {
    event.preventDefault();
    
    const serviceId = document.getElementById('serviceId').value;
    const action = serviceId ? 'update' : 'add';
    
    const serviceData = {
        user_id: currentUserId,
        name: document.getElementById('serviceName').value,
        type: document.getElementById('serviceType').value,
        image_url: document.getElementById('serviceImageUrl').value,
        price: document.getElementById('servicePrice').value,
        category: document.getElementById('serviceCategory').value,
        description: document.getElementById('serviceDescription').value
    };
    
    if (serviceId) {
        serviceData.id = serviceId;
    }
    
    try {
        const url = serviceId ? `${API_BASE_URL}/services/update/${serviceId}` : `${API_BASE_URL}/services/add`;
        const method = serviceId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serviceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            closeServiceModal();
            await loadBusinessStats();
            await loadBusinessServices();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error saving service:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

async function deleteService(serviceId) {
    if (!confirm('ต้องการลบบริการนี้ใช่หรือไม่?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/services/delete/${serviceId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            await loadBusinessStats();
            await loadBusinessServices();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

function closeServiceModal() {
    document.getElementById('serviceModal').style.display = 'none';
}
// ==================== Notifications ====================

// Load unread notification count
async function loadNotificationCount() {
    if (!currentUserId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count/${currentUserId}`);
        const result = await response.json();
        
        if (result.success) {
            const count = result.count;
            const badge = document.getElementById('notificationBadge');
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Show notifications modal
function showNotifications() {
    document.getElementById('notificationsModal').style.display = 'flex';
    loadNotifications();
}

// Close notifications modal
function closeNotificationsModal() {
    document.getElementById('notificationsModal').style.display = 'none';
}

// Load notifications list
async function loadNotifications() {
    if (!currentUserId) return;
    
    const listElement = document.getElementById('notificationsList');
    const emptyElement = document.getElementById('notificationsEmpty');
    const loadingElement = document.getElementById('notificationsLoading');
    const showUnreadOnly = document.getElementById('showUnreadOnly').checked;
    
    // Show loading
    listElement.style.display = 'none';
    emptyElement.style.display = 'none';
    loadingElement.style.display = 'block';
    
    try {
        const url = `${API_BASE_URL}/notifications/list/${currentUserId}${showUnreadOnly ? '?unread_only=true' : ''}`;
        const response = await fetch(url);
        const result = await response.json();
        
        loadingElement.style.display = 'none';
        
        if (result.success && result.notifications.length > 0) {
            listElement.innerHTML = result.notifications.map(notif => `
                <div class="notification-item ${notif.is_read ? '' : 'unread'}" 
                     data-type="${notif.type}"
                     data-like-id="${notif.related_like_id || ''}"
                     data-like-type="${notif.type === 'pet_like' ? 'pet_finder' : notif.type === 'breeding_like' ? 'breeding' : ''}"
                     onclick="handleNotificationClick(event, ${notif.id}, '${notif.link || ''}')">
                    <div class="notification-header">
                        <div class="notification-title">
                            <i class="notification-icon fas fa-${getNotificationIcon(notif.type)}"></i>
                            ${notif.title}
                        </div>
                        <div class="notification-time">${formatNotificationTime(notif.created_at)}</div>
                    </div>
                    <div class="notification-message">${notif.message}</div>
                </div>
            `).join('');
            listElement.style.display = 'block';
            
            // Update mark all read button
            const hasUnread = result.notifications.some(n => !n.is_read);
            document.getElementById('markAllReadBtn').disabled = !hasUnread;
        } else {
            emptyElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        loadingElement.style.display = 'none';
        emptyElement.style.display = 'block';
    }
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch(type) {
        case 'pet_like': return 'heart';
        case 'breeding_like': return 'heart';
        case 'match': return 'fire';
        case 'message': return 'comment';
        default: return 'bell';
    }
}

// Format notification time
function formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'เมื่อสักครู่';
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// Handle notification click
async function handleNotificationClick(event, notificationId, link) {
    try {
        // Mark as read
        await fetch(`${API_BASE_URL}/notifications/mark-read/${notificationId}`, {
            method: 'POST'
        });
        
        // Reload notifications
        await loadNotifications();
        await loadNotificationCount();
        
        // Check if it's a like notification that needs detail view
        const notifElement = event.target.closest('.notification-item');
        if (notifElement) {
            const notifType = notifElement.dataset.type;
            const likeId = notifElement.dataset.likeId;
            const likeType = notifElement.dataset.likeType;
            
            if ((notifType === 'pet_like' || notifType === 'breeding_like') && likeId) {
                // Show like detail modal
                await showLikeDetailModal(likeId, likeType);
                return;
            }
        }
        
        // Navigate if link exists
        if (link) {
            closeNotificationsModal();
            
            // Parse link and navigate
            if (link.startsWith('matches')) {
                showPage('matches');
            } else if (link.startsWith('breeding')) {
                showPage('breeding');
            } else if (link.startsWith('pet-finder')) {
                showPage('pet-finder');
            }
        }
    } catch (error) {
        console.error('Error handling notification click:', error);
    }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    if (!currentUserId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read/${currentUserId}`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            await loadNotifications();
            await loadNotificationCount();
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// Start notification polling (check every 30 seconds)
function startNotificationPolling() {
    loadNotificationCount(); // Load immediately
    setInterval(loadNotificationCount, 30000); // Then every 30 seconds
}

// Initialize notification system when user logs in
function initNotifications() {
    if (currentUserId) {
        startNotificationPolling();
    }
}// ==================== Like Detail Modal ====================

let currentLikeData = null;

async function showLikeDetailModal(likeId, likeType) {
    try {
        const endpoint = likeType === 'breeding' 
            ? `${API_BASE_URL}/breeding/like-detail/${likeId}`
            : `${API_BASE_URL}/likes/detail/${likeId}`;
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        if (result.success && result.like) {
            currentLikeData = { ...result.like, likeType };
            
            const like = result.like;
            const age = like.liker_dob ? calculateAge(like.liker_dob) : 'ไม่ระบุ';
            const gender = like.liker_gender === 'male' ? 'ชาย' : like.liker_gender === 'female' ? 'หญิง' : 'ไม่ระบุ';
            
            document.getElementById('likeDetailContent').innerHTML = `
                <div class="like-detail-card">
                    <img src="${like.liker_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}" 
                         alt="${like.liker_name}" 
                         class="like-detail-image">
                    <div class="like-detail-info">
                        <div class="like-detail-name">${like.liker_name}</div>
                        <div class="like-detail-meta">
                            <div class="like-detail-meta-item">
                                <i class="fas fa-venus-mars"></i>
                                <span>${gender}</span>
                            </div>
                            <div class="like-detail-meta-item">
                                <i class="fas fa-birthday-cake"></i>
                                <span>${age} ปี</span>
                            </div>
                            ${like.liker_location ? `
                                <div class="like-detail-meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${like.liker_location}</span>
                                </div>
                            ` : ''}
                            ${like.liker_email ? `
                                <div class="like-detail-meta-item">
                                    <i class="fas fa-envelope"></i>
                                    <span>${like.liker_email}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${like.liker_bio ? `
                    <div class="like-detail-bio">
                        <strong><i class="fas fa-quote-left"></i> เกี่ยวกับฉัน</strong><br>
                        ${like.liker_bio}
                    </div>
                ` : ''}
                
                <div class="like-detail-pet-info">
                    <h4><i class="fas fa-paw"></i> สนใจสัตว์เลี้ยง</h4>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${like.pet_image}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover; border: 2px solid white;">
                        <div>
                            <strong style="font-size: 18px;">${like.pet_name}</strong><br>
                            <span>${like.pet_breed}</span>
                        </div>
                    </div>
                </div>
            `;
            
            closeNotificationsModal();
            document.getElementById('likeDetailModal').style.display = 'flex';
        } else {
            alert('ไม่สามารถโหลดข้อมูลได้');
        }
    } catch (error) {
        console.error('Error loading like detail:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}

function calculateAge(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function closeLikeDetailModal() {
    document.getElementById('likeDetailModal').style.display = 'none';
    currentLikeData = null;
}

async function handleAcceptLike() {
    if (!currentLikeData) return;
    
    const confirmMsg = `ต้องการยอมรับและเริ่มแชทกับ ${currentLikeData.liker_name} ใช่หรือไม่?`;
    if (!confirm(confirmMsg)) return;
    
    try {
        const endpoint = currentLikeData.likeType === 'breeding'
            ? `${API_BASE_URL}/breeding/accept`
            : `${API_BASE_URL}/likes/accept`;
        
        const payload = currentLikeData.likeType === 'breeding' ? {
            like_id: currentLikeData.id,
            owner_user_id: currentUserId,
            liker_user_id: currentLikeData.user_id,
            breeding_pet_id: currentLikeData.breeding_pet_id
        } : {
            like_id: currentLikeData.id,
            owner_user_id: currentUserId,
            liker_user_id: currentLikeData.user_id,
            pet_id: currentLikeData.pet_id
        };
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Match สำเร็จ! ตอนนี้คุณสามารถแชทกันได้แล้ว');
            closeLikeDetailModal();
            await loadNotificationCount();
            showPage('matches');
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error accepting like:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

async function handleRejectLike() {
    if (!currentLikeData) return;
    
    if (!confirm('ต้องการปฏิเสธใช่หรือไม่?')) return;
    
    try {
        const endpoint = currentLikeData.likeType === 'breeding'
            ? `${API_BASE_URL}/breeding/reject`
            : `${API_BASE_URL}/likes/reject`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ like_id: currentLikeData.id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('ปฏิเสธเรียบร้อย');
            closeLikeDetailModal();
            await loadNotificationCount();
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error rejecting like:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

// Profile Edit Functions
async function loadUserProfile() {
    if (!currentUser || !currentUser.id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile/${currentUser.id}`);
        const result = await response.json();
        
        if (result.success && result.user) {
            const user = result.user;
            
            // Update display fields
            document.getElementById('profilePhoneInfo').textContent = user.phone || '-';
            document.getElementById('profileLocationInfo').textContent = user.location || '-';
            document.getElementById('profileBioInfo').textContent = user.bio || '-';
            document.getElementById('profileGenderInfo').textContent = formatGender(user.gender);
            
            // Format birthday
            if (user.date_of_birth) {
                const date = new Date(user.date_of_birth);
                document.getElementById('profileBirthdayInfo').textContent = 
                    date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            } else {
                document.getElementById('profileBirthdayInfo').textContent = '-';
            }
            
            // Format joined date
            if (user.created_at) {
                const joinDate = new Date(user.created_at);
                document.getElementById('profileJoinedInfo').textContent = 
                    joinDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
            }
            
            // Show profile image if exists
            const avatarContainer = document.querySelector('.profile-avatar');
            if (avatarContainer) {
                // Clear existing image first
                const existingImg = avatarContainer.querySelector('img');
                if (existingImg) {
                    existingImg.remove();
                }
                
                const icon = avatarContainer.querySelector('i');
                if (user.profile_image && user.profile_image !== 'NULL') {
                    // Hide icon and show image
                    if (icon) icon.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = `/${user.profile_image}`;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
                    img.onerror = function() {
                        // If image fails to load, show icon
                        this.remove();
                        if (icon) icon.style.display = 'block';
                    };
                    avatarContainer.insertBefore(img, icon);
                } else {
                    // No image, show icon
                    if (icon) icon.style.display = 'block';
                }
            }
            
            // Store user data for editing
            currentUser = { ...currentUser, ...user };
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function formatGender(gender) {
    const genderMap = {
        'male': 'ชาย',
        'female': 'หญิง',
        'other': 'อื่นๆ'
    };
    return gender ? genderMap[gender] || gender : '-';
}

function showEditProfile() {
    // Hide display, show form
    document.getElementById('profileInfoDisplay').style.display = 'none';
    document.getElementById('profileEditForm').style.display = 'block';
    
    // Pre-fill form with current data
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editLocation').value = currentUser.location || '';
    document.getElementById('editBio').value = currentUser.bio || '';
    document.getElementById('editGender').value = currentUser.gender || '';
    
    if (currentUser.date_of_birth) {
        const date = new Date(currentUser.date_of_birth);
        document.getElementById('editBirthday').value = date.toISOString().split('T')[0];
    }
    
    // Show current profile image
    if (currentUser.profile_image) {
        const preview = document.getElementById('profileImagePreview');
        preview.src = `/${currentUser.profile_image}`;
        preview.style.display = 'block';
    }
}

function cancelEditProfile() {
    document.getElementById('profileInfoDisplay').style.display = 'block';
    document.getElementById('profileEditForm').style.display = 'none';
    document.getElementById('profileEditForm').reset();
}

function previewProfileImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('profileImagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function saveProfile() {
    if (!currentUser || !currentUser.id) return;
    
    try {
        const name = document.getElementById('editName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const location = document.getElementById('editLocation').value.trim();
        const bio = document.getElementById('editBio').value.trim();
        const gender = document.getElementById('editGender').value;
        const birthday = document.getElementById('editBirthday').value;
        
        if (!name) {
            alert('กรุณากรอกชื่อ');
            return;
        }
        
        // Update profile data
        const response = await fetch(`${API_BASE_URL}/users/profile/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                phone,
                location,
                bio,
                gender,
                date_of_birth: birthday || null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Upload profile image if selected
            const imageInput = document.getElementById('profileImageInput');
            if (imageInput.files.length > 0) {
                const formData = new FormData();
                formData.append('profile_image', imageInput.files[0]);
                
                const imageResponse = await fetch(`${API_BASE_URL}/users/profile/${currentUser.id}/image`, {
                    method: 'POST',
                    body: formData
                });
                
                const imageResult = await imageResponse.json();
                if (!imageResult.success) {
                    console.error('Error uploading image:', imageResult.message);
                }
            }
            
            alert('บันทึกโปรไฟล์สำเร็จ');
            
            // Update currentUser
            currentUser.name = name;
            
            // Update localStorage
            const savedUser = localStorage.getItem('pawHomeUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                userData.name = name;
                localStorage.setItem('pawHomeUser', JSON.stringify(userData));
            }
            
            // Reload profile display
            await loadUserProfile();
            cancelEditProfile();
        } else {
            alert(result.message || 'เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('เกิดข้อผิดพลาดในการบันทึก');
    }
}
