import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Bell } from 'lucide-react';
import Button from '../components/ui/Button';
import { apiService } from '../services/api.service';
import { useToast } from '../hooks/useToast';

export default function PreferencesPage() {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailOnFindingDetected: true,
    emailOnFindingAssigned: true,
    emailOnRemediationVerified: true,
    emailOnCommentAdded: true,
    pushNotifications: false,
    inAppNotifications: true,
    dailyDigest: false,
    digestTime: '09:00',
  });

  // Fetch preferences
  const { data: fetchedPreferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => apiService.get('/users/preferences').then(res => res.data?.data),
    staleTime: 60 * 1000,
  });

  // Update preferences when fetched
  useEffect(() => {
    if (fetchedPreferences) {
      setPreferences({
        emailOnFindingDetected: fetchedPreferences.emailOnFindingDetected ?? true,
        emailOnFindingAssigned: fetchedPreferences.emailOnFindingAssigned ?? true,
        emailOnRemediationVerified: fetchedPreferences.emailOnRemediationVerified ?? true,
        emailOnCommentAdded: fetchedPreferences.emailOnCommentAdded ?? true,
        pushNotifications: fetchedPreferences.pushNotifications ?? false,
        inAppNotifications: fetchedPreferences.inAppNotifications ?? true,
        dailyDigest: fetchedPreferences.dailyDigest ?? false,
        digestTime: fetchedPreferences.digestTime ?? '09:00',
      });
    }
  }, [fetchedPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.post('/users/preferences', preferences);
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      toast.error('Error al guardar preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Preferencias</h1>
        <p className="text-sm text-[#A0A0A0]">
          Personaliza tu experiencia en la plataforma
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Bell size={18} />
                Notificaciones
              </h3>

              <div className="space-y-3">
                {[
                  { key: 'emailOnFindingDetected', label: 'Email en hallazgos detectados' },
                  { key: 'emailOnFindingAssigned', label: 'Email en hallazgos asignados' },
                  { key: 'emailOnRemediationVerified', label: 'Email en remediación verificada' },
                  { key: 'emailOnCommentAdded', label: 'Email en nuevos comentarios' },
                  { key: 'inAppNotifications', label: 'Notificaciones dentro de la app' },
                  { key: 'dailyDigest', label: 'Resumen diario' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences[key as keyof typeof preferences] === true}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          [key]: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-[#A0A0A0]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Digest Time */}
            {preferences.dailyDigest && (
              <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
                <h3 className="font-semibold text-white mb-4">Hora del Resumen Diario</h3>
                <input
                  type="time"
                  value={preferences.digestTime}
                  onChange={(e) => setPreferences({ ...preferences, digestTime: e.target.value })}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

          </div>

          {/* Save Button */}
          <div className="flex gap-2 sticky bottom-0 bg-[#111111] border-t border-[#2D2D2D] p-4 -m-6 mt-0">
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save size={18} className="mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
