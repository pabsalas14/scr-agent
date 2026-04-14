/**
 * ============================================================================
 * WEBHOOK MANAGER - Manage GitHub Webhooks for Projects
 * ============================================================================
 * Allows users to configure, test, and delete GitHub webhooks
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Webhook, Trash2, Plus, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';

interface WebhookConfig {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookManagerProps {
  projectId: string;
  repositoryName: string;
}

export default function WebhookManager({ projectId, repositoryName }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  // Load webhooks
  useEffect(() => {
    loadWebhooks();
  }, [projectId]);

  const loadWebhooks = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get(`/github/webhooks/${projectId}`);
      if (response.success) {
        setWebhooks(response.webhooks || []);
      }
    } catch (error) {
      console.warn('Failed to load webhooks (may not be configured yet)');
      setWebhooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const configureWebhook = async () => {
    setIsConfiguring(true);
    try {
      // Construct webhook URL - would be from backend configuration
      const webhookUrl = `${window.location.origin}/api/v1/github/webhook`;

      const response = await apiService.post(`/github/webhooks/configure`, {
        projectId,
        webhookUrl,
      });

      if (response.success) {
        toast.success(`✅ Webhook configured successfully!`);
        loadWebhooks();
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.warning('Webhook already exists for this repository');
      } else {
        toast.error('Failed to configure webhook');
      }
    } finally {
      setIsConfiguring(false);
    }
  };

  const deleteWebhook = async (hookId: number) => {
    await confirm.confirm({
      title: 'Delete Webhook',
      message: 'Are you sure you want to delete this webhook? GitHub will no longer send events.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await apiService.delete(`/github/webhooks/${projectId}/${hookId}`);
          toast.success('Webhook deleted');
          loadWebhooks();
        } catch (error) {
          toast.error('Failed to delete webhook');
        }
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[#2D2D2D] bg-[#1E1E20] p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#F97316]/10">
            <Webhook className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">GitHub Webhooks</h3>
            <p className="text-sm text-[#6B7280]">Auto-trigger analysis on push/PR events</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#6B7280] hover:text-white transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Configure Button */}
            {webhooks.length === 0 && (
              <button
                onClick={configureWebhook}
                disabled={isConfiguring}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConfiguring ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Configure Webhook
                  </>
                )}
              </button>
            )}

            {/* Webhooks List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 animate-spin text-[#F97316]" />
                <span className="ml-2 text-[#6B7280]">Loading webhooks...</span>
              </div>
            ) : webhooks.length > 0 ? (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg border border-[#2D2D2D] bg-[#242424] space-y-3"
                  >
                    {/* URL */}
                    <div>
                      <p className="text-xs text-[#6B7280] uppercase font-semibold mb-1">
                        Webhook URL
                      </p>
                      <p className="text-sm text-white font-mono break-all">{webhook.url}</p>
                    </div>

                    {/* Events */}
                    <div>
                      <p className="text-xs text-[#6B7280] uppercase font-semibold mb-1">
                        Subscribed Events
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-2 py-1 text-xs rounded bg-[#F97316]/20 text-[#F97316] font-medium"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        {webhook.active ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                            <span className="text-sm text-[#22C55E]">Active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                            <span className="text-sm text-[#EF4444]">Inactive</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="p-2 rounded hover:bg-[#1E1E20] text-[#6B7280] hover:text-[#EF4444] transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Created/Updated */}
                    <div className="text-xs text-[#6B7280] space-y-1 pt-2 border-t border-[#2D2D2D]">
                      <p>Created: {new Date(webhook.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(webhook.updatedAt).toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Add Another Webhook */}
                <button
                  onClick={configureWebhook}
                  disabled={isConfiguring}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[#2D2D2D] text-[#6B7280] hover:text-white hover:border-[#F97316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfiguring ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Another Webhook
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6 text-center rounded-lg border border-dashed border-[#2D2D2D]">
                <p className="text-[#6B7280] mb-4">
                  No webhooks configured yet. Set up automatic analysis triggering on GitHub events.
                </p>
              </div>
            )}

            {/* Info */}
            <div className="p-3 rounded-lg bg-[#F97316]/5 border border-[#F97316]/20">
              <p className="text-xs text-[#6B7280]">
                <strong>Info:</strong> Webhooks will automatically trigger analysis when you push code or open
                pull requests. This requires GitHub write access.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
