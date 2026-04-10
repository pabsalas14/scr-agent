/* ========================================
   MODERNIZATION ENHANCEMENTS - SCR Agent
   Modern, Dynamic Interactive Features
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // 1. SCROLL PROGRESS INDICATOR
    // ========================================
    const createScrollProgress = () => {
        const progress = document.createElement('div');
        progress.className = 'scroll-progress';
        document.body.appendChild(progress);

        window.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / scrollHeight) * 100;
            progress.style.width = scrolled + '%';
        });
    };
    createScrollProgress();

    // ========================================
    // 2. RESPONSIVE HAMBURGER MENU
    // ========================================
    const setupHamburgerMenu = () => {
        const navbar = document.querySelector('.navbar');
        const navContainer = document.querySelector('.nav-container');

        // Create hamburger if it doesn't exist
        if (!document.querySelector('.hamburger-menu')) {
            const hamburger = document.createElement('button');
            hamburger.className = 'hamburger-menu';
            hamburger.innerHTML = '<span></span><span></span><span></span>';
            navContainer.appendChild(hamburger);

            const navLinks = document.querySelector('.nav-links');

            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close menu when link is clicked
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }
    };
    setupHamburgerMenu();

    // ========================================
    // 3. ENHANCED NAVBAR SCROLL EFFECT
    // ========================================
    const enhanceNavbarScroll = () => {
        const navbar = document.querySelector('.navbar');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    };
    enhanceNavbarScroll();

    // ========================================
    // 4. ANIMATED FLOW DIAGRAM PARTICLES
    // ========================================
    const animateFlowDiagram = () => {
        const flowDiagram = document.querySelector('.flow-diagram');
        if (!flowDiagram) return;

        // Create animated arrows
        const arrows = flowDiagram.querySelectorAll('.flow-arrow');
        arrows.forEach((arrow, index) => {
            arrow.style.animationDelay = `${index * 0.3}s`;
        });

        // Add staggered animations to flow stages
        const stages = flowDiagram.querySelectorAll('.flow-stage');
        stages.forEach((stage, index) => {
            stage.classList.add('staggered-item');
            stage.style.animationDelay = `${index * 0.1}s`;
        });
    };
    animateFlowDiagram();

    // ========================================
    // 5. DYNAMIC PATTERN DETECTION VISUALIZATION
    // ========================================
    const enhancePatternDetection = () => {
        const patterns = document.querySelectorAll('[data-pattern]');
        patterns.forEach((pattern, index) => {
            pattern.classList.add('pattern-scanner');
            pattern.style.animationDelay = `${index * 0.2}s`;
        });
    };
    enhancePatternDetection();

    // ========================================
    // 6. TECH CARD STAGGERED ANIMATIONS
    // ========================================
    const enhanceTechCards = () => {
        const techCards = document.querySelectorAll('.tech-card');
        techCards.forEach((card, index) => {
            card.classList.add('staggered-item');
            card.style.animationDelay = `${index * 0.15}s`;

            const listItems = card.querySelectorAll('li');
            listItems.forEach((item, itemIndex) => {
                item.classList.add('staggered-item');
                item.style.animationDelay = `${(index * 0.15) + (itemIndex * 0.1)}s`;
            });
        });
    };
    enhanceTechCards();

    // ========================================
    // 7. AGENT CARD 3D EFFECTS
    // ========================================
    const enhance3DAgentCards = () => {
        const agentCards = document.querySelectorAll('.agente-card');
        agentCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const rotateX = (y - rect.height / 2) / 10;
                const rotateY = (x - rect.width / 2) / 10;

                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'rotateX(0) rotateY(0) scale(1)';
            });
        });
    };
    enhance3DAgentCards();

    // ========================================
    // 8. CVSS SCORE VISUALIZATION ANIMATION
    // ========================================
    const animateCVSSBars = () => {
        const cvssElements = document.querySelectorAll('[data-cvss]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cvssScore = parseFloat(entry.target.dataset.cvss);
                    const fill = entry.target.querySelector('.cvss-bar-fill');

                    if (fill) {
                        fill.style.setProperty('--risk-percentage', `${cvssScore}%`);
                        fill.classList.add('animate');
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        cvssElements.forEach(el => observer.observe(el));
    };
    animateCVSSBars();

    // ========================================
    // 9. ANIMATED COUNTER FOR STATISTICS
    // ========================================
    const animateMetricValues = () => {
        const metrics = document.querySelectorAll('.metric-value');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.textContent);
                    let current = 0;
                    const increment = target / 60;
                    const duration = 2000;
                    const startTime = Date.now();

                    const update = () => {
                        const elapsed = Date.now() - startTime;
                        current = Math.min(elapsed / duration * target, target);
                        entry.target.textContent = Math.floor(current);

                        if (elapsed < duration) {
                            requestAnimationFrame(update);
                        }
                    };
                    update();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        metrics.forEach(metric => observer.observe(metric));
    };
    animateMetricValues();

    // ========================================
    // 10. COMPARISON TABLE WITH ANIMATIONS
    // ========================================
    const enhanceComparisonTable = () => {
        const comparisonItems = document.querySelectorAll('.comparison-item');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('comparison-item');
                }
            });
        }, { threshold: 0.5 });

        comparisonItems.forEach((item, index) => {
            observer.observe(item);
        });
    };
    enhanceComparisonTable();

    // ========================================
    // 11. SVG PATH ANIMATIONS
    // ========================================
    const animateSVGPaths = () => {
        const svgPaths = document.querySelectorAll('svg path');
        svgPaths.forEach((path, index) => {
            const length = path.getTotalLength ? path.getTotalLength() : 0;

            if (length) {
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                path.classList.add('svg-path-animate');

                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        path.style.strokeDashoffset = 0;
                    }
                }, { threshold: 0.5 });

                observer.observe(path);
            }
        });
    };
    animateSVGPaths();

    // ========================================
    // 12. INTERACTIVE ARCHITECTURE LAYERS
    // ========================================
    const setupLayerDetails = () => {
        window.showLayerDetails = function(layerName) {
            const infoBox = document.getElementById('arch-info');
            if (!infoBox) return;

            const details = {
                client: {
                    title: '🖥️ Capa Cliente',
                    description: 'React 19 con TypeScript, WebSockets para comunicación en tiempo real, Vite para build ultrarrápido.'
                },
                api: {
                    title: '🌐 API Gateway',
                    description: 'Node.js 18+ con Express.js, rutas REST organizadas, validación de requests, autenticación JWT.'
                },
                engine: {
                    title: '🧠 Engine IA',
                    description: 'Análisis AST de código, 200+ patrones de vulnerabilidades, ML models para scoring de riesgo.'
                },
                database: {
                    title: '💾 Capa Datos',
                    description: 'PostgreSQL 14+ para datos principales, Redis para cache, Elasticsearch para búsqueda full-text.'
                }
            };

            const layer = details[layerName];
            if (layer) {
                infoBox.innerHTML = `<h4>${layer.title}</h4><p>${layer.description}</p>`;
                infoBox.style.animation = 'fade-in-scale 0.5s ease';
            }
        };
    };
    setupLayerDetails();

    // ========================================
    // 13. CODE ANALYZER WITH SYNTAX HIGHLIGHTING
    // ========================================
    const setupCodeAnalyzer = () => {
        const analyzerButton = document.querySelector('[data-analyze-code]');
        if (!analyzerButton) return;

        analyzerButton.addEventListener('click', () => {
            const codeInput = document.querySelector('[data-code-input]');
            if (!codeInput) return;

            const resultsContainer = document.querySelector('[data-analysis-results]');
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p>Analizando código...</p>';
                resultsContainer.style.animation = 'fade-in-scale 0.5s ease';

                setTimeout(() => {
                    const results = performCodeAnalysis(codeInput.value);
                    resultsContainer.innerHTML = results;
                }, 1500);
            }
        });
    };
    setupCodeAnalyzer();

    // ========================================
    // 14. SMOOTH SCROLL WITH EASING
    // ========================================
    const enhanceScrollBehavior = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    };
    enhanceScrollBehavior();

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    // Simple code analysis function
    function performCodeAnalysis(code) {
        const findings = [];
        const patterns = [
            { regex: /eval\s*\(/gi, type: 'CRITICAL', msg: 'eval() detectado' },
            { regex: /innerHTML\s*=/gi, type: 'HIGH', msg: 'innerHTML sin sanitizar' },
            { regex: /var\s+\w+\s*=/gi, type: 'LOW', msg: 'Variable con var en lugar de let/const' },
            { regex: /console\.log/gi, type: 'INFO', msg: 'console.log en producción' }
        ];

        patterns.forEach(pattern => {
            const matches = code.match(pattern.regex);
            if (matches) {
                findings.push({
                    type: pattern.type,
                    message: pattern.msg,
                    count: matches.length
                });
            }
        });

        return findings.length > 0
            ? findings.map(f => `<div class="finding-${f.type}">⚠️ [${f.type}] ${f.message} (${f.count})</div>`).join('')
            : '<p style="color: #22C55E;">✅ No se detectaron vulnerabilidades críticas</p>';
    }

    // ========================================
    // INTERSECTION OBSERVER FOR LAZY ANIMATIONS
    // ========================================
    const setupIntersectionObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    if (!entry.target.classList.contains('staggered-item')) {
                        entry.target.classList.add('staggered-item');
                    }
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section, .card, .feature-card, .agente-card, .tech-card').forEach(el => {
            observer.observe(el);
        });
    };
    setupIntersectionObserver();

    // ========================================
    // PARALLAX EFFECT FOR HERO SECTION
    // ========================================
    const setupParallax = () => {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const parallaxElements = hero.querySelectorAll('[data-parallax]');

            parallaxElements.forEach(element => {
                const speed = element.dataset.parallax || 0.5;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    };
    setupParallax();

    // ========================================
    // TOOLTIP INITIALIZATION
    // ========================================
    const setupTooltips = () => {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', () => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = element.dataset.tooltip;

                document.body.appendChild(tooltip);

                const rect = element.getBoundingClientRect();
                tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';

                element.addEventListener('mouseleave', () => {
                    tooltip.remove();
                });
            });
        });
    };
    setupTooltips();

    // ========================================
    // CHART.JS INTEGRATION FOR DASHBOARD
    // ========================================
    const initializeDashboardCharts = () => {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') return;

        // Risk Distribution Chart
        const riskCtx = document.querySelector('[data-chart="risk-distribution"]');
        if (riskCtx) {
            new Chart(riskCtx, {
                type: 'doughnut',
                data: {
                    labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                    datasets: [{
                        data: [15, 25, 35, 25],
                        backgroundColor: ['#EF4444', '#F97316', '#EAB308', '#22C55E']
                    }]
                },
                options: {
                    responsive: true,
                    animation: { duration: 2000 }
                }
            });
        }

        // Trend Chart
        const trendCtx = document.querySelector('[data-chart="trend-analysis"]');
        if (trendCtx) {
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                    datasets: [{
                        label: 'Vulnerabilidades Detectadas',
                        data: [12, 19, 15, 25],
                        borderColor: '#F97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    animation: { duration: 2000 }
                }
            });
        }
    };

    // Initialize charts after a small delay to ensure DOM is ready
    setTimeout(initializeDashboardCharts, 500);

    // ========================================
    // LOG INITIALIZATION
    // ========================================
    console.log('✅ SCR Agent Presentation - Modernizations Loaded');
    console.log('Features: Scroll Progress, Hamburger Menu, 3D Effects, Animations');
});
