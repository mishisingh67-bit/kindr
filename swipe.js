document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const authData = localStorage.getItem('auth');
    if (!authData) {
        window.location.href = '/login.html';
        return;
    }

    const auth = JSON.parse(authData);
    if (!auth.isAuthenticated) {
        window.location.href = '/login.html';
        return;
    }

    // Update UI with user info
    const userAvatar = document.querySelector('.avatar');
    if (userAvatar) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.firstName)}&background=ff4b6e&color=fff`;
    }

    // Setup user menu
    setupUserMenu();

    // Initialize card stack
    let currentCardIndex = 0;
    const cardStack = document.querySelector('.card-stack');
    const cards = [];

    // Sample data - Replace with API call
    const sampleRequests = [
        {
            id: 1,
            title: "College Tuition Support",
            location: "New York, USA",
            distance: "2.5 miles away",
            description: "Help me complete my final year of medical school. Your support will help me serve others in need.",
            image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6",
            tags: ["Urgent", "Education", "Healthcare"],
            progress: 75,
            amount: 15000,
            daysLeft: 30
        },
        {
            id: 2,
            title: "Emergency Medical Treatment",
            location: "Boston, USA",
            distance: "1.8 miles away",
            description: "Need assistance with critical medical procedure. Every contribution makes a difference.",
            image: "https://images.unsplash.com/photo-1584515933487-779824d29309",
            tags: ["Urgent", "Medical", "Healthcare"],
            progress: 60,
            amount: 8000,
            daysLeft: 15
        },
        {
            id: 3,
            title: "Food Bank Support",
            location: "Chicago, USA",
            distance: "3.2 miles away",
            description: "Help us provide meals to families in need. Together we can fight hunger in our community.",
            image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
            tags: ["Food", "Community"],
            progress: 45,
            amount: 5000,
            daysLeft: 45
        }
    ];

    // Initialize cards
    function createCard(data) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="verification-badge">
                <i class="fas fa-check-circle"></i>
                Verified
            </div>
            <div class="card-image">
                <img src="${data.image}" alt="${data.title}">
            </div>
            <div class="card-content">
                <h2>${data.title}</h2>
                <div class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${data.location}</span>
                    <span class="distance">${data.distance}</span>
                </div>
                <p class="description">${data.description}</p>
                <div class="tags">
                    ${data.tags.map(tag => `
                        <span class="tag ${tag.toLowerCase() === 'urgent' ? 'urgent' : ''}">${tag}</span>
                    `).join('')}
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${data.progress}%"></div>
                </div>
                <span class="progress-text">$${data.amount.toLocaleString()} needed • ${data.progress}% funded • ${data.daysLeft} days left</span>
            </div>
        `;
        return card;
    }

    function initializeCards() {
        // Clear existing cards
        cardStack.innerHTML = '';
        cards.length = 0;

        // Create and add cards to the stack
        sampleRequests.forEach((request, index) => {
            const card = createCard(request);
            card.style.zIndex = sampleRequests.length - index;
            card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
            card.style.opacity = index > 2 ? '0' : '1';
            cards.push(card);
            cardStack.appendChild(card);
        });

        // Setup event listeners for the top card
        if (cards.length > 0) {
            setupCardEvents(cards[0]);
        }
    }

    // Card swipe functionality
    function setupCardEvents(card) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;
        let initialRotation = 0;

        function handleStart(e) {
            startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            isDragging = true;
            card.style.transition = 'none';
            initialRotation = 0;

            // Add grabbing cursor
            card.style.cursor = 'grabbing';

            // Trigger haptic feedback if available
            if (window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }

        function handleMove(e) {
            if (!isDragging) return;
            e.preventDefault();

            currentX = (e.type === 'mousemove' ? e.clientX : e.touches[0].clientX) - startX;
            currentY = (e.type === 'mousemove' ? e.clientY : e.touches[0].clientY) - startY;

            // Calculate rotation based on horizontal movement
            const rotate = currentX * 0.1;
            
            // Calculate scale based on vertical movement (subtle effect)
            const scale = Math.max(1 - Math.abs(currentY) / 2000, 0.95);
            
            // Update card position with rotation and scale
            card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg) scale(${scale})`;

            // Update background color based on swipe direction
            updateBackgroundColor(currentX);
            
            // Update other cards in stack
            updateStackedCards(currentX);
        }

        function handleEnd() {
            if (!isDragging) return;
            isDragging = false;
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            card.style.cursor = 'grab';

            const threshold = window.innerWidth * 0.15;
            if (Math.abs(currentX) > threshold) {
                // Swipe was strong enough
                const direction = currentX > 0 ? 'right' : 'left';
                completeSwipe(direction);
            } else {
                // Reset card position
                resetCard();
            }
        }

        // Touch events
        card.addEventListener('touchstart', handleStart);
        card.addEventListener('touchmove', handleMove);
        card.addEventListener('touchend', handleEnd);

        // Mouse events
        card.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }

    function updateBackgroundColor(x) {
        const threshold = window.innerWidth * 0.15;
        if (x > threshold) {
            document.body.style.backgroundColor = '#e8fff0';
            updateButtonOpacity('accept');
        } else if (x < -threshold) {
            document.body.style.backgroundColor = '#ffe8e8';
            updateButtonOpacity('decline');
        } else {
            document.body.style.backgroundColor = '#f5f7fa';
            resetButtonOpacity();
        }
    }

    function updateStackedCards(x) {
        const progress = Math.abs(x) / (window.innerWidth * 0.15);
        cards.forEach((card, index) => {
            if (index === 0) return; // Skip the top card
            if (index <= 3) { // Only animate the next 3 cards
                const scale = 1 - ((index - progress) * 0.05);
                const translateY = (index - progress) * 10;
                card.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                card.style.opacity = 1;
            }
        });
    }

    function completeSwipe(direction) {
        const card = cards[0];
        const rotate = direction === 'right' ? 30 : -30;
        const translateX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
        
        card.style.transform = `translate(${translateX}px, ${window.innerHeight * 0.5}px) rotate(${rotate}deg)`;
        card.style.opacity = 0;

        // Trigger haptic feedback
        if (window.navigator.vibrate) {
            window.navigator.vibrate([50, 30, 50]);
        }

        setTimeout(() => {
            cardStack.removeChild(card);
            cards.shift();
            
            // Update remaining cards
            cards.forEach((card, index) => {
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                card.style.zIndex = cards.length - index;
                card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
                card.style.opacity = index > 2 ? '0' : '1';
            });

            // Setup events for the new top card
            if (cards.length > 0) {
                setupCardEvents(cards[0]);
            }

            // Load more cards if needed
            if (cards.length < 3) {
                loadMoreCards();
            }

            // Reset background color
            document.body.style.backgroundColor = '#f5f7fa';
            resetButtonOpacity();
        }, 300);
    }

    function resetCard() {
        const card = cards[0];
        card.style.transform = 'translate(0) rotate(0) scale(1)';
        updateStackedCards(0);
        document.body.style.backgroundColor = '#f5f7fa';
        resetButtonOpacity();
    }

    function loadMoreCards() {
        // In a real app, this would be an API call
        // For demo, we'll just reuse our sample data
        sampleRequests.forEach(request => {
            const card = createCard(request);
            card.style.opacity = '0';
            cards.push(card);
            cardStack.appendChild(card);
        });

        // Update positions of all cards
        cards.forEach((card, index) => {
            card.style.zIndex = cards.length - index;
            card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
            card.style.opacity = index > 2 ? '0' : '1';
        });
    }

    // Button handlers
    document.querySelector('.decline').addEventListener('click', () => completeSwipe('left'));
    document.querySelector('.accept').addEventListener('click', () => completeSwipe('right'));
    document.querySelector('.info').addEventListener('click', showInfo);

    // Initialize the card stack
    initializeCards();

    // Modal functionality
    setupModalHandlers();
});

// Helper functions
function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function() {
            const menu = document.createElement('div');
            menu.className = 'user-dropdown';
            menu.innerHTML = `
                <div class="user-info">
                    <img src="${userAvatar.src}" alt="User" class="avatar-small">
                    <div>
                        <p class="user-name">${auth.user.firstName}</p>
                        <p class="user-email">${auth.user.email}</p>
                    </div>
                </div>
                <hr>
                <a href="/profile.html"><i class="fas fa-user"></i> Profile</a>
                <a href="/settings.html"><i class="fas fa-cog"></i> Settings</a>
                <a href="#" id="logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
            
            handleDropdownMenu(menu, userMenu);
        });
    }
}

function handleDropdownMenu(menu, userMenu) {
    // Remove existing dropdown if any
    const existingDropdown = document.querySelector('.user-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    } else {
        document.body.appendChild(menu);
        
        // Position the dropdown
        const rect = userMenu.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = rect.bottom + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
        
        // Handle logout
        document.getElementById('logout').addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('auth');
            window.location.href = '/login.html';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!menu.contains(e.target) && !userMenu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }
}

function setupModalHandlers() {
    const modal = document.getElementById('info-modal');
    
    document.querySelector('.close-modal').addEventListener('click', hideInfo);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideInfo();
    });

    // Handle donation buttons
    document.querySelectorAll('.donate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.textContent;
            if (amount === 'Custom') {
                const customAmount = prompt('Enter custom amount:');
                if (customAmount) {
                    processDonation(Number(customAmount));
                }
            } else {
                processDonation(Number(amount.replace('$', '')));
            }
        });
    });
}

function showInfo() {
    const modal = document.getElementById('info-modal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideInfo() {
    const modal = document.getElementById('info-modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function updateButtonOpacity(activeButton) {
    const buttons = {
        accept: document.querySelector('.accept'),
        decline: document.querySelector('.decline'),
        info: document.querySelector('.info')
    };

    Object.keys(buttons).forEach(key => {
        buttons[key].style.opacity = key === activeButton ? '1' : '0.5';
    });
}

function resetButtonOpacity() {
    document.querySelectorAll('.swipe-button').forEach(btn => {
        btn.style.opacity = '1';
    });
}

function processDonation(amount) {
    // In a real app, this would process the payment
    alert(`Processing donation of $${amount}`);
    hideInfo();
} 