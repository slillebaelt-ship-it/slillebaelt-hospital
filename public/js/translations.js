// Multi-language translations
const translations = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About Us',
    departments: 'Departments',
    doctors: 'Doctors',
    contact: 'Contact',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    
    // Home Page
    welcome: 'Welcome to Our Hospital',
    hospitalName: 'sygehuzbaelt',
    tagline: 'Caring for Your Health, Caring for You',
    overview: 'Hospital Overview',
    overviewText: 'We are a leading healthcare institution dedicated to providing exceptional medical care to our community. With state-of-the-art facilities and a team of experienced healthcare professionals, we strive to deliver the highest quality of patient care.',
    vision: 'Our Vision',
    visionText: 'To be the most trusted and preferred healthcare provider, known for excellence in medical care, innovation, and compassionate service.',
    mission: 'Our Mission',
    missionText: 'To provide accessible, high-quality healthcare services that improve the health and well-being of our patients and community through compassionate care, advanced technology, and continuous improvement.',
    emergency: 'Emergency',
    emergencyText: '24/7 Emergency Services Available',
    bookAppointment: 'Book Appointment',
    viewDepartments: 'View Departments',
    
    // About Page
    aboutTitle: 'About Our Hospital',
    aboutText: 'sygehuzbaelt has been serving the community for over 30 years. We are committed to providing comprehensive healthcare services with a focus on patient-centered care.',
    ourValues: 'Our Values',
    compassion: 'Compassion',
    excellence: 'Excellence',
    integrity: 'Integrity',
    innovation: 'Innovation',
    
    // Departments
    departmentsTitle: 'Our Medical Departments',
    opd: 'Outpatient Department (OPD)',
    opdDesc: 'General consultations and follow-up visits',
    pharmacy: 'Pharmacy',
    pharmacyDesc: 'Complete range of medications and prescriptions',
    laboratory: 'Laboratory',
    laboratoryDesc: 'Advanced diagnostic and testing services',
    maternity: 'Maternity',
    maternityDesc: 'Comprehensive maternal and newborn care',
    emergency: 'Emergency',
    emergencyDesc: '24/7 emergency medical services',
    surgery: 'Surgery',
    surgeryDesc: 'Advanced surgical procedures and operations',
    
    // Doctors
    doctorsTitle: 'Our Medical Team',
    doctorsSubtitle: 'Experienced healthcare professionals dedicated to your well-being',
    specialization: 'Specialization',
    department: 'Department',
    contact: 'Contact',
    
    // Contact
    contactTitle: 'Contact Us',
    contactSubtitle: 'Get in touch with us',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    hours: 'Working Hours',
    sendMessage: 'Send Message',
    name: 'Name',
    message: 'Message',
    submit: 'Submit',
    contactFormSuccess: 'Thank you! Your message has been sent.',
    
    // Patient Registration
    patientRegistration: 'Patient Registration',
    registerPatient: 'Register Patient',
    patientId: 'Patient ID',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    phoneNumber: 'Phone Number',
    addressField: 'Address',
    register: 'Register',
    registrationSuccess: 'Patient registered successfully!',
    registrationError: 'Error registering patient. Please try again.',
    
    // Admin Dashboard
    dashboard: 'Dashboard',
    totalPatients: 'Total Patients',
    totalVisits: 'Total Visits',
    pendingAppointments: 'Pending Appointments',
    totalDoctors: 'Total Doctors',
    managePatients: 'Manage Patients',
    manageDoctors: 'Manage Doctors',
    manageAppointments: 'Manage Appointments',
    patientRecords: 'Patient Records',
    addDoctor: 'Add Doctor',
    editDoctor: 'Edit Doctor',
    deleteDoctor: 'Delete Doctor',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    actions: 'Actions',
    noRecords: 'No records found',
    
    // Patient Visits
    recordVisit: 'Record Patient Visit',
    visitDate: 'Visit Date',
    doctorName: 'Doctor Name',
    notes: 'Notes',
    record: 'Record',
    visitRecorded: 'Visit recorded successfully!',
    
    // Appointments
    bookAppointmentTitle: 'Book an Appointment',
    appointmentDate: 'Appointment Date',
    appointmentTime: 'Appointment Time',
    status: 'Status',
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    close: 'Close',
    allRightsReserved: 'All rights reserved.'
  },
  
  da: {
    // Navigation
    home: 'Hjem',
    about: 'Om Os',
    departments: 'Afdeling',
    doctors: 'Læger',
    contact: 'Kontakt',
    admin: 'Admin',
    login: 'Log Ind',
    logout: 'Log Ud',
    
    // Home Page
    welcome: 'Velkommen til Vores Hospital',
    hospitalName: 'sygehuzbaelt',
    tagline: 'Pleje for Dit Helbred, Pleje for Dig',
    overview: 'Hospital Oversigt',
    overviewText: 'Vi er en førende sundhedsinstitution dedikeret til at levere exceptionel medicinsk pleje til vores samfund. Med state-of-the-art faciliteter og et team af erfarne sundhedsprofessionelle, stræber vi efter at levere den højeste kvalitet af patientpleje.',
    vision: 'Vores Vision',
    visionText: 'At være den mest betroede og foretrukne sundhedsudbyder, kendt for ekspertise i medicinsk pleje, innovation og medfølende service.',
    mission: 'Vores Mission',
    missionText: 'At levere tilgængelige, højkvalitets sundhedstjenester, der forbedrer sundheden og velværet hos vores patienter og samfund gennem medfølende pleje, avanceret teknologi og kontinuerlig forbedring.',
    emergency: 'Nødsituation',
    emergencyText: '24/7 Nødstjenester Tilgængelige',
    bookAppointment: 'Book Tid',
    viewDepartments: 'Se Afdelinger',
    
    // About Page
    aboutTitle: 'Om Vores Hospital',
    aboutText: 'Byens Generelle Hospital har betjent samfundet i over 30 år. Vi er forpligtet til at levere omfattende sundhedstjenester med fokus på patientcentreret pleje.',
    ourValues: 'Vores Værdier',
    compassion: 'Medfølelse',
    excellence: 'Ekspertise',
    integrity: 'Integritet',
    innovation: 'Innovation',
    
    // Departments
    departmentsTitle: 'Vores Medicinske Afdelinger',
    opd: 'Ambulatorisk Afdeling (OPD)',
    opdDesc: 'Generelle konsultationer og opfølgende besøg',
    pharmacy: 'Apotek',
    pharmacyDesc: 'Komplet udvalg af medicin og recepter',
    laboratory: 'Laboratorium',
    laboratoryDesc: 'Avancerede diagnostiske og testtjenester',
    maternity: 'Fødselsafdeling',
    maternityDesc: 'Omfattende pleje til mødre og nyfødte',
    emergency: 'Nødsituation',
    emergencyDesc: '24/7 nødmedicinske tjenester',
    surgery: 'Kirurgi',
    surgeryDesc: 'Avancerede kirurgiske procedurer og operationer',
    
    // Doctors
    doctorsTitle: 'Vores Medicinske Team',
    doctorsSubtitle: 'Erfarne sundhedsprofessionelle dedikeret til dit velvære',
    specialization: 'Specialisering',
    department: 'Afdeling',
    contact: 'Kontakt',
    
    // Contact
    contactTitle: 'Kontakt Os',
    contactSubtitle: 'Kom i kontakt med os',
    address: 'Adresse',
    phone: 'Telefon',
    email: 'Email',
    hours: 'Åbningstider',
    sendMessage: 'Send Besked',
    name: 'Navn',
    message: 'Besked',
    submit: 'Indsend',
    contactFormSuccess: 'Tak! Din besked er blevet sendt.',
    
    // Patient Registration
    patientRegistration: 'Patient Registrering',
    registerPatient: 'Registrer Patient',
    patientId: 'Patient ID',
    age: 'Alder',
    gender: 'Køn',
    male: 'Mand',
    female: 'Kvinde',
    other: 'Andet',
    phoneNumber: 'Telefonnummer',
    addressField: 'Adresse',
    register: 'Registrer',
    registrationSuccess: 'Patient registreret med succes!',
    registrationError: 'Fejl ved registrering af patient. Prøv venligst igen.',
    
    // Admin Dashboard
    dashboard: 'Dashboard',
    totalPatients: 'Totale Patienter',
    totalVisits: 'Totale Besøg',
    pendingAppointments: 'Afventende Tider',
    totalDoctors: 'Totale Læger',
    managePatients: 'Administrer Patienter',
    manageDoctors: 'Administrer Læger',
    manageAppointments: 'Administrer Tider',
    patientRecords: 'Patient Optegnelser',
    addDoctor: 'Tilføj Læge',
    editDoctor: 'Rediger Læge',
    deleteDoctor: 'Slet Læge',
    save: 'Gem',
    cancel: 'Annuller',
    search: 'Søg',
    actions: 'Handlinger',
    noRecords: 'Ingen optegnelser fundet',
    
    // Patient Visits
    recordVisit: 'Registrer Patient Besøg',
    visitDate: 'Besøgsdato',
    doctorName: 'Lægens Navn',
    notes: 'Noter',
    record: 'Registrer',
    visitRecorded: 'Besøg registreret med succes!',
    
    // Appointments
    bookAppointmentTitle: 'Book en Tid',
    appointmentDate: 'Tidsdato',
    appointmentTime: 'Tidspunkt',
    status: 'Status',
    pending: 'Afventende',
    confirmed: 'Bekræftet',
    completed: 'Fuldført',
    cancelled: 'Annulleret',
    
    // Common
    loading: 'Indlæser...',
    error: 'Fejl',
    success: 'Succes',
    close: 'Luk',
    allRightsReserved: 'Alle rettigheder forbeholdes.'
  },
  
};

// Language Manager
class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('selectedLanguage') || 'en';
    this.init();
  }
  
  init() {
    this.setLanguage(this.currentLang);
    this.setupLanguageSwitcher();
  }
  
  setLanguage(lang) {
    if (!translations[lang]) {
      lang = 'en';
    }
    this.currentLang = lang;
    localStorage.setItem('selectedLanguage', lang);
    this.translatePage();
    this.updateLanguageSwitcher();
  }
  
  translatePage() {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = this.getTranslation(key);
      if (translation) {
        if (element.tagName === 'INPUT' && element.type === 'submit') {
          element.value = translation;
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }
  
  getTranslation(key) {
    const keys = key.split('.');
    let value = translations[this.currentLang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }
  
  setupLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
      switcher.value = this.currentLang;
      switcher.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }
  }
  
  updateLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    if (switcher) {
      switcher.value = this.currentLang;
    }
  }
}

// Initialize language manager
const langManager = new LanguageManager();
window.langManager = langManager; // Make globally accessible

