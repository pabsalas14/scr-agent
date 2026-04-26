import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Tag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api.service';

type LibraryItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: string;
  instances: number;
};

/**
 * Patrones agregados solo desde hallazgos reales (API).
 * Las "reglas de notificación" viven en Reglas de alerta (centro de hallazgos).
 */
export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const { data: findingsData, isLoading } = useQuery({
    queryKey: ['library-findings'],
    queryFn: () => apiService.obtenerHallazgosGlobales({ limit: 200 }),
  });

  const libraryItems: LibraryItem[] = (findingsData?.data || []).reduce(
    (acc: LibraryItem[], finding: { riskType?: string; severity?: string; whySuspicious?: string }) => {
      const key = finding.riskType || 'UNKNOWN';
      const existing = acc.find((item) => item.id === key);
      if (!existing) {
        acc.push({
          id: key,
          title: (finding.riskType || 'UNKNOWN').replace(/_/g, ' '),
          category: 'DETECTADO',
          description:
            (finding.whySuspicious as string) ||
            'Tipo de riesgo observado en tus análisis.',
          severity: (finding.severity as string) || 'MEDIUM',
          instances: 1,
        });
      } else {
        existing.instances += 1;
      }
      return acc;
    },
    []
  );

  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(libraryItems.map((item) => item.category)));

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-500 bg-red-500/10';
      case 'HIGH':
        return 'text-orange-500 bg-orange-500/10';
      case 'MEDIUM':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Biblioteca de patrones</h1>
          <p className="text-sm text-[#A0A0A0]">
            Tipos de riesgo detectados en tus análisis. Para alertas y webhooks, usa{' '}
            <Link to="/dashboard/hallazgos" className="text-blue-400 hover:underline">
              Hallazgos → Reglas de alerta
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
          <input
            type="text"
            placeholder="Buscar por tipo o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-[#2D2D2D] text-[#A0A0A0] hover:bg-[#3D3D3D]'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2D2D2D] text-[#A0A0A0] hover:bg-[#3D3D3D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-[#A0A0A0] text-sm">Cargando hallazgos…</p>}

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#4B5563] transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="text-blue-400" size={18} />
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(item.severity)}`}
                  >
                    {item.severity}
                  </span>
                </div>

                <p className="text-sm text-[#A0A0A0] mb-2">{item.description}</p>

                <div className="flex items-center gap-2 text-xs">
                  <Tag size={14} className="text-[#666666]" />
                  <span className="text-[#666666]">{item.category}</span>
                  <span className="text-[#666666]">· {item.instances} instancias</span>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  Ver
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && !isLoading && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
          <p className="text-[#A0A0A0]">
            Aún no hay tipos de riesgo agregados. Ejecuta análisis con hallazgos para poblar la
            biblioteca.
          </p>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#111111] border-b border-[#2D2D2D] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Detalle</h2>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-[#2D2D2D] rounded-lg"
              >
                <X className="text-[#A0A0A0]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="block text-sm font-medium text-[#A0A0A0] mb-2">Tipo</span>
                <div className="px-4 py-2 rounded-lg border bg-[#0F0F0F] border-[#1A1A1A] text-white">
                  {selectedItem.title}
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-[#A0A0A0] mb-2">Descripción</span>
                <div className="px-4 py-2 rounded-lg border bg-[#0F0F0F] border-[#1A1A1A] text-white">
                  {selectedItem.description}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-[#A0A0A0] mb-2">Severidad</span>
                  <div className="px-4 py-2 rounded-lg border bg-[#0F0F0F] border-[#1A1A1A] text-white">
                    {selectedItem.severity}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-[#A0A0A0] mb-2">Instancias</span>
                  <div className="px-4 py-2 rounded-lg border bg-[#0F0F0F] border-[#1A1A1A] text-white">
                    {selectedItem.instances}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
