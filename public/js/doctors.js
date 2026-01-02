// Doctors page functionality
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('doctorsContainer');
  
  try {
    const doctors = await getDoctors();
    
    if (doctors.length === 0) {
      container.innerHTML = '<div class="card"><p>No doctors available at the moment.</p></div>';
      return;
    }
    
    container.innerHTML = doctors.map(doctor => {
      const doctorImage = doctor.image_url || 'images/doctors.jpg';
      return `
      <div class="card doctor-card">
        <img src="${doctorImage}" alt="${doctor.name}" class="doctor-photo" onerror="this.onerror=null; this.src='images/doctors.jpg';" loading="lazy">
        <h3>${doctor.name}</h3>
        <p><strong>${window.langManager ? window.langManager.getTranslation('specialization') : 'Specialization'}:</strong> ${doctor.specialization}</p>
        <p><strong>${window.langManager ? window.langManager.getTranslation('department') : 'Department'}:</strong> ${doctor.department}</p>
        ${doctor.email ? `<p><strong>${window.langManager ? window.langManager.getTranslation('email') : 'Email'}:</strong> <a href="mailto:${doctor.email}" style="color: var(--primary-blue); text-decoration: none;">${doctor.email}</a></p>` : ''}
        ${doctor.bio ? `<p style="margin-top: 1rem; color: var(--gray); line-height: 1.6;">${doctor.bio}</p>` : ''}
      </div>
    `;
    }).join('');
  } catch (error) {
    container.innerHTML = '<div class="card"><p>Error loading doctors. Please try again later.</p></div>';
  }
});

