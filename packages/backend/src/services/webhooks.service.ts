/**
 * ============================================================================
 * WEBHOOKS SERVICE
 * ============================================================================
 * Manage webhook configurations and deliveries
 */

import { prisma } from './prisma.service';
import crypto from 'crypto';

export const webhooksService = {
  /**
   * Get all webhooks
   */
  async getAll() {
    return prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get webhook by ID
   */
  async getById(id: string) {
    return prisma.webhook.findUnique({
      where: { id },
    });
  },

  /**
   * Create new webhook
   */
  async create(data: {
    url: string;
    events: string[];
    headers?: Record<string, string>;
  }) {
    const secret = crypto.randomBytes(32).toString('hex');

    return prisma.webhook.create({
      data: {
        url: data.url,
        events: data.events,
        secret,
        headers: data.headers ? JSON.stringify(data.headers) : null,
        status: 'active',
      },
    });
  },

  /**
   * Update webhook
   */
  async update(
    id: string,
    data: {
      url?: string;
      events?: string[];
      status?: 'active' | 'inactive';
      headers?: Record<string, string>;
    }
  ) {
    return prisma.webhook.update({
      where: { id },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events }),
        ...(data.status && { status: data.status }),
        ...(data.headers && { headers: JSON.stringify(data.headers) }),
      },
    });
  },

  /**
   * Delete webhook
   */
  async delete(id: string) {
    // Delete related deliveries first
    await prisma.webhookDelivery.deleteMany({
      where: { webhookId: id },
    });

    return prisma.webhook.delete({
      where: { id },
    });
  },

  /**
   * Test webhook by sending a test payload
   */
  async testWebhook(id: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
      },
    };

    try {
      const signature = crypto
        .createHmac('sha256', webhook.secret || 'default')
        .update(JSON.stringify(testPayload))
        .digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          ...(webhook.headers ? JSON.parse(webhook.headers) : {}),
        },
        body: JSON.stringify(testPayload),
      });

      // Log delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'webhook.test',
          payload: JSON.stringify(testPayload),
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status,
        },
      });

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? 'Test delivery successful' : 'Test delivery failed',
      };
    } catch (error: any) {
      // Log failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: 'webhook.test',
          payload: JSON.stringify(testPayload),
          status: 'failed',
          error: error.message,
        },
      });

      throw error;
    }
  },

  /**
   * Get delivery history for a webhook
   */
  async getDeliveryHistory(webhookId: string, limit = 50) {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Queue webhook delivery
   * (In production, this should use Bull/Redis queue)
   */
  async queueDelivery(event: string, payload: any) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        status: 'active',
        events: {
          hasSome: [event],
        },
      },
    });

    const deliveries = webhooks.map((webhook) => ({
      webhookId: webhook.id,
      event,
      payload: JSON.stringify(payload),
      status: 'pending' as const,
    }));

    if (deliveries.length > 0) {
      await prisma.webhookDelivery.createMany({
        data: deliveries,
      });
    }

    return deliveries.length;
  },
};
