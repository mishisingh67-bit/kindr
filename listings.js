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

    async function fetchListings() {
        try {
            listingsGrid.innerHTML = '<p>Loading...</p>';
            const res = await fetch('/api/listings?status=active');
            const listings = await res.json();
            renderListings(listings);
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

            // Format progress bar if we had a goal
            // For now, simple card
            card.innerHTML = `
                <div class="image-container" style="height:200px; overflow:hidden;">
                    <img src="${listing.image}" alt="${listing.title}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="content" style="padding: 1.5rem;">
                    <span class="category" style="color:var(--primary-color); font-size:0.9rem;">${listing.category}</span>
                    <h3 style="margin: 0.5rem 0;">${listing.title}</h3>
                    <p class="description" style="color:#666; font-size:0.9rem;">${listing.description}</p>
                    
                    <div class="stats" style="margin: 1rem 0; display:flex; justify-content:space-between; align-items:center;">
                         <span class="location"><i class="fas fa-map-marker-alt"></i> ${listing.location}</span>
                         <span class="urgency" style="color:${listing.urgency === 'High' ? 'red' : 'orange'}">${listing.urgency} Priority</span>
                    </div>

                    <div class="progress-bar-container" style="background:#eee; height:8px; border-radius:4px; margin-bottom:1rem; overflow:hidden;">
                        <div class="progress" style="width:${listing.progress || 0}%; background:var(--primary-color); height:100%;"></div>
                    </div>
                    
                    <button class="donate-btn" style="width:100%; padding:0.8rem; background:var(--primary-color); color:white; border:none; border-radius:8px; cursor:pointer;" onclick="alert('Donation flow coming soon')">Donate Now</button>
                </div>
            `;
            listingsGrid.appendChild(card);
        });
    }

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