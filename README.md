# Hospital Website - Multi-language Support

A modern, responsive hospital website with English and Danish language support, patient management system, and admin dashboard.

## Features

- 🌐 **Multi-language Support**: English and Danish with easy language switching
- 👥 **Patient Management**: Registration with unique Patient ID generation
- 📋 **Patient Visit Records**: Track patient visits by department and doctor
- 👨‍⚕️ **Doctor Management**: Add, edit, and manage doctors
- 📅 **Appointment Booking**: Online appointment booking system
- 🔐 **Admin Dashboard**: Secure login and comprehensive management interface
- 📱 **Fully Responsive**: Works on all devices (mobile, tablet, desktop)
- 🎨 **Medical Theme**: Clean blue & white medical-themed design

## Pages

1. **Home** - Hospital overview, vision, and mission
2. **About Us** - Hospital information and values
3. **Departments** - Medical departments (OPD, Pharmacy, Laboratory, Maternity, Emergency, Surgery)
4. **Doctors** - Medical team profiles
5. **Contact** - Contact information and contact form
6. **Patient Registration** - Register new patients
7. **Appointment Booking** - Book appointments online
8. **Admin Dashboard** - Manage patients, doctors, appointments, and visits

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Pure - No frameworks)
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Authentication**: Cookie-based session management

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

3. **Access the Website**
   - Open your browser and navigate to: `http://localhost:3000`

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default password after first login in production!

## Database

The application uses SQLite database (`hospital.db`) which is automatically created on first run. The database includes:

- `patients` - Patient information
- `patient_visits` - Patient visit records
- `doctors` - Doctor profiles
- `appointments` - Appointment bookings
- `admins` - Admin user accounts

## Language Support

The website supports two languages:
- **English (en)** - Default language
- **Danish (da)** - Full translation

Language preference is saved in browser localStorage and persists across sessions.

## API Endpoints

### Authentication
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/check-auth` - Check authentication status

### Patients
- `POST /api/patients` - Register new patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID

### Visits
- `POST /api/visits` - Record patient visit
- `GET /api/visits` - Get all visits

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Add new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get all appointments
- `PUT /api/appointments/:id` - Update appointment status

### Statistics
- `GET /api/stats` - Get dashboard statistics

## Deployment

### Local Server
1. Install Node.js (v14 or higher)
2. Run `npm install`
3. Run `npm start`
4. Access at `http://localhost:3000`

### Cloud Hosting (Heroku, Railway, etc.)
1. Ensure Node.js is available
2. Set environment variable `PORT` (if needed)
3. Deploy the entire project folder
4. Run `npm install` and `npm start` on the server

### Important Notes
- The SQLite database file (`hospital.db`) will be created automatically
- Make sure the server has write permissions for the database file
- For production, consider using PostgreSQL or MySQL instead of SQLite
- Update the default admin password in production
- Use HTTPS for secure connections in production

## Project Structure

```
hospital/
├── public/
│   ├── index.html          # Home page
│   ├── about.html          # About page
│   ├── departments.html    # Departments page
│   ├── doctors.html        # Doctors page
│   ├── contact.html        # Contact page
│   ├── register.html       # Patient registration
│   ├── appointment.html    # Appointment booking
│   ├── admin.html          # Admin dashboard
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   └── js/
│       ├── main.js         # Main JavaScript utilities
│       ├── translations.js # Language translations
│       ├── doctors.js      # Doctors page functionality
│       └── admin.js        # Admin dashboard functionality
├── server.js               # Express server
├── package.json            # Dependencies
└── README.md              # This file
```

## Features Not Included (As Requested)

- ❌ Billing system
- ❌ Receipt generation
- ❌ Payment processing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC

## Support

For issues or questions, please check the code comments or contact the development team.

