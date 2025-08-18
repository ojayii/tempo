class Carousel {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.carousel = this.container.querySelector('.carousel');
        this.seats = []; // This is like "seats" in your sample
        this.interval = options.interval || 2000;
        this.autoPlay = options.autoPlay !== false;
        this.intervalId = null;
        
        this.init();
    }
    
    init() {
        this.seats = Array.from(this.carousel.children);
        if (this.seats.length === 0) return;
        
        // Set the LAST item as initial reference (like your sample)
        const lastItem = this.seats[this.seats.length - 1];
        lastItem.classList.add('is-ref');
        lastItem.style.order = '1';
        
        // Set initial order for all items
        let currentSeat = lastItem;
        for (let i = 2; i <= this.seats.length; i++) {
            currentSeat = this.next(currentSeat);
            currentSeat.style.order = i.toString();
        }
        
        this.carousel.classList.add('is-set');
        
        if (this.autoPlay) {
            this.start();
        }
    }
    
    // This matches your "next" function exactly
    next(el) {
        const nextEl = el.nextElementSibling;
        if (nextEl) {
            return nextEl;
        } else {
            return this.seats[0]; // Return first seat
        }
    }
    
    // This matches your "progress" function exactly
    progress() {
        const el = this.carousel.querySelector('.is-ref');
        if (!el) return; // Safety check
        
        el.classList.remove('is-ref');
        const newSeat = this.next(el);
        
        newSeat.classList.add('is-ref');
        newSeat.style.order = '1';
        
        // Update orders for all other items
        let currentSeat = newSeat;
        for (let i = 2; i <= this.seats.length; i++) {
            currentSeat = this.next(currentSeat);
            currentSeat.style.order = i.toString();
        }
        
        this.carousel.classList.remove('is-set');
        
        setTimeout(() => {
            this.carousel.classList.add('is-set');
        }, 50);
    }
    
    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            this.progress();
        }, this.interval);
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    destroy() {
        this.stop();
        this.seats.forEach(item => {
            item.classList.remove('is-ref');
            item.style.order = '';
        });
        this.carousel.classList.remove('is-set');
    }
}

window.Carousel = Carousel;