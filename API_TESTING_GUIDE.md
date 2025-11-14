# FastGram API Testing Guide

## 🚀 Server Health Check
```bash
curl -X GET http://localhost:3000/
```

## 🔐 Authentication APIs

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

### 2. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Verify Token
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Logout (Single Device)
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### 6. Logout All Devices
```bash
curl -X POST http://localhost:3000/api/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 👤 User Management APIs

### 7. Get Current User Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Update User Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "email": "newemail@example.com",
    "fullName": "New Full Name",
    "bio": "Updated bio text",
    "profilePictureUrl": "https://example.com/profile.jpg"
  }'
```

### 9. Change Password
```bash
curl -X PUT http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

### 10. Get User by Username (Public Profile)
```bash
curl -X GET http://localhost:3000/api/users/johndoe
```

### 11. Follow User
```bash
curl -X POST http://localhost:3000/api/users/johndoe/follow \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 12. Unfollow User
```bash
curl -X DELETE http://localhost:3000/api/users/johndoe/follow \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 13. Get User's Followers
```bash
curl -X GET "http://localhost:3000/api/users/johndoe/followers?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 14. Get User's Following
```bash
curl -X GET "http://localhost:3000/api/users/johndoe/following?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📝 Post Management APIs

### 15. Create Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Beautiful sunset! 🌅",
    "imageUrl": "https://picsum.photos/400/300"
  }'
```

### 16. Get Post by ID
```bash
curl -X GET http://localhost:3000/api/posts/1
```

### 17. Update Post Caption
```bash
curl -X PUT http://localhost:3000/api/posts/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Updated caption text 🎉"
  }'
```

### 18. Delete Post
```bash
curl -X DELETE http://localhost:3000/api/posts/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 19. Get User Posts
```bash
curl -X GET "http://localhost:3000/api/posts/user/johndoe?page=1&limit=20"
```

### 20. Get Feed (Timeline)
```bash
curl -X GET "http://localhost:3000/api/posts/feed/timeline?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ❤️ Like Management APIs

### 21. Like Post
```bash
curl -X POST http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 22. Unlike Post
```bash
curl -X DELETE http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 💬 Comment Management APIs

### 23. Add Comment
```bash
curl -X POST http://localhost:3000/api/posts/1/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "Great photo! 👍"
  }'
```

### 24. Get Post Comments
```bash
curl -X GET "http://localhost:3000/api/posts/1/comments?page=1&limit=20"
```

### 25. Delete Comment
```bash
curl -X DELETE http://localhost:3000/api/posts/1/comments/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🧪 Complete Testing Workflow

### Step 1: Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Step 2: Login and Get Tokens
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Step 3: Test Protected Route
```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 4: Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "My first post! 🎉",
    "imageUrl": "https://picsum.photos/400/300"
  }'
```

### Step 5: Like and Comment on Post
```bash
# Like the post
curl -X POST http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Add a comment
curl -X POST http://localhost:3000/api/posts/1/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "Amazing! 🔥"
  }'
```

### Step 6: View Your Feed
```bash
curl -X GET "http://localhost:3000/api/posts/feed/timeline?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 7: Update Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "This is my updated bio!",
    "profilePictureUrl": "https://via.placeholder.com/150"
  }'
```

## 📝 Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "bio": "This is my updated bio!",
      "profilePictureUrl": "https://via.placeholder.com/150",
      "isVerified": false,
      "createdAt": "2025-01-25T18:58:54.826Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Username must be between 3 and 50 characters",
      "param": "username",
      "location": "body"
    }
  ]
}
```

## 🔧 Testing Tips

1. **Save Tokens**: After login, save the `accessToken` and `refreshToken` for subsequent requests
2. **Token Expiry**: Access tokens expire in 15 minutes, use refresh token to get new ones
3. **Validation**: Test with invalid data to see validation errors
4. **Authentication**: Test protected routes without tokens to see 401 errors
5. **Rate Limiting**: Be mindful of request frequency during testing

## 🚨 Common Error Codes

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials/token)
- **403**: Forbidden (invalid token, inactive account)
- **404**: Not Found (user/resource not found)
- **409**: Conflict (duplicate username/email)
- **500**: Internal Server Error
