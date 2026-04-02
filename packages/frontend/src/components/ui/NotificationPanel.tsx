import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, AlertTriangle, CheckCircle2, User, Shield, X } from 'lucide-react';
import { notificationsService } from '../../services/notifications.service';
import { useSocketEvents } from '../../hooks/useSocketEvents';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  ANALYSIS_COMPLETED: { icon: CheckCircle2, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
  ANALYSIS_FAILED:    { icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
  FINDING_CRITICAL:   { icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
  FINDING_ASSIGNED:   { icon: User,          color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10' },
  REMEDIATION_VERIFIED: { icon: Shield,      color: 'text-[#F97316]', bg: 'bg-[#F97316]/10' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(20),
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  useSocketEvents({
    onAnalysisCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
    onAnalysisError: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const unread = (notifications as Notification[]).filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 bg-[#1C1C1E] border border-[#2D2D2D] rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F97316]" />
          <span className="text-sm font-semibold text-white">Notificaciones</span>
          {unread > 0 && (
            <span className="text-[10px] font-bold bg-[#EF4444] text-white rounded-full px-1.5 py-0.5 leading-none">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              title="Marcar todas como leídas"
              className="p-1.5 text-[#6B7280] hover:text-[#A0A0A0] hover:bg-[#242424] rounded-lg transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#A0A0A0] hover:bg-[#242424] rounded-lg transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
          </div>
        ) : (notifications as Notification[]).length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
            <Bell className="w-8 h-8 text-[#2D2D2D]" />
            <p className="text-xs text-[#6B7280] font-medium">Sin notificaciones nuevas</p>
          </div>
        ) : (
          (notifications as Notification[]).map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG['ANALYSIS_COMPLETED'];
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => { if (!n.read) markReadMutation.mutate(n.id); }}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[#242424] transition-colors text-left border-b border-[#2D2D2D] last:border-0 ${!n.read ? 'bg-[#242424]/50' : ''}`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-3 h-3 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${n.read ? 'text-[#6B7280]' : 'text-white'}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-[#475569] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] flex-shrink-0 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
