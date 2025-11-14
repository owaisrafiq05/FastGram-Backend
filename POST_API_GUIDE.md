# FastGram Post Management API Guide

Complete guide for all post management, likes, and comments APIs.

## 📝 Post Management APIs

### 1. Create Post
Create a new post with image upload and optional caption.

**Note:** This endpoint now uses `multipart/form-data` for file uploads, not JSON.

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/your/image.jpg" \
  -F "caption=Beautiful sunset! 🌅"
```

**Using Postman:**
1. Select POST method
2. Enter URL: `http://localhost:3000/api/posts`
3. Authorization tab: Bearer Token
4. Body tab: form-data
   - Key: `image`, Type: File, Value: Select image file
   - Key: `caption`, Type: Text, Value: Your caption

**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post": {
      "id": 1,
      "userId": 1,
      "caption": "Beautiful sunset! 🌅",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fastgram/posts/post_1_1234567890.jpg",
      "likesCount": 0,
      "commentsCount": 0,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Note:** The `imageUrl` is now a Cloudinary URL after automatic upload.

### 2. Get Post by ID
Retrieve a specific post with full details.

```bash
curl -X GET http://localhost:3000/api/posts/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": 1,
      "userId": 1,
      "caption": "Beautiful sunset! 🌅",
      "imageUrl": "https://example.com/sunset.jpg",
      "likesCount": 10,
      "commentsCount": 5,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "user": {
        "username": "johndoe",
        "fullName": "John Doe",
        "profilePictureUrl": "https://example.com/profile.jpg",
        "isVerified": true
      }
    }
  }
}
```

### 3. Update Post Caption
Update the caption of your own post.

```bash
curl -X PUT http://localhost:3000/api/posts/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Updated caption text 🎉"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "post": {
      "id": 1,
      "userId": 1,
      "caption": "Updated caption text 🎉",
      "imageUrl": "https://example.com/sunset.jpg",
      "likesCount": 10,
      "commentsCount": 5,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

### 4. Delete Post
Delete your own post.

```bash
curl -X DELETE http://localhost:3000/api/posts/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### 5. Get User Posts
Get all posts by a specific user (with pagination).

```bash
curl -X GET "http://localhost:3000/api/posts/user/johndoe?page=1&limit=20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "userId": 1,
        "caption": "Beautiful sunset! 🌅",
        "imageUrl": "https://example.com/sunset.jpg",
        "likesCount": 10,
        "commentsCount": 5,
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z",
        "user": {
          "username": "johndoe",
          "fullName": "John Doe",
          "profilePictureUrl": "https://example.com/profile.jpg",
          "isVerified": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPosts": 45,
      "totalPages": 3
    }
  }
}
```

### 6. Get Feed (Timeline)
Get posts from users you follow (requires authentication).

```bash
curl -X GET "http://localhost:3000/api/posts/feed/timeline?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "userId": 1,
        "caption": "Beautiful sunset! 🌅",
        "imageUrl": "https://example.com/sunset.jpg",
        "likesCount": 10,
        "commentsCount": 5,
        "isLiked": true,
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z",
        "user": {
          "username": "johndoe",
          "fullName": "John Doe",
          "profilePictureUrl": "https://example.com/profile.jpg",
          "isVerified": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20
    }
  }
}
```

## ❤️ Like Management APIs

### 7. Like Post
Like a post.

```bash
curl -X POST http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Post liked successfully"
}
```

### 8. Unlike Post
Remove your like from a post.

```bash
curl -X DELETE http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Post unliked successfully"
}
```

## 💬 Comment Management APIs

### 9. Add Comment
Add a comment to a post.

```bash
curl -X POST http://localhost:3000/api/posts/1/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "Great photo! 👍"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "comment": {
      "id": 1,
      "userId": 1,
      "postId": 1,
      "commentText": "Great photo! 👍",
      "createdAt": "2025-01-15T11:00:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  }
}
```

### 10. Get Post Comments
Get all comments for a post (with pagination).

```bash
curl -X GET "http://localhost:3000/api/posts/1/comments?page=1&limit=20"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "userId": 1,
        "postId": 1,
        "commentText": "Great photo! 👍",
        "createdAt": "2025-01-15T11:00:00.000Z",
        "updatedAt": "2025-01-15T11:00:00.000Z",
        "user": {
          "username": "johndoe",
          "fullName": "John Doe",
          "profilePictureUrl": "https://example.com/profile.jpg",
          "isVerified": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalComments": 15,
      "totalPages": 1
    }
  }
}
```

### 11. Delete Comment
Delete your own comment.

```bash
curl -X DELETE http://localhost:3000/api/posts/1/comments/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

## 🧪 Complete Testing Workflow

### Step 1: Register and Login
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Save the accessToken from the response
```

### Step 2: Create a Post
```bash
# Create post with image upload
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@./test-image.jpg" \
  -F "caption=My first post! 🎉"

# Save the post ID from the response
```

### Step 3: Like the Post
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/like \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 4: Add a Comment
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "Amazing post! 🔥"
  }'
```

### Step 5: Get Your Feed
```bash
curl -X GET "http://localhost:3000/api/posts/feed/timeline?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 6: View Post Details
```bash
curl -X GET http://localhost:3000/api/posts/POST_ID
```

## 📊 API Endpoint Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/posts` | ✅ | Create new post |
| GET | `/api/posts/:postId` | ❌ | Get post by ID |
| PUT | `/api/posts/:postId` | ✅ | Update post caption |
| DELETE | `/api/posts/:postId` | ✅ | Delete post |
| GET | `/api/posts/user/:username` | ❌ | Get user posts |
| GET | `/api/posts/feed/timeline` | ✅ | Get feed |
| POST | `/api/posts/:postId/like` | ✅ | Like post |
| DELETE | `/api/posts/:postId/like` | ✅ | Unlike post |
| POST | `/api/posts/:postId/comments` | ✅ | Add comment |
| GET | `/api/posts/:postId/comments` | ❌ | Get comments |
| DELETE | `/api/posts/:postId/comments/:commentId` | ✅ | Delete comment |

## 🔍 Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Image URL is required",
      "param": "imageUrl",
      "location": "body"
    }
  ]
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Not authorized to update this post"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Post not found"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "Post already liked"
}
```

## 💡 Pro Tips

1. **Image Uploads**: Images are automatically uploaded to Cloudinary - see `IMAGE_UPLOAD_GUIDE.md` for details
2. **File Size**: Maximum image file size is 5MB
3. **Image Formats**: Supported formats are JPEG, PNG, GIF, and WebP
4. **Pagination**: Always use pagination for lists to improve performance
5. **Error Handling**: Check response status codes and handle errors appropriately
6. **Rate Limiting**: Be mindful of API rate limits (if implemented)
7. **Authentication**: Always include valid access token in Authorization header
8. **Caption Length**: Keep captions under 2200 characters
9. **Comment Length**: Keep comments between 1-500 characters
10. **Image Optimization**: Images are automatically optimized (max 1080x1080px)

## 🔐 Security Notes

- Only post owners can update or delete their posts
- Only comment authors can delete their comments
- Deleted posts automatically cascade delete likes and comments
- All authenticated endpoints require valid JWT access token
- Token expires after 15 minutes - use refresh token to get new access token

## 📚 Additional Resources

- Full API Documentation: `http://localhost:3000/docs`
- Authentication Guide: See `API_TESTING_GUIDE.md`
- User Management: See `README.md`

