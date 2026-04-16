# Guía: Exponer SCR Agent con ngrok

Esta guía te muestra cómo exponer tu instancia local de SCR Agent a través de ngrok para acceso remoto.

## 🚀 Inicio Rápido

### 1. Instalar ngrok

```bash
# macOS
brew install ngrok

# Linux
sudo snap install ngrok

# Windows (con Chocolatey)
choco install ngrok
```

[Descargar ngrok](https://ngrok.com/download)

### 2. Autenticación (Opcional)

```bash
# Crear cuenta en https://ngrok.com/signup
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Ejecutar Aplicación Localmente

```bash
# En la raíz del proyecto
npm run dev:all
```

Espera a que ambos servidores estén listos:
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### 4. Exponer con ngrok (Nueva Terminal)

```bash
# Frontend (puerto 5173)
ngrok http 5173
```

Copiarás una URL como:
```
https://worst-negate-brussels.ngrok-free.dev
```

### 5. Acceder Remotamente

Abre el navegador con la URL que generó ngrok:
```
https://worst-negate-brussels.ngrok-free.dev
```

✅ ¡Listo! La aplicación está accesible de forma remota.

---

## 🔧 Configuración Avanzada

### Exponer Backend y Frontend Simultáneamente

```bash
# Terminal 1: Frontend
ngrok http 5173

# Terminal 2: Backend
ngrok http 3001

# Terminal 3: Aplicación
cd packages/backend && npm run dev
cd packages/frontend && npm run dev
```

### Usar Dominio Personalizado (Pro)

```bash
# Con cuenta ngrok PRO, usa el mismo dominio cada vez
ngrok http 5173 --domain=your-custom-domain.ngrok.io
```

### Configurar Variables de Entorno

**Frontend** - `.env`:
```bash
VITE_API_URL="https://tu-ngrok-backend.ngrok-free.dev/api/v1"
VITE_WS_URL="wss://tu-ngrok-backend.ngrok-free.dev"
```

**Backend** - `.env`:
```bash
FRONTEND_URL="https://tu-ngrok-frontend.ngrok-free.dev"
NODE_ENV="development"
```

### Inspeccionar Requests

ngrok proporciona una interfaz web para inspeccionar requests:
```
http://localhost:4040
```

Abre esto en el navegador para ver todas las requests/responses en tiempo real.

---

## ✅ Verificación

### Health Check

```bash
curl https://tu-ngrok-url.ngrok-free.dev/health
# Respuesta esperada: {"status":"ok",...}
```

### Prueba de Login

```bash
curl -X POST https://tu-ngrok-url.ngrok-free.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scr.com","password":"admin123"}'
```

---

## 🐛 Troubleshooting

### Error: "Blocked request. This host is not allowed"

**Solución**: Ya está arreglado. Las configuraciones actuales soportan:
- ✅ `*.ngrok-free.dev`
- ✅ `*.ngrok.io`
- ✅ Todos los hosts en `development`

### WebSocket no conecta

Asegúrate de que el backend también está expuesto:

```bash
# Necesitas exponer el backend en otra terminal
ngrok http 3001
```

Y actualiza el `.env` del frontend:
```bash
VITE_WS_URL="wss://tu-ngrok-backend.ngrok-free.dev"
```

### CORS Errors

Si ves errores de CORS, verifica que:
1. ✅ El backend está en `development` (NODE_ENV=development)
2. ✅ La URL de ngrok está incluida en `allowedOrigins` o matches el patrón

### Conexión lenta

ngrok introduce latencia mínima. Si es demasiado lenta:
- Usa ngrok PRO para mejor rendimiento
- Verifica tu conexión a internet
- Usa `ngrok http 5173 -region=us` para región cercana

---

## 📊 Monitoreo

### Ver estado de ngrok

```bash
# La salida mostrará:
# Forwarding  https://worst-negate-brussels.ngrok-free.dev -> http://localhost:5173
# Forwarding  http://worst-negate-brussels.ngrok-free.dev -> http://localhost:5173
```

### Logs en Tiempo Real

Ver los logs en la interfaz web:
```
http://localhost:4040
```

---

## 🔒 Seguridad

### Proteger con Contraseña HTTP

```bash
ngrok http 5173 --auth "user:password"
```

### Restricción por IP

```bash
ngrok http 5173 --ip-restriction "192.168.1.1,10.0.0.1"
```

### Rate Limiting

```bash
ngrok http 5173 --rate-limit "5"  # 5 requests por segundo
```

---

## 📝 Notas

- **URLs Temporales**: Las URLs ngrok-free cambian cada vez que reinicia
- **Timeout**: Las conexiones ociosas se cierran después de 1-2 horas (PRO: ilimitado)
- **Costo**: ngrok-free es gratuito, PRO da más features
- **Privacidad**: Los datos viajan encriptados (HTTPS)

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica que local funciona: `http://localhost:5173`
2. Revisa `http://localhost:4040` (inspector ngrok)
3. Mira los logs del backend: `npm run dev:backend`
4. Verifica variables de entorno

---

**Happy Tunneling! 🚀**
