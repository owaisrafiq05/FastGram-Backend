const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Group Management
 *   description: Group creation, membership and messaging
 */

const createGroupValidation = [
  body('name').notEmpty().withMessage('Group name is required').isLength({ max: 150 })
];

// Create a new group
/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 150
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, createGroupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, description, isPrivate } = req.body;
    const ownerId = req.user.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const groupResult = await client.query(
        `INSERT INTO groups (name, description, is_private, owner_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, is_private, owner_id, members_count, created_at, updated_at`,
        [name, description || '', !!isPrivate, ownerId]
      );

      const group = groupResult.rows[0];

      // Add owner as admin member
      await client.query(
        `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`,
        [group.id, ownerId, 'admin']
      );

      // Update members_count
      await client.query('UPDATE groups SET members_count = members_count + 1 WHERE id = $1', [group.id]);

      await client.query('COMMIT');

      res.status(201).json({ success: true, message: 'Group created', data: { group } });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Create group error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create group error (outer):', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get group details
/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get group details by ID
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await pool.query(
      `SELECT g.*, u.username as owner_username, u.full_name as owner_full_name, u.profile_picture_url as owner_profile_picture
       FROM groups g
       LEFT JOIN users u ON g.owner_id = u.id
       WHERE g.id = $1`,
      [groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const group = result.rows[0];

    res.json({ success: true, data: { group } });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update group (admin only)
/**
 * @swagger
 * /api/groups/{groupId}:
 *   put:
 *     summary: Update group (admin only)
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.put('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isPrivate } = req.body;
    const userId = req.user.id;

    // Check admin role
    const memberRes = await pool.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberRes.rows.length === 0 || memberRes.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update group' });
    }

    const result = await pool.query(
      `UPDATE groups SET name = COALESCE($1, name), description = COALESCE($2, description), is_private = COALESCE($3, is_private), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, description, is_private, owner_id, members_count, created_at, updated_at`,
      [name, description, typeof isPrivate === 'boolean' ? isPrivate : null, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({ success: true, message: 'Group updated', data: { group: result.rows[0] } });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete group (admin only)
/**
 * @swagger
 * /api/groups/{groupId}:
 *   delete:
 *     summary: Delete a group (admin only)
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:groupId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check admin
    const memberRes = await client.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberRes.rows.length === 0 || memberRes.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete group' });
    }

    await client.query('BEGIN');

    // Delete group (cascades to members/messages)
    const delRes = await client.query('DELETE FROM groups WHERE id = $1', [groupId]);
    if (delRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    await client.query('COMMIT');

    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Join group (public only)
/**
 * @swagger
 * /api/groups/{groupId}/join:
 *   post:
 *     summary: Join a public group
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joined group successfully
 *       403:
 *         description: Cannot join private group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal server error
 */
router.post('/:groupId/join', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const groupRes = await client.query('SELECT is_private FROM groups WHERE id = $1', [groupId]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (groupRes.rows[0].is_private) {
      return res.status(403).json({ success: false, message: 'Cannot join a private group' });
    }

    await client.query('BEGIN');
    const insertRes = await client.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [groupId, userId, 'member']
    );

    if (insertRes.rowCount > 0) {
      await client.query('UPDATE groups SET members_count = members_count + 1 WHERE id = $1', [groupId]);
    }

    await client.query('COMMIT');

    res.json({ success: true, message: 'Joined group' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Join group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Add member (admin only)
/**
 * @swagger
 * /api/groups/{groupId}/members:
 *   post:
 *     summary: Add a member to group (admin only)
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 */
router.post('/:groupId/members', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { groupId } = req.params;
    const { userId: newUserId } = req.body; // expects numeric userId
    const userId = req.user.id;

    if (!newUserId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const memberRes = await client.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberRes.rows.length === 0 || memberRes.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add members' });
    }

    await client.query('BEGIN');
    const insertRes = await client.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [groupId, newUserId, 'member']
    );

    if (insertRes.rowCount > 0) {
      await client.query('UPDATE groups SET members_count = members_count + 1 WHERE id = $1', [groupId]);
    }

    await client.query('COMMIT');

    res.status(201).json({ success: true, message: 'Member added' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Remove member
/**
 * @swagger
 * /api/groups/{groupId}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from group (admin or self)
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Member not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:groupId/members/:memberId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    // If self remove or admin
    const isAdminRes = await client.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    const isAdmin = isAdminRes.rows.length > 0 && isAdminRes.rows[0].role === 'admin';

    if (!isAdmin && parseInt(memberId, 10) !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this member' });
    }

    await client.query('BEGIN');
    const delRes = await client.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, memberId]);
    if (delRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    await client.query('UPDATE groups SET members_count = GREATEST(members_count - 1, 0) WHERE id = $1', [groupId]);
    await client.query('COMMIT');

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// List group members
/**
 * @swagger
 * /api/groups/{groupId}/members:
 *   get:
 *     summary: List group members
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const membersRes = await pool.query(
      `SELECT gm.user_id, gm.role, gm.joined_at, u.username, u.full_name, u.profile_picture_url
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    res.json({ success: true, data: { members: membersRes.rows } });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// Group post endpoints using posts table
/**
 * @swagger
 * /api/groups/{groupId}/posts:
 *   post:
 *     summary: Create a post in the group
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               caption:
 *                 type: string
 *                 description: Post caption (optional)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (optional)
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation failed
 *       403:
 *         description: Must be a member to post
 *       500:
 *         description: Internal server error
 */
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { uploadToCloudinary, extractPublicId, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

router.post('/:groupId/posts', authenticateToken, upload.single('image'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { groupId } = req.params;
    const { caption } = req.body;
    const userId = req.user.id;

    // Check member
    const memberRes = await client.query('SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    if (memberRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Must be a member to post' });
    }

    let imageUrl = null;
    if (req.file) {
      try {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, {
          folder: `fastgram/group_posts/${groupId}`,
          public_id: `group_${groupId}_user_${userId}_${Date.now()}`
        });
        imageUrl = cloudinaryResult.secure_url;
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Image upload failed' });
      }
    }

    const postRes = await client.query(
      `INSERT INTO posts (user_id, caption, image_url, group_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, caption, image_url, group_id, likes_count, comments_count, created_at, updated_at`,
      [userId, caption || '', imageUrl, groupId]
    );

    res.status(201).json({ success: true, message: 'Post created', data: { post: postRes.rows[0] } });
  } catch (error) {
    console.error('Create group post error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/groups/{groupId}/posts:
 *   get:
 *     summary: List posts in a group
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:groupId/posts', authenticateToken, async (req, res) => {
  try {
    const groupIdRaw = req.params.groupId;
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;

    const groupId = parseInt(groupIdRaw, 10);
    const page = parseInt(pageRaw || '1', 10);
    const limit = parseInt(limitRaw || '20', 10);

    if (Number.isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid groupId' });
    }
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit = Number.isNaN(limit) || limit < 1 ? 20 : limit;
    const offset = (safePage - 1) * safeLimit;

    const postsRes = await pool.query(
      `SELECT p.id, p.user_id, p.caption, p.image_url, p.group_id, p.likes_count, p.comments_count, p.created_at, p.updated_at,
              u.username, u.full_name, u.profile_picture_url
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.group_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, safeLimit, offset]
    );

    res.json({ success: true, data: { posts: postsRes.rows } });
  } catch (error) {
    console.error('List group posts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}/posts/{postId}:
 *   delete:
 *     summary: Delete a group post (author or admin)
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:groupId/posts/:postId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { groupId, postId } = req.params;
    const userId = req.user.id;

    // Get post
    const postRes = await client.query('SELECT * FROM posts WHERE id = $1 AND group_id = $2', [postId, groupId]);
    if (postRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const post = postRes.rows[0];

    // Check if author or admin
    let isAdmin = false;
    if (post.user_id !== userId) {
      const adminRes = await client.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
      isAdmin = adminRes.rows.length > 0 && adminRes.rows[0].role === 'admin';
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
      }
    }

    await client.query('DELETE FROM posts WHERE id = $1', [postId]);

    // Delete image from Cloudinary if present
    if (post.image_url) {
      try {
        const publicId = extractPublicId(post.image_url);
        if (publicId) await deleteFromCloudinary(publicId);
      } catch (err) {
        // Ignore image deletion errors
      }
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Delete group post error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    client.release();
  }
});

module.exports = router;

// Get groups for a user (groups the user is a member of)
/**
 * @swagger
 * /api/groups/user/{userId}:
 *   get:
 *     summary: List groups a user is member of
 *     tags: [Group Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const groupsRes = await pool.query(
      `SELECT g.id, g.name, g.description, g.is_private, g.owner_id, g.members_count, g.created_at, g.updated_at,
              gm.role as my_role,
              u.username as owner_username, u.full_name as owner_full_name, u.profile_picture_url as owner_profile_picture
       FROM group_members gm
       JOIN groups g ON gm.group_id = g.id
       LEFT JOIN users u ON g.owner_id = u.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: { groups: groupsRes.rows } });
  } catch (error) {
    console.error('List user groups error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
