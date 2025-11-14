const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastGram Backend API',
      version: '1.0.0',
      description: 'A comprehensive backend API for FastGram (Instagram-like social media platform) built with Node.js, Express.js, and PostgreSQL (Neon DB).',
      contact: {
        name: 'FastGram API Support',
        email: 'support@fastgram.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username (3-50 characters, alphanumeric and underscores only)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            fullName: {
              type: 'string',
              description: 'User full name'
            },
            bio: {
              type: 'string',
              description: 'User bio text'
            },
            profilePictureUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to user profile picture'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether user account is verified'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (expires in 15 minutes)'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token (expires in 7 days)'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: {
                    type: 'string',
                    description: 'Validation error message'
                  },
                  param: {
                    type: 'string',
                    description: 'Parameter name'
                  },
                  location: {
                    type: 'string',
                    description: 'Error location'
                  }
                }
              }
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Username (3-50 characters, alphanumeric and underscores only)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Password (minimum 6 characters)'
            },
            fullName: {
              type: 'string',
              maxLength: 100,
              description: 'User full name (optional)'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            }
          }
        },
        LogoutRequest: {
          type: 'object',
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token to invalidate'
            }
          }
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'New username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'New email address'
            },
            fullName: {
              type: 'string',
              maxLength: 100,
              description: 'New full name'
            },
            bio: {
              type: 'string',
              maxLength: 500,
              description: 'New bio text'
            },
            profilePictureUrl: {
              type: 'string',
              format: 'uri',
              description: 'New profile picture URL'
            }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              description: 'Current password'
            },
            newPassword: {
              type: 'string',
              minLength: 6,
              description: 'New password (minimum 6 characters)'
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            username: {
              type: 'string'
            },
            fullName: {
              type: 'string'
            },
            bio: {
              type: 'string'
            },
            profilePictureUrl: {
              type: 'string'
            },
            isVerified: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            followersCount: {
              type: 'integer',
              description: 'Number of followers'
            },
            followingCount: {
              type: 'integer',
              description: 'Number of users being followed'
            },
            postsCount: {
              type: 'integer',
              description: 'Number of posts'
            }
          }
        },
        Follower: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            username: {
              type: 'string'
            },
            fullName: {
              type: 'string'
            },
            profilePictureUrl: {
              type: 'string'
            },
            isVerified: {
              type: 'boolean'
            },
            followedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Post: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Post ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID of post author'
            },
            caption: {
              type: 'string',
              description: 'Post caption text'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to post image'
            },
            likesCount: {
              type: 'integer',
              description: 'Number of likes'
            },
            commentsCount: {
              type: 'integer',
              description: 'Number of comments'
            },
            isLiked: {
              type: 'boolean',
              description: 'Whether current user has liked the post'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Post creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            user: {
              type: 'object',
              properties: {
                username: {
                  type: 'string'
                },
                fullName: {
                  type: 'string'
                },
                profilePictureUrl: {
                  type: 'string'
                },
                isVerified: {
                  type: 'boolean'
                }
              }
            }
          }
        },
        CreatePostRequest: {
          type: 'object',
          required: ['imageUrl'],
          properties: {
            caption: {
              type: 'string',
              maxLength: 2200,
              description: 'Post caption (optional, max 2200 characters)'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to post image (required)'
            }
          }
        },
        UpdatePostRequest: {
          type: 'object',
          properties: {
            caption: {
              type: 'string',
              maxLength: 2200,
              description: 'Updated caption text'
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Comment ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID of comment author'
            },
            postId: {
              type: 'integer',
              description: 'Post ID'
            },
            commentText: {
              type: 'string',
              description: 'Comment text'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Comment creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            },
            user: {
              type: 'object',
              properties: {
                username: {
                  type: 'string'
                },
                fullName: {
                  type: 'string'
                },
                profilePictureUrl: {
                  type: 'string'
                },
                isVerified: {
                  type: 'boolean'
                }
              }
            }
          }
        },
        CommentRequest: {
          type: 'object',
          required: ['commentText'],
          properties: {
            commentText: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Comment text (1-500 characters)'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
