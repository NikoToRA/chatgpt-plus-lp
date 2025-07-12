// Modern Interactions and Animations for ChatGPT Plus Medical LP

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      
      // Trigger number counting animation if it's a counter
      if (entry.target.classList.contains('counter')) {
        animateCounter(entry.target);
      }
    }
  });
}, observerOptions);

// Observe all animated elements
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .counter');
  animatedElements.forEach(el => scrollObserver.observe(el));
  
  // Initialize interactive components
  initSmoothScroll();
  initFormValidation();
  initTestimonialSlider();
  initParallax();
  initTypingAnimation();
});

// Counter Animation
function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;
  
  const updateCounter = () => {
    current += increment;
    if (current < target) {
      element.textContent = Math.floor(current).toLocaleString();
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target.toLocaleString();
    }
  };
  
  updateCounter();
}


// Smooth Scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Form Validation with Visual Feedback
function initFormValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  const inputs = form.querySelectorAll('.form-input');
  
  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input);
    });
    
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateField(input);
      }
    });
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let isValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });
    
    if (isValid) {
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success state
      submitBtn.innerHTML = '✓ 送信完了';
      submitBtn.classList.add('btn-success');
      
      // Reset after delay
      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove('btn-success');
      }, 3000);
    }
  });
}

function validateField(input) {
  const value = input.value.trim();
  const type = input.type;
  const required = input.hasAttribute('required');
  
  let isValid = true;
  let errorMessage = '';
  
  if (required && !value) {
    isValid = false;
    errorMessage = 'この項目は必須です';
  } else if (type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = '有効なメールアドレスを入力してください';
    }
  }
  
  const errorElement = input.parentElement.querySelector('.error-message');
  
  if (!isValid) {
    input.classList.add('error');
    if (!errorElement) {
      const error = document.createElement('span');
      error.className = 'error-message';
      error.textContent = errorMessage;
      input.parentElement.appendChild(error);
    } else {
      errorElement.textContent = errorMessage;
    }
  } else {
    input.classList.remove('error');
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  return isValid;
}

// Testimonial Slider
function initTestimonialSlider() {
  const slider = document.querySelector('.testimonial-slider');
  if (!slider) return;
  
  const slides = slider.querySelectorAll('.testimonial-slide');
  const dots = slider.querySelector('.slider-dots');
  let currentSlide = 0;
  
  // Create dots
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(index));
    dots.appendChild(dot);
  });
  
  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots.children[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    dots.children[currentSlide].classList.add('active');
  }
  
  // Auto-advance
  setInterval(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, 5000);
}

// Parallax Effect
function initParallax() {
  const parallaxElements = document.querySelectorAll('.parallax');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(element => {
      const speed = element.getAttribute('data-speed') || 0.5;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  });
}

// Typing Animation
function initTypingAnimation() {
  const typingElements = document.querySelectorAll('.typing-animation');
  
  typingElements.forEach(element => {
    const text = element.getAttribute('data-text');
    const speed = parseInt(element.getAttribute('data-speed')) || 100;
    let index = 0;
    
    element.textContent = '';
    
    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      } else {
        element.classList.add('typing-complete');
      }
    }
    
    // Start typing when element is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && index === 0) {
          type();
          observer.unobserve(entry.target);
        }
      });
    });
    
    observer.observe(element);
  });
}

// Magnetic Buttons
document.querySelectorAll('.btn-magnetic').forEach(button => {
  button.addEventListener('mousemove', (e) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(0, 0)';
  });
});

// Progress Bar on Scroll
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(to right, #3b82f6, #06b6d4);
  z-index: 9999;
  transition: width 0.3s;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  progressBar.style.width = `${scrollPercent}%`;
});

// Copy to Clipboard
document.querySelectorAll('.copy-button').forEach(button => {
  button.addEventListener('click', async () => {
    const text = button.getAttribute('data-copy');
    
    try {
      await navigator.clipboard.writeText(text);
      
      const originalText = button.textContent;
      button.textContent = 'コピーしました！';
      button.classList.add('copied');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
});