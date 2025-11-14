# Cloudinary Setup Guide for FastGram

## Quick Setup (5 minutes)

### Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (No credit card required!)
3. Verify your email address

### Step 2: Get Your Credentials

1. After login, you'll see your **Dashboard**
2. You'll find these credentials:
   ```
   Cloud Name: xxxxxxx
   API Key: 123456789012345
   API Secret: xxxxx-xxxxxxxxxxxx
   ```
3. **Copy these values** - you'll need them next

### Step 3: Configure Your Backend

1. Open your `.env` file (or create one from `env.example`)
2. Add your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

3. **Replace the placeholders** with your actual credentials from Step 2

### Step 4: Restart Your Server

```bash
npm run dev
```

You should see:
```
✅ Cloudinary connected successfully
```

If you see this message, you're all set! 🎉

## Testing Your Setup

### Test 1: Create a Post with Image

```bash
# Replace YOUR_ACCESS_TOKEN with your actual token
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@./test-image.jpg" \
  -F "caption=Testing Cloudinary upload!"
```

### Test 2: Check Cloudinary Dashboard

1. Go to [Cloudinary Media Library](https://cloudinary.com/console/media_library)
2. Navigate to `fastgram/posts` folder
3. You should see your uploaded image!

## Free Plan Limits

Cloudinary's free plan includes:
- ✅ **25 GB** Storage
- ✅ **25 GB** Monthly bandwidth
- ✅ **25,000** Transformations/month
- ✅ **500** Images/videos

This is **more than enough** for development and small-scale production!

## Troubleshooting

### ❌ "Cloudinary credentials not configured"

**Solution:**
1. Check your `.env` file exists
2. Verify all three credentials are set
3. Make sure there are no extra spaces
4. Restart your server

### ❌ "Authentication failed"

**Solution:**
1. Verify credentials are correct (copy from Cloudinary dashboard)
2. Check for typos in credential names
3. Make sure you're using the correct API Secret (not API Environment Variable)

### ❌ Images not appearing in Cloudinary

**Solution:**
1. Check server logs for upload errors
2. Verify folder path in code matches your preference
3. Check Cloudinary quota hasn't been exceeded

## Next Steps

Now that Cloudinary is set up:

1. ✅ Test image uploads via Postman or cURL
2. ✅ Integrate with your frontend application
3. ✅ Read `IMAGE_UPLOAD_GUIDE.md` for frontend examples
4. ✅ Explore Cloudinary's [Media Library](https://cloudinary.com/console/media_library)
5. ✅ Check out Cloudinary's [transformation features](https://cloudinary.com/documentation/image_transformations)

## Security Best Practices

1. ✅ **Never commit** your `.env` file to git
2. ✅ **Keep API Secret** secure (treat it like a password)
3. ✅ Use **environment variables** in production
4. ✅ Enable **signed uploads** for production (optional)
5. ✅ Set up **usage alerts** in Cloudinary dashboard

## Additional Resources

- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Guide](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

## Need Help?

- Check `IMAGE_UPLOAD_GUIDE.md` for detailed usage examples
- Review Cloudinary's [Getting Started Guide](https://cloudinary.com/documentation/how_to_integrate_cloudinary)
- Contact Cloudinary support (they're very responsive!)

---

**Congratulations! Your Cloudinary setup is complete!** 🎉

