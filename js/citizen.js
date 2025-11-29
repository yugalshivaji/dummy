class CitizenDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.complaints = [];
        this.aqiData = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.initEventListeners();
        this.loadDashboardData();
        this.initCharts();
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('aqi_user') || '{}');
        document.getElementById('userName').textContent = user.name || 'Citizen User';
        document.getElementById('userPoints').textContent = `${user.points || 0} Points`;
    }

    initEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // Sidebar collapse
        document.getElementById('sidebarCollapse').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.authManager.logout();
        });
    }

    async loadDashboardData() {
        try {
            await this.loadCurrentAQI();
            await this.loadComplaints();
            await this.loadForecast();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadCurrentAQI() {
        // Mock data - replace with actual API call
        const mockAQIData = {
            aqi: 256,
            status: 'Poor',
            pollutants: {
                pm25: 115,
                pm10: 198,
                no2: 48,
                o3: 0.04,
                so2: 0.01,
                co: 1.2
            },
            weather: {
                temperature: 28,
                humidity: 65,
                windSpeed: 12,
                visibility: 2.5
            }
        };

        this.updateAQIDisplay(mockAQIData);
    }

    updateAQIDisplay(data) {
        const aqiCircle = document.querySelector('.aqi-circle-large');
        aqiCircle.setAttribute('data-aqi', data.aqi);
        aqiCircle.querySelector('.aqi-value').textContent = data.aqi;
        aqiCircle.querySelector('.aqi-status').textContent = data.status;

        // Update pollutant breakdown
        const breakdown = document.querySelector('.aqi-breakdown');
        breakdown.innerHTML = Object.entries(data.pollutants).map(([key, value]) => `
            <div class="pollutant">
                <span class="name">${key.toUpperCase()}</span>
                <span class="value">${value} ${this.getPollutantUnit(key)}</span>
            </div>
        `).join('');

        // Update weather
        const weatherGrid = document.querySelector('.weather-grid');
        weatherGrid.innerHTML = `
            <div class="weather-item">
                <i class="fas fa-temperature-high"></i>
                <div>
                    <span class="label">Temperature</span>
                    <span class="value">${data.weather.temperature}°C</span>
                </div>
            </div>
            <div class="weather-item">
                <i class="fas fa-tint"></i>
                <div>
                    <span class="label">Humidity</span>
                    <span class="value">${data.weather.humidity}%</span>
                </div>
            </div>
            <div class="weather-item">
                <i class="fas fa-wind"></i>
                <div>
                    <span class="label">Wind Speed</span>
                    <span class="value">${data.weather.windSpeed} km/h</span>
                </div>
            </div>
            <div class="weather-item">
                <i class="fas fa-eye"></i>
                <div>
                    <span class="label">Visibility</span>
                    <span class="value">${data.weather.visibility} km</span>
                </div>
            </div>
        `;
    }

    getPollutantUnit(pollutant) {
        const units = {
            pm25: 'μg/m³',
            pm10: 'μg/m³',
            no2: 'μg/m³',
            o3: 'ppm',
            so2: 'ppm',
            co: 'ppm'
        };
        return units[pollutant] || '';
    }

    initCharts() {
        this.initForecastChart();
    }

    initForecastChart() {
        const ctx = document.getElementById('forecastChart');
        if (!ctx) return;

        // Mock forecast data
        const forecastData = {
            labels: ['Now', '+6h', '+12h', '+18h', '+24h', '+30h', '+36h', '+42h', '+48h', '+54h', '+60h', '+66h', '+72h'],
            datasets: [{
                label: 'AQI Forecast',
                data: [256, 240, 220, 210, 230, 250, 270, 260, 240, 220, 200, 190, 180],
                borderColor: '#FF9933',
                backgroundColor: 'rgba(255, 153, 51, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: forecastData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'AQI'
                        }
                    }
                }
            }
        });
    }

    async loadComplaints() {
        try {
            const response = await fetch(`${API_BASE_URL}/citizen/complaints`, {
                headers: window.authManager.getAuthHeaders()
            });
            
            if (response.ok) {
                this.complaints = await response.json();
                this.updateComplaintsDisplay();
            }
        } catch (error) {
            console.error('Error loading complaints:', error);
        }
    }

    updateComplaintsDisplay() {
        // This will be used in the complaints section
    }

    showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Update active nav item
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`).parentElement.classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            complaints: 'Submit Complaint',
            tracking: 'Complaint Tracking',
            'aqi-map': 'AQI Map',
            hospitals: 'Nearby Hospitals',
            health: 'Health & Breathing',
            shelters: 'AQI Shelters',
            'policy-rating': 'Rate Policies',
            events: 'Events',
            profile: 'Profile Settings'
        };

        document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
        
        // Load section content
        this.loadSectionContent(sectionName);
    }

    async loadSectionContent(sectionName) {
        const contentDiv = document.getElementById('dynamic-content');
        contentDiv.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

        try {
            let html = '';
            
            switch (sectionName) {
                case 'complaints':
                    html = await this.loadComplaintsSection();
                    break;
                case 'tracking':
                    html = await this.loadTrackingSection();
                    break;
                case 'aqi-map':
                    html = await this.loadMapSection();
                    break;
                case 'health':
                    html = await this.loadHealthSection();
                    break;
                // Add other sections...
                default:
                    document.getElementById('dashboard-section').style.display = 'block';
                    document.getElementById('dynamic-content').innerHTML = '';
                    return;
            }

            document.getElementById('dashboard-section').style.display = 'none';
            contentDiv.innerHTML = html;
            this.initSectionSpecificScripts(sectionName);
        } catch (error) {
            console.error('Error loading section:', error);
            contentDiv.innerHTML = '<div class="alert alert-danger">Error loading content</div>';
        }
    }

    async loadComplaintsSection() {
        return `
            <div class="complaints-section">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">Submit Pollution Complaint</h5>
                            </div>
                            <div class="card-body">
                                <form id="complaintForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="complaintType" class="form-label">Complaint Type</label>
                                            <select class="form-select" id="complaintType" required>
                                                <option value="">Select Type</option>
                                                <option value="industrial_pollution">Industrial Pollution</option>
                                                <option value="vehicle_emission">Vehicle Emission</option>
                                                <option value="construction_dust">Construction Dust</option>
                                                <option value="waste_burning">Waste Burning</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="priority" class="form-label">Priority Level</label>
                                            <select class="form-select" id="priority" required>
                                                <option value="">Select Priority</option>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="location" class="form-label">Location</label>
                                        <input type="text" class="form-control" id="location" required 
                                               placeholder="Enter location or use current location">
                                    </div>
                                    <div class="mb-3">
                                        <label for="description" class="form-label">Description</label>
                                        <textarea class="form-control" id="description" rows="4" 
                                                  placeholder="Please describe the pollution issue in detail..." required></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Photo Evidence (Optional)</label>
                                        <div class="photo-upload-area" id="photoUploadArea">
                                            <input type="file" id="photoUpload" multiple accept="image/*" style="display: none;">
                                            <div class="upload-placeholder" onclick="document.getElementById('photoUpload').click()">
                                                <i class="fas fa-camera fa-2x mb-2"></i>
                                                <p>Click to upload photos</p>
                                                <small class="text-muted">Max 5 photos, 5MB each</small>
                                            </div>
                                        </div>
                                        <div class="photo-preview mt-3" id="photoPreview"></div>
                                    </div>
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary btn-lg">
                                            <i class="fas fa-paper-plane me-2"></i>Submit Complaint
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initSectionSpecificScripts(sectionName) {
        switch (sectionName) {
            case 'complaints':
                this.initComplaintsForm();
                break;
            case 'aqi-map':
                this.initMap();
                break;
            // Add other section initializations...
        }
    }

    initComplaintsForm() {
        const form = document.getElementById('complaintForm');
        const photoUpload = document.getElementById('photoUpload');
        const photoPreview = document.getElementById('photoPreview');

        if (photoUpload) {
            photoUpload.addEventListener('change', (e) => {
                this.handlePhotoUpload(e, photoPreview);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.handleComplaintSubmit(e));
        }
    }

    handlePhotoUpload(event, previewContainer) {
        const files = event.target.files;
        previewContainer.innerHTML = '';

        for (let i = 0; i < Math.min(files.length, 5); i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'photo-preview-item';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="btn btn-sm btn-danger remove-photo">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(preview);

                // Add remove functionality
                preview.querySelector('.remove-photo').addEventListener('click', () => {
                    preview.remove();
                });
            };

            reader.readAsDataURL(file);
        }
    }

    async handleComplaintSubmit(e) {
        e.preventDefault();
        
        const formData = {
            complaint_type: document.getElementById('complaintType').value,
            priority: document.getElementById('priority').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/citizen/complaints`, {
                method: 'POST',
                headers: window.authManager.getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showAlert('Complaint submitted successfully!', 'success');
                document.getElementById('complaintForm').reset();
                document.getElementById('photoPreview').innerHTML = '';
            } else {
                this.showAlert('Error submitting complaint', 'danger');
            }
        } catch (error) {
            this.showAlert('Network error. Please try again.', 'danger');
        }
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const content = document.getElementById('dynamic-content') || document.querySelector('.main-content');
        content.prepend(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.citizenDashboard = new CitizenDashboard();
});

// Global function for showing sections from quick actions
function showSection(sectionName) {
    if (window.citizenDashboard) {
        window.citizenDashboard.showSection(sectionName);
    }
}
