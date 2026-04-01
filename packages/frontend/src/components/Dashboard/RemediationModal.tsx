/**
 * RemediationModal - Modal profesional para gestionar remediaciones
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  LinkIcon,
  FileText,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Finding, RemediationEntry } from '../../types/findings';
import { findingsService } from '../../services/findings.service';
import { useToast } from '../../hooks/useToast';

interface RemediationModalProps {
  finding: Finding;
  onClose: () => void;
  onSave: () => void;
}

export default function RemediationModal({
  finding,
  onClose,
  onSave,
}: RemediationModalProps) {
  const [remediation, setRemediation] = useState<RemediationEntry | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [proofOfFixUrl, setProofOfFixUrl] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tab, setTab] = useState<'correction' | 'verification'>('correction');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const toast = useToast();

  // Load existing remediation
  useEffect(() => {
    const loadRemediation = async () => {
      try {
        const data = await findingsService.getRemediation(finding.id);
        if (data) {
          setRemediation(data);
          setCorrectionNotes(data.correctionNotes || '');
          setProofOfFixUrl(data.proofOfFixUrl || '');
        }
      } catch (error) {
        console.error('Error loading remediation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRemediation();
  }, [finding.id]);

  const handleSaveRemediation = async () => {
    if (!correctionNotes && !proofOfFixUrl) {
      toast.error('Agrega notas o una URL de prueba');
      return;
    }

    try {
      setIsSaving(true);
      await findingsService.updateRemediation(finding.id, {
        correctionNotes,
        proofOfFixUrl,
        status: 'IN_PROGRESS',
      });
      toast.success('Remediación registrada');
      onSave();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyRemediation = async () => {
    try {
      setIsVerifying(true);
      await findingsService.verifyRemediation(finding.id, verificationNotes);
      toast.success('Remediación verificada');
      onSave();
    } catch (error) {
      toast.error('Error al verificar');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const remediationStatus = remediation?.status === 'VERIFIED'
    ? 'Verificada'
    : remediation?.status === 'IN_PROGRESS'
      ? 'En Progreso'
      : 'Pendiente';

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Remediación">
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
          <p className="text-sm text-[#6B7280]">Cargando...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Remediación: ${finding.file.split('/').pop()}`} size="lg">
      <div className="space-y-4">
        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg border border-[#F97316]/20 bg-[#F97316]/5"
        >
          <p className="text-xs text-[#6B7280] mb-1">Estado de Remediación</p>
          <p className="text-lg font-bold text-[#F97316]">{remediationStatus}</p>
          {remediation?.verifiedAt && (
            <p className="text-xs text-[#6B7280] mt-2">
              Verificada el {new Date(remediation.verifiedAt).toLocaleString('es-ES')}
            </p>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#2D2D2D]">
          <button
            onClick={() => setTab('correction')}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2 ${
              tab === 'correction'
                ? 'text-[#F97316] border-b-[#F97316]'
                : 'text-[#6B7280] border-b-transparent hover:text-[#A0A0A0]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Corrección
          </button>
          <button
            onClick={() => setTab('verification')}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 flex items-center gap-2 ${
              tab === 'verification'
                ? 'text-[#22C55E] border-b-[#22C55E]'
                : 'text-[#6B7280] border-b-transparent hover:text-[#A0A0A0]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Verificación
          </button>
        </div>

        {/* Correction Tab */}
        {tab === 'correction' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Correction Notes */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notas de Corrección
              </label>
              <textarea
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Describe qué cambios realizaste y por qué solucionan el problema..."
                className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#F97316]/50 text-sm resize-none"
                rows={4}
              />
              <p className="text-xs text-[#6B7280] mt-1">Sé específico sobre los cambios implementados</p>
            </div>

            {/* Proof of Fix URL */}
            <div>
              <label className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Prueba de Corrección (URL)
              </label>
              <div className="relative mt-2">
                <input
                  type="url"
                  value={proofOfFixUrl}
                  onChange={(e) => setProofOfFixUrl(e.target.value)}
                  placeholder="https://github.com/user/repo/pull/123"
                  className="w-full px-4 py-2.5 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#F97316]/50 pr-10"
                />
                {proofOfFixUrl && (
                  <button
                    onClick={() => copyToClipboard(proofOfFixUrl)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                  >
                    {copiedUrl ? (
                      <Check className="w-4 h-4 text-[#22C55E]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mt-1">PR, commit, o screenshot demostrando la solución</p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveRemediation}
              disabled={isSaving || (!correctionNotes && !proofOfFixUrl)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#EA6D00] text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar Corrección'}
            </button>

            {remediation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border border-[#22C55E]/20 bg-[#22C55E]/5"
              >
                <p className="text-xs text-[#22C55E] mb-1">Remediación Registrada</p>
                <p className="text-xs text-[#6B7280]">
                  Iniciada:{' '}
                  {remediation.startedAt
                    ? new Date(remediation.startedAt).toLocaleString('es-ES')
                    : 'Ahora'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Verification Tab */}
        {tab === 'verification' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!remediation || remediation.status !== 'VERIFIED' ? (
              <>
                <div className="p-4 rounded-lg border border-[#EAB308]/20 bg-[#EAB308]/5 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#EAB308] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#EAB308]">
                    Verifica que la corrección haya solucionado completamente el problema de seguridad
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Notas de Verificación
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Describe cómo verificaste que la corrección es efectiva..."
                    className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#22C55E]/50 text-sm resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleVerifyRemediation}
                  disabled={isVerifying || !remediation}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : <><CheckCircle2 className="w-4 h-4" /> Verificar Remediación</>}
                </button>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-3">
                <div className="w-14 h-14 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-[#22C55E]" />
                </div>
                <p className="text-lg font-bold text-[#22C55E]">Verificada</p>
                <p className="text-sm text-[#6B7280]">
                  Verificada el {new Date(remediation.verifiedAt!).toLocaleString('es-ES')}
                </p>
                {remediation.verificationNotes && (
                  <p className="text-sm text-[#6B7280] mt-2 p-3 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-left">
                    {remediation.verificationNotes}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
