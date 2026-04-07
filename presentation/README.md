# SCR Agent - Presentación Interactiva

Presentación técnica y visual del sistema de auditoría de código inteligente **SCR Agent**.

## 🎯 Características

- ✅ Presentación interactiva y responsiva
- ✅ Diagramas de arquitectura dinámicos
- ✅ Pipeline de análisis visualizado
- ✅ Trazabilidad y seguimiento
- ✅ Dashboard mockup integrado
- ✅ Datos reales + ficticios claramente marcados
- ✅ Información sobre modelos y tecnologías
- ✅ Estimaciones de costos
- ✅ Arquitectura Docker/Deployment

## 📋 Contenido

### Secciones Principales

1. **Portada** - Hero section con estadísticas clave
2. **Problema & Solución** - Contexto y valor propuesto
3. **Arquitectura** - Componentes del sistema
4. **Pipeline de Análisis** - Flujo de detección
5. **Módulos Principales** - Amenazas, Remediación, Forense, Incidentes
6. **Agentes IA** - [PRÓXIMA SECCIÓN - Funcionalidades y explotación]
7. **Modelos & Tecnología** - Stack técnico utilizado
8. **Estimaciones de Costos** - Inversión y ROI
9. **Arquitectura Docker** - Deployment y escalabilidad
10. **Trazabilidad** - Seguimiento completo
11. **Dashboard** - Mockup del sistema
12. **Conclusión** - Resumen y beneficios

## 🚀 Ejecución

### Localmente (Node.js)

```bash
# Instalar dependencias
npm install

# Ejecutar servidor
npm start

# Acceder en http://localhost:3000
```

### Con Docker Compose

```bash
# Construir e iniciar
docker-compose up

# Ver logs
docker-compose logs -f presentation

# Detener
docker-compose down
```

### Con Docker (Manual)

```bash
# Construir imagen
docker build -t scr-agent/presentation:latest .

# Ejecutar contenedor
docker run -p 3000:3000 scr-agent/presentation:latest

# Acceder en http://localhost:3000
```

## 🌐 Exposición con Ngrok

```bash
# Instalar ngrok (si no lo tienes)
# macOS: brew install ngrok
# Windows: scoop install ngrok
# Linux: apt-get install ngrok

# Exponer servidor local
ngrok http 3000

# Compartir URL pública
# https://[random-subdomain].ngrok.io
```

## 📊 Datos

### Carpeta `/assets/data/`

- **stats.json** - Estadísticas reales del sistema + datos ficticios
- **models.json** - Descripción de modelos de IA utilizados
- **architecture.json** - Detalles de la arquitectura

### Notas sobre Datos

- ✅ **Datos Reales**: Estadísticas del dashboard, precisión, tiempos
- ℹ️ **Datos Ficticios**: Nombres de proyectos y algunos ejemplos (marcados claramente)

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- GSAP (animaciones)

### Backend (Presentation Server)
- Node.js 18+
- Express.js
- CORS habilitado

### Datos
- JSON estático
- API `/api/stats` para cargar datos dinámicamente

## 📁 Estructura

```
presentation/
├── index.html           # Página principal
├── server.js            # Servidor Express
├── package.json         # Dependencias
├── Dockerfile           # Imagen Docker
├── docker-compose.yml   # Orquestación
│
├── css/
│   ├── main.css         # Estilos principales
│   └── diagrams.css     # Estilos para SVGs
│
├── js/
│   └── main.js          # Animaciones y interactividad
│
└── assets/
    ├── data/
    │   ├── stats.json
    │   ├── models.json
    │   └── architecture.json
    ├── screenshots/     # [Para agregar]
    ├── mockups/         # [Para agregar]
    ├── logos/
    └── icons/
```

## 🎨 Diseño

- **Color Primario**: #F97316 (Naranja)
- **Crítico**: #EF4444 (Rojo)
- **Éxito**: #22C55E (Verde)
- **Fondo**: #111111 (Negro)
- **Tipografía**: Segoe UI, sans-serif

## 📝 Configuración Ambiente

### Variables de Entorno (opcional)

```bash
PORT=3000
NODE_ENV=production
```

## 🔧 Desarrollo

```bash
# Para desarrollo local sin Docker
npm install
npm start

# La presentación se recarga automáticamente al cambiar archivos
# (requiere instalar nodemon: npm install -D nodemon)
```

## 📊 Agregar Screenshots

Coloca screenshots en `assets/screenshots/`:

```
assets/screenshots/
├── dashboard.png         # Vista principal
├── amenazas.png         # Módulo de Amenazas
├── remediacion.png      # Módulo de Remediación
├── forense.png          # Investigaciones Forenses
└── incidentes.png       # Monitoreo de Incidentes
```

Luego referencia en HTML:
```html
<img src="assets/screenshots/dashboard.png" alt="Dashboard">
```

## 📞 Contacto & Soporte

Para reportar problemas o sugerencias, contactar al equipo de SCR Agent.

## 📄 Licencia

MIT

---

**Última actualización**: 2024-04-07
**Versión**: 1.0.0
