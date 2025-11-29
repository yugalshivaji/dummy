class HealthManager {
    constructor() {
        this.breathingInterval = null;
        this.isBreathingActive = false;
        this.currentStep = 0;
        this.init();
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Breathing exercise controls
        const startBtn = document.getElementById('startBreathing');
        const stopBtn = document.getElementById('stopBreathing');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startBreathingExercise());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopBreathingExercise());
        }

        // Health assessment form
        const healthForm = document.getElementById('healthAssessmentForm');
        if (healthForm) {
            healthForm.addEventListener('submit', (e) => this.handleHealthAssessment(e));
        }
    }

    startBreathingExercise() {
        if (this.isBreathingActive) return;

        this.isBreathingActive = true;
        this.currentStep = 0;
        
        const circle = document.getElementById('breathingCircle');
        const instruction = document.getElementById('breathingInstruction');
        const timer = document.getElementById('breathingTimer');
        
        circle.style.animation = 'breathe 4s infinite ease-in-out';
        instruction.textContent = 'Breathe in slowly...';
        
        let seconds = 0;
        
        this.breathingInterval = setInterval(() => {
            seconds++;
            timer.textContent = this.formatTime(seconds);
            
            // Cycle through breathing instructions
            this.currentStep = (this.currentStep + 1) % 4;
            
            switch (this.currentStep) {
                case 0:
                    instruction.textContent = 'Breathe in slowly...';
                    break;
                case 1:
                    instruction.textContent = 'Hold your breath...';
                    break;
                case 2:
                    instruction.textContent = 'Breathe out slowly...';
                    break;
                case 3:
                    instruction.textContent = 'Hold...';
                    break;
            }
        }, 4000);
        
        // Update button states
        document.getElementById('startBreathing').disabled = true;
        document.getElementById('stopBreathing').disabled = false;
    }

    stopBreathingExercise() {
        if (!this.isBreathingActive) return;

        this.isBreathingActive = false;
        clearInterval(this.breathingInterval);
        
        const circle = document.getElementById('breathingCircle');
        const instruction = document.getElementById('breathingInstruction');
        
        circle.style.animation = 'none';
        instruction.textContent = 'Click start to begin breathing exercise';
        
        // Update button states
        document.getElementById('startBreathing').disabled = false;
        document.getElementById('stopBreathing').disabled = true;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    async handleHealthAssessment(e) {
        e.preventDefault();
        
        const formData = {
            age: parseInt(document.getElementById('age').value),
            has_respiratory_conditions: document.getElementById('respiratoryConditions').checked,
            is_smoker: document.getElementById('smoker').checked,
            activity_level: document.getElementById('activityLevel').value
        };

        try {
            const response = await CommonUtils.makeApiCall('/citizen/health-assessment', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response) {
                this.displayHealthResults(response);
            }
        } catch (error) {
            // Use mock response if API fails
            this.displayHealthResults(this.getMockHealthResponse(formData));
        }
    }

    displayHealthResults(results) {
        const resultsDiv = document.getElementById('healthResults');
        
        resultsDiv.innerHTML = `
            <div class="health-results-card">
                <div class="risk-level alert alert-${results.risk_level === 'high' ? 'danger' : 'warning'}">
                    <h5>Risk Level: ${results.risk_level.toUpperCase()}</h5>
                </div>
                
                <div class="points-earned alert alert-info">
                    <strong>Points Earned:</strong> ${results.points_earned}
                    <br>
                    <strong>Total Points:</strong> ${results.total_points}
                </div>
                
                <h6>Personalized Recommendations:</h6>
                <ul class="recommendations-list">
                    ${results.personalized_recommendations.map(rec => 
                        `<li><i class="fas fa-check-circle text-success"></i> ${rec}</li>`
                    ).join('')}
                </ul>
                
                <div class="additional-tips mt-3">
                    <h6>Additional Health Tips:</h6>
                    <div class="tips-grid">
                        <div class="tip-item">
                            <i class="fas fa-mask"></i>
                            <span>Use N95 masks outdoors</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-home"></i>
                            <span>Use air purifiers indoors</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-tint"></i>
                            <span>Stay hydrated</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-procedures"></i>
                            <span>Regular health checkups</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.classList.remove('d-none');
    }

    getMockHealthResponse(formData) {
        const recommendations = [];
        
        if (formData.has_respiratory_conditions || formData.age > 60) {
            recommendations.push('Use N95 masks when going outside');
            recommendations.push('Keep medications and inhalers handy');
            recommendations.push('Consider using air purifiers at home');
        }
        
        if (formData.is_smoker) {
            recommendations.push('Avoid smoking, especially during high pollution days');
            recommendations.push('Consider smoking cessation programs');
        }
        
        if (formData.activity_level === 'high') {
            recommendations.push('Shift intense workouts indoors');
            recommendations.push('Consider early morning or late evening for outdoor activities');
        }
        
        recommendations.push('Monitor AQI regularly before planning outdoor activities');
        recommendations.push('Keep windows closed during peak pollution hours');
        
        return {
            personalized_recommendations: recommendations,
            risk_level: formData.has_respiratory_conditions ? 'high' : 'moderate',
            points_earned: 10,
            total_points: 110
        };
    }
}

// Initialize health manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.healthManager = new HealthManager();
});
