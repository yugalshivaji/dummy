class PolicymakerDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.policyData = [];
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
        document.getElementById('userName').textContent = user.name || 'Policymaker';
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
            await this.loadZoneWiseAQI();
            await this.loadPolicyAnalytics();
            await this.loadRecentFeedback();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadZoneWiseAQI() {
        try {
            const data = await CommonUtils.makeApiCall('/policymaker/dashboard');
            if (data && data.zone_wise_aqi) {
                this.updateZoneWiseAQI(data.zone_wise_aqi);
            }
        } catch (error) {
            // Use mock data if API fails
            this.updateZoneWiseAQI(this.getMockZoneData());
        }
    }

    updateZoneWiseAQI(zones) {
        const container = document.getElementById('zoneWiseAQI');
        container.innerHTML = zones.map(zone => `
            <div class="col-md-4 mb-3">
                <div class="zone-card card h-100">
                    <div class="card-body">
                        <h6 class="card-title">${zone.zone}</h6>
                        <div class="aqi-value-large" style="color: ${CommonUtils.getAQIColor(zone.current_aqi)}">
                            ${zone.current_aqi}
                        </div>
                        <div class="aqi-status">${CommonUtils.getAQIStatus(zone.current_aqi)}</div>
                        <div class="zone-trend ${zone.trend}">
                            <i class="fas fa-${zone.trend === 'improving' ? 'arrow-down' : 'arrow-up'}"></i>
                            ${zone.trend}
                        </div>
                        <div class="dominant-pollutant">
                            Dominant: ${zone.dominant_pollutant}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadPolicyAnalytics() {
        try {
            const data = await CommonUtils.makeApiCall('/policymaker/dashboard');
            if (data && data.policy_analyses) {
                this.updatePolicyAnalytics(data.policy_analyses);
            }
        } catch (error) {
            // Use mock data
            this.updatePolicyAnalytics(this.getMockPolicyData());
        }
    }

    updatePolicyAnalytics(policies) {
        this.initPolicyPerformanceChart(policies);
        this.updateDemographicsStats(policies);
    }

    initPolicyPerformanceChart(policies) {
        const ctx = document.getElementById('policyPerformanceChart');
        if (!ctx) return;

        const chartData = {
            labels: policies.map(p => p.policy_type.replace('_', ' ').toUpperCase()),
            datasets: [
                {
                    label: 'Average Rating',
                    data: policies.map(p => p.average_rating),
                    backgroundColor: 'rgba(255, 153, 51, 0.8)',
                    borderColor: 'rgba(255, 153, 51, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Effectiveness Score',
                    data: policies.map(p => p.effectiveness_score),
                    backgroundColor: 'rgba(19, 136, 8, 0.8)',
                    borderColor: 'rgba(19, 136, 8, 1)',
                    borderWidth: 2
                }
            ]
        };

        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Policy Performance Metrics'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateDemographicsStats(policies) {
        const container = document.getElementById('demographicsStats');
        const totalRatings = policies.reduce((sum, policy) => sum + policy.total_ratings, 0);
        const avgRating = (policies.reduce((sum, policy) => sum + policy.average_rating, 0) / policies.length).toFixed(1);

        container.innerHTML = `
            <div class="demographic-item mb-3">
                <div class="d-flex justify-content-between">
                    <span>Total Ratings:</span>
                    <strong>${totalRatings}</strong>
                </div>
            </div>
            <div class="demographic-item mb-3">
                <div class="d-flex justify-content-between">
                    <span>Average Rating:</span>
                    <strong>${avgRating}/5</strong>
                </div>
            </div>
            <div class="demographic-item mb-3">
                <div class="d-flex justify-content-between">
                    <span>Public Acceptance:</span>
                    <strong>${((policies.reduce((sum, policy) => sum + policy.positive_feedback, 0) / totalRatings) * 100).toFixed(1)}%</strong>
                </div>
            </div>
        `;
    }

    async loadRecentFeedback() {
        try {
            const data = await CommonUtils.makeApiCall('/policymaker/dashboard');
            if (data && data.recent_feedback) {
                this.updateRecentFeedback(data.recent_feedback);
            }
        } catch (error) {
            // Use mock data
            this.updateRecentFeedback(this.getMockFeedback());
        }
    }

    updateRecentFeedback(feedback) {
        const container = document.getElementById('recentFeedback');
        container.innerHTML = feedback.map(item => `
            <div class="feedback-item mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong class="policy-type">${item.policy_type.replace('_', ' ').toUpperCase()}</strong>
                    <div class="rating">
                        ${this.generateStars(item.rating)}
                    </div>
                </div>
                ${item.feedback ? `<p class="feedback-text mb-2">"${item.feedback}"</p>` : ''}
                <small class="text-muted">${CommonUtils.formatDate(item.created_at)}</small>
            </div>
        `).join('');
    }

    generateStars(rating) {
        return Array.from({length: 5}, (_, i) => 
            `<i class="fas fa-star${i < rating ? ' text-warning' : ' text-muted'}"></i>`
        ).join('');
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
            dashboard: 'Policy Dashboard',
            'policy-analysis': 'Policy Analysis',
            ratings: 'View Ratings',
            'aqi-map': 'AQI Map',
            hospitals: 'Hospitals',
            health: 'Health Tools',
            profile: 'Settings'
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
                case 'policy-analysis':
                    html = await this.loadPolicyAnalysisSection();
                    break;
                case 'ratings':
                    html = await this.loadRatingsSection();
                    break;
                default:
                    document.getElementById('dashboard-section').style.display = 'block';
                    document.getElementById('dynamic-content').innerHTML = '';
                    return;
            }

            document.getElementById('dashboard-section').style.display = 'none';
            contentDiv.innerHTML = html;
        } catch (error) {
            console.error('Error loading section:', error);
            contentDiv.innerHTML = '<div class="alert alert-danger">Error loading content</div>';
        }
    }

    async loadPolicyAnalysisSection() {
        const policies = await this.getPolicyAnalysisData();
        
        return `
            <div class="policy-analysis-section">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">Detailed Policy Analysis</h5>
                            </div>
                            <div class="card-body">
                                ${policies.map(policy => this.createPolicyAnalysisCard(policy)).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createPolicyAnalysisCard(policy) {
        return `
            <div class="policy-card">
                <div class="policy-header">
                    <div class="policy-title">${policy.policy_type.replace('_', ' ').toUpperCase()}</div>
                    <div class="rating-value">${policy.average_rating}/5</div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <h6>Effectiveness Metrics</h6>
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <span>Public Acceptance:</span>
                                <strong>${((policy.positive_feedback / policy.total_ratings) * 100).toFixed(1)}%</strong>
                            </div>
                            <div class="metric-item">
                                <span>Effectiveness Score:</span>
                                <strong>${policy.effectiveness_score}%</strong>
                            </div>
                            <div class="metric-item">
                                <span>Total Ratings:</span>
                                <strong>${policy.total_ratings}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Sentiment Analysis</h6>
                        <div class="sentiment-bars">
                            <div class="sentiment-item positive">
                                <span>Positive</span>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: ${(policy.positive_feedback / policy.total_ratings) * 100}%"></div>
                                </div>
                                <span>${policy.positive_feedback}</span>
                            </div>
                            <div class="sentiment-item neutral">
                                <span>Neutral</span>
                                <div class="progress">
                                    <div class="progress-bar bg-warning" style="width: ${(policy.neutral_feedback / policy.total_ratings) * 100}%"></div>
                                </div>
                                <span>${policy.neutral_feedback}</span>
                            </div>
                            <div class="sentiment-item negative">
                                <span>Negative</span>
                                <div class="progress">
                                    <div class="progress-bar bg-danger" style="width: ${(policy.negative_feedback / policy.total_ratings) * 100}%"></div>
                                </div>
                                <span>${policy.negative_feedback}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="policy-recommendations mt-3">
                    <h6>Recommendations:</h6>
                    <ul>
                        <li>Increase public awareness about policy benefits</li>
                        <li>Address concerns raised in negative feedback</li>
                        <li>Monitor AQI impact continuously</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Mock data methods
    getMockZoneData() {
        return [
            { zone: 'Central Delhi', current_aqi: 256, trend: 'improving', dominant_pollutant: 'PM2.5' },
            { zone: 'South Delhi', current_aqi: 198, trend: 'worsening', dominant_pollutant: 'PM10' },
            { zone: 'North Delhi', current_aqi: 312, trend: 'stable', dominant_pollutant: 'NO2' },
            { zone: 'East Delhi', current_aqi: 278, trend: 'improving', dominant_pollutant: 'PM2.5' },
            { zone: 'West Delhi', current_aqi: 234, trend: 'worsening', dominant_pollutant: 'SO2' },
            { zone: 'Noida', current_aqi: 267, trend: 'stable', dominant_pollutant: 'PM10' }
        ];
    }

    getMockPolicyData() {
        return [
            {
                policy_type: 'odd_even',
                average_rating: 4.2,
                total_ratings: 150,
                positive_feedback: 95,
                neutral_feedback: 35,
                negative_feedback: 20,
                effectiveness_score: 84
            },
            {
                policy_type: 'grap',
                average_rating: 3.8,
                total_ratings: 120,
                positive_feedback: 70,
                neutral_feedback: 30,
                negative_feedback: 20,
                effectiveness_score: 76
            },
            {
                policy_type: 'ev_promotion',
                average_rating: 4.5,
                total_ratings: 180,
                positive_feedback: 140,
                neutral_feedback: 25,
                negative_feedback: 15,
                effectiveness_score: 90
            }
        ];
    }

    getMockFeedback() {
        return [
            {
                policy_type: 'odd_even',
                rating: 5,
                feedback: 'Great initiative! Traffic has reduced significantly.',
                created_at: new Date().toISOString()
            },
            {
                policy_type: 'ev_promotion',
                rating: 4,
                feedback: 'Good policy but need more charging stations.',
                created_at: new Date(Date.now() - 86400000).toISOString()
            }
        ];
    }

    async getPolicyAnalysisData() {
        try {
            const response = await CommonUtils.makeApiCall('/policymaker/dashboard');
            return response?.policy_analyses || this.getMockPolicyData();
        } catch (error) {
            return this.getMockPolicyData();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.policymakerDashboard = new PolicymakerDashboard();
});
