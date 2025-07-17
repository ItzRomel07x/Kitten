// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href && href !== '#' && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Handle invite button clicks
document.addEventListener('DOMContentLoaded', function() {
    const inviteButtons = document.querySelectorAll('#invite-btn');
    const navCta = document.querySelector('.nav-cta');
    
    inviteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://discord.com/oauth2/authorize?client_id=1371349914021531788&permissions=8&integration_type=0&scope=bot', '_blank');
        });
    });
    
    if (navCta) {
        navCta.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://discord.com/oauth2/authorize?client_id=1371349914021531788&permissions=8&integration_type=0&scope=bot', '_blank');
        });
    }
});



// Add navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    }
});

// Animate feature cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards and setup steps
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.feature-card, .step, .command-category');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add mobile menu toggle (for future enhancement)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Add typing effect to hero text
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
document.addEventListener('DOMContentLoaded', function() {
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        setTimeout(() => {
            typeWriter(heroTitle, originalText, 30);
        }, 500);
    }
    
    // Initialize particles
    initParticles();
});

// Simple falling particles
function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    
    // Set canvas to full screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    
    // Simple particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.size = Math.random() * 3 + 1;
            this.speed = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.3;
        }
        
        update() {
            this.y += this.speed;
            if (this.y > canvas.height + 10) {
                this.y = -10;
                this.x = Math.random() * canvas.width;
            }
        }
        
        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.size, this.y + this.size * 2);
            ctx.lineTo(this.x + this.size, this.y + this.size * 2);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Create particles
    function createParticles() {
        particles = [];
        const count = Math.min(20, Math.max(10, Math.floor(canvas.width / 100)));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Initialize
    createParticles();
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
    
    // Cleanup
    return () => {
        cancelAnimationFrame(animationId);
    };
}