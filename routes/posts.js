const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = require('../utils/cloudinaryUpload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Post Management
 *   description: Post creation, management, likes, and comments
 */

// Validation rules
const createPostValidation = [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption must be less than 2200 characters')
];

const updatePostValidation = [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Caption must be less than 2200 characters')
];

const commentValidation = [
  body('commentText')
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post with image upload
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               caption:
 *                 type: string
 *                 maxLength: 2200
 *                 description: Post caption (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation failed or no image uploaded
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authenticateToken, 
  upload.single('image'),
  handleMulterError,
  createPostValidation, 
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Check if image file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Image file is required'
        });
      }

      const { caption } = req.body;
      const userId = req.user.id;

      // Upload image to Cloudinary
      console.log('Uploading image to Cloudinary...');
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'fastgram/posts',
        public_id: `post_${userId}_${Date.now()}`
      });

      const imageUrl = cloudinaryResult.secure_url;
      console.log('Image uploaded successfully:', imageUrl);

      // Save post to database
      const result = await pool.query(
        `INSERT INTO posts (user_id, caption, image_url)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, caption, image_url, likes_count, comments_count, created_at, updated_at`,
        [userId, caption || '', imageUrl]
      );

      const post = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: {
          post: {
            id: post.id,
            userId: post.user_id,
            caption: post.caption,
            imageUrl: post.image_url,
            likesCount: post.likes_count,
            commentsCount: post.comments_count,
            createdAt: post.created_at,
            updatedAt: post.updated_at
          }
        }
      });

    } catch (error) {
      console.error('Create post error:', error);
      
      // Handle Cloudinary errors
      if (error.http_code) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to cloud storage'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get post by ID with full details
 *     tags: [Post Management]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT p.*, 
              u.username, u.full_name, u.profile_picture_url, u.is_verified
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const post = result.rows[0];

    res.json({
      success: true,
      data: {
        post: {
          id: post.id,
          userId: post.user_id,
          caption: post.caption,
          imageUrl: post.image_url,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          user: {
            username: post.username,
            fullName: post.full_name,
            profilePictureUrl: post.profile_picture_url,
            isVerified: post.is_verified
          }
        }
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update post caption
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 maxLength: 2200
 *           example:
 *             caption: "Updated caption text"
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Not authorized to update this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.put('/:postId', authenticateToken, updatePostValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { postId } = req.params;
    const { caption } = req.body;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const result = await pool.query(
      `UPDATE posts 
       SET caption = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, user_id, caption, image_url, likes_count, comments_count, created_at, updated_at`,
      [caption, postId]
    );

    const post = result.rows[0];

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: {
          id: post.id,
          userId: post.user_id,
          caption: post.caption,
          imageUrl: post.image_url,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          updatedAt: post.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const checkResult = await pool.query(
      'SELECT user_id, image_url FROM posts WHERE id = $1',
      [postId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    const imageUrl = checkResult.rows[0].image_url;

    // Delete post from database
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    // Delete image from Cloudinary (optional - don't fail if this fails)
    try {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
        console.log('Image deleted from Cloudinary:', publicId);
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error (non-critical):', cloudinaryError.message);
      // Continue execution even if Cloudinary deletion fails
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/posts/user/{username}:
 *   get:
 *     summary: Get posts by username
 *     tags: [Post Management]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Posts per page
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userId = userResult.rows[0].id;

    // Get posts
    const postsResult = await pool.query(
      `SELECT p.*, 
              u.username, u.full_name, u.profile_picture_url, u.is_verified
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = $1',
      [userId]
    );

    const posts = postsResult.rows.map(post => ({
      id: post.id,
      userId: post.user_id,
      caption: post.caption,
      imageUrl: post.image_url,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      user: {
        username: post.username,
        fullName: post.full_name,
        profilePictureUrl: post.profile_picture_url,
        isVerified: post.is_verified
      }
    }));

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPosts: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get feed (posts from followed users)
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Posts per page
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/feed/timeline', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get posts from followed users (including own posts)
    const postsResult = await pool.query(
      `SELECT p.*, 
              u.username, u.full_name, u.profile_picture_url, u.is_verified,
              EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id IN (
         SELECT following_id FROM followers WHERE follower_id = $1
         UNION
         SELECT $1
       )
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const posts = postsResult.rows.map(post => ({
      id: post.id,
      userId: post.user_id,
      caption: post.caption,
      imageUrl: post.image_url,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      isLiked: post.is_liked,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      user: {
        username: post.username,
        fullName: post.full_name,
        profilePictureUrl: post.profile_picture_url,
        isVerified: post.is_verified
      }
    }));

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       404:
 *         description: Post not found
 *       409:
 *         description: Post already liked
 *       500:
 *         description: Internal server error
 */
router.post('/:postId/like', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const postResult = await client.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const likeResult = await client.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (likeResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Post already liked'
      });
    }

    // Add like
    await client.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
      [userId, postId]
    );

    // Update likes count
    await client.query(
      'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Post liked successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *       404:
 *         description: Like not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:postId/like', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { postId } = req.params;
    const userId = req.user.id;

    // Remove like
    const result = await client.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Like not found'
      });
    }

    // Update likes count
    await client.query(
      'UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Post unliked successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentText
 *             properties:
 *               commentText:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *           example:
 *             commentText: "Great photo! 👍"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.post('/:postId/comments', authenticateToken, commentValidation, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    await client.query('BEGIN');
    
    const { postId } = req.params;
    const { commentText } = req.body;
    const userId = req.user.id;

    // Check if post exists
    const postResult = await client.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Add comment
    const commentResult = await client.query(
      `INSERT INTO comments (user_id, post_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, post_id, comment_text, created_at, updated_at`,
      [userId, postId, commentText]
    );

    // Update comments count
    await client.query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    const comment = commentResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: {
          id: comment.id,
          userId: comment.user_id,
          postId: comment.post_id,
          commentText: comment.comment_text,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Post Management]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if post exists
    const postResult = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get comments
    const commentsResult = await pool.query(
      `SELECT c.*, 
              u.username, u.full_name, u.profile_picture_url, u.is_verified
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = $1',
      [postId]
    );

    const comments = commentsResult.rows.map(comment => ({
      id: comment.id,
      userId: comment.user_id,
      postId: comment.post_id,
      commentText: comment.comment_text,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: {
        username: comment.username,
        fullName: comment.full_name,
        profilePictureUrl: comment.profile_picture_url,
        isVerified: comment.is_verified
      }
    }));

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalComments: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Post Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    // Check if comment exists and belongs to user
    const commentResult = await client.query(
      'SELECT user_id, post_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (commentResult.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Delete comment
    await client.query('DELETE FROM comments WHERE id = $1', [commentId]);

    // Update comments count
    await client.query(
      'UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

module.exports = router;

