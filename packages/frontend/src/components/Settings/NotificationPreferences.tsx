/**
 * Notification Preferences Component
 * Manage user notification settings and preferences
 */

import { useState } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';

interface NotificationPreference {
  id: string;
  userId: string;
  emailOnFindingDetected: boolean;
  emailOnFindingAssigned: boolean;
  emailOnRemediationVerified: boolean;
  emailOnCommentAdded: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  dailyDigest: boolean;
  digestTime: string; // HH:mm format
}

const PREFERENCE_ITEMS = [
  {
    id: 'emailOnFindingDetected',
    title: 'Email on Finding Detected',
    description: 'Get emailed when a new security finding is detected',
    icon: Mail,
    category: 'findings'
  },
  {
    id: 'emailOnFindingAssigned',
    title: 'Email on Finding Assigned',
    description: 'Get notified when a finding is assigned to you',
    icon: Mail,
    category: 'findings'
  },
  {
    id: 'emailOnRemediationVerified',
    title: 'Email on Remediation Verified',
    description: 'Get notified when your remediation is verified',
    icon: Mail,
    category: 'remediation'
  },
  {
    id: 'emailOnCommentAdded',
    title: 'Email on New Comment',
    description: 'Get notified when someone comments on your findings',
    icon: Mail,
    category: 'comments'
  },
  {
    id: 'pushNotifications',
    title: 'Push Notifications',
    description: 'Receive push notifications on your device',
    icon: Smartphone,
    category: 'delivery'
  },
  {
    id: 'inAppNotifications',
    title: 'In-App Notifications',
    description: 'Show notifications within the application',
    icon: Bell,
    category: 'delivery'
  },
  {
    id: 'dailyDigest',
    title: 'Daily Digest',
    description: 'Receive a daily summary of all activity',
    icon: MessageSquare,
    category: 'digest'
  }
];

export default function NotificationPreferences() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreference | null>(null);

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiService.get('/api/v1/users/preferences');
      const data = response.data?.data || (response.data as NotificationPreference);
      setLocalPreferences(data);
      return data;
    }
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreference>) => {
      const response = await apiService.post('/api/v1/users/preferences', data);
      return response.data?.data || response.data;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['notification-preferences'], updatedData);
      setLocalPreferences(updatedData);
      toast.success('Preferences updated successfully');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    }
  });

  const handleToggle = async (key: keyof NotificationPreference, value: boolean) => {
    const updated = { ...localPreferences, [key]: value };
    setLocalPreferences(updated as NotificationPreference);
    await updateMutation.mutateAsync({ [key]: value });
  };

  const handleDigestTimeChange = async (time: string) => {
    const updated = { ...localPreferences, digestTime: time };
    setLocalPreferences(updated as NotificationPreference);
    await updateMutation.mutateAsync({ digestTime: time });
  };

  if (isLoading || !localPreferences) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin text-4xl mb-3">⚙️</div>
          <p className="text-[#6B7280]">Loading preferences...</p>
        </div>
      </Card>
    );
  }

  const categories = {
    findings: { label: 'Finding Notifications', icon: AlertCircle },
    remediation: { label: 'Remediation Updates', icon: CheckCircle },
    comments: { label: 'Discussion Notifications', icon: MessageSquare },
    delivery: { label: 'Delivery Methods', icon: Smartphone },
    digest: { label: 'Daily Digest', icon: MessageSquare }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          Notification Preferences
        </h2>
        <p className="text-[#6B7280] mt-1">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Settings by category */}
      {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
        const categoryItems = PREFERENCE_ITEMS.filter(item => item.category === categoryKey);
        if (categoryItems.length === 0) return null;

        return (
          <Card key={categoryKey}>
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <categoryInfo.icon className="w-5 h-5 text-orange-500" />
                {categoryInfo.label}
              </h3>
            </div>

            <div className="space-y-4">
              {categoryItems.map((item) => {
                const Icon = item.icon;
                const isEnabled = localPreferences[item.id as keyof NotificationPreference];

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-[#6B7280]">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(item.id as keyof NotificationPreference, !isEnabled)}
                      disabled={updateMutation.isPending}
                      className={`ml-3 flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled
                          ? 'bg-blue-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      } ${
                        updateMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Digest Time Setting */}
      {localPreferences.dailyDigest && (
        <Card className="border-l-4" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="space-y-3">
            <label className="block">
              <span className="font-medium text-white mb-2 block">
                Digest Delivery Time
              </span>
              <input
                type="time"
                value={localPreferences.digestTime}
                onChange={(e) => handleDigestTimeChange(e.target.value)}
                disabled={updateMutation.isPending}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Daily digest will be sent at this time
              </p>
            </label>
          </div>
        </Card>
      )}

      {/* Save Status */}
      {updateMutation.isPending && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          Saving preferences...
        </div>
      )}
    </div>
  );
}
