const API_BASE_URL = 'https://your-render-url.onrender.com/api';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('aqi_token');
        this.user = JSON.parse(localStorage.getItem('aqi_user') || '{}');
        this.initEventListeners();
    }

    initEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Form toggle
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        
        if (showRegister) showRegister.addEventListener('click', (e) => this.toggleForms(e));
        if (showLogin) showLogin.addEventListener('click', (e) => this.toggleForms(e));

        // Check if user is already logged in
        this.checkAuthentication();
    }

    toggleForms(e) {
        e.preventDefault();
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        loginForm.classList.toggle('d-none');
        registerForm.classList.toggle('d-none');
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        this.showLoading(e.target);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.token = result.access_token;
                this.user = { role: result.role, email: data.email };
                
                localStorage.setItem('aqi_token', this.token);
                localStorage.setItem('aqi_user', JSON.stringify(this.user));
                
                this.redirectToDashboard(result.role);
            } else {
                this.showError(result.detail || 'Login failed');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading(e.target);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const data = {
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            name: document.getElementById('regName').value,
            mobile: document.getElementById('regMobile').value,
            location: document.getElementById('regLocation').value,
            role: 'citizen'
        };

        if (data.password !== document.getElementById('regConfirmPassword').value) {
            this.showError('Passwords do not match');
            return;
        }

        this.showLoading(e.target);

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Registration successful! Please login.');
                this.toggleForms({ preventDefault: () => {} });
            } else {
                this.showError(result.detail || 'Registration failed');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading(e.target);
        }
    }

    showLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        const spinner = button.querySelector('.spinner-border');
        button.disabled = true;
        spinner.classList.remove('d-none');
    }

    hideLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        const spinner = button.querySelector('.spinner-border');
        button.disabled = false;
        spinner.classList.add('d-none');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert-dismissible');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const forms = document.querySelectorAll('.login-form:not(.d-none)');
        if (forms.length > 0) {
            forms[0].prepend(alert);
        }
    }

    redirectToDashboard(role) {
        switch (role) {
            case 'citizen':
                window.location.href = 'citizen-dashboard.html';
                break;
            case 'policymaker':
                window.location.href = 'policymaker-dashboard.html';
                break;
            case 'department':
                window.location.href = 'department-dashboard.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    checkAuthentication() {
        if (this.token && this.user.role) {
            // If on login page, redirect to dashboard
            if (window.location.pathname.includes('login.html')) {
                this.redirectToDashboard(this.user.role);
            }
        } else if (!window.location.pathname.includes('login.html') && 
                   !window.location.pathname.includes('index.html')) {
            // If not logged in and not on public pages, redirect to login
            window.location.href = 'login.html';
        }
    }

    logout() {
        localStorage.removeItem('aqi_token');
        localStorage.removeItem('aqi_user');
        window.location.href = 'login.html';
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
