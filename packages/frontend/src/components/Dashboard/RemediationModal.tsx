/**
 * RemediationModal - Modal para gestionar la remediación de hallazgos
 * Permite: registrar correcciones, agregar prueba, verificar
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  FileText,
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
      toast.error('Error al guardar remediación');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyRemediation = async () => {
    try {
      setIsVerifying(true);
      await findingsService.verifyRemediation(finding.id, verificationNotes);
      toast.success('Remediación verificada correctamente');
      onSave();
    } catch (error) {
      toast.error('Error al verificar remediación');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Remediación">
        <div className="text-center py-8">
          <div className="animate-spin text-3xl mb-2">⚙️</div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Remediación: ${finding.file}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg"
        >
          <p className="text-xs text-blue-300 mb-1">Estado de Remediación</p>
          <p className="text-blue-400 font-semibold">
            {remediation?.status === 'VERIFIED'
              ? '✓ Verificada'
              : remediation?.status === 'IN_PROGRESS'
                ? '⏳ En Progreso'
                : 'Pendiente'}
          </p>
          {remediation?.verifiedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Verificada el {new Date(remediation.verifiedAt).toLocaleString()}
            </p>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setTab('correction')}
            className={`px-4 py-2 font-medium transition-colors ${
              tab === 'correction'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Corrección
          </button>
          <button
            onClick={() => setTab('verification')}
            className={`px-4 py-2 font-medium transition-colors ${
              tab === 'verification'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Verificación
          </button>
        </div>

        {/* Correction Tab */}
        {tab === 'correction' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Correction Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                📝 Notas de Corrección
              </label>
              <textarea
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Describe qué cambios realizaste para corregir esta vulnerabilidad..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-1">
                Sé específico sobre los cambios y por qué los resuelven
              </p>
            </div>

            {/* Proof of Fix URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Prueba de Corrección (URL)
              </label>
              <input
                type="url"
                value={proofOfFixUrl}
                onChange={(e) => setProofOfFixUrl(e.target.value)}
                placeholder="https://github.com/.../pull/123"
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                PR, commit, o screenshot que demuestre la corrección
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveRemediation}
              disabled={isSaving || (!correctionNotes && !proofOfFixUrl)}
              isLoading={isSaving}
              className="w-full"
            >
              Guardar Corrección
            </Button>

            {remediation && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg"
              >
                <p className="text-xs text-green-300 mb-2">
                  ✓ Remediación guardada
                </p>
                <p className="text-xs text-gray-400">
                  Iniciada:{' '}
                  {remediation.startedAt
                    ? new Date(remediation.startedAt).toLocaleString()
                    : 'Ahora'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Verification Tab */}
        {tab === 'verification' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {!remediation || remediation.status !== 'VERIFIED' ? (
              <>
                <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-300">
                    ⚠️ Verifica que la corrección sea válida y completa
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    ✓ Notas de Verificación
                  </label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Describe cómo verificaste que la corrección es válida..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 text-sm"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleVerifyRemediation}
                  disabled={
                    isVerifying || !remediation || remediation.status === 'VERIFIED'
                  }
                  isLoading={isVerifying}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  ✓ Verificar Remediación
                </Button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-bold text-green-400 mb-2">
                  ✓ Verificada
                </p>
                <p className="text-gray-400 text-sm">
                  Verificada el{' '}
                  {new Date(remediation.verifiedAt!).toLocaleString()}
                </p>
                {remediation.verificationNotes && (
                  <p className="text-gray-400 text-sm mt-4 p-3 bg-gray-800/30 rounded">
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
