# Image Upload Guide - FastGram Backend

## Overview

FastGram now supports direct image uploads using **Multer** and **Cloudinary**. Users can upload images when creating posts, and the images are automatically stored in Cloudinary cloud storage.

## 🎯 Features

- ✅ **Direct File Upload** - No need for pre-signed URLs
- ✅ **Cloudinary Integration** - Secure cloud storage
- ✅ **Automatic Optimization** - Images are optimized automatically
- ✅ **File Validation** - Only accepts valid image formats
- ✅ **Size Limits** - Maximum 5MB per image
- ✅ **Auto Deletion** - Images deleted from Cloudinary when post is deleted

## 📋 Setup Instructions

### 1. Get Cloudinary Credentials

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/)
2. Go to your [Dashboard](https://cloudinary.com/console)
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Install Dependencies (Already Installed)

```bash
npm install multer cloudinary streamifier
```

## 🚀 How to Use

### Creating a Post with Image Upload

**Endpoint:** `POST /api/posts`

**Content-Type:** `multipart/form-data`

**Authentication:** Required (Bearer Token)

**Form Data:**
- `image` (required) - Image file (JPEG, PNG, GIF, WebP)
- `caption` (optional) - Post caption (max 2200 characters)

### Example: Using cURL

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/your/image.jpg" \
  -F "caption=Beautiful sunset! 🌅"
```

### Example: Using Postman

1. Select **POST** method
2. Enter URL: `http://localhost:3000/api/posts`
3. Go to **Authorization** tab:
   - Type: Bearer Token
   - Token: YOUR_ACCESS_TOKEN
4. Go to **Body** tab:
   - Select `form-data`
   - Add key `image`, change type to `File`, select your image
   - Add key `caption`, keep type as `Text`, enter your caption
5. Click **Send**

### Example: Using JavaScript (Frontend)

```javascript
const createPost = async (imageFile, caption) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('caption', caption);

  const response = await fetch('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  const data = await response.json();
  return data;
};

// Usage
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];
const caption = 'My awesome post!';

createPost(file, caption)
  .then(data => console.log('Post created:', data))
  .catch(error => console.error('Error:', error));
```

### Example: Using Axios (Frontend)

```javascript
import axios from 'axios';

const createPost = async (imageFile, caption) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('caption', caption);

  try {
    const response = await axios.post('http://localhost:3000/api/posts', formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error.response?.data);
    throw error;
  }
};
```

### Example: Using React with File Input

```jsx
import React, { useState } from 'react';
import axios from 'axios';

function CreatePost({ accessToken }) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', image);
    formData.append('caption', caption);

    try {
      const response = await axios.post(
        'http://localhost:3000/api/posts', 
        formData, 
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Post created:', response.data);
      alert('Post created successfully!');
      
      // Reset form
      setCaption('');
      setImage(null);
      setPreview(null);
    } catch (error) {
      console.error('Error:', error.response?.data);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        {preview && <img src={preview} alt="Preview" style={{ maxWidth: '300px' }} />}
      </div>
      
      <div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          maxLength={2200}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}

export default CreatePost;
```

## 📊 Response Format

### Success Response (201 Created)

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

### Error Responses

**No Image Uploaded (400)**
```json
{
  "success": false,
  "message": "Image file is required"
}
```

**Invalid File Type (400)**
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

**File Too Large (400)**
```json
{
  "success": false,
  "message": "File size too large. Maximum size is 5MB."
}
```

**Cloudinary Upload Failed (500)**
```json
{
  "success": false,
  "message": "Failed to upload image to cloud storage"
}
```

## 🔧 Technical Details

### File Upload Middleware

**Location:** `middleware/upload.js`

**Features:**
- Uses Multer with memory storage
- Validates file types (JPEG, PNG, GIF, WebP)
- Limits file size to 5MB
- Stores files in memory for direct Cloudinary upload

### Cloudinary Configuration

**Location:** `config/cloudinary.js`

**Settings:**
- Folder: `fastgram/posts`
- Max dimensions: 1080x1080px
- Quality: Auto optimization
- Format: Auto selection

### Upload Helper

**Location:** `utils/cloudinaryUpload.js`

**Functions:**
- `uploadToCloudinary()` - Upload image buffer to Cloudinary
- `deleteFromCloudinary()` - Delete image from Cloudinary
- `extractPublicId()` - Extract public ID from Cloudinary URL

## 🎨 Image Optimization

All uploaded images are automatically:
- Resized to max 1080x1080px (maintains aspect ratio)
- Optimized for quality (auto:good)
- Converted to best format (auto format)
- Stored with a unique public ID

## 🗑️ Post Deletion

When a post is deleted:
1. Post record is removed from database
2. Associated likes and comments are cascade deleted
3. Image is automatically deleted from Cloudinary

## ⚙️ Configuration Options

### Change Upload Folder

Edit `routes/posts.js`:

```javascript
const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
  folder: 'your-custom-folder', // Change this
  public_id: `post_${userId}_${Date.now()}`
});
```

### Change Image Transformations

Edit `utils/cloudinaryUpload.js`:

```javascript
transformation: [
  { width: 2000, height: 2000, crop: 'limit' }, // Larger size
  { quality: 'auto:best' }, // Better quality
  { fetch_format: 'auto' }
],
```

### Change File Size Limit

Edit `middleware/upload.js`:

```javascript
limits: {
  fileSize: 10 * 1024 * 1024 // 10MB
}
```

## 🔒 Security Features

- ✅ Authentication required for uploads
- ✅ File type validation
- ✅ File size limits
- ✅ Unique file names to prevent conflicts
- ✅ Automatic malware scanning (Cloudinary feature)
- ✅ HTTPS delivery for all images

## 📝 Testing

### Test with cURL

```bash
# 1. Register and login to get access token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Create post with image
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@./test-image.jpg" \
  -F "caption=Test post"
```

### Test with Postman

1. Import the collection from `/docs` (Swagger)
2. Set up environment variable for access token
3. Use the **Create Post** endpoint
4. Select file in form-data body
5. Send request

## 🐛 Troubleshooting

### Error: "Cloudinary credentials not configured"

**Solution:** Check your `.env` file has correct Cloudinary credentials

### Error: "File too large"

**Solution:** 
- Reduce image file size (max 5MB)
- Or increase limit in `middleware/upload.js`

### Error: "Invalid file type"

**Solution:** 
- Only JPEG, PNG, GIF, WebP are allowed
- Check file extension is correct

### Error: "Failed to upload image to cloud storage"

**Solution:**
- Check Cloudinary credentials are correct
- Check internet connection
- Check Cloudinary quota hasn't exceeded

## 📚 Additional Resources

- [Multer Documentation](https://github.com/expressjs/multer)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Optimization Guide](https://cloudinary.com/documentation/image_optimization)

## 🎯 Best Practices

1. **Always validate on frontend** before sending to backend
2. **Show upload progress** to users
3. **Compress images** on frontend before upload
4. **Use preview** before final upload
5. **Handle errors gracefully** with user-friendly messages
6. **Implement retry logic** for failed uploads
7. **Clean up preview URLs** with `URL.revokeObjectURL()`

## 💡 Pro Tips

- Use Cloudinary's transformation API for thumbnails
- Enable Cloudinary's auto-backup feature
- Monitor upload analytics in Cloudinary dashboard
- Use Cloudinary's media library for management
- Implement progressive image loading on frontend

