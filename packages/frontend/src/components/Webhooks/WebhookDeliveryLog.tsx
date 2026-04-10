import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  statusCode?: number;
  responseTime: number;
  error?: string;
  payload: Record<string, unknown>;
  deliveredAt: Date;
  retryCount: number;
}

interface WebhookDeliveryLogProps {
  webhookId?: string;
  deliveries?: WebhookDelivery[];
  isLoading?: boolean;
  onRetry?: (deliveryId: string) => void;
}

export const WebhookDeliveryLog: React.FC<WebhookDeliveryLogProps> = ({
  deliveries = [],
  isLoading = false,
  onRetry,
}) => {
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'FAILED':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'PENDING':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin">
          <Clock className="w-6 h-6 text-orange-500" />
        </div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No webhook deliveries yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold">Event</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Response Time</th>
              <th className="text-left py-3 px-4 font-semibold">Delivered</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className={`border-b border-gray-100 dark:border-gray-800 ${getStatusColor(delivery.status)}`}
              >
                <td className="py-3 px-4">{delivery.event}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(delivery.status)}
                    <span className="text-xs font-medium">{delivery.status}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{delivery.responseTime}ms</td>
                <td className="py-3 px-4">
                  {format(new Date(delivery.deliveredAt), 'PPp', { locale: es })}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => setSelectedDelivery(delivery)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs mr-2"
                  >
                    Details
                  </button>
                  {delivery.status === 'FAILED' && onRetry && (
                    <button
                      onClick={() => onRetry(delivery.id)}
                      className="text-orange-600 dark:text-orange-400 hover:underline text-xs inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDelivery && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">Delivery Details</h3>
            <button
              onClick={() => setSelectedDelivery(null)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Event:</span>
              <span className="ml-2">{selectedDelivery.event}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status Code:</span>
              <span className="ml-2">{selectedDelivery.statusCode || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
              <span className="ml-2">{selectedDelivery.responseTime}ms</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Retry Count:</span>
              <span className="ml-2">{selectedDelivery.retryCount}</span>
            </div>
            {selectedDelivery.error && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Error:</span>
                <p className="mt-1 text-red-600 dark:text-red-400 text-xs">
                  {selectedDelivery.error}
                </p>
              </div>
            )}
            <div>
              <span className="text-gray-600 dark:text-gray-400">Payload:</span>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(selectedDelivery.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookDeliveryLog;
