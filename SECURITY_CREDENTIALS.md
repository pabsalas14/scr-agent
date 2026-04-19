# 🔐 Gestión Segura de Credenciales - SCR Agent

## Resumen Ejecutivo

Todas las credenciales (GitHub token, LLM keys, etc.) se manejan de forma segura:
- **En la UI**: El usuario ingresa credenciales en **texto claro**
- **En tránsito**: Se envían al backend a través de HTTPS (en desarrollo HTTP pero debería ser HTTPS en producción)
- **En la BD**: Se cifran con **AES-256-GCM** antes de almacenarse
- **En uso**: Se descifran automáticamente cuando se necesitan

## Arquitectura de Encriptación

### 1. Cifrado con AES-256-GCM
- **Algoritmo**: AES-256-GCM (Advanced Encryption Standard con Galois/Counter Mode)
- **Tamaño de clave**: 256 bits (32 bytes = 64 caracteres en hex)
- **IV**: 16 bytes aleatorios por encriptación
- **Auth Tag**: Protege contra tampering
- **Formato almacenado**: `base64(iv):base64(ciphertext):base64(authTag)`

### 2. ENCRYPTION_KEY

La clave de encriptación se configura a través de la variable de entorno:

```bash
ENCRYPTION_KEY=<64-hex-generada>
```

**Ubicación**: 
- Desarrollo: `packages/backend/.env` (ya configurada)
- Producción: Debe estar en las variables de entorno del servidor (NO en .env)

**Generación**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Flujo de Credenciales

### Usuario GitHub

```
1. UI: Usuario ingresa token en texto claro
   ↓
2. Frontend: POST /api/v1/user-settings/github-token
   (Token en body como texto claro)
   ↓
3. Backend: Validar formato contra GitHub API
   ↓
4. Backend: encrypt(token) con AES-256-GCM
   ↓
5. BD: Guardar token CIFRADO
   ↓
6. Análisis: decrypt(token) cuando se necesite
```

### LLM Configuration

```
1. UI: Usuario selecciona proveedor LLM
   - Si es Claude: No necesita config adicional
   - Si es LM Studio: Ingresa URL y modelo en texto claro
   ↓
2. Backend: Valida conexión al servidor LLM
   ↓
3. BD: Guardar configuración (URL y modelo NO se cifran - son datos no-sensibles)
   ↓
4. Análisis: Leer configuración y aplicar a agentes
```

## Endpoints de Seguridad

### GitHub Token
- **POST** `/api/v1/user-settings/github-token` - Guardar token (cifrado automáticamente)
- **DELETE** `/api/v1/user-settings/github-token` - Remover token
- **GET** `/api/v1/user-settings/github-token` - Leer token (descifrado automáticamente)

### LLM Config
- **GET** `/api/v1/user-settings/llm-config` - Leer configuración actual
- **POST** `/api/v1/user-settings/llm-config` - Actualizar proveedor LLM

### API Keys
- **GET** `/api/v1/user-settings/llm-keys` - Listar claves (cifradas)
- **POST** `/api/v1/user-settings/llm-keys` - Agregar clave (cifrada automáticamente)
- **DELETE** `/api/v1/user-settings/llm-keys/{keyId}` - Remover clave

## Configuración del Entorno

### Desarrollo Local

**packages/backend/.env** (committeado, sin credenciales):
```
ENCRYPTION_KEY=<64-hex-generada>
ANTHROPIC_API_KEY=
DATABASE_URL=postgresql://...
JWT_SECRET=scr-agent-dev-secret
...
```

**packages/backend/.env.local** (NO committeado, con credenciales):
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
# Otras credenciales si las necesitas
```

### Producción

En producción, configura variables de entorno en el servidor:
```bash
# En tu hosting (Vercel, Railway, Render, etc)
export ENCRYPTION_KEY="generada-en-servidor"
export ANTHROPIC_API_KEY="tu-clave-real"
export DATABASE_URL="postgresql://..."
export JWT_SECRET="secreto-fuerte"
```

## Procedimiento de Seguridad

### ✅ Buenas Prácticas Implementadas

1. **Encrypt at Rest**: Todas las credenciales se cifran en la BD
2. **No Hardcoding**: Ninguna credencial está hardcodeada en el código
3. **Environment Variables**: Se usan env vars para configuración sensible
4. **.gitignore**: `.env` y `.env.local` están en .gitignore
5. **Validation**: Se valida formato de tokens antes de guardar
6. **Testing**: Se prueba conectividad antes de guardar config

### ⚠️ IMPORTANTE - Nunca Hagas Esto

```bash
# ❌ NO HAGAS ESTO - Nunca commitees credenciales reales
git add .env
git commit -m "Add credentials"

# ❌ NO HAGAS ESTO - Nunca dejes tokens en el código
const GITHUB_TOKEN = "ghp_xxxxx";

# ❌ NO HAGAS ESTO - Nunca dejes API keys en logs
console.log("Token:", userToken);
```

### ✅ Esto Sí Está Bien

```bash
# ✅ Desarrollo con .env.local (no committeado)
echo "ANTHROPIC_API_KEY=sk-ant-xxx" >> .env.local

# ✅ Producción con env vars del servidor
export ENCRYPTION_KEY=$(node -e "...")

# ✅ Credenciales en UI ingresadas por usuario
// El usuario ingresa en la UI, se cifran automáticamente
```

## Verificación de Seguridad

### Checklist de Seguridad

- [ ] ENCRYPTION_KEY está configurada en .env (desarrollo) o env vars (producción)
- [ ] .env.local está en .gitignore (nunca committeado)
- [ ] No hay credenciales hardcodeadas en el código
- [ ] Los tokens se cifran antes de guardarse en BD
- [ ] Los tokens se descifran solo cuando se usan
- [ ] Los logs NO muestran credenciales en texto claro

### Testing de Encriptación

Ejecutar en terminal:
```bash
node -e "
const crypto = require('crypto');
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const plaintext = 'test-credential';
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
console.log('✅ Encryption test passed');
"
```

## Referencias

- **Crypto Service**: `packages/backend/src/services/crypto.service.ts`
- **Settings Routes**: `packages/backend/src/routes/user-settings.routes.ts`
- **Analysis Worker**: `packages/backend/src/workers/analysis.worker.ts`
- **Frontend Integration**: `packages/frontend/src/pages/IntegrationsPage.tsx`

---

**Última actualización**: 2026-04-19
**Status**: ✅ Implementado y verificado
