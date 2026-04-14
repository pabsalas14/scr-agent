export interface SecurityTopic {
  id: string;
  title: string;
  category: 'SCR_METHODOLOGY' | 'THREAT_TYPES' | 'GIT_FORENSICS' | 'REMEDIATION';
  summary: string;
  content: string;
  examples?: {
    bad: string;
    good: string;
    explanation: string;
  }[];
}

export const SECURITY_KNOWLEDGE: SecurityTopic[] = [
  {
    id: 'scr-intro',
    title: '¿Qué es el SCR (Source Code Review)?',
    category: 'SCR_METHODOLOGY',
    summary: 'Definición, finalidad y ventajas clave del análisis agéntico.',
    content: `
El **Source Code Review (SCR)** agéntico es una evolución de la auditoría de seguridad tradicional. A diferencia de las herramientas SAST (Static Application Security Testing) que buscan firmas de código conocidas, el SCR agéntico utiliza **modelos de lenguaje masivos (LLMs)** y agentes autónomos para entender la **intención** detrás del código.

### Finalidad
La finalidad de SCR Agent es identificar vulnerabilidades de lógica compleja, puertas traseras (backdoors) y manipulaciones sutiles en el historial de Git que pasarían desapercibidas para herramientas automáticas simples.

### Ventajas
- **Análisis Semántico**: Entiende para qué sirve una función, no solo cómo está escrita.
- **Correlación Forense**: Cruza hallazgos en el código con el historial de commits y el comportamiento de los autores.
- **Baja tasa de Falsos Positivos**: Los agentes "razonan" sobre el riesgo antes de reportarlo.
- **Disponibilidad 24/7**: Auditoría continua en cada commit.
    `
  },
  {
    id: 'scr-methodology',
    title: 'Metodología SCR Agent',
    category: 'SCR_METHODOLOGY',
    summary: 'El proceso detrás de cada análisis: Inspector, Detective y Fiscal.',
    content: `
Nuestro sistema opera bajo un flujo de trabajo de 3 etapas críticas:

1. **Fase de Inspección (Agente Inspector)**:
   Escanea el código fuente buscando patrones de malicia, ofuscación o malas prácticas. Su objetivo es la detección primaria.
   
2. **Fase de Investigación (Agente Detective)**:
   Toma los hallazgos del Inspector y viaja al pasado del repositorio. Analiza quién introdujo el código, cuándo, y si fue parte de una serie de cambios sospechosos en otros archivos.
   
3. **Fase de Síntesis (Agente Fiscal)**:
   Cruza la información de las dos fases anteriores para generar un reporte ejecutivo. Calcula la ponderación de riesgo y prioriza las acciones de remediación.
    `
  },
  {
    id: 'threat-ponderation',
    title: 'Ponderación de Amenazas',
    category: 'SCR_METHODOLOGY',
    summary: 'Cómo calculamos el Risk Score y por qué es importante.',
    content: `
El **Risk Score** (0-100) es el indicador definitivo de la salud de tu proyecto. Se calcula mediante una matriz de impacto y probabilidad:

- **CRÍTICO (90-100)**: Amenazas que permiten ejecución remota de código o compromiso total del sistema (ej: Puerta trasera activa).
- **ALTO (70-89)**: Vulnerabilidades graves que exponen datos sensibles o permiten bypass de seguridad.
- **MEDIO (40-69)**: Fallos de lógica o configuraciones inseguras que requieren atención.
- **BAJO (0-39)**: Desviaciones de mejores prácticas o info leaks menores.

**Patrón de ponderación**: Un hallazgo "Crítico" con alta evidencia forense (ej: un commit ofuscado por un autor nuevo) eleva el score mucho más que una vulnerabilidad técnica en código legacy.
    `
  },
  {
    id: 'backdoors',
    title: 'Puertas Traseras (Backdoors)',
    category: 'THREAT_TYPES',
    summary: 'Identificación y patrones de acceso oculto.',
    content: `
Una puerta trasera es un método para saltar la autenticación normal o mantener un acceso remoto dentro de un sistema.

### Patrones Comunes
- **Autenticación Bypass**: Códigos como \`if (user === "admin_debug") return true\`.
- **Carga Dinámica**: Uso de \`eval()\`, \`exec()\` o \`socket.connect()\` con IPs hardcodeadas u ofuscadas en Base64.
- **Bombas de Tiempo**: Código que solo se activa después de una fecha específica o después de N ejecuciones.
    `,
    examples: [
      {
        bad: 'if (req.headers["x-debug-key"] === "SUPER_SECRET_PASS") { loginUser(req.body.id); }',
        good: 'const user = await db.users.findUnique({ where: { id: req.body.id, authToken: req.headers.authorization } });',
        explanation: 'El ejemplo malicioso contiene un "Master Key" que permite acceso a cualquier cuenta sin contraseña real.'
      }
    ]
  },
  {
    id: 'git-forensics',
    title: 'Análisis Forense de Git',
    category: 'GIT_FORENSICS',
    summary: 'Cómo el Agente Detective rastrea el origen de las amenazas.',
    content: `
El código por sí solo no cuenta toda la historia. El **Análisis Forense** examina los metadatos de Git para identificar comportamientos anómalos.

### Patrones de Trazabilidad
- **El Factor "Tiempo"**: Commits realizados en horarios inusuales (ej: 3 AM) que inyectan cambios en archivos críticos.
- **Autoría Sospechosa**: Cambios en el núcleo de seguridad realizados por un autor que nunca antes había tocado ese módulo.
- **Commits "Camuflados"**: Un commit con mensaje "Fix typo" que en realidad modifica la lógica de cifrado o autenticación.
- **Incremento de Volumen**: Inyección repentina de miles de líneas de código (posible librerías maliciosas o dependencias comprometidas).

**Metodología**: El Agente Detective reconstruye el árbol de decisiones del atacante, permitiendo no solo borrar el código, sino entender la profundidad del compromiso.
    `
  },
  {
    id: 'remediation-tactics',
    title: 'Tácticas de Remediación',
    category: 'REMEDIATION',
    summary: 'Estrategias para neutralizar amenazas de forma segura.',
    content: `
Una vez detectada una amenaza, la rapidez es clave, pero la precisión es vital para no romper el sistema.

### Estrategias Recomendadas
1. **Reversión Inmediata (Revert)**: Si el commit malicioso es identificable, un \`git revert\` es la forma más limpia de deshacer el cambio manteniendo el historial.
2. **Parche de Emergencia**: Si el código malicioso está mezclado con lógica legítima, se debe aplicar un parche manual documentado.
3. **Auditoría de Credenciales**: Tras un hallazgo crítico (Backdoor), es obligatorio rotar todas las claves de API, tokens de GitHub y credenciales de base de datos asociadas a ese entorno.

### Verificación
Cada remediación debe ser validada por un nuevo escaneo de SCR Agent para confirmar que el vector de ataque ha sido cerrado exitosamente.
    `
  }
];
