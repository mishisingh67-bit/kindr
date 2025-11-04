document.addEventListener('DOMContentLoaded', function () {
    // ✅ Grab the main form element
    const form = document.querySelector('form');
    if (!form) return; // stop if there's no form (e.g., on other pages)

    // ✅ Detect form type
    const isLoginForm = form.id === 'loginForm';

    // ✅ Define form steps (used only in signup)
    const formSteps = {
        role: document.getElementById('step-role'),
        name: document.getElementById('step-name'),
        contact: document.getElementById('step-contact'),
        password: document.getElementById('step-password')
    };

    let currentStep = 'role';
    let selectedRole = null;

    // ✅ Handle role selection (works for both login & signup)
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            roleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            selectedRole = option.dataset.role;
        });
    });

    // ✅ Handle navigation between steps (signup only)
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const previousStep = button.dataset.step;
            goToStep(previousStep, 'back');
        });
    });

    const nextButtons = document.querySelectorAll('.next-button');
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextStep = button.dataset.next;
            if (validateCurrentStep()) goToStep(nextStep);
        });
    });

    function goToStep(step, direction = 'forward') {
        if (!formSteps[currentStep] || !formSteps[step]) return;
        formSteps[currentStep].classList.remove('active');
        formSteps[step].classList.remove('slide-in-right', 'slide-in-left');
        void formSteps[step].offsetWidth; // trigger reflow
        formSteps[step].classList.add('active');
        formSteps[step].classList.add(direction === 'forward' ? 'slide-in-right' : 'slide-in-left');
        currentStep = step;
    }

    function validateCurrentStep() {
        const inputs = formSteps[currentStep]?.querySelectorAll('input[required]') || [];
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

    // ✅ Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.classList.toggle('fa-eye');
            button.classList.toggle('fa-eye-slash');
        });
    });

    // ✅ Handle form submission (login or signup)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isLoginForm && !selectedRole) {
            showError('Please select your role first');
            return;
        }

        const formData = {
            role: selectedRole,
            email: document.getElementById('email')?.value,
            password: document.getElementById('password')?.value
        };

        if (!isLoginForm) {
            formData.firstName = document.getElementById('firstName')?.value;
            formData.lastName = document.getElementById('lastName')?.value;
            formData.phone = document.getElementById('phone')?.value;
        }

        try {
            await simulateAuth(formData);

            // ✅ Store login/signup data
            localStorage.setItem('auth', JSON.stringify({
                isAuthenticated: true,
                user: {
                    role: formData.role || 'donor',
                    firstName: formData.firstName || 'User',
                    email: formData.email
                }
            }));

            // ✅ Save user in local storage (for demo persistence)
            if (!isLoginForm) {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                users.push(formData);
                localStorage.setItem('users', JSON.stringify(users));
            }

            // ✅ Show success and redirect
            const message = isLoginForm
                ? 'Login successful! Redirecting...'
                : 'Account created successfully! Redirecting...';
            showSuccess(message);

            const role = formData.role || 'donor';
            setTimeout(() => {
                window.location.href = role === 'donor'
                    ? 'donor-dashboard.html'
                    : 'recipient-dashboard.html';
            }, 2000);

        } catch (error) {
            showError(error.message);
        }
    });

    // ✅ Simulate backend authentication
    async function simulateAuth(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (data.email && data.password) resolve({ success: true });
                else reject(new Error('Please fill out all required fields.'));
            }, 1000);
        });
    }

    // ✅ Social sign-in (Google/Facebook)
    document.querySelectorAll('.social-button').forEach(button => {
        button.addEventListener('click', () => {
            if (!isLoginForm && !selectedRole) {
                showError('Please select your role first');
                return;
            }
            const provider = button.classList.contains('google') ? 'Google' : 'Facebook';
            handleSocialAuth(provider);
        });
    });

    async function handleSocialAuth(provider) {
        try {
            await simulateAuth({ email: 'social@example.com', password: 'dummy' });
            const userRole = selectedRole || 'donor';
            localStorage.setItem('auth', JSON.stringify({
                isAuthenticated: true,
                user: {
                    role: userRole,
                    firstName: 'Social User',
                    email: 'social@example.com'
                }
            }));
            showSuccess(`${provider} authentication successful! Redirecting...`);
            setTimeout(() => {
                window.location.href = userRole === 'donor'
                    ? 'donor-dashboard.html'
                    : 'recipient-dashboard.html';
            }, 2000);
        } catch {
            showError(`${provider} authentication failed`);
        }
    }

    // ✅ Helper UI message functions
    function showError(message) {
        const existing = document.querySelector('.error-message');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = message;
        form.insertBefore(div, form.firstChild);
        setTimeout(() => div.remove(), 3000);
    }

    function showSuccess(message) {
        const existing = document.querySelector('.success-message');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.className = 'success-message';
        div.textContent = message;
        form.insertBefore(div, form.firstChild);
    }

    // ✅ Preselect role from URL (?role=donor)
    const roleParam = new URLSearchParams(window.location.search).get('role');
    if (roleParam) {
        const option = document.querySelector(`[data-role="${roleParam}"]`);
        if (option) {
            selectedRole = roleParam;
            roleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        }
    }

    // ✅ Inline CSS for notifications
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
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
