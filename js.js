// Exemple d'export des données (à adapter avec votre backend)
function exportDataToSite() {
    localStorage.setItem('courses', JSON.stringify(courses));
    localStorage.setItem('testimonials', JSON.stringify(testimonials));
    
    // Rechargez votre page principale pour voir les changements
    location.reload();
}