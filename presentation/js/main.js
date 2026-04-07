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

// Console message
console.log('%cSCR Agent - Auditoría Inteligente de Código', 'color: #F97316; font-size: 24px; font-weight: bold;');
console.log('%cTecnología avanzada en análisis de seguridad', 'color: #6B7280; font-size: 14px;');
