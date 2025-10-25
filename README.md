# FastGram Backend API

A comprehensive backend API for FastGram (Instagram-like social media platform) built with Node.js, Express.js, and PostgreSQL (Neon DB).

## Features

- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 👤 **User Management** - Complete user profile management and social features
- 🔒 **Password Security** - Bcrypt hashing with salt rounds
- 🛡️ **Security** - Helmet.js for security headers, CORS protection
- 📊 **Database** - PostgreSQL with Neon DB integration
- ✅ **Validation** - Input validation with express-validator
- 🔄 **Token Refresh** - Automatic token refresh mechanism
- 👥 **Social Features** - Follow/unfollow users, view followers/following

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database (Neon DB recommended)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FastGram-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration (Neon DB)
   DATABASE_URL=postgresql://neondb_owner:npg_HQfuie3PRO2y@ep-cold-shadow-a1x7skxq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## Database Setup

The application will automatically create the necessary tables when it starts:

- **users** - User accounts and profiles
- **refresh_tokens** - JWT refresh token storage
- **posts** - User posts (for future implementation)
- **followers** - User follow relationships

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout from All Devices
```http
POST /api/auth/logout-all
Authorization: Bearer <access-token>
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <access-token>
```

### User Routes (`/api/users`)

#### Get Current User Profile
```http
GET /api/users/profile
Authorization: Bearer <access-token>
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com",
  "fullName": "New Full Name",
  "bio": "Updated bio",
  "profilePictureUrl": "https://example.com/profile.jpg"
}
```

#### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Get User by Username
```http
GET /api/users/:username
```

#### Follow User
```http
POST /api/users/:username/follow
Authorization: Bearer <access-token>
```

#### Unfollow User
```http
DELETE /api/users/:username/follow
Authorization: Bearer <access-token>
```

#### Get User's Followers
```http
GET /api/users/:username/followers?page=1&limit=20
```

#### Get User's Following
```http
GET /api/users/:username/following?page=1&limit=20
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if applicable)
  ]
}
```

## Authentication Flow

1. **Registration/Login**: User provides credentials
2. **Token Generation**: Server generates access token (15min) and refresh token (7days)
3. **Token Storage**: Refresh token stored in database
4. **API Requests**: Include access token in Authorization header
5. **Token Refresh**: Use refresh token to get new access token when expired
6. **Logout**: Remove refresh token from database

## Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configurable CORS settings
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Comprehensive input validation
- **SQL Injection Protection**: Parameterized queries
- **Token Expiration**: Automatic token expiration

## Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (invalid token, inactive account)
- **404**: Not Found (user/resource not found)
- **409**: Conflict (duplicate username/email)
- **500**: Internal Server Error

## Development

### Project Structure
```
FastGram-Backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js             # Authentication middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   └── users.js            # User management routes
├── server.js               # Main server file
├── package.json            # Dependencies
└── .env                    # Environment variables
```

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
