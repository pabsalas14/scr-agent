// Initialize GSAP animations
gsap.registerPlugin(ScrollTrigger);

// Smooth scroll for nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Animate hero section
gsap.to('.hero-title', {
    duration: 1,
    opacity: 1,
    y: 0,
    delay: 0.2
});

gsap.to('.hero-subtitle', {
    duration: 1,
    opacity: 1,
    y: 0,
    delay: 0.4
});

gsap.to('.hero-description', {
    duration: 1,
    opacity: 1,
    y: 0,
    delay: 0.6
});

// Animate cards on scroll
document.querySelectorAll('.problem-card, .solution-card, .feature-card').forEach(card => {
    gsap.to(card, {
        scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            onEnter: () => {
                gsap.to(card, {
                    duration: 0.6,
                    opacity: 1,
                    y: 0
                });
            }
        }
    });
});

// Animate section titles
document.querySelectorAll('.section-title').forEach(title => {
    gsap.to(title, {
        scrollTrigger: {
            trigger: title,
            start: 'top 80%',
            onEnter: () => {
                gsap.to(title, {
                    duration: 0.8,
                    opacity: 1,
                    x: 0
                });
            }
        }
    });
});

// Animate step numbers
document.querySelectorAll('.step-number').forEach((step, index) => {
    gsap.to(step, {
        scrollTrigger: {
            trigger: step.parentElement,
            start: 'top 80%',
            onEnter: () => {
                gsap.to(step, {
                    duration: 0.6,
                    delay: index * 0.1,
                    scale: 1,
                    rotation: 0
                });
            }
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.boxShadow = 'none';
    }
});

// Counter animation for stats
function animateCounter(element, target, duration = 2) {
    let current = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 1000 / 60);
}

// Animate stats when they come into view
document.querySelectorAll('.stat-number').forEach(stat => {
    const target = parseInt(stat.textContent);
    let hasAnimated = false;

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !hasAnimated) {
            animateCounter(stat, target);
            hasAnimated = true;
        }
    }, { threshold: 0.5 });

    observer.observe(stat);
});

// Responsive menu
const navLinks = document.querySelector('.nav-links');
document.addEventListener('click', e => {
    if (e.target.classList.contains('nav-link')) {
        navLinks.style.display = 'none';
        setTimeout(() => {
            navLinks.style.display = 'flex';
        }, 500);
    }
});

// Demo Interactive Analysis
const demoButton = document.getElementById('demoButton');
const demoCode = document.getElementById('demoCode');
const demoResults = document.getElementById('demoResults');

if (demoButton && demoCode && demoResults) {
    demoButton.addEventListener('click', () => {
        const code = demoCode.value;
        demoResults.innerHTML = '<p style="color: var(--text-muted);">Analizando código...</p>';

        // Simulate analysis delay
        setTimeout(() => {
            const findings = analyzeCode(code);
            displayResults(findings);
        }, 800);
    });
}

function analyzeCode(code) {
    const findings = [];

    // SQL Injection pattern
    if (/`SELECT.*\$\{/.test(code) || /`INSERT.*\$\{/.test(code)) {
        findings.push({
            type: 'SQL Injection',
            severity: 'CRITICAL',
            cvss: '9.8',
            message: 'Posible SQL Injection detectada. Usa prepared statements.',
            line: code.split('\n').findIndex(l => /`SELECT.*\$\{|`INSERT.*\$\{/.test(l)) + 1
        });
    }

    // XSS vulnerability
    if (/dangerouslySetInnerHTML|innerHTML\s*=/.test(code)) {
        findings.push({
            type: 'Cross-Site Scripting (XSS)',
            severity: 'HIGH',
            cvss: '6.1',
            message: 'Riesgo de XSS detectado. Evita dangerouslySetInnerHTML.',
            line: code.split('\n').findIndex(l => /dangerouslySetInnerHTML|innerHTML\s*=/.test(l)) + 1
        });
    }

    // Hardcoded credentials
    if (/password\s*[=:]\s*['"]/.test(code) || /api[_-]?key\s*[=:]\s*['"]/.test(code)) {
        findings.push({
            type: 'Credenciales Hardcoded',
            severity: 'CRITICAL',
            cvss: '8.2',
            message: 'Credenciales detectadas en código. Usa variables de entorno.',
            line: code.split('\n').findIndex(l => /password\s*[=:]\s*['"]|api[_-]?key\s*[=:]\s*['"]/.test(l)) + 1
        });
    }

    // eval() usage
    if (/eval\s*\(/.test(code)) {
        findings.push({
            type: 'Eval Usage',
            severity: 'CRITICAL',
            cvss: '9.6',
            message: 'Uso de eval() detectado. Esto es una vulnerabilidad grave.',
            line: code.split('\n').findIndex(l => /eval\s*\(/.test(l)) + 1
        });
    }

    // No findings
    if (findings.length === 0) {
        findings.push({
            type: 'Análisis Completado',
            severity: 'INFO',
            message: 'No se detectaron vulnerabilidades conocidas en este snippet.',
        });
    }

    return findings;
}

function displayResults(findings) {
    if (findings.length === 0) {
        demoResults.innerHTML = '<p style="color: var(--success); text-align: center;">✅ No se detectaron vulnerabilidades</p>';
        return;
    }

    let html = '';
    findings.forEach(finding => {
        const severityClass = finding.severity === 'CRITICAL' ? 'critical' :
                            finding.severity === 'HIGH' ? 'high' :
                            finding.severity === 'MEDIUM' ? 'medium' : '';

        html += `
            <div class="demo-result-item ${severityClass}">
                <div class="demo-result-title">${finding.type}</div>
                <div class="demo-result-desc">
                    ${finding.message}<br/>
                    ${finding.severity !== 'INFO' ? `<strong>CVSS Score:</strong> ${finding.cvss} (${finding.severity})<br/>` : ''}
                    ${finding.line ? `<strong>Línea:</strong> ${finding.line}` : ''}
                </div>
            </div>
        `;
    });

    demoResults.innerHTML = html;
}

// Pipeline Stage Info
function showStageInfo(element, title, description) {
    const infoBox = document.getElementById('pipelineInfo');
    if (infoBox) {
        infoBox.innerHTML = `
            <h4>${title}</h4>
            <p>${description}</p>
        `;
    }
}

// Dashboard Interactive Tabs
const dashboardTabs = document.querySelectorAll('.mockup-tabs .tab');
const dashboardContents = document.querySelectorAll('.dashboard-tab-content');

dashboardTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        dashboardTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');

        // Hide all content
        dashboardContents.forEach(content => content.classList.remove('active'));

        // Show corresponding content
        const tabNames = ['monitor', 'incidentes', 'amenazas', 'remediacion', 'forense'];
        if (index < tabNames.length) {
            const contentId = `tab-${tabNames[index]}`;
            const content = document.getElementById(contentId);
            if (content) {
                content.classList.add('active');
            }
        }
    });
});

// Component Tabs Navigation
function showComponentTab(tabName) {
  // Hide all panels
  const panels = document.querySelectorAll('.component-panel');
  panels.forEach(panel => panel.classList.remove('active'));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.component-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected panel
  const selectedPanel = document.getElementById(tabName + '-panel');
  if (selectedPanel) {
    selectedPanel.classList.add('active');
  }

  // Add active class to clicked button
  event.target.classList.add('active');
}

// Architecture 3D Layer Details
function showLayerDetails(layer) {
  const infoBox = document.getElementById('arch-info');
  const details = {
    client: {
      title: '🖥️ Capa Cliente',
      desc: 'Interfaz de usuario responsiva con Dashboard en tiempo real. React 18 con TypeScript, Vite para build, Tailwind CSS y WebSockets para actualizaciones instantáneas.'
    },
    api: {
      title: '🌐 API Gateway',
      desc: 'Orquestador de servicios. Express.js con Node.js, REST API completa, autenticación JWT, rate limiting y webhooks para integraciones externas.'
    },
    engine: {
      title: '🧠 Engine IA',
      desc: 'Núcleo de análisis inteligente. AST parsing para análisis sintáctico, pattern detection para 200+ vulnerabilidades, ML models para risk scoring y flow analysis para trazado de datos.'
    },
    database: {
      title: '💾 Capa de Datos',
      desc: 'Almacenamiento escalable. PostgreSQL para datos transaccionales, Redis para caché en memoria y Elasticsearch para búsqueda ultrarrápida de hallazgos.'
    }
  };

  const detail = details[layer] || details.client;
  infoBox.innerHTML = `<h4>${detail.title}</h4><p>${detail.desc}</p>`;
}

// Report Tabs Navigation
document.addEventListener('DOMContentLoaded', () => {
  const reportTabs = document.querySelectorAll('.report-tab');
  const reportContents = document.querySelectorAll('.report-section-content');

  reportTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      // Remove active from all
      reportTabs.forEach(t => t.classList.remove('active'));
      reportContents.forEach(c => c.classList.remove('active'));

      // Add active to clicked
      tab.classList.add('active');
      if (reportContents[index]) {
        reportContents[index].classList.add('active');
      }
    });
  });
});

// Console message
console.log('%cSCR Agent - Auditoría Inteligente de Código', 'color: #F97316; font-size: 24px; font-weight: bold;');
console.log('%cTecnología avanzada en análisis de seguridad', 'color: #6B7280; font-size: 14px;');

// Stage Details Interactive
const stageDetails = {
    deteccion: {
        title: '🔍 Etapa 1: Detección (0-5 min)',
        content: `
            <h4 style="color: var(--primary); margin-bottom: 10px;">¿Qué sucede?</h4>
            <p>SCR Agent escanea el repositorio automáticamente identificando patrones de vulnerabilidades.</p>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Acciones:</h4>
            <ul style="margin-left: 20px; list-style: disc;">
                <li>✓ AST Parsing del código fuente</li>
                <li>✓ Búsqueda de 200+ patrones OWASP</li>
                <li>✓ Análisis de dependencias</li>
                <li>✓ Mapeo de flujos de datos</li>
            </ul>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Salida:</h4>
            <p>Lista inicial de hallazgos (sin filtrado aún)</p>
        `
    },
    analisis: {
        title: '📊 Etapa 2: Análisis (5-15 min)',
        content: `
            <h4 style="color: var(--primary); margin-bottom: 10px;">¿Qué sucede?</h4>
            <p>IA valida, contextualiza y prioriza cada hallazgo automáticamente.</p>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Análisis realizados:</h4>
            <ul style="margin-left: 20px; list-style: disc;">
                <li>✓ ML Validation (reduce falsos positivos a 5%)</li>
                <li>✓ CVSS Score Automático</li>
                <li>✓ Análisis de contexto e impacto</li>
                <li>✓ Forense: ¿Quién lo introdujo?</li>
            </ul>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Resultado:</h4>
            <p>95% hallazgos válidos, priorizados por severidad</p>
        `
    },
    reporte: {
        title: '📄 Etapa 3: Reporte (15-20 min)',
        content: `
            <h4 style="color: var(--primary); margin-bottom: 10px;">¿Qué sucede?</h4>
            <p>Se genera documentación completa con soluciones automáticas.</p>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Generación de:</h4>
            <ul style="margin-left: 20px; list-style: disc;">
                <li>✓ PDF ejecutivo con hallazgos</li>
                <li>✓ Código solución propuesto</li>
                <li>✓ Pasos de remediación</li>
                <li>✓ JSON para integración</li>
            </ul>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Distribución:</h4>
            <p>Email, Slack, webhook, dashboard</p>
        `
    },
    remediacion: {
        title: '⚙️ Etapa 4: Remediación (20h-48h)',
        content: `
            <h4 style="color: var(--primary); margin-bottom: 10px;">¿Qué sucede?</h4>
            <p>El equipo implementa las soluciones propuestas con seguimiento automático.</p>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Actividades:</h4>
            <ul style="margin-left: 20px; list-style: disc;">
                <li>✓ Asignación automática al dev responsable</li>
                <li>✓ Implementación del código solución</li>
                <li>✓ Testing local</li>
                <li>✓ Code review y PR</li>
            </ul>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Dashboard muestra:</h4>
            <p>Progreso, asignado a, fecha límite, reminders</p>
        `
    },
    cierre: {
        title: '✅ Etapa 5: Cierre (48h+)',
        content: `
            <h4 style="color: var(--primary); margin-bottom: 10px;">¿Qué sucede?</h4>
            <p>Validación final y cierre automático del hallazgo.</p>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Validación:</h4>
            <ul style="margin-left: 20px; list-style: disc;">
                <li>✓ Re-test automático en main</li>
                <li>✓ Confirmación: vulnerabilidad resuelta</li>
                <li>✓ Archivo de evidencia</li>
                <li>✓ Notificación a stakeholders</li>
            </ul>
            
            <h4 style="color: var(--primary); margin-bottom: 10px; margin-top: 20px;">Resultado:</h4>
            <p>Hallazgo archivado con historial completo e auditable</p>
        `
    }
};

function showStageDetails(element, stage) {
    const panel = document.getElementById('stageDetailsPanel');
    const title = document.getElementById('stageDetailsTitle');
    const body = document.getElementById('stageDetailsBody');
    
    title.textContent = stageDetails[stage].title;
    body.innerHTML = stageDetails[stage].content;
    
    panel.classList.add('active');
    
    // Highlight the selected stage
    document.querySelectorAll('.stage-interactive').forEach(s => s.style.opacity = '0.5');
    element.style.opacity = '1';
}

function closeStageDetails() {
    const panel = document.getElementById('stageDetailsPanel');
    panel.classList.remove('active');
    
    // Remove highlight
    document.querySelectorAll('.stage-interactive').forEach(s => s.style.opacity = '1');
}

// Close panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('stageDetailsPanel');
    const content = document.querySelector('.stage-details-content');
    
    if (panel && panel.classList.contains('active') && 
        e.target === panel) {
        closeStageDetails();
    }
});
