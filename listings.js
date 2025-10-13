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

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const listingCards = document.querySelectorAll('.listing-card');

    function performSearch(query) {
        query = query.toLowerCase();
        listingCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.description').textContent.toLowerCase();
            const category = card.querySelector('.category').textContent.toLowerCase();
            
            if (title.includes(query) || description.includes(query) || category.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });

    // Sorting functionality
    const sortSelect = document.querySelector('.sort-options select');
    const listingsGrid = document.querySelector('.listings-grid');

    sortSelect.addEventListener('change', () => {
        const sortValue = sortSelect.value;
        const cardsArray = Array.from(listingCards);

        cardsArray.sort((a, b) => {
            switch(sortValue) {
                case 'recent':
                    // For demo, just reverse current order
                    return -1;
                case 'urgent':
                    const daysA = parseInt(a.querySelector('.stat .amount').textContent);
                    const daysB = parseInt(b.querySelector('.stat .amount').textContent);
                    return daysA - daysB;
                case 'amount':
                    const amountA = parseInt(a.querySelector('.stat .amount').textContent.replace('$', '').replace(',', ''));
                    const amountB = parseInt(b.querySelector('.stat .amount').textContent.replace('$', '').replace(',', ''));
                    return amountA - amountB;
                default:
                    return 0;
            }
        });

        // Re-append sorted cards
        cardsArray.forEach(card => {
            listingsGrid.appendChild(card);
        });
    });

    // Filter functionality
    const filterOptions = document.querySelectorAll('.filter-options input');
    const applyFiltersButton = document.querySelector('.apply-filters');
    const locationSelect = document.querySelector('.filter-section select');
    const minAmount = document.querySelector('.range-inputs input:first-child');
    const maxAmount = document.querySelector('.range-inputs input:last-child');

    function applyFilters() {
        const selectedCategories = Array.from(filterOptions)
            .filter(input => input.checked)
            .map(input => input.value);
        
        const location = locationSelect.value;
        const min = parseInt(minAmount.value) || 0;
        const max = parseInt(maxAmount.value) || Infinity;

        listingCards.forEach(card => {
            const category = card.querySelector('.category').textContent.toLowerCase();
            const amount = parseInt(card.querySelector('.stat .amount').textContent.replace('$', '').replace(',', ''));
            
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(category);
            const locationMatch = !location || location === '';
            const amountMatch = amount >= min && amount <= max;

            card.style.display = categoryMatch && locationMatch && amountMatch ? 'block' : 'none';
        });

        // Close filter panel after applying
        filterPanelOpen = false;
        filterPanel.style.right = '-300px';
        filterButton.style.borderColor = '#eee';
    }

    applyFiltersButton.addEventListener('click', applyFilters);

    // Load more functionality
    const loadMoreButton = document.querySelector('.load-more button');
    let currentPage = 1;

    loadMoreButton.addEventListener('click', () => {
        // Simulate loading more items
        loadMoreButton.textContent = 'Loading...';
        setTimeout(() => {
            // Clone existing cards for demo
            const newCards = Array.from(listingCards).slice(0, 3).map(card => card.cloneNode(true));
            newCards.forEach(card => {
                listingsGrid.appendChild(card);
            });
            loadMoreButton.textContent = 'Load More';
            currentPage++;
        }, 1000);
    });
}); 