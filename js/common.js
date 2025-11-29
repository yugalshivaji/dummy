// Common utility functions
const API_BASE_URL = 'https://your-render-url.onrender.com/api';

class CommonUtils {
    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getAQIColor(aqi) {
        if (aqi <= 50) return '#00E400'; // Good
        if (aqi <= 100) return '#FFFF00'; // Satisfactory
        if (aqi <= 200) return '#FF7E00'; // Moderate
        if (aqi <= 300) return '#FF0000'; // Poor
        if (aqi <= 400) return '#99004C'; // Very Poor
        return '#7E0023'; // Severe
    }

    static getAQIStatus(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Satisfactory';
        if (aqi <= 200) return 'Moderate';
        if (aqi <= 300) return 'Poor';
        if (aqi <= 400) return 'Very Poor';
        return 'Severe';
    }

    static showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    static hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    static async makeApiCall(endpoint, options = {}) {
        const token = localStorage.getItem('aqi_token');
        
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (response.status === 401) {
                window.authManager.logout();
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Export to global scope
window.CommonUtils = CommonUtils;
