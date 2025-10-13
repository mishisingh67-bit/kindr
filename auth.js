document.addEventListener('DOMContentLoaded', function() {
    // Form steps
    const formSteps = {
        role: document.getElementById('step-role'),
        name: document.getElementById('step-name'),
        contact: document.getElementById('step-contact'),
        password: document.getElementById('step-password')
    };
    
    let currentStep = 'role';
    let selectedRole = null;

    // Check if it's login form
    const isLoginForm = document.querySelector('form').id === 'loginForm';

    // Role selection
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            roleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            selectedRole = option.dataset.role;
        });
    });

    // Back buttons
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const previousStep = button.dataset.step;
            goToStep(previousStep, 'back');
        });
    });

    // Next buttons
    const nextButtons = document.querySelectorAll('.next-button');
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextStep = button.dataset.next;
            if (validateCurrentStep()) {
                goToStep(nextStep);
            }
        });
    });

    function goToStep(step, direction = 'forward') {
        // Hide current step
        formSteps[currentStep].classList.remove('active');
        
        // Show new step
        formSteps[step].classList.remove('slide-in-right', 'slide-in-left');
        void formSteps[step].offsetWidth; // Trigger reflow
        formSteps[step].classList.add('active');
        formSteps[step].classList.add(direction === 'forward' ? 'slide-in-right' : 'slide-in-left');
        
        currentStep = step;
    }

    function validateCurrentStep() {
        const inputs = formSteps[currentStep].querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                showError(`Please fill in ${input.previousElementSibling.textContent}`);
                isValid = false;
            }
        });

        if (currentStep === 'password') {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                isValid = false;
            }
        }

        return isValid;
    }

    // Password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.classList.toggle('fa-eye');
            button.classList.toggle('fa-eye-slash');
        });
    });

    // Form submission
    const form = document.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedRole && !isLoginForm) {
            showError('Please select your role first');
            return;
        }

        const formData = {
            role: selectedRole,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        if (!isLoginForm) {
            // Add signup-specific fields
            formData.firstName = document.getElementById('firstName')?.value;
            formData.lastName = document.getElementById('lastName')?.value;
            formData.phone = document.getElementById('phone')?.value;
        }

        try {
            // Simulate API call
            await simulateAuth(formData);
            
            // Get user role (use selected role for signup, or get from form data for login)
            const userRole = selectedRole || formData.role || 'donor';
            
            // Store auth state
            localStorage.setItem('auth', JSON.stringify({
                isAuthenticated: true,
                user: {
                    role: userRole,
                    firstName: formData.firstName || 'User',
                    email: formData.email
                }
            }));
            
            // Show success message
            const message = isLoginForm 
                ? 'Login successful! Redirecting...'
                : 'Account created successfully! Redirecting...';
            showSuccess(message);
            
            // Redirect based on user role
            setTimeout(() => {
                window.location.href = userRole === 'donor' ? '/donor-dashboard.html' : '/recipient-dashboard.html';
            }, 2000);
        } catch (error) {
            showError(error.message);
        }
    });

    // Social auth buttons
    const socialButtons = document.querySelectorAll('.social-button');
    socialButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!selectedRole && !isLoginForm) {
                showError('Please select your role first');
                return;
            }
            const provider = button.classList.contains('google') ? 'Google' : 'Facebook';
            handleSocialAuth(provider);
        });
    });

    // Error handling
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const form = document.querySelector('form');
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Success message handling
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const existingSuccess = document.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        const form = document.querySelector('form');
        form.insertBefore(successDiv, form.firstChild);
    }

    // Simulate authentication API call
    async function simulateAuth(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (data.email && data.password) {
                    // For demo purposes, accept any non-empty email/password
                    resolve({ success: true });
                } else {
                    reject(new Error('Please enter both email and password'));
                }
            }, 1000);
        });
    }

    // Handle social authentication
    async function handleSocialAuth(provider) {
        try {
            // Simulate social auth
            await simulateAuth({ email: 'social@example.com', password: 'dummy' });
            
            // Get user role
            const userRole = selectedRole || 'donor';
            
            // Store auth state
            localStorage.setItem('auth', JSON.stringify({
                isAuthenticated: true,
                user: {
                    role: userRole,
                    firstName: 'Social User',
                    email: 'social@example.com'
                }
            }));
            
            showSuccess(`${provider} authentication successful! Redirecting...`);
            
            // Redirect based on user role
            setTimeout(() => {
                window.location.href = userRole === 'donor' ? '/donor-dashboard.html' : '/recipient-dashboard.html';
            }, 2000);
        } catch (error) {
            showError(`${provider} authentication failed`);
        }
    }

    // Check URL parameters for pre-selected role
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    if (roleParam) {
        const roleOption = document.querySelector(`[data-role="${roleParam}"]`);
        if (roleOption) {
            selectedRole = roleParam;
            roleOptions.forEach(opt => opt.classList.remove('active'));
            roleOption.classList.add('active');
        }
    }

    // Add CSS for messages
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            background-color: #ffe8e8;
            color: #ff4b6e;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            animation: slideDown 0.3s ease;
        }

        .success-message {
            background-color: #e8fff0;
            color: #4bff91;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from {
                transform: translateY(-10px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}); 