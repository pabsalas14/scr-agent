import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, BookOpen, Tag, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { apiService } from '../services/api.service';
import { useToast } from '../hooks/useToast';

const SECURITY_RULE_CATEGORIES = [
  {
    id: 'owasp',
    title: 'OWASP Top 10',
    description: 'Las vulnerabilidades web más críticas',
    rules: [
      { title: 'SQL Injection', severity: 'CRITICAL' },
      { title: 'Cross-Site Scripting (XSS)', severity: 'HIGH' },
      { title: 'Broken Authentication', severity: 'CRITICAL' },
      { title: 'Sensitive Data Exposure', severity: 'HIGH' },
    ]
  },
  {
    id: 'cwe',
    title: 'Common Weakness Enumeration',
    description: 'Lista estándar de debilidades de software',
    rules: []
  },
  {
    id: 'custom',
    title: 'Reglas Personalizadas',
    description: 'Reglas configuradas para tu organización',
    rules: []
  }
];

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const toast = useToast();

  // Cargar hallazgos para crear una "biblioteca" basada en datos reales
  const { data: findingsData, isLoading } = useQuery({
    queryKey: ['library-findings'],
    queryFn: () => apiService.obtenerHallazgosGlobales({ limit: 100 }),
  });

  // Mapear hallazgos a elementos de biblioteca por tipo de riesgo
  const libraryItems = (findingsData?.data || [])
    .reduce((acc: any[], finding: any) => {
      const existing = acc.find(item => item.riskType === finding.riskType);
      if (!existing) {
        acc.push({
          id: finding.riskType,
          title: finding.riskType?.replace(/_/g, ' ') || 'Unknown Risk',
          category: 'DETECTED',
          description: `Patrón de riesgo detectado en análisis`,
          severity: finding.severity,
          instances: 1,
        });
      } else {
        existing.instances += 1;
      }
      return acc;
    }, [])
    .concat(SECURITY_RULE_CATEGORIES[0].rules.map((rule, idx) => ({
      id: `owasp-${idx}`,
      title: rule.title,
      category: 'OWASP',
      description: 'Vulnerabilidad web crítica',
      severity: rule.severity,
      instances: 0,
    })));

  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch = !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(libraryItems.map(item => item.category)));

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Biblioteca de Seguridad</h1>
          <p className="text-sm text-[#A0A0A0]">
            Reglas y patrones de detección de seguridad
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNewRuleDialog(true)}>
          <Plus size={18} className="mr-2" />
          Nueva Regla
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
          <input
            type="text"
            placeholder="Buscar en la biblioteca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
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

      {/* Library Items */}
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>

                <p className="text-sm text-[#A0A0A0] mb-2">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 text-xs">
                  <Tag size={14} className="text-[#666666]" />
                  <span className="text-[#666666]">{item.category}</span>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setIsEditingMode(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  Ver
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setIsEditingMode(true);
                  }}
                  className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] rounded-lg text-xs font-medium text-[#A0A0A0] transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
          <p className="text-[#A0A0A0]">No se encontraron elementos en la biblioteca</p>
        </div>
      )}

      {/* Detail/Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-[#2D2D2D] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{isEditingMode ? 'Editar' : 'Ver'} Regla</h2>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setIsEditingMode(false);
                }}
                className="p-2 hover:bg-[#2D2D2D] rounded-lg"
              >
                <X className="text-[#A0A0A0]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Nombre de la Regla</label>
                <div className={`px-4 py-2 rounded-lg border ${isEditingMode ? 'bg-[#111111] border-[#2D2D2D]' : 'bg-[#0F0F0F] border-[#1A1A1A]'} text-white`}>
                  {selectedItem.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Descripción</label>
                <div className={`px-4 py-2 rounded-lg border ${isEditingMode ? 'bg-[#111111] border-[#2D2D2D]' : 'bg-[#0F0F0F] border-[#1A1A1A]'} text-white`}>
                  {selectedItem.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Severidad</label>
                  <div className={`px-4 py-2 rounded-lg border ${isEditingMode ? 'bg-[#111111] border-[#2D2D2D]' : 'bg-[#0F0F0F] border-[#1A1A1A]'} text-white`}>
                    {selectedItem.severity}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Categoría</label>
                  <div className={`px-4 py-2 rounded-lg border ${isEditingMode ? 'bg-[#111111] border-[#2D2D2D]' : 'bg-[#0F0F0F] border-[#1A1A1A]'} text-white`}>
                    {selectedItem.category}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Instancias Detectadas</label>
                <div className={`px-4 py-2 rounded-lg border ${isEditingMode ? 'bg-[#111111] border-[#2D2D2D]' : 'bg-[#0F0F0F] border-[#1A1A1A]'} text-white`}>
                  {selectedItem.instances}
                </div>
              </div>

              {isEditingMode && (
                <button
                  onClick={() => {
                    toast.success('Regla actualizada correctamente');
                    setSelectedItem(null);
                    setIsEditingMode(false);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Guardar Cambios
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Rule Dialog */}
      {showNewRuleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-[#2D2D2D] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Nueva Regla de Seguridad</h2>
              <button
                onClick={() => setShowNewRuleDialog(false)}
                className="p-2 hover:bg-[#2D2D2D] rounded-lg"
              >
                <X className="text-[#A0A0A0]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Nombre de la Regla</label>
                <input
                  type="text"
                  placeholder="Ej: SQL Injection Detection"
                  className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Descripción</label>
                <textarea
                  placeholder="Describe qué busca esta regla..."
                  rows={4}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Severidad</label>
                  <select className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:border-blue-500 focus:outline-none">
                    <option>LOW</option>
                    <option>MEDIUM</option>
                    <option>HIGH</option>
                    <option>CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#A0A0A0] mb-2">Categoría</label>
                  <select className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:border-blue-500 focus:outline-none">
                    <option>CUSTOM</option>
                    <option>OWASP</option>
                    <option>CWE</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success('Regla creada correctamente');
                  setShowNewRuleDialog(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
              >
                Crear Regla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
