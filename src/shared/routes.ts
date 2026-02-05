import { z } from 'zod';
import {
  insertUserSchema,
  users,
  profiles,
  couples,
  messages,
  cycleLogs,
  gifts,
  insertProfileSchema,
  insertMessageSchema,
  insertCycleLogSchema,
  insertGiftSchema,
  communityPosts,
  communityComments,
  communityLikes
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Auth & Identity
  auth: {
    verifyAge: {
      method: 'POST' as const,
      path: '/api/auth/verify-age',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    }
  },

  // Public Dating / Profiles
  profiles: {
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:userId',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    getByUser: {
      method: 'GET' as const,
      path: '/api/users/:userId/profile',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        401: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/profiles', // Public matchmaking list
      input: z.object({
        gender: z.string().optional(),
        relationshipGoals: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    }
  },

  // Couples / Private Mode
  couples: {
    list: {
      method: 'GET' as const,
      path: '/api/couples',
      responses: {
        200: z.array(z.custom<typeof couples.$inferSelect & { partner: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/couples',
      input: z.object({ partnerId: z.string() }),
      responses: {
        201: z.custom<typeof couples.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/couples/:id',
      responses: {
        200: z.custom<typeof couples.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },

  // Messaging (Private/Public)
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/couples/:coupleId/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/couples/:coupleId/messages',
      input: z.object({ content: z.string(), type: z.string().optional() }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },

  // Cycle Tracking
  cycle: {
    list: {
      method: 'GET' as const,
      path: '/api/cycle-logs',
      responses: {
        200: z.array(z.custom<typeof cycleLogs.$inferSelect>()),
      },
    },
    log: {
      method: 'POST' as const,
      path: '/api/cycle-logs',
      input: insertCycleLogSchema,
      responses: {
        201: z.custom<typeof cycleLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },

  // AI Features (Flirt/Advice)
  ai: {
    generateFlirt: {
      method: 'POST' as const,
      path: '/api/ai/flirt',
      input: z.object({
        tone: z.enum(['romantic', 'playful', 'spicy', 'intellectual']),
        recipientContext: z.string().optional()
      }),
      responses: {
        200: z.object({ text: z.string() }),
        400: errorSchemas.validation,
      },
    }
  },

  // Wallet & Economy
  wallet: {
    get: {
      method: 'GET' as const,
      path: '/api/wallet',
      responses: {
        200: z.object({ balance: z.number(), transactions: z.array(z.custom<any>()) }),
        401: errorSchemas.unauthorized,
      },
    },
    withdraw: {
      method: 'POST' as const,
      path: '/api/wallet/withdraw',
      input: z.object({ amount: z.number(), method: z.string(), details: z.any() }),
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
      },
    }
  },

  // Intimacy Games
  games: {
    start: {
      method: 'POST' as const,
      path: '/api/games/start',
      input: z.object({ coupleId: z.number(), gameType: z.string(), intensity: z.string() }),
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/games/:id',
      input: z.object({ gameState: z.any(), status: z.string().optional() }),
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    }
  },

  // Security & Compliance
  security: {
    logAudit: {
      method: 'POST' as const,
      path: '/api/security/audit',
      input: z.object({ eventType: z.string(), details: z.string().optional() }),
      responses: {
        201: z.object({ success: z.boolean() }),
      },
    },
    consent: {
      method: 'POST' as const,
      path: '/api/security/consent',
      input: z.object({ coupleId: z.number(), target: z.string(), isGranted: z.boolean() }),
      responses: {
        201: z.custom<any>(),
      },
    }
  },

  // Admin Dashboard
  admin: {
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats',
      responses: {
        200: z.object({
          totalUsers: z.number(),
          totalCouples: z.number(),
          revenue: z.number(),
          pendingWithdrawals: z.number(),
        }),
        403: errorSchemas.unauthorized,
      },
    }
  },

  // Community Social (Section A)
  communityFeed: {
    listPosts: {
      method: 'GET' as const,
      path: '/api/community/posts',
      responses: {
        200: z.array(z.custom<typeof communityPosts.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    createPost: {
      method: 'POST' as const,
      path: '/api/community/posts',
      input: z.object({ content: z.string(), imageUrl: z.string().optional() }),
      responses: {
        201: z.custom<typeof communityPosts.$inferSelect>(),
      },
    },
    likePost: {
      method: 'POST' as const,
      path: '/api/community/posts/:postId/like',
      responses: {
        200: z.object({ success: z.boolean(), likesCount: z.number() }),
      },
    },
    addComment: {
      method: 'POST' as const,
      path: '/api/community/posts/:postId/comments',
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof communityComments.$inferSelect>(),
      },
    },
    listComments: {
      method: 'GET' as const,
      path: '/api/community/posts/:postId/comments',
      responses: {
        200: z.array(z.custom<typeof communityComments.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
