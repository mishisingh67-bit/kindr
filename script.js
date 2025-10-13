// Card swipe functionality
document.addEventListener('DOMContentLoaded', function() {
    const card = document.querySelector('.card');
    const modal = document.getElementById('info-modal');
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    // Touch events for mobile
    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchmove', handleTouchMove);
    card.addEventListener('touchend', handleTouchEnd);

    // Mouse events for desktop
    card.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);

    // Button click handlers
    document.querySelector('.decline').addEventListener('click', () => swipeCard('left'));
    document.querySelector('.accept').addEventListener('click', () => swipeCard('right'));
    document.querySelector('.info').addEventListener('click', showInfo);

    // Modal handlers
    document.querySelector('.close-modal').addEventListener('click', hideInfo);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideInfo();
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Add filter functionality here
        });
    });

    function handleTouchStart(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
        card.style.transition = 'none';
        startDragging();
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX - startX;
        updateCardPosition(currentX);
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        handleSwipeEnd();
    }

    function handleDragStart(e) {
        startX = e.clientX;
        isDragging = true;
        card.style.transition = 'none';
        startDragging();
    }

    function handleDrag(e) {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX - startX;
        updateCardPosition(currentX);
    }

    function handleDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        handleSwipeEnd();
    }

    function startDragging() {
        card.style.cursor = 'grabbing';
        card.style.userSelect = 'none';
    }

    function updateCardPosition(x) {
        const rotate = x * 0.1;
        const scale = Math.max(1 - Math.abs(x) / 1000, 0.9);
        card.style.transform = `translateX(${x}px) rotate(${rotate}deg) scale(${scale})`;
        
        // Update background color based on swipe direction
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

    function handleSwipeEnd() {
        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        card.style.cursor = 'grab';
        
        const threshold = window.innerWidth * 0.15;
        if (currentX > threshold) {
            swipeCard('right');
        } else if (currentX < -threshold) {
            swipeCard('left');
        } else {
            resetCard();
        }
    }

    function swipeCard(direction) {
        const swipeDistance = direction === 'right' ? window.innerWidth : -window.innerWidth;
        const rotate = swipeDistance * 0.1;
        card.style.transform = `translateX(${swipeDistance}px) rotate(${rotate}deg)`;
        
        // Simulate loading new card
        setTimeout(() => {
            card.style.opacity = '0';
            setTimeout(() => {
                resetCard();
                card.style.opacity = '1';
                document.body.style.backgroundColor = '#f5f7fa';
            }, 300);
        }, 300);
    }

    function resetCard() {
        currentX = 0;
        card.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        resetButtonOpacity();
    }

    function showInfo() {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    function hideInfo() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Donation button handlers
    document.querySelectorAll('.donate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.textContent;
            if (amount === 'Custom') {
                const customAmount = prompt('Enter custom amount:');
                if (customAmount) {
                    alert(`Thank you for your donation of $${customAmount}!`);
                }
            } else {
                alert(`Thank you for your donation of ${amount}!`);
            }
        });
    });
}); 