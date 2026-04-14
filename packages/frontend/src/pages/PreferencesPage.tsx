import { useState } from 'react';
import { Save, Bell, Eye, Language } from 'lucide-react';
import Button from '../components/ui/Button';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: {
      criticalFindings: true,
      dailySummary: true,
      weeklyReport: false,
    },
    defaultView: 'dashboard',
    language: 'es',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Preferencias</h1>
        <p className="text-sm text-[#A0A0A0]">
          Personaliza tu experiencia en la plataforma
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Eye size={18} />
            Tema
          </h3>

          <div className="space-y-2">
            {['dark', 'light', 'auto'].map((theme) => (
              <label key={theme} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={preferences.theme === theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                  className="rounded"
                />
                <span className="text-sm text-[#A0A0A0]">
                  {theme === 'dark' ? 'Oscuro' : theme === 'light' ? 'Claro' : 'Automático'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={18} />
            Notificaciones
          </h3>

          <div className="space-y-3">
            {[
              { key: 'criticalFindings', label: 'Alertas de hallazgos críticos' },
              { key: 'dailySummary', label: 'Resumen diario' },
              { key: 'weeklyReport', label: 'Reporte semanal' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-[#A0A0A0]">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Default View */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Eye size={18} />
            Vista por Defecto
          </h3>

          <select
            value={preferences.defaultView}
            onChange={(e) => setPreferences({ ...preferences, defaultView: e.target.value })}
            className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="dashboard">Dashboard Principal</option>
            <option value="projects">Proyectos</option>
            <option value="incidents">Incidentes</option>
            <option value="analytics">Análisis</option>
          </select>
        </div>

        {/* Language */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Language size={18} />
            Idioma
          </h3>

          <select
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-2 sticky bottom-0 bg-[#111111] border-t border-[#2D2D2D] p-4 -m-6 mt-0">
        <Button onClick={handleSave} size="sm">
          <Save size={18} className="mr-2" />
          Guardar Cambios
        </Button>
        {saved && (
          <span className="ml-4 text-sm text-green-400 flex items-center gap-2">
            ✓ Preferencias guardadas
          </span>
        )}
      </div>
    </div>
  );
}
