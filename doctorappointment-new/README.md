# Healthcare Professional Management Platform

## Project Overview
This is a full-stack web application designed for healthcare professional management, featuring authentication, profile management, and password reset functionality.

## Key Features
- User Authentication
- Doctor Registration
- Password Recovery
- Profile Management

## Technology Stack
-Frontend-Next js
- Backend: Node.js
- Database: MongoDB
- Authentication: JWT, Bcrypt
- Email Service: Nodemailer

## Authentication Workflow

### User Registration
- Supports doctor registration
- Validates user details
- Generates verification token
- Sends verification email

### Password Recovery
- Forgot Password functionality
- Generates unique reset token
- Sends password reset link via email

## Key Components

### Models
#### User Model Fields
- Name
- Email
- Password (hashed)
- Mobile
- Experience
- Specialization (e.g., MBBS)
- Gender
- Verification Status
- Profile Rating

### Authentication Controllers
- Registration
- Login
- Email Verification
- Password Reset
- Forgot Password

## Security Features
- Password Hashing
- Token-based Authentication
- Email Verification
- Secure Password Reset Mechanism

## Environment Setup

### Prerequisites
- Node.js (v14+ recommended)
- MongoDB
- npm or yarn

### Installation Steps
1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up environment variables
   - Create a `.env` file
   - Add necessary configurations
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     EMAIL_SERVICE_CREDENTIALS=your_email_service_credentials
     ```
4. Start the server
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - User Registration
- `POST /auth/login` - User Login
- `POST /auth/forgot-password` - Initiate Password Reset
- `POST /auth/reset-password` - Complete Password Reset

## Deployment Considerations
- Use environment-specific configurations
- Implement proper error handling
- Secure sensitive information
- Use HTTPS in production

## Troubleshooting
- Check MongoDB connection
- Verify email service credentials
- Ensure all environment variables are set

## Future Enhancements
- Two-factor authentication
- More robust user roles
- Enhanced profile management
- Advanced search and filtering

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
