# Node.js Authentication System

A basic authentication system built with Node.js, Express, and MongoDB. Users can sign up, create accounts with unique IDs, and sign in using JWT tokens.

## Features

- **User Registration (Sign Up)**: Create new user accounts with username, email, and password
- **User Login (Sign In)**: Authenticate users with email and password
- **Unique User IDs**: Automatically generated unique IDs for each user
- **Password Hashing**: Secure password storage using bcryptjs
- **JWT Authentication**: Token-based authentication for protected routes
- **Protected Routes**: Example of accessing user data with authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud - MongoDB Atlas)
- npm

## Installation

1. Clone or navigate to the project directory:
```bash
cd nodeAuth
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (already included) and update if needed:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nodeauth
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
```

## Running the Server

### Development mode (with nodemon):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### 1. Sign Up (Create Account)
**POST** `/api/auth/signup`

Request body:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890_abc123",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2026-04-19T10:30:00.000Z"
  }
}
```

### 2. Sign In (Login)
**POST** `/api/auth/signin`

Request body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Signed in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890_abc123",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2026-04-19T10:30:00.000Z"
  }
}
```

### 3. Get Current User (Protected Route)
**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer <your_jwt_token>
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user_1234567890_abc123",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2026-04-19T10:30:00.000Z"
  }
}
```

## Project Structure

```
nodeAuth/
├── models/
│   └── User.js              # User schema and model
├── routes/
│   └── auth.js              # Authentication routes
├── middleware/
│   └── auth.js              # Authentication middleware (JWT protection)
├── controllers/
│   └── authController.js    # Authentication logic
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md                # This file
```

## How It Works

1. **Sign Up**: User provides username, email, and password. Password is hashed using bcryptjs before storing in database. A unique user ID is automatically generated.

2. **Sign In**: User provides email and password. The system verifies credentials and returns a JWT token if valid.

3. **Protected Routes**: The JWT token must be included in the Authorization header to access protected routes like `/api/auth/me`.

4. **User ID**: Each user gets a unique ID in format `user_<timestamp>_<random_string>` automatically upon creation.

## Testing with Postman

1. **Sign Up**: Send POST request to `http://localhost:5000/api/auth/signup` with the required fields
2. **Sign In**: Send POST request to `http://localhost:5000/api/auth/signin` with email and password
3. **Get User**: Send GET request to `http://localhost:5000/api/auth/me` with the token in Authorization header

## Technologies Used

- **Express.js**: Web framework for Node.js
- **Mongoose**: MongoDB object modeling
- **bcryptjs**: Password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **dotenv**: Environment variable management

## Security Notes

- Always change the `JWT_SECRET` in production
- Use HTTPS in production
- Implement rate limiting for authentication endpoints
- Consider adding email verification
- Implement password reset functionality
- Add CORS if needed for frontend applications

## Future Enhancements

- Email verification
- Password reset functionality
- User profile updates
- Logout functionality with token blacklisting
- Refresh token implementation
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub, etc.)
