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
        });
    }

    // Filter panel toggle
    const filterButton = document.querySelector('.filter-button');
    const filterPanel = document.querySelector('.filter-panel');
    let filterPanelOpen = false;

    filterButton.addEventListener('click', () => {
        filterPanelOpen = !filterPanelOpen;
        filterPanel.style.right = filterPanelOpen ? '0' : '-300px';
        filterButton.style.borderColor = filterPanelOpen ? 'var(--primary-color)' : '#eee';
    });

    // Close filter panel when clicking outside
    document.addEventListener('click', (e) => {
        if (filterPanelOpen &&
            !filterPanel.contains(e.target) &&
            !filterButton.contains(e.target)) {
            filterPanelOpen = false;
            filterPanel.style.right = '-300px';
            filterButton.style.borderColor = '#eee';
        }
    });

    // Load listings from API
    const listingsGrid = document.querySelector('.listings-grid');

    let currentListings = [];
    let selectedListing = null;

    async function fetchListings() {
        const BASE_URL = 'http://127.0.0.1:8000';
        try {
            listingsGrid.innerHTML = '<p>Loading...</p>';
            const res = await fetch(`${BASE_URL}/api/listings?status=active`);
            currentListings = await res.json();
            renderListings(currentListings);
        } catch (error) {
            console.error(error);
            listingsGrid.innerHTML = '<p>Error loading listings.</p>';
        }
    }

    function renderListings(listings) {
        listingsGrid.innerHTML = '';
        if (listings.length === 0) {
            listingsGrid.innerHTML = '<p>No active listings found.</p>';
            return;
        }

        listings.forEach(listing => {
            const card = document.createElement('div');
            card.className = 'listing-card';
            card.dataset.id = listing.id;

            card.innerHTML = `
                <div class="image-container" style="height:200px; overflow:hidden;">
                    <img src="${listing.image}" alt="${listing.title}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="content" style="padding: 1.5rem;">
                    <span class="category" style="color:var(--primary-color); font-size:0.9rem;">${listing.category}</span>
                    <h3 style="margin: 0.5rem 0;">${listing.title}</h3>
                    <p class="description" style="color:#666; font-size:0.9rem; height: 3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${listing.description}</p>
                    
                    <div class="stats" style="margin: 1rem 0; display:flex; justify-content:space-between; align-items:center;">
                         <span class="location"><i class="fas fa-map-marker-alt"></i> ${listing.location}</span>
                         <span class="urgency" style="color:${listing.urgency === 'High' ? 'red' : 'orange'}">${listing.urgency} Priority</span>
                    </div>

                    <div class="progress-bar-container" style="background:#eee; height:8px; border-radius:4px; margin-bottom:1rem; overflow:hidden;">
                        <div class="progress" style="width:${listing.progress || 0}%; background:var(--primary-color); height:100%;"></div>
                    </div>
                    
                    <button class="donate-btn-real" style="width:100%; padding:0.8rem; background:var(--primary-color); color:white; border:none; border-radius:8px; cursor:pointer;" onclick="openDonateModal('${listing.id}')">Donate Now</button>
                </div>
            `;
            listingsGrid.appendChild(card);
        });
    }

    // Modal Logic
    const modal = document.getElementById('donateModal');
    const closeModal = modal.querySelector('.close-modal');

    const hideModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };

    window.openDonateModal = (id) => {
        selectedListing = currentListings.find(l => l.id === id);
        if (!selectedListing) return;

        document.getElementById('modalTitle').textContent = selectedListing.title;
        document.getElementById('modalImg').src = selectedListing.image;
        document.getElementById('modalDesc').textContent = selectedListing.description;

        const qrContainer = document.getElementById('modalQR');
        qrContainer.innerHTML = `
            <h3>Direct Donation</h3>
            <div class="qr-box" style="margin: 1rem auto; width: 180px; height: 180px; background: #f9f9f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                ${selectedListing.qrCode ? `<img src="${selectedListing.qrCode}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-qrcode" style="font-size: 4rem; color: #ccc;"></i>'}
            </div>
            <p style="font-size: 0.8rem; color: #666; margin-bottom: 1rem;">Scan with any UPI app</p>
            <button class="confirm-btn" style="width:100%; padding: 0.8rem; background:#4bff91; color:#0f5132; border:none; border-radius:8px; font-weight:600; cursor:pointer;" onclick="confirmDonation()">I've Donated</button>
        `;

        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    };

    closeModal.onclick = hideModal;
    window.onclick = (e) => { if (e.target == modal) hideModal(); };

    window.confirmDonation = async () => {
        if (!selectedListing) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/listings/${selectedListing.id}/donate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    donorId: auth.user.email,
                    amount: 50, // Demo amount
                    timestamp: new Date().toISOString()
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Thank you! Request progress is now ${data.progress}%.`);
                hideModal();
                fetchListings(); // Refresh UI
            } else {
                alert('Confirmation failed.');
            }
        } catch (e) {
            console.error(e);
            alert('Error connecting to server.');
        }
    };

    // Initial load
    fetchListings();

    // Filter functionality (simplified for now)
    const applyFiltersButton = document.querySelector('.apply-filters');
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            // Re-fetch or filter client side
            // For this iteration, just reloading all
            fetchListings();
        });
    }
});