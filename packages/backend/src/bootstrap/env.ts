import dotenv from 'dotenv';
import path from 'path';
import { validateEnvOrExit } from '../config/validate-env';

// Cargar variables de entorno lo antes posible (antes de importar otros módulos).
// Intentar múltiples rutas (override para evitar vars vacías del sistema).
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), 'packages/backend/.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of envPaths) {
  const result = dotenv.config({ path: p, override: true });
  if (!result.error) break;
}

validateEnvOrExit();
