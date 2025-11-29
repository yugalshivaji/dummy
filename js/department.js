class DepartmentDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.complaints = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.initEventListeners();
        this.loadDashboardData();
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('aqi_user') || '{}');
        document.getElementById('userName').textContent = user.name || 'Department User';
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
            await this.loadComplaintStats();
            await this.loadRecentComplaints();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadComplaintStats() {
        try {
            const data = await CommonUtils.makeApiCall('/department/dashboard');
            if (data && data.stats) {
                this.updateComplaintStats(data.stats);
            }
        } catch (error) {
            // Use mock data
            this.updateComplaintStats(this.getMockStats());
        }
    }

    updateComplaintStats(stats) {
        document.getElementById('totalComplaints').textContent = stats.total_complaints;
        document.getElementById('pendingComplaints').textContent = stats.pending_complaints;
        document.getElementById('inProgressComplaints').textContent = stats.in_progress_complaints;
        document.getElementById('resolvedComplaints').textContent = stats.resolved_complaints;
    }

    async loadRecentComplaints() {
        try {
            const data = await CommonUtils.makeApiCall('/department/complaints');
            if (data) {
                this.complaints = data;
                this.updateRecentComplaintsTable(data.slice(0, 5));
            }
        } catch (error) {
            // Use mock data
            const mockData = this.getMockComplaints();
            this.complaints = mockData;
            this.updateRecentComplaintsTable(mockData.slice(0, 5));
        }
    }

    updateRecentComplaintsTable(complaints) {
        const tbody = document.querySelector('#recentComplaintsTable tbody');
        tbody.innerHTML = complaints.map(complaint => `
            <tr>
                <td>#${complaint.id}</td>
                <td>${complaint.complaint_type.replace('_', ' ')}</td>
                <td><span class="badge badge-priority-${complaint.priority}">${complaint.priority}</span></td>
                <td><span class="badge badge-status-${complaint.status}">${complaint.status}</span></td>
                <td>${CommonUtils.formatDate(complaint.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="departmentDashboard.viewComplaint(${complaint.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
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
            dashboard: 'Department Dashboard',
            complaints: 'Complaint Management',
            reports: 'Reports & Analytics',
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
                case 'complaints':
                    html = await this.loadComplaintsSection();
                    break;
                case 'reports':
                    html = await this.loadReportsSection();
                    break;
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
        const complaints = await this.getAllComplaints();
        
        return `
            <div class="complaints-management-section">
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">All Complaints</h5>
                                <div class="filter-controls">
                                    <select class="form-select form-select-sm" id="statusFilter" onchange="departmentDashboard.filterComplaints()">
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover" id="allComplaintsTable">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <input type="checkbox" id="selectAll" onchange="departmentDashboard.toggleSelectAll()">
                                                </th>
                                                <th>ID</th>
                                                <th>Type</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Location</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${complaints.map(complaint => this.createComplaintRow(complaint)).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="bulk-actions mt-3" id="bulkActions" style="display: none;">
                                    <div class="d-flex gap-2">
                                        <select class="form-select" id="bulkStatus">
                                            <option value="">Change Status To...</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <button class="btn btn-primary" onclick="departmentDashboard.applyBulkAction()">Apply</button>
                                        <button class="btn btn-secondary" onclick="departmentDashboard.hideBulkActions()">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createComplaintRow(complaint) {
        return `
            <tr>
                <td>
                    <input type="checkbox" class="complaint-checkbox" value="${complaint.id}">
                </td>
                <td>#${complaint.id}</td>
                <td>${complaint.complaint_type.replace('_', ' ')}</td>
                <td><span class="badge badge-priority-${complaint.priority}">${complaint.priority}</span></td>
                <td>
                    <select class="form-select form-select-sm status-select" data-complaint-id="${complaint.id}">
                        <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="rejected" ${complaint.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
                <td>${complaint.location}</td>
                <td>${CommonUtils.formatDate(complaint.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="departmentDashboard.viewComplaint(${complaint.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="departmentDashboard.assignDepartment(${complaint.id})">
                        <i class="fas fa-users"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    initSectionSpecificScripts(sectionName) {
        if (sectionName === 'complaints') {
            this.initComplaintManagement();
        }
    }

    initComplaintManagement() {
        // Add event listeners for status changes
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const complaintId = e.target.dataset.complaintId;
                const newStatus = e.target.value;
                this.updateComplaintStatus(complaintId, newStatus);
            });
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.complaint-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleBulkActions();
            });
        });
    }

    async updateComplaintStatus(complaintId, newStatus) {
        try {
            const response = await CommonUtils.makeApiCall(`/department/complaints/${complaintId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (response) {
                this.showAlert('Complaint status updated successfully!', 'success');
            }
        } catch (error) {
            this.showAlert('Error updating complaint status', 'danger');
        }
    }

    toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.complaint-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
        
        this.toggleBulkActions();
    }

    toggleBulkActions() {
        const checkedBoxes = document.querySelectorAll('.complaint-checkbox:checked');
        const bulkActions = document.getElementById('bulkActions');
        
        if (checkedBoxes.length > 0) {
            bulkActions.style.display = 'block';
        } else {
            bulkActions.style.display = 'none';
        }
    }

    hideBulkActions() {
        document.getElementById('bulkActions').style.display = 'none';
        document.getElementById('selectAll').checked = false;
        document.querySelectorAll('.complaint-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    async applyBulkAction() {
        const selectedStatus = document.getElementById('bulkStatus').value;
        if (!selectedStatus) {
            this.showAlert('Please select a status', 'warning');
            return;
        }

        const checkedBoxes = document.querySelectorAll('.complaint-checkbox:checked');
        const complaintIds = Array.from(checkedBoxes).map(cb => cb.value);

        try {
            const response = await CommonUtils.makeApiCall('/department/complaints/bulk-update', {
                method: 'POST',
                body: JSON.stringify({
                    complaint_ids: complaintIds,
                    status: selectedStatus
                })
            });

            if (response) {
                this.showAlert(`Updated ${response.updated_count} complaints`, 'success');
                this.hideBulkActions();
                this.loadDashboardData(); // Refresh data
            }
        } catch (error) {
            this.showAlert('Error updating complaints', 'danger');
        }
    }

    // Mock data methods
    getMockStats() {
        return {
            total_complaints: 156,
            pending_complaints: 45,
            in_progress_complaints: 32,
            resolved_complaints: 79,
            resolution_rate: 50.6,
            avg_resolution_time: 24.5
        };
    }

    getMockComplaints() {
        return [
            {
                id: 1001,
                complaint_type: 'vehicle_emission',
                priority: 'high',
                status: 'pending',
                location: 'Connaught Place',
                description: 'Heavy smoke from buses',
                created_at: new Date().toISOString()
            },
            {
                id: 1002,
                complaint_type: 'construction_dust',
                priority: 'critical',
                status: 'in-progress',
                location: 'Dwarka Sector 12',
                description: 'Construction site without dust control',
                created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 1003,
                complaint_type: 'industrial_pollution',
                priority: 'medium',
                status: 'resolved',
                location: 'Okhla Industrial Area',
                description: 'Factory emitting black smoke',
                created_at: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }

    async getAllComplaints() {
        try {
            const response = await CommonUtils.makeApiCall('/department/complaints');
            return response || this.getMockComplaints();
        } catch (error) {
            return this.getMockComplaints();
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

    // Placeholder methods for future implementation
    viewComplaint(complaintId) {
        alert(`View complaint ${complaintId} - Feature coming soon!`);
    }

    assignDepartment(complaintId) {
        alert(`Assign department for complaint ${complaintId} - Feature coming soon!`);
    }

    async loadReportsSection() {
        return `
            <div class="reports-section">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title">Monthly Performance Report</h5>
                            </div>
                            <div class="card-body">
                                <div class="text-center py-5">
                                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                                    <p>Reports and analytics feature coming soon!</p>
                                    <button class="btn btn-primary" onclick="generateReport()">
                                        <i class="fas fa-download me-2"></i>Generate Sample Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global functions
function generateReport() {
    alert('Report generation feature coming soon!');
}

function showBulkActions() {
    const departmentDashboard = window.departmentDashboard;
    if (departmentDashboard) {
        departmentDashboard.showSection('complaints');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.departmentDashboard = new DepartmentDashboard();
});
