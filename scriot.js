// Configuration API
const API_BASE = 'http://localhost:3001/api';

// Stockage local pour token
let token = localStorage.getItem('token');

// Données (chargées depuis API)
let courses = [];
let testimonials = [];
let students = [];

// Login avec API
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success || data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('userName').textContent = data.user?.email || 'Admin';
            loadDashboard();
            showMessage('✅ Connexion réussie !', 'success');
        } else {
            showMessage('❌ Identifiants incorrects', 'error');
        }
    } catch (error) {
        showMessage('❌ Erreur serveur. Vérifiez que le backend tourne sur port 3001', 'error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    token = null;
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginForm').reset();
});

// Fonction utilitaire API
async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return response.json();
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', async function(e) {
        e.preventDefault();
        const section = this.dataset.section;
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Show section
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        document.getElementById(section + 'Section').style.display = 'block';
        
        // Load data
        if (section === 'courses') await loadCourses();
        if (section === 'testimonials') await loadTestimonials();
        if (section === 'students') await loadStudents();
    });
});

// Load Dashboard
async function loadDashboard() {
    try {
        const stats = await apiRequest('/courses');
        document.getElementById('totalCourses').textContent = stats.length || 0;
        
        const studentsData = await apiRequest('/students');
        document.getElementById('totalStudents').textContent = studentsData.length || 0;
        
        const testimonialsData = await apiRequest('/testimonials');
        document.getElementById('totalTestimonials').textContent = testimonialsData.length || 0;
        
        document.getElementById('revenue').textContent = '€' + 
            ((stats.reduce((sum, c) => sum + (c.price || 0), 0) * 5).toLocaleString());
    } catch (error) {
        console.error('Erreur dashboard:', error);
    }
}

// Load Courses
async function loadCourses() {
    try {
        courses = await apiRequest('/courses');
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = courses.map(course => `
            <tr>
                <td>${course.id}</td>
                <td>${course.title}</td>
                <td>${course.description?.substring(0, 50)}...</td>
                <td>€${course.price}</td>
                <td>${course.duration}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editCourse(${course.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCourse(${course.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Erreur chargement cours', 'error');
    }
}

// Load Testimonials
async function loadTestimonials() {
    try {
        testimonials = await apiRequest('/testimonials');
        const tbody = document.getElementById('testimonialsTableBody');
        tbody.innerHTML = testimonials.map(testimonial => `
            <tr>
                <td>${testimonial.id}</td>
                <td>${testimonial.name}</td>
                <td>${testimonial.text?.substring(0, 50)}...</td>
                <td>${'★'.repeat(testimonial.rating || 5)}</td>
                <td>
                    <span style="color: ${testimonial.status === 'published' ? 'var(--success)' : 'var(--warning)'}">
                        ${testimonial.status || 'published'}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTestimonial(${testimonial.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTestimonial(${testimonial.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Erreur chargement témoignages', 'error');
    }
}

// Load Students
async function loadStudents() {
    try {
        students = await apiRequest('/students');
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.course_name || 'Non assigné'}</td>
                <td>${student.enrollment_date || 'N/A'}</td>
                <td>
                    <span style="color: ${student.status === 'active' ? 'var(--success)' : 'var(--danger)'}">
                        ${student.status || 'active'}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage('Erreur chargement élèves', 'error');
    }
}

// Course CRUD
document.getElementById('courseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('courseId').value;
    const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        price: parseInt(document.getElementById('coursePrice').value),
        duration: document.getElementById('courseDuration').value,
        icon: document.getElementById('courseIcon').value
    };

    try {
        let response;
        if (id) {
            response = await apiRequest(`/courses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(courseData)
            });
        } else {
            response = await apiRequest('/courses', {
                method: 'POST',
                body: JSON.stringify(courseData)
            });
        }
        
        closeModal('courseModal');
        await loadCourses();
        showMessage('✅ Cours sauvegardé !', 'success');
    } catch (error) {
        showMessage('❌ Erreur sauvegarde', 'error');
    }
});

async function editCourse(id) {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    
    document.getElementById('courseId').value = course.id;
    document.getElementById('courseTitle').value = course.title;
    document.getElementById('courseDescription').value = course.description;
    document.getElementById('coursePrice').value = course.price;
    document.getElementById('courseDuration').value = course.duration;
    document.getElementById('courseIcon').value = course.icon;
    document.getElementById('courseModalTitle').textContent = 'Modifier le cours';
    openModal('courseModal');
}

async function deleteCourse(id) {
    if (!confirm('Supprimer ce cours ?')) return;
    
    try {
        const response = await apiRequest(`/courses/${id}`, { method: 'DELETE' });
        await loadCourses();
        showMessage('✅ Cours supprimé !', 'success');
    } catch (error) {
        showMessage('❌ Erreur suppression', 'error');
    }
}

// Testimonial CRUD
document.getElementById('testimonialForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('testimonialId').value;
    const testimonialData = {
        name: document.getElementById('testimonialName').value,
        text: document.getElementById('testimonialText').value,
        rating: parseInt(document.getElementById('testimonialRating').value),
        status: document.getElementById('testimonialStatus').value
    };

    try {
        let response;
        if (id) {
            response = await apiRequest(`/testimonials/${id}`, {
                method: 'PUT',
                body: JSON.stringify(testimonialData)
            });
        } else {
            response = await apiRequest('/testimonials', {
                method: 'POST',
                body: JSON.stringify(testimonialData)
            });
        }
        
        closeModal('testimonialModal');
        await loadTestimonials();
        showMessage('✅ Témoignage sauvegardé !', 'success');
    } catch (error) {
        showMessage('❌ Erreur sauvegarde', 'error');
    }
});

async function editTestimonial(id) {
    const testimonial = testimonials.find(t => t.id === id);
    if (!testimonial) return;
    
    document.getElementById('testimonialId').value = testimonial.id;
    document.getElementById('testimonialName').value = testimonial.name;
    document.getElementById('testimonialText').value = testimonial.text;
    document.getElementById('testimonialRating').value = testimonial.rating;
    document.getElementById('testimonialStatus').value = testimonial.status;
    document.getElementById('testimonialModalTitle').textContent = 'Modifier le témoignage';
    openModal('testimonialModal');
}

async function deleteTestimonial(id) {
    if (!confirm('Supprimer ce témoignage ?')) return;
    
    try {
        await apiRequest(`/testimonials/${id}`, { method: 'DELETE' });
        await loadTestimonials();
        showMessage('✅ Témoignage supprimé !', 'success');
    } catch (error) {
        showMessage('❌ Erreur suppression', 'error');
    }
}

// Modal functions (inchangées)
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    const form = document.getElementById(modalId + 'Form');
    form.reset();
    form.querySelector('[name="id"]').value = ''; // Reset hidden id
}

// Messages
function showMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = type === 'success' ? 'success-msg' : 'error-msg';
    msg.textContent = text;
    document.querySelector('.main-content')?.insertBefore(msg, document.querySelector('.main-content').firstChild) ||
    document.body.insertBefore(msg, document.body.firstChild);
    setTimeout(() => msg.remove(), 4000);
}

// Close modals on outside click
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        const modalId = e.target.id;
        closeModal(modalId);
    }
});

// Auto-login si token valide
if (token) {
    // Vérifier token
    apiRequest('/courses').then(() => {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadDashboard();
    }).catch(() => {
        localStorage.removeItem('token');
    });
}