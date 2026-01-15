document.addEventListener('DOMContentLoaded', function () {
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
    let currentListing = null;

    // Initialize cards
    function createCard(data) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.listingId = data.id;
        card.innerHTML = `
            <div class="verification-badge">
                <i class="fas fa-check-circle"></i>
                Verified
            </div>
            <div class="card-image">
                <img src="${data.image || 'https://via.placeholder.com/400x300'}" alt="${data.title}">
            </div>
            <div class="card-content">
                <h2>${data.title}</h2>
                <div class="location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${data.location || 'Unknown'}</span>
                </div>
                <p class="description">${data.description}</p>
                <div class="tags">
                    <span class="tag ${data.urgency === 'High' ? 'urgent' : ''}">${data.urgency || 'Normal'}</span>
                    <span class="tag">${data.category || 'General'}</span>
                </div>
            </div>
        `;
        return card;
    }

    async function initializeCards() {
        // Clear existing cards
        cardStack.innerHTML = '';
        cards.length = 0;

        try {
            const donorId = auth.user.email;
            const res = await fetch(`http://127.0.0.1:8000/api/listings?status=active&donorId=${donorId}`);
            const activeRequests = await res.json();

            if (activeRequests.length === 0) {
                cardStack.innerHTML = '<div class="no-cards">No more requests to swipe!</div>';
                return;
            }

            // Create and add cards to the stack
            activeRequests.forEach((request, index) => {
                // Map API data to card format if needed, or use directly
                const card = createCard(request);
                card.style.zIndex = activeRequests.length - index;
                card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
                card.style.opacity = index > 2 ? '0' : '1';
                cards.push(card);
                cardStack.appendChild(card);
            });

            // Setup event listeners for the top card
            if (cards.length > 0) {
                setupCardEvents(cards[0]);
            }

        } catch (error) {
            console.error('Error fetching cards:', error);
            cardStack.innerHTML = '<div class="no-cards">Error loading requests.</div>';
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

    async function completeSwipe(direction) {
        const card = cards[0];
        const listingId = card.dataset.listingId;
        const rotate = direction === 'right' ? 30 : -30;
        const translateX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;

        const donorId = auth.user.email;

        // Record the swipe regardless of direction
        try {
            await fetch(`http://127.0.0.1:8000/api/listings/${listingId}/swipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ donorId })
            });
            console.log(`Recorded swipe (${direction}) for listing ${listingId}`);
        } catch (e) {
            console.error("Failed to record swipe:", e);
        }

        // If swiped right, also record the match
        if (direction === 'right') {
            try {
                await fetch(`http://127.0.0.1:8000/api/listings/${listingId}/match`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ donorId })
                });
                console.log(`Matched with listing ${listingId}`);
            } catch (e) {
                console.error("Failed to record match:", e);
            }
        }

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

    async function loadMoreCards() {
        try {
            const donorId = auth.user.email;
            const res = await fetch(`http://127.0.0.1:8000/api/listings?status=active&donorId=${donorId}`);
            const newRequests = await res.json();

            if (newRequests.length === 0) return;

            newRequests.forEach(request => {
                const card = createCard(request);
                card.style.opacity = '0';
                cards.push(card);
                cardStack.appendChild(card);
            });

            // Update positions of all cards
            cards.forEach((card, index) => {
                card.style.zIndex = cards.length - index;
                card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
                // Only make the top 3 visible
                card.style.opacity = index > 2 ? '0' : '1';
                // Reset transition for new/reordered cards
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            });

        } catch (e) {
            console.error("Error loading more cards:", e);
        }
    }

    // Button handlers
    document.querySelector('.decline').addEventListener('click', () => completeSwipe('left'));
    document.querySelector('.accept').addEventListener('click', () => completeSwipe('right'));
    document.querySelector('.info').addEventListener('click', () => {
        const topCard = cards[0];
        if (topCard) {
            const listingId = topCard.dataset.listingId;
            // Find listing data
            fetch(`http://127.0.0.1:8000/api/listings/matches?donorId=${auth.user.email}`) // This is a bit inefficient, but lets assume we have it
                .then(res => res.json())
                .then(matches => {
                    // Actually, we can just use the data we already fetched for cards
                    // But card data is only partially stored in DOM. 
                    // Let's modify createCard to store the full data or fetch it.
                    // For now, let's just use the card's ID to fetch again.
                    fetch(`http://127.0.0.1:8000/api/listings`)
                        .then(res => res.json())
                        .then(all => {
                            currentListing = all.find(l => l.id === listingId);
                            showInfo(currentListing);
                        });
                });
        }
    });

    // Initialize the card stack
    initializeCards();

    // Modal functionality
    setupModalHandlers();
});

// Helper functions
function setupUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function () {
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
        document.getElementById('logout').addEventListener('click', function (e) {
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
    document.querySelector('.confirm-donation-btn')?.addEventListener('click', () => {
        processDonation(50); // Simulating a $50 donation
    });
}

function showInfo(listing) {
    if (!listing) return;

    const modal = document.getElementById('info-modal');
    modal.querySelector('h2').textContent = listing.title;
    modal.querySelector('.story p').textContent = listing.description;

    const modalBody = modal.querySelector('.modal-body');
    // Inject donation section
    const donationSection = `
        <div class="donation-section" style="text-align: center; margin-top: 2rem;">
            <h3>Direct Donation</h3>
            <p>Scan the UPI QR code below to donate directly to this recipient.</p>
            <div class="qr-container" style="margin: 1rem auto; width: 200px; height: 200px; background: #eee; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${listing.qrCode ? `<img src="${listing.qrCode}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-qrcode" style="font-size: 4rem; color: #ccc;"></i>'}
            </div>
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 1.5rem;">After donating, please confirm below to update the request progress.</p>
            <button class="btn btn-primary confirm-donation-btn" style="background: var(--primary-color); color: white; border: none; padding: 1rem 2rem; border-radius: 30px; font-weight: 600; cursor: pointer; width: 100%;">
                <i class="fas fa-check-circle"></i> I've Donated
            </button>
        </div>
    `;

    // Remove old donation buttons if present
    const oldButtons = modalBody.querySelector('.donation-buttons');
    if (oldButtons) oldButtons.remove();

    const existingSection = modalBody.querySelector('.donation-section');
    if (existingSection) existingSection.remove();

    modalBody.insertAdjacentHTML('beforeend', donationSection);

    // Re-setup handlers for the new button
    setupModalHandlers();

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

async function processDonation(amount) {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (!currentListing) {
        alert('Listing data not found.');
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/listings/${currentListing.id}/donate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                donorId: auth.user.email,
                amount: amount,
                timestamp: new Date().toISOString()
            })
        });

        if (res.ok) {
            const data = await res.json();
            alert(`Thank you for your donation! The request progress is now ${data.progress}%.`);
            hideInfo();
            // Refresh cards to show updated progress
            initializeCards();
        } else {
            alert('Failed to confirm donation. Please try again.');
        }
    } catch (e) {
        console.error(e);
        alert('Error connecting to server.');
    }
} 