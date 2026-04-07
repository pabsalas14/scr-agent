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

// Console message
console.log('%cSCR Agent - Auditoría Inteligente de Código', 'color: #F97316; font-size: 24px; font-weight: bold;');
console.log('%cTecnología avanzada en análisis de seguridad', 'color: #6B7280; font-size: 14px;');
