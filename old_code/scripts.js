// Generel site-wide JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Sæt logo bredde FØRST så loader er korrekt placeret fra start
    const logoImg = document.getElementById('dynamic-logo');
    if (logoImg) {
        // Hvis logo allerede er loadet
        if (logoImg.complete) {
            const logoWidth = logoImg.offsetWidth;
            document.documentElement.style.setProperty('--logo-width', `${logoWidth}px`);
        } else {
            // Vent på logo load
            logoImg.addEventListener('load', function() {
                const logoWidth = logoImg.offsetWidth;
                document.documentElement.style.setProperty('--logo-width', `${logoWidth}px`);
            });
        }
    }
    
    // Check page type (moved up for failsafe)
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    const slides = document.querySelectorAll('.slide');
    const isStaticPage = slides.length === 1;
    
    // START INTELLIGENT LOADING SYSTEM
    startIntelligentLoading();
    
    // GLOBAL BACKUP FAILSAFE: Start page after 8 seconds no matter what
    setTimeout(() => {
        // Check if page is still loading
        if (!document.body.classList.contains('loaded')) {
            console.warn('Global failsafe activated - forcing page start after 8 seconds');
            document.body.classList.add('loaded');
            
            // Hide loader if it's still visible
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay && !loadingOverlay.classList.contains('hide')) {
                loadingOverlay.classList.add('hide');
            }
            
            // Start content animation manually - ALSO trigger hero animation
            if (isIndexPage && !isStaticPage) {
                // Trigger hero animation first, then content cascade
                if (window.startAllAnimations) {
                    window.startAllAnimations();
                }
                startContentCascade();
            } else {
                startStaticContentAnimation();
            }
        }
    }, 8000);

    async function startIntelligentLoading() {
        // Start loader animation
        startLoaderAnimation();
        
        // FAILSAFE: Maximum loading time (5 sekunder)
        const maxLoadingTime = 5000;
        let loadingComplete = false;
        
        // Set failsafe timeout
        const failsafeTimeout = setTimeout(() => {
            if (!loadingComplete) {
                console.warn('Loading failsafe activated - forcing page start after 5 seconds');
                loadingComplete = true;
                hideLoaderAndStartPage();
            }
        }, maxLoadingTime);
        
        try {
            // Wait for all assets to be ready
            await waitForAssetsReady();
            
            // Success - clear failsafe and start normally
            if (!loadingComplete) {
                clearTimeout(failsafeTimeout);
                loadingComplete = true;
                hideLoaderAndStartPage();
            }
        } catch (error) {
            // Error - use failsafe
            console.error('Loading error, using failsafe:', error);
            if (!loadingComplete) {
                clearTimeout(failsafeTimeout);
                loadingComplete = true;
                hideLoaderAndStartPage();
            }
        }
    }

    function startLoaderAnimation() {
        const grid = document.getElementById('loader');
        if (!grid) return;
        
        const totalDots = 9;
        
        // Clear any existing dots
        grid.innerHTML = '';
        
        // Clear any existing animations
        if (window.loaderAnimations) {
            window.loaderAnimations.forEach(animation => animation.cancel());
        }
        window.loaderAnimations = [];
        
        // Keyframes for grid animation
        const keyframes = [
            { transform: 'scale(1)', opacity: 1, offset: 0 },
            { transform: 'scale(1)', opacity: 1, offset: 0.5, easing: 'ease-in-out' },
            { transform: 'scale(0)', opacity: 0, offset: 0.75 },
            { transform: 'scale(2.5)', opacity: 0, offset: 0.751, easing: 'ease-in-out' },
            { transform: 'scale(1)', opacity: 1, offset: 1 }
        ];
        
        // Create and animate each dot
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            grid.appendChild(dot);
            
            const animationOptions = {
                duration: 1200,
                delay: i * 50,
                iterations: Infinity,
                fill: 'forwards'
            };
            
            // Apply the animation using the Web Animations API
            const animation = dot.animate(keyframes, animationOptions);
            window.loaderAnimations.push(animation);
        }
    }
    
    function stopLoaderAnimation() {
        if (window.loaderAnimations) {
            window.loaderAnimations.forEach(animation => animation.cancel());
            window.loaderAnimations = [];
        }
    }

    async function waitForAssetsReady() {
        const promises = [];
        
        // Wait for fonts to load
        if (document.fonts && document.fonts.ready) {
            promises.push(document.fonts.ready);
        }
        
        // Beregn logo bredde tidligt og sæt CSS custom property
        const logoImg = document.getElementById('dynamic-logo');
        if (logoImg) {
            // Vent på at logo er loadet
            const logoPromise = new Promise((resolve) => {
                if (logoImg.complete) {
                    resolve();
                } else {
                    logoImg.addEventListener('load', resolve, { once: true });
                    logoImg.addEventListener('error', resolve, { once: true });
                    setTimeout(resolve, 1000);
                }
            });
            promises.push(logoPromise);
        }
        
        // Wait for hero videos to load - CRITICAL for hero animation
        const heroVideos = document.querySelectorAll('.slide video');
        const videoPromises = Array.from(heroVideos).map(video => {
            return new Promise((resolve) => {
                if (video.readyState >= 3) {
                    resolve();
                } else {
                    video.addEventListener('canplaythrough', resolve, { once: true });
                    video.addEventListener('loadeddata', resolve, { once: true }); // Also accept loadeddata
                    video.addEventListener('error', resolve, { once: true }); // Don't fail on video errors
                    setTimeout(resolve, 8000); // Longer timeout for hero videos (8 seconds)
                }
            });
        });
        promises.push(...videoPromises);
        
        // Wait for thumbnail images to load
        const thumbnailImages = document.querySelectorAll('.thumbnail-image');
        const imagePromises = Array.from(thumbnailImages).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true }); // Don't fail on image errors
                    setTimeout(resolve, 2000); // Timeout after 2 seconds
                }
            });
        });
        promises.push(...imagePromises);
        
        // Wait for thumbnail videos to preload
        const thumbnailVideos = document.querySelectorAll('.thumbnail-video');
        const thumbVideoPromises = Array.from(thumbnailVideos).map(video => {
            return new Promise((resolve) => {
                if (video.readyState >= 1) { // Just metadata is enough for thumbnails
                    resolve();
                } else {
                    video.addEventListener('loadedmetadata', resolve, { once: true });
                    video.addEventListener('error', resolve, { once: true });
                    setTimeout(resolve, 1500); // Shorter timeout for thumbnail videos
                }
            });
        });
        promises.push(...thumbVideoPromises);
        
        // Wait for critical images (logo, etc.)
        const logo = document.getElementById('dynamic-logo');
        if (logo) {
            const logoPromise = new Promise((resolve) => {
                if (logo.complete) {
                    resolve();
                } else {
                    logo.addEventListener('load', resolve, { once: true });
                    logo.addEventListener('error', resolve, { once: true });
                    setTimeout(resolve, 1000);
                }
            });
            promises.push(logoPromise);
        }
        
        // Wait for all promises to resolve (don't fail if some assets don't load)
        await Promise.allSettled(promises);
        
        // Sæt logo bredde efter alt er loadet
        if (logoImg) {
            const logoWidth = logoImg.offsetWidth;
            document.documentElement.style.setProperty('--logo-width', `${logoWidth}px`);
        }
        
        // Add a small delay to ensure everything is settled
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    function hideLoaderAndStartPage() {
        // Start hero animation først
        startOriginalFunctionality();
        document.body.classList.add('loaded');
            
        // Start content animation dynamisk efter loading
        startContentCascade();
    }

    function startOriginalFunctionality() {
        // Mark that content is ready
        window.cardsReady = true;
        window.hoverEffectsEnabled = true;
        
        // Enable all hover effects immediately since loading is complete
        document.querySelectorAll('.card:not(.double-height)').forEach(card => {
            card.classList.remove('disable-hover-effects');
            const image = card.querySelector('.thumbnail-image');
            if (image) {
                image.style.opacity = '1';
            }
        });
        
        // Add hover-ready class to body
        document.body.classList.add('hover-effects-ready');
        
        // Start hero animations if on index page - ENSURE first video is ready
        if (isIndexPage && !isStaticPage) {
            const firstVideo = document.querySelector('.slide video');
            if (firstVideo && firstVideo.readyState >= 1) {
                window.startAllAnimations();
            } else {
                // If first video not ready, try again after short delay
                setTimeout(() => {
                    window.startAllAnimations();
                }, 500);
            }
        }
        
        console.log('All assets loaded and functionality enabled');
    }

    // DYNAMISK CONTENT CASCADE ANIMATION
    function startContentCascade() {
        // Vent kort tid så hero kan starte
        setTimeout(() => {
            document.body.classList.add('content-ready');
            
            // Find alle cards i korrekt rækkefølge
            const leftCards = document.querySelectorAll('.left-column .card');
            const rightCards = document.querySelectorAll('.right-column .card');
            
            // Cascade timing: skiftevis venstre/højre
            const cascadeDelay = 200; // 200ms mellem hver card
            let currentDelay = 800; // Start efter 800ms (lidt før hero er færdig)
            
            // Animér cards én efter én
            const animateCard = (card, delay) => {
                setTimeout(() => {
                    card.style.animation = 'cardFadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                    
                    // Hvis det er tekstkortet, start tekstanimation
                    if (card.classList.contains('double-height')) {
                        setTimeout(() => {
                            animateTextWordsFixed(card);
                        }, 200);
                    }
                }, delay);
            };
            
            // Text card først
            if (leftCards[0]) animateCard(leftCards[0], currentDelay);
            currentDelay += cascadeDelay;
            
            // Motion Design
            if (rightCards[0]) animateCard(rightCards[0], currentDelay);
            currentDelay += cascadeDelay;
            
            // RegApp
            if (leftCards[1]) animateCard(leftCards[1], currentDelay);
            currentDelay += cascadeDelay;
            
            // NQS
            if (rightCards[1]) animateCard(rightCards[1], currentDelay);
            currentDelay += cascadeDelay;
            
            // AI Video
            if (leftCards[2]) animateCard(leftCards[2], currentDelay);
            currentDelay += cascadeDelay;
            
            // XRPA
            if (rightCards[2]) animateCard(rightCards[2], currentDelay);
            currentDelay += cascadeDelay;
            
            // Confidential Work
            if (leftCards[3]) animateCard(leftCards[3], currentDelay);
            
            // Skjul loader tidligere - efter hero + første par cards
            const loaderHideTime = 1500; // 1.5 sekunder er rigeligt
            setTimeout(() => {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hide');
                    // Stop loader animation når den skjules
                    stopLoaderAnimation();
                }
            }, loaderHideTime);
            
                 }, 100); // Kort delay efter loading er færdig
    }

    // STATISK CONTENT ANIMATION (for projekt-sider)
    function startStaticContentAnimation() {
        document.body.classList.add('content-ready');
        
        // Find alle cards
        const cards = document.querySelectorAll('.content-grid .card');
        
        // Animér alle cards samtidigt for statiske sider
        setTimeout(() => {
            cards.forEach(card => {
                card.style.animation = 'cardFadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                
                // Hvis det er tekstkortet, start tekstanimation (samme som på index.html)
                if (card.classList.contains('double-height')) {
                    setTimeout(() => {
                        animateTextWordsFixed(card);
                    }, 200);
                }
            });
            
            // Stop loader animation og fade den væk når siden er etableret
            setTimeout(() => {
                stopLoaderAnimation();
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hide');
                }
            }, 800); // Når animationen er godt i gang
            
        }, 300); // Kort delay så hero kan starte
    }

    // END INTELLIGENT LOADING SYSTEM

    let loadTime = Date.now();
    let mouseMoves = 0;
    document.addEventListener('mousemove', () => { mouseMoves++; });
    const minTime = 1000;
    const minMoves = 5;
    // Debug helper (simplified for production)
    function debug(msg, data) {
        // Silent in production - only log warnings
        if (msg.includes('WARNING')) {
            console.warn(msg, data);
        }
    }

    // TEXT WORD ANIMATION SYSTEM
    function animateTextWordsFixed(card) {
        const textContainer = card.querySelector('.card-text p') || card.querySelector('.card-text');
        const cardTextElement = card.querySelector('.card-text');
        if (!textContainer || !cardTextElement) return;
        
        // Tjek om animation allerede er startet
        if (cardTextElement.classList.contains('animating')) return;
        
        // VIS tekstcontaineren først
        cardTextElement.classList.add('animating');
        
        const originalHTML = textContainer.innerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;
        
        // Wrap words i spans
        function wrapTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const words = text.split(/(\s+)/).filter(word => word.length > 0);
                
                const fragment = document.createDocumentFragment();
                words.forEach(word => {
                    if (word.match(/^\s+$/)) {
                        fragment.appendChild(document.createTextNode(word));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'word-animate';
                        span.textContent = word;
                        fragment.appendChild(span);
                    }
                });
                
                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const children = Array.from(node.childNodes);
                children.forEach(child => wrapTextNodes(child));
            }
        }
        
        wrapTextNodes(tempDiv);
        textContainer.innerHTML = tempDiv.innerHTML;
        
        // Få ord i korrekt rækkefølge
        const wordSpans = [];
        const walker = document.createTreeWalker(
            textContainer,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    return node.classList.contains('word-animate') ? 
                           NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            wordSpans.push(node);
        }
        
        // Animér ordene hurtigt - dobbelt hastighed på regapp pga. lang tekst
        const isRegappPage = document.body.classList.contains('regapp');
        const baseDelay = isRegappPage ? 6 : 12;
        const maxEasedDelay = isRegappPage ? 50 : 100;
        const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        
        wordSpans.forEach((span, index) => {
            const progress = index / Math.max(wordSpans.length - 1, 1);
            const easedDelay = easeOutExpo(progress) * maxEasedDelay;
            const totalDelay = (index * baseDelay) + easedDelay;
            
            setTimeout(() => {
                span.classList.add('visible');
            }, totalDelay);
        });
    }

    // Tilføj kortsorterings-funktion til mobil-view
    function setupMobileCardOrdering() {
    
        
        // Saml alle kort (undtagen tekstkortet) fra begge kolonner i korrekt alternerende rækkefølge
        const leftColumn = document.querySelector('.left-column');
        const rightColumn = document.querySelector('.right-column');
        
        if (!leftColumn || !rightColumn) return;
        
        // Tekstkortet springer vi over (order: 0)
        const textCard = leftColumn.querySelector('.card.double-height');
        
        // Sammel alle kort i arrays efter kolonne
        const leftCards = Array.from(leftColumn.querySelectorAll('.card:not(.double-height)'));
        const rightCards = Array.from(rightColumn.querySelectorAll('.card'));
        
        // Ny, mere robust logik for alternering
        const cards = [];
        
        // Først altid 1. kort fra højre kolonne
        if (rightCards.length > 0) {
            cards.push(rightCards[0]);
        }
        
        // Maksimale antal iterationer (uden at tælle tekstkortet og første højre kort)
        const maxIterations = Math.max(leftCards.length, rightCards.length - 1);
        
        // Derefter alternerer vi perfekt
        for (let i = 0; i < maxIterations; i++) {
            // Venstre kort
            if (i < leftCards.length) {
                cards.push(leftCards[i]);
            }
            
            // Højre kort (starter fra index 1, da vi allerede har taget det første)
            if (i + 1 < rightCards.length) {
                cards.push(rightCards[i + 1]);
            }
        }
        

        
        // Tilføj mobile-order attributter til alle kort
        cards.forEach((card, index) => {
            // Start med 1 da tekstkortet har order: 0
            const orderValue = index + 1;
            card.setAttribute('data-mobile-order', orderValue);
            card.style.setProperty('--mobile-order', orderValue);

        });
        
        // Opdater lightbox samlingsfunktionerne for at bruge den korrekte sortering
        if (window.updateLightboxCollectors) {
            window.updateLightboxCollectors(cards);
        }
    }
    
    // Initialiser mobilkortsorterings-funktionen
    setupMobileCardOrdering();

    // *** BROWSER NAVIGATION FIX - SUBTIL VERSION ***
    // Løsning til at håndtere browser-navigation uden synlige beskeder
    
    // Tjek om vi er i en browser-navigations-kontekst
    try {
        // Brug en mindre aggressiv metode til at detektere browser-navigation
        if (performance && performance.navigation && performance.navigation.type === 2) {
    
            
            // Simpel stille reload uden synlig message
            window.location.reload();
        }
        
        // Håndtér pageshow event (browser-navigation via cache)
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
        
                window.location.reload();
            }
        });
        
        // Lyt til popstate events (browser forward/back knapper)
        window.addEventListener('popstate', function(event) {
    
            window.location.reload();
        });
    } catch (e) {
        // Ignorer eventuelle fejl i navigationsdetektionen
        console.error('Fejl i navigationsdetektionen:', e);
    }

    // Page type variables already declared above
    


    // Globale variabler
    const logo = document.getElementById('dynamic-logo');
    const heroText = document.getElementById('hero-text');
    
    // Markér straks kort med video med en klasse (TIDLIGT i indlæsningsprocessen)
    document.querySelectorAll('.card:not(.double-height)').forEach(card => {
        const video = card.querySelector('.thumbnail-video');
        if (video) card.classList.add('has-video');
    });
    
    // Håndtering af tekstkort farver baseret på baggrundsfarve
    function applyTextCardColorScheme() {
        // Tjek om window.hasDarkBackground funktion eksisterer (fra page-colors.js)
        if (typeof window.hasDarkBackground === 'function') {
            // Tjek om siden har mørk baggrund
            const hasDarkBg = window.hasDarkBackground(window.location.href) || 
                              document.body.classList.contains('xrpa') || 
                              document.body.classList.contains('nqs');
    
            
            // Find alle tekstkort
            const textCards = document.querySelectorAll('.card.double-height');
            textCards.forEach(card => {
                if (hasDarkBg) {
                    // Anvend mørk stil til tekstkort
                    card.style.background = `linear-gradient(to bottom, var(--text-card-bg-top-dark), var(--text-card-bg-bottom-dark))`;
                    
                    // Uanset HTML-struktur, stil hele project-description
                    const projectDescriptions = card.querySelectorAll('.project-description');
                    projectDescriptions.forEach(description => {
                        description.style.color = 'var(--text-card-text-dark)';
                        description.style.fontWeight = 'var(--text-card-font-weight-dark)';
                        
                        // Stil alle child-elementer i description
                        const allElements = description.querySelectorAll('*');
                        allElements.forEach(el => {
                            el.style.color = 'var(--text-card-text-dark)';
                            
                            // Særlig håndtering af b/strong
                            if (el.tagName.toLowerCase() === 'b' || el.tagName.toLowerCase() === 'strong') {
                                el.style.fontWeight = 'var(--text-card-bold-weight-dark)';
                            }
                            // Håndter p-elementer
                            else if (el.tagName.toLowerCase() === 'p') {
                                el.style.fontWeight = 'var(--text-card-paragraph-weight-dark)';
                            }
                        });
                        
                        // Håndter direkte tekstnoder (for sider med direkte tekst + br-elementer)
                        description.childNodes.forEach(node => {
                            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                                // Indsæt span omkring tekstnoder for styring
                                const span = document.createElement('span');
                                span.textContent = node.textContent;
                                span.style.color = 'var(--text-card-text-dark)';
                                span.style.fontWeight = 'var(--text-card-paragraph-weight-dark)';
                                
                                // Erstat tekstnoden med span
                                node.parentNode.replaceChild(span, node);
                            }
                        });
                    });
                    
    
                } else {
                    // Anvend lys stil til tekstkort (standard)
                    card.style.background = `linear-gradient(to bottom, var(--text-card-bg-top), var(--text-card-bg-bottom))`;
                    
                    // Uanset HTML-struktur, nulstil hele project-description
                    const projectDescriptions = card.querySelectorAll('.project-description');
                    projectDescriptions.forEach(description => {
                        description.style.color = 'var(--text-card-text)';
                        description.style.fontWeight = 'var(--text-card-font-weight)';
                        
                        // Nulstil alle child-elementer i description
                        const allElements = description.querySelectorAll('*');
                        allElements.forEach(el => {
                            if (el.tagName.toLowerCase() === 'b' || el.tagName.toLowerCase() === 'strong') {
                                el.style.color = 'var(--text-card-text)';
                                el.style.fontWeight = '700';
                            } 
                            else if (el.tagName.toLowerCase() === 'p') {
                                el.style.color = 'var(--text-card-text)';
                                el.style.fontWeight = 'var(--text-card-paragraph-weight)';
                            }
                            else {
                                el.style.color = 'var(--text-card-text)';
                            }
                        });
                        
                        // Håndter direkte tekstnoder (for sider med direkte tekst + br-elementer)
                        description.querySelectorAll('span').forEach(span => {
                            if (!span.hasAttribute('data-original-element')) {
                                span.style.color = 'var(--text-card-text)';
                                span.style.fontWeight = 'var(--text-card-paragraph-weight)';
                            }
                        });
                    });
                    
    
                }
            });
        }
    }
    
    // Anvend tekstkort-farver baseret på baggrundsfarve
    applyTextCardColorScheme();
    
    // Sticky header med scroll-responsiv baggrund
    function handleStickyHeader() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        // Få sidens baggrundsfarve
        function getPageBackgroundColor() {
            // Først prøv window.pageBackgroundColor
            if (window.pageBackgroundColor) {
                return window.pageBackgroundColor;
            }
            
            // Derefter prøv data-background-color attribut
            const bodyBgColor = document.body.getAttribute('data-background-color');
            if (bodyBgColor) {
                return bodyBgColor;
            }
            
            // Fallback til computed style
            const computedBg = getComputedStyle(document.body).backgroundColor;
            if (computedBg && computedBg !== 'rgba(0, 0, 0, 0)') {
                return computedBg;
            }
            
            // Ultimate fallback
            return '#F9F9F9';
        }
        
        // Konverter hex til rgba med alpha
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // Sæt header baggrund til sidens farve
        const pageColor = getPageBackgroundColor();
        const headerBgColor = pageColor.startsWith('#') ? 
            hexToRgba(pageColor, 0.95) : 
            pageColor.replace('rgb(', 'rgba(').replace(')', ', 0.95)');
        
        // Opdater CSS custom property med sidens farve
        header.style.setProperty('--header-bg-color', headerBgColor);
        

        
        function updateHeaderOnScroll() {
            const scrollY = window.scrollY;
            
            // Gradvis fade-in fra 0-100px, derefter konstant
            if (scrollY > 0) {
                header.classList.add('scrolled');
                
                // Beregn gradvis opacity fra 0-100px (0% til 95%)
                if (scrollY <= 100) {
                    const fadeProgress = Math.min(scrollY / 100, 1); // 0 til 1
                    const targetOpacity = fadeProgress * 0.95; // 0% til 95%
                    
                    // Opdater CSS custom property for gradvis fade
                    header.style.setProperty('--header-bg-opacity', targetOpacity);
                } else {
                    // Efter 100px, hold konstant 95% alpha
                    header.style.setProperty('--header-bg-opacity', 0.95);
                }
                
                // Fjern max-scroll klasse da vi nu bruger custom property
                header.classList.remove('scrolled-max');
            } else {
                header.classList.remove('scrolled');
                header.classList.remove('scrolled-max');
                header.style.setProperty('--header-bg-opacity', 0);
            }
            
            // Smart logo-skift kun på index siden
            if (isIndexPage && !isStaticPage) {
                handleSmartLogoSwitch(scrollY);
            }
        }
        
        // Lyt til scroll events
        window.addEventListener('scroll', updateHeaderOnScroll);
        
        // Tjek initial state
        updateHeaderOnScroll();
    }
    
    // Smart logo-skift for index siden
    function handleSmartLogoSwitch(scrollY) {
        if (!logo) return;
        
        if (scrollY < 100) {
            // Under 100px scroll: Lad hero-animationen styre logo-farven
            logo.classList.remove('scroll-override');
            
            // Synkroniser med aktuel slide i hero-animationen
            if (window.timeline && typeof window.timeline.currentIndex !== 'undefined') {
                const currentSlide = window.timeline.currentIndex;
                
                // Anvend logo-farve baseret på aktuel slide
                if (currentSlide === 1) {
                    // Slide 2: mørk baggrund -> lyst logo
                    logo.classList.add('light');
                } else {
                    // Slide 1 og 3: lys baggrund -> mørkt logo
                    logo.classList.remove('light');
                }
            }
        } else {
            // Over 100px scroll: Skift til statisk farve baseret på side-baggrund
            logo.classList.add('scroll-override');
            
            // Index har lys baggrund (#F9F9F9), så logo skal være mørkt
            if (typeof getLogoColor === 'function') {
                const staticLogoColor = getLogoColor('index.html');
                if (staticLogoColor === 'dark') {
                    logo.classList.remove('light');
                } else {
                    logo.classList.add('light');
                }
            } else {
                // Fallback: Index har lys baggrund, så logo skal være mørkt
                logo.classList.remove('light');
            }
        }
    }
    
    // Initialiser sticky header
    handleStickyHeader();
    
    // Håndtering af statiske og dynamiske sider
    if (isStaticPage) {

        
        // VIGTIGT: Tilføj loaded klasse til statiske sider så hero CSS-animation kan starte
        document.body.classList.add('loaded');
        
        // Start content animation for statiske sider
        startStaticContentAnimation();
        
        // Sæt initial state for statisk side
        const firstSlide = slides[0];
        if (firstSlide) {
            firstSlide.style.opacity = '1';
            // TJEK FOR VIDEO OG START DEN
            const video = firstSlide.querySelector('video');
            if (video) {

                video.play();
            }
        }
        if (heroText) {
            heroText.style.opacity = '1';
            // Fjern eventuelle transitions og effekter
            heroText.style.transition = 'none';
            heroText.classList.remove('blur');
        }
        // Check slide baggrund og sæt logo farve
        if (firstSlide && firstSlide.getAttribute('data-background') === 'dark') {

            if (logo) logo.classList.add('light');
        }
    } 
    else {
        // Resten af den eksisterende kode fortsætter uændret

        
        // Tidslinjekonfiguration: Nu med ekstra properties for alle slides, inkl. slide 1.
        // Gør timeline global så scroll-funktionen kan tilgå den
        window.timeline = {
            slides: [
                {
                    duration: 8000,
                    text: "I turn ideas into<br>form and function",
                    heroTextDelay: 3,         // Forsinkelse på 2 sekunder før hero-teksten opdateres
                    logoSwitchDelay: 0,       // Øjeblikkelig, ingen ændring – logoet forbliver uændret
                    heroTextColor: "#000"
                },
                {
                    duration: 7000,
                    text: "I create intuitive<br>user experiences",
                    logoSwitchDelay: 2.7,      // Skift logo efter 2.5 sekunder
                    heroTextDelay: 2.7,          // Skift hero-tekst (og farve) efter 3 sekunder
                    heroTextColor: "#fff"
                },
                {
                    duration: 10000,
                    text: "I simplify complexity<br>through motion",
                    logoSwitchDelay: 6.7,        // Skift logo efter 7 sekunder
                    heroTextDelay: 6.7,          // Skift hero-tekst (og farve) efter 7 sekunder
                    heroTextColor: "#000"
                }
            ],
            currentIndex: 0
        };

        // Initial visning af første slide og tekst med fade-in for hero-teksten
        // Hent animationsvarighed fra CSS-variablen (konverteret til millisekunder)
        const computedStyle = getComputedStyle(document.documentElement);
        const fadeSeconds = computedStyle.getPropertyValue('--hero-intro-duration').trim();
        const fadeDuration = parseFloat(fadeSeconds) * 1000 || 2000; // Konverterer sekunder til ms, default 2000ms
        
        // Setup for intelligent loading system
        const firstVideo = slides[0].querySelector('video');
        
        // Make first slide visible IMMEDIATELY so it follows CSS animation from start
        slides[0].style.opacity = '1';
        
        // Make startAllAnimations global so it can be called from intelligent loading
        window.startAllAnimations = function() {
            
            // Allow CSS to update before starting animations
            requestAnimationFrame(() => {
            firstVideo.play();
            
            // Start med heroText skjult (opacity 0) og med blur
            heroText.innerHTML = ''; // Ændret fra textContent til innerHTML
            heroText.style.opacity = '0';
            heroText.style.transition = `opacity ${fadeDuration}ms, filter ${fadeDuration}ms, transform ${fadeDuration}ms`;
            heroText.classList.add('blur');
            
            // Brug den definerede forsinkelse for slide 1 (heroTextDelay) – her 2 sekunder
            setTimeout(() => {
                heroText.innerHTML = window.timeline.slides[0].text; // Ændret fra textContent til innerHTML
                heroText.style.color = window.timeline.slides[0].heroTextColor;
                heroText.classList.remove('blur');
                heroText.style.opacity = '1';
            }, window.timeline.slides[0].heroTextDelay * 1000);
            
            // Start rotation efter første slides varighed
            setTimeout(nextSlide, window.timeline.slides[0].duration);
            });
        };
        
        // REMOVED OLD VIDEO LOADING LOGIC - CONFLICTS WITH INTELLIGENT LOADING

        function nextSlide() {
            // Brug samme fadeDuration som er defineret ovenfor - hentes fra CSS
            const currentIndex = window.timeline.currentIndex;
            const nextIndex = (currentIndex + 1) % window.timeline.slides.length;
            const oldSlide = slides[currentIndex];
            const newSlide = slides[nextIndex];
            
            // Sørg for, at den nye slide vises med det samme (uden fade-in)
            newSlide.style.transition = 'none';
            newSlide.style.opacity = '1';
            newSlide.style.zIndex = '0';
            setTimeout(() => {
                newSlide.style.transition = `opacity ${fadeDuration}ms`;
            }, 50);
            
            // Start den nye video's afspilning med det samme
            const vidNew = newSlide.querySelector('video');
            vidNew.currentTime = 0;
            vidNew.play();
            
            // Start fade-out af den gamle slide og hero-tekst med fast fadeDuration
            // Sørg for, at både opacity og filter (blur) overgår over fadeDuration.
            heroText.style.transition = `opacity ${fadeDuration}ms, filter ${fadeDuration}ms, transform ${fadeDuration}ms`;
            heroText.style.opacity = '0';
            heroText.classList.add('blur');
            
            oldSlide.style.transition = `opacity ${fadeDuration}ms`;
            oldSlide.style.opacity = '0';
            oldSlide.style.zIndex = '1';
            
            // Beregn det delay, hvorefter hero-teksten skal opdateres.
            // Vi tvinger det minimum til fadeDuration for at undgå opdatering før fade-out er færdig.
            const desiredHeroDelay = window.timeline.slides[nextIndex].heroTextDelay * 1000;
            const textDelay = Math.max(desiredHeroDelay, fadeDuration);
            
            setTimeout(() => {
                heroText.innerHTML = window.timeline.slides[nextIndex].text; // Ændret fra textContent til innerHTML
                heroText.style.color = window.timeline.slides[nextIndex].heroTextColor;
                heroText.classList.remove('blur');
                heroText.style.opacity = '1';
            }, textDelay);
            
            // Logoopdatering – skifter logoets farve med den definerede delay
            // Men kun hvis scroll-override ikke er aktiv
            const logoDelay = window.timeline.slides[nextIndex].logoSwitchDelay * 1000;
            setTimeout(() => {
                if (!logo.classList.contains('scroll-override')) {
                if (nextIndex === 1) { // f.eks. slide 2: skift fra mørkt til lyst
                    logo.classList.add('light');
                } else if (nextIndex === 2) { // slide 3: skift fra lyst til mørkt
                    logo.classList.remove('light');
                } else if (nextIndex === 0) {
                    // Slide 1: sørg for at logoet er i den ønskede 'mørke' tilstand
                    logo.classList.remove('light');
                    }
                }
            }, logoDelay);
            
            // Når fadeDuration er over, stoppes den gamle video, og vi planlægger næste slide
            setTimeout(() => {
                oldSlide.querySelector('video').pause();
                oldSlide.style.zIndex = '0';
                window.timeline.currentIndex = nextIndex;
                const remainingDuration = window.timeline.slides[nextIndex].duration - fadeDuration;
                setTimeout(nextSlide, remainingDuration > 0 ? remainingDuration : window.timeline.slides[nextIndex].duration);
            }, fadeDuration);
        }
    }

    // Thumbnail variabler
    const thumbZoomScale = 1.20; // Hvor meget billedet zoomer ind
    const thumbTransitionTime = 0.8; // Overgangsvarighed i sekunder
    
    // GLOBAL VARIABEL - starter med at blokere alle hover-effekter
    window.hoverEffectsEnabled = false;

    // Tilføj transform transition til alle thumbnail billeder
    document.querySelectorAll('.thumbnail-image').forEach(img => {
        img.style.transition = `opacity ${thumbTransitionTime}s ease, transform ${thumbTransitionTime}s ease`;
    });
    
    // Placeholder hover effekt
    document.querySelectorAll('.card.placeholder').forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!window.hoverEffectsEnabled) return;
            card.style.background = '#d0d0d0';
        });
        
        card.addEventListener('mouseleave', () => {
            if (!window.hoverEffectsEnabled) return;
            card.style.background = '#e0e0e0';
        });
    });
    
    // Tilføj denne globale variabel øverst i DOMContentLoaded eventhandler
    let mouseHasMoved = false;

    // Tilføj denne event listener lige efter den globale variabel-deklaration
    document.addEventListener('mousemove', function onFirstMouseMove() {
        mouseHasMoved = true;
        // Fjern event listener efter første musebevægelse
        document.removeEventListener('mousemove', onFirstMouseMove);

    });

    // Thumbnail hover handling (for videoer på indexsiden)
    document.querySelectorAll('.card:not(.double-height)').forEach(card => {
        const video = card.querySelector('.thumbnail-video');
        const image = card.querySelector('.thumbnail-image');
        
        card.addEventListener('mouseenter', (event) => {
            // STOP HVIS IKKE READY!
            if (!window.cardsReady) return;
            
            if (video) {
                if (video.readyState === 0) {
                    video.load();
                }
                video.style.visibility = 'visible';
                video.style.opacity = '1';
                video.style.zIndex = '2';
                if (image) image.style.zIndex = '1';
                video.play();
                card.classList.add('video-active');
            }
        });
        
        card.addEventListener('mouseleave', (event) => {
            // STOP HVIS IKKE READY!
            if (!window.cardsReady) return;
            
            if (video) {
                video.pause();
                video.currentTime = 0;
                card.classList.remove('video-active');
                video.style.visibility = 'hidden';
                video.style.opacity = '0';
                video.style.zIndex = '0';
                if (image) {
                    image.style.opacity = '1';
                    image.style.zIndex = '2';
                }
            }
        });
    });

    // Lightbox funktionalitet (nyt system)
    const lightbox = document.querySelector('.lightbox');
    // Skip global lightbox init on NQS to avoid conflicts with page-specific implementation
    if (lightbox && !document.body.classList.contains('nqs')) {
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const lightboxVideo = lightbox.querySelector('.lightbox-video');
        const lightboxCaption = lightbox.querySelector('.lightbox-caption');
        const lightboxClose = lightbox.querySelector('.lightbox-close');
        const prevButton = lightbox.querySelector('.prev');
        const nextButton = lightbox.querySelector('.next');
        let currentIndex = 0;
        let gallery = { type: 'image', items: [] };

        function inMobileOrderedContext() {
            return Array.isArray(window.mobileOrderedCards) && window.mobileOrderedCards.length > 0;
        }

        function buildGallery(type) {
            const items = [];
            if (inMobileOrderedContext()) {
                window.mobileOrderedCards.forEach(card => {
                    const overlay = card.querySelector('.overlay');
                    if (type === 'video') {
                        const source = card.querySelector('video source');
                        if (source) items.push({ type: 'video', src: source.src, caption: overlay?.innerHTML || '' });
                    } else {
                        const img = card.querySelector('img');
                        if (img) items.push({ type: 'image', src: img.src, alt: img.alt || '', caption: overlay?.innerHTML || '' });
                    }
                });
            } else {
                const rightColumn = document.querySelector('.right-column');
                const leftColumn = document.querySelector('.left-column');
                const pushFromColumn = (col, selector, mapFn) => {
                    if (!col) return;
                    col.querySelectorAll(selector).forEach(el => {
                        const card = el.closest('.card');
                        const overlay = card?.querySelector('.overlay');
                        const item = mapFn(el, overlay);
                        if (item) items.push(item);
                    });
                };
                if (type === 'video') {
                    pushFromColumn(rightColumn, '.card:not(.double-height) video source', (source, overlay) => ({ type: 'video', src: source.src, caption: overlay?.innerHTML || '' }));
                    pushFromColumn(leftColumn, '.card:not(.double-height) video source', (source, overlay) => ({ type: 'video', src: source.src, caption: overlay?.innerHTML || '' }));
                } else {
                    pushFromColumn(rightColumn, '.card:not(.double-height) img', (img, overlay) => ({ type: 'image', src: img.src, alt: img.alt || '', caption: overlay?.innerHTML || '' }));
                    pushFromColumn(leftColumn, '.card:not(.double-height) img', (img, overlay) => ({ type: 'image', src: img.src, alt: img.alt || '', caption: overlay?.innerHTML || '' }));
                }
            }
            return items;
        }

        function setAriaActive(isActive) {
            lightbox.setAttribute('role', 'dialog');
            lightbox.setAttribute('aria-modal', 'true');
            lightbox.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        }

        function showItem(index) {
            currentIndex = index;
            const item = gallery.items[currentIndex];
            if (!item) return;

            // Reset both
            if (lightboxVideo) {
                try { lightboxVideo.pause(); } catch (e) {}
                lightboxVideo.removeAttribute('src');
                lightboxVideo.load();
                lightboxVideo.classList.remove('visible');
            }
            if (lightboxImg) {
                lightboxImg.src = '';
                lightboxImg.alt = '';
                lightboxImg.classList.remove('visible');
            }

            // Apply item
            if (item.type === 'video' && lightboxVideo) {
                const sourceEl = lightboxVideo.querySelector('source');
                if (sourceEl) {
                    sourceEl.src = item.src;
                } else {
                    // Fallback hvis der ikke er <source>
                    lightboxVideo.src = item.src;
                }
                lightboxVideo.load();
                lightboxVideo.play();
                lightboxVideo.classList.add('visible');
            } else if (item.type === 'image' && lightboxImg) {
                lightboxImg.src = item.src;
                if (item.alt) lightboxImg.alt = item.alt;
                lightboxImg.classList.add('visible');
            }
            if (lightboxCaption) {
                lightboxCaption.innerHTML = item.caption || '';
            }
        }

        function openForCard(card) {
            // Determine type by presence of video source
            const isVideo = !!card.querySelector('video source');
            gallery.type = isVideo ? 'video' : 'image';
            gallery.items = buildGallery(gallery.type);

            // Find clicked index
            const targetSrc = isVideo ? card.querySelector('video source')?.src : card.querySelector('img')?.src;
            let index = 0;
            if (targetSrc) {
                index = gallery.items.findIndex(it => it.src === targetSrc);
                if (index < 0) index = 0;
            }

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
            setAriaActive(true);
            showItem(index);
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            setAriaActive(false);
            // Reset media
            if (lightboxVideo) {
                try { lightboxVideo.pause(); } catch (e) {}
                lightboxVideo.removeAttribute('src');
                lightboxVideo.load();
                lightboxVideo.classList.remove('visible');
            }
            if (lightboxImg) {
                lightboxImg.src = '';
                lightboxImg.alt = '';
                lightboxImg.classList.remove('visible');
            }
        }

        function showNext() {
            if (!gallery.items.length) return;
            const next = (currentIndex + 1) % gallery.items.length;
            showItem(next);
        }

        function showPrev() {
            if (!gallery.items.length) return;
            const prev = (currentIndex - 1 + gallery.items.length) % gallery.items.length;
            showItem(prev);
        }

        // Attach events
        document.querySelectorAll('.card').forEach(card => {
            if (!card.classList.contains('double-height')) {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setupMobileCardOrdering();
                    openForCard(card);
                });
            }
        });

        if (prevButton) prevButton.addEventListener('click', showPrev);
        if (nextButton) nextButton.addEventListener('click', showNext);
        if (lightboxClose) {
            lightboxClose.addEventListener('click', function(e) {
                e.stopPropagation();
                closeLightbox();
            });
        }
        lightbox.addEventListener('click', function(e) {
            if (!e.target.closest('.lightbox-image-container')) closeLightbox();
        });

        // Keyboard
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') showPrev();
            else if (e.key === 'ArrowRight') showNext();
        });

        // Touch swipe
        let touchStartX = 0;
        let touchEndX = 0;
        const threshold = 40;
        lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; });
        lightbox.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].clientX;
            const dx = touchEndX - touchStartX;
            if (Math.abs(dx) > threshold) {
                if (dx < 0) showNext(); else showPrev();
            }
        });
    }

    // Opret baggrundsoverlay element - første gang siden indlæses
    const bgOverlay = document.createElement('div');
    bgOverlay.className = 'background-transition-overlay';
    bgOverlay.style.position = 'fixed';
    bgOverlay.style.top = '0';
    bgOverlay.style.left = '0';
    bgOverlay.style.width = '100%';
    bgOverlay.style.height = '100%';
    bgOverlay.style.zIndex = '-1'; // Placeret bag alt andet indhold
    bgOverlay.style.opacity = '0';
    bgOverlay.style.pointerEvents = 'none'; // Ignorerer alle museklik
    document.body.appendChild(bgOverlay);

    // Page Transition System
    document.addEventListener('click', function(e) {
        // Find nærmeste <a> element eller returnér hvis ikke et link
        let linkElement = e.target.closest('a');
        if (!linkElement) return;
        
        // Ignorér eksterne links, anchor links eller links med target="_blank"
        const href = linkElement.getAttribute('href');
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('http') || 
            href.startsWith('//') ||
            linkElement.getAttribute('target') === '_blank') {
            return;
        }

        // Forbedret logo-klik detektion
        const isLogoClick = e.target.id === 'dynamic-logo' || // Logoet selv blev klikket
                          linkElement.hasAttribute('data-logo') || // Link med data-logo attribut
                          e.target.closest('.logo-card') !== null || // Inden for .logo-card
                          linkElement.closest('.logo-card') !== null; // Link inden for .logo-card
        
        // Forhindre standard navigation
        e.preventDefault();
        


        // Hvis det er et logo-klik, tilføj en lille forsinkelse før transition
        if (isLogoClick) {

            setTimeout(() => {
                startPageTransition(href, isLogoClick);
            }, 200); // Lille forsinkelse for logo-klik
        } else {
            startPageTransition(href, isLogoClick);
        }
    });

    // Helper funktion til at starte page transition
    function startPageTransition(href, isLogoClick) {
        // Ny, meget enklere farvehåndtering - brug page-colors.js
        // Brug den indbyggede funktion, hvis den er tilgængelig
        if (typeof getPageColor === 'function') {
            const destinationColor = getPageColor(href);
            console.log("Found color from page-colors.js:", destinationColor);
            
            // Tjek om vi har en funktion til at få logo-farven
            let destinationLogoIsDark = true; // Standard - logo skal være mørkt
            if (typeof getLogoColor === 'function') {
                destinationLogoIsDark = getLogoColor(href) === 'dark';
                console.log("Found logo color from page-colors.js:", destinationLogoIsDark ? 'dark' : 'light');
            }
            
            performPageTransition(destinationColor, href, isLogoClick, destinationLogoIsDark);
            return;
        }
        
        // Fallback til den gamle metode, hvis page-colors.js ikke er indlæst
        // Hent destination-sidens farve og logo-type
        fetch(href)
            .then(response => response.text())
            .then(html => {
                console.log("HTML fetched, length:", html.length);
                console.log("Destination URL:", href);
                
                // Debug: Tjek om HTML indeholder vores pageBackgroundColor variabel
                const hasColorVar = html.includes('pageBackgroundColor');
                console.log("HTML contains pageBackgroundColor:", hasColorVar);
                
                // Bestem logofarven baseret på indholdet
                let destinationLogoIsDark = true; // Standard: logo er mørkt
                
                // Find data-attribut der angiver om logo skal være lyst eller mørkt
                const logoColorRegex = /<body[^>]*data-logo-color=["'](dark|light)["'][^>]*>/i;
                const logoColorMatch = html.match(logoColorRegex);
                
                if (logoColorMatch && logoColorMatch[1]) {
                    destinationLogoIsDark = logoColorMatch[1].toLowerCase() === 'dark';
                    console.log("Found logo color from data attribute:", destinationLogoIsDark ? 'dark' : 'light');
                } else {
                    // Se om der er en klasse på en slide der indikerer baggrund
                    const darkBgSlideRegex = /<div[^>]*class=["'][^"']*slide[^"']*["'][^>]*data-background=["']dark["']/i;
                    const hasDarkBgSlide = darkBgSlideRegex.test(html);
                    
                    if (hasDarkBgSlide) {
                        // Hvis der er en mørk baggrund, skal logoet være lyst
                        destinationLogoIsDark = false;
                        console.log("Found dark background slide - logo should be light");
                    } else {
                        // Tjek om logo-elementet har .light klassen
                        const logoLightRegex = /id=["']dynamic-logo["'][^>]*class=["'][^"']*light[^"']*["']/i;
                        const hasLightLogo = logoLightRegex.test(html);
                        
                        if (hasLightLogo) {
                            destinationLogoIsDark = false;
                            console.log("Found light logo class on destination page");
                        }
                    }
                }
                
                // Find baggrundfarven med den eksisterende kode
                if (hasColorVar) {
                    // Find specifikt kontekst omkring pageBackgroundColor
                    const colorVarIndex = html.indexOf('pageBackgroundColor');
                    if (colorVarIndex > -1) {
                        const colorVarContext = html.substring(
                            Math.max(0, colorVarIndex - 50),
                            Math.min(html.length, colorVarIndex + 100)
                        );
                        console.log("Color variable context:", colorVarContext);
                    }
                }
                
                // Lad os forsøge at finde farven ved hjælp af window.pageBackgroundColor variablen
                // Regex mønster til at matche variabel-deklarationen
                const variableRegex = /window\.pageBackgroundColor\s*=\s*['"]([^'"]+)['"]/;
                const variableMatch = html.match(variableRegex);
                
                let destinationColor = '#ffffff'; // Standard hvid
                
                if (variableMatch && variableMatch[1]) {
                    // Denne metode har højest prioritet
                    destinationColor = variableMatch[1].trim();
                    console.log("Found color from pageBackgroundColor variable:", destinationColor);
                } else if (html.includes('pageBackgroundColor')) {
                    // Hvis variablen findes, men regex ikke matchede korrekt
                    console.log("pageBackgroundColor found but couldn't extract value");
                    
                    // Prøv alternative regex formuleringer
                    const altRegex1 = /pageBackgroundColor\s*=\s*['"]([^'"]+)['"]/;
                    const altRegex2 = /pageBackgroundColor['"]?\s*[:=]\s*['"]([^'"]+)['"]/;
                    
                    const altMatch1 = html.match(altRegex1);
                    const altMatch2 = html.match(altRegex2);
                    
                    if (altMatch1 && altMatch1[1]) {
                        destinationColor = altMatch1[1].trim();
                        console.log("Found color with alternate regex 1:", destinationColor);
                    } else if (altMatch2 && altMatch2[1]) {
                        destinationColor = altMatch2[1].trim();
                        console.log("Found color with alternate regex 2:", destinationColor);
                    }
                }
                
                // Hvis ikke fundet via variablen, prøv data-attributtet
                if (destinationColor === '#ffffff') {
                    const dataColorRegex = /<body[^>]*data-background-color=["']([^"']+)["'][^>]*>/i;
                    const dataColorMatch = html.match(dataColorRegex);
                    
                    if (dataColorMatch && dataColorMatch[1]) {
                        destinationColor = dataColorMatch[1].trim();
                        console.log("Found color from data attribute:", destinationColor);
                    } else {
                        // Prøv at finde meta tag med baggrundsfarve
                        const metaColorRegex = /<meta\s+name=["']theme-background-color["']\s+content=["']([^"']+)["']/i;
                        const metaColorMatch = html.match(metaColorRegex);
                        
                        if (metaColorMatch && metaColorMatch[1]) {
                            destinationColor = metaColorMatch[1].trim();
                            console.log("Found color from meta tag:", destinationColor);
                        } else {
                            // Hvis data-attributten ikke blev fundet, fortsæt med de eksisterende metoder
                            // Udskriv en del af HTML'en omkring body-tagget for at se præcis hvordan det ser ud
                            const bodyIndex = html.indexOf('<body');
                            if (bodyIndex > -1) {
                                // Udskriv et større stykke af HTML omkring body-tagget
                                const bodyContext = html.substring(
                                    Math.max(0, bodyIndex - 50), 
                                    Math.min(html.length, bodyIndex + 200)
                                );
                                console.log("Body tag context:", bodyContext);
                                
                                // Meget specifik regex som matcher præcis body-tag formatet vi har set
                                const exactBodyRegex = /<body[^>]*style="[^"]*background-color:\s*([^;"\s]+)[^"]*"[^>]*>/i;
                                const exactMatch = html.match(exactBodyRegex);
                                
                                if (exactMatch && exactMatch[1]) {
                                    destinationColor = exactMatch[1].trim();
                                    console.log("Found exact color match:", destinationColor);
                                } else {
                                    console.log("Exact body match failed");
                                    
                                    // En sidste mulighed - brug en mere generel regex
                                    const generalBgRegex = /background-color:\s*([^;"\s]+)/i;
                                    const generalMatch = html.match(generalBgRegex);
                                    
                                    if (generalMatch && generalMatch[1]) {
                                        destinationColor = generalMatch[1].trim();
                                        console.log("Found general color match:", destinationColor);
                                    } else {
                                        console.log("No background-color found in HTML");
                                    }
                                }
                            } else {
                                console.log("No body tag found in HTML");
                            }
                        }
                    }
                }
                
                // Start page transition med både farve og logo-info
                performPageTransition(destinationColor, href, isLogoClick, destinationLogoIsDark);
            })
            .catch((error) => {
                console.error("Fetch error:", error);
                // Ved fejl, brug standard transition uden farveændring
                performPageTransition('#ffffff', href, isLogoClick, true); // Standard: mørkt logo
            });
    }

    // Udfør side-transition
    function performPageTransition(destinationColor, targetUrl, isLogoClick, destinationLogoIsDark = true) {

        const transitionDuration = 1000; // Præcis 1 sekund samlet
        const contentFadeDuration = 600; // Indholdet fader ud på 600ms
        
        // Detect if we're on a static page like uiux.html (not index.html)
        const isStaticPage = slides.length === 1;
        const isUiUxPage = window.location.pathname.includes('uiux.html') || 
                           window.location.pathname.includes('template.html') ||
                           window.location.pathname.includes('xrpa.html');
        // Specifik detektering af XRPA page
        const isXrpaPage = window.location.pathname.includes('xrpa.html') || document.body.classList.contains('xrpa');
        

        
        // Vis debug info med farverne
        const currentColor = getComputedStyle(document.body).backgroundColor;

        
        // Fade ud hoved-indhold
        const hero = document.querySelector('.hero');
        const content = document.querySelector('.content-grid');
        const header = document.querySelector('.header');
        
        // Fade ud header baggrunden
        if (header) {
            // Tilføj transition klasse for langsom fade
            header.classList.add('page-transition');
            header.style.setProperty('--header-bg-opacity', '0');
        }
        
        // Logo-overgang
        const logo = document.getElementById('dynamic-logo');
        if (logo) {
            // Find ud af om logoet skal være lyst eller mørkt på destination
            const logoTransitionDelay = 200; // Lille forsinkelse på logo-skift for bedre effekt
            
            setTimeout(() => {
                // Overgang for logoet - tilføj/fjern .light class afhængigt af destination
                if (destinationLogoIsDark) {
                    logo.classList.remove('light');
        
                } else {
                    logo.classList.add('light');
        
                }
                
                // Tilføj transition til logoet så farven overblænder
                logo.style.transition = `filter ${transitionDuration - logoTransitionDelay}ms ease, opacity ${transitionDuration - logoTransitionDelay}ms ease, color ${transitionDuration - logoTransitionDelay}ms ease`;
            }, logoTransitionDelay);
        }
        
        // Debug info om elementerne
        debug('Page elements for transition:', { 
            heroExists: !!hero, 
            contentExists: !!content, 
            heroTextExists: !!document.getElementById('hero-text'),
            isStaticPage: isStaticPage,
            isUiUxPage: isUiUxPage,
            isXrpaPage: isXrpaPage
        });
        
        // Anvend den nye farve på overlay og fade det ind
        const bgOverlay = document.querySelector('.background-transition-overlay');
        if (bgOverlay) {
            bgOverlay.style.backgroundColor = destinationColor;
            bgOverlay.style.transition = `opacity ${transitionDuration}ms ease`;
            bgOverlay.style.opacity = '1';
        }
        
        // Specifik håndtering for uiux.html og andre statiske sider
        if (isStaticPage && (isUiUxPage || isXrpaPage)) {

            
            // Brug de samme indstillinger som index.html
            if (content) {
                // Præcis samme transition som index.html
                content.style.transition = `opacity ${contentFadeDuration}ms cubic-bezier(0.2, 0, 0.8, 0.5), filter ${contentFadeDuration}ms ease`;
                content.style.opacity = '0';
                content.style.filter = 'blur(10px)';
            }
            
            // Deaktiver eventuelle forsinkelses-animationer på kort
            const allCards = content.querySelectorAll('.card');
            allCards.forEach(card => {
                card.style.transitionDelay = '0s !important';
                card.style.animationDelay = '0s !important';
            });
            
            // Ingen forsinkelse for hero i uiux.html (i modsætning til index.html)
            if (hero) {
                const heroText = document.getElementById('hero-text');
                if (heroText) {
                    // Samme transition som i index.html
                    heroText.style.transition = 'opacity 0.5s ease-out';
                    heroText.style.opacity = '0';
                }
                // Præcis samme håndtering som i index.html
                hero.classList.add('fade-out');
            }
        }
        // Normal transition for andre sider (f.eks. index.html)
        else {
            // Standard index.html håndtering - FORBLIVER 100% UÆNDRET
            if (content) {
                content.style.transition = `opacity ${contentFadeDuration}ms cubic-bezier(0.2, 0, 0.8, 0.5), filter ${contentFadeDuration}ms ease`;
                content.style.opacity = '0';
                content.style.filter = 'blur(10px)';
            }
            
            // Vent 100ms før hero fader ud
            setTimeout(() => {
                if (hero) {
                    const heroText = document.getElementById('hero-text');
                    if (heroText) {
                        heroText.style.transition = 'opacity 0.5s ease-out';
                        heroText.style.opacity = '0';
                    }
                    hero.classList.add('fade-out');
                }
            }, 100);
        }
        
        // Efter nøjagtigt 1 sekund, naviger til ny side
        setTimeout(() => {
            window.location.href = targetUrl;
        }, transitionDuration);
    }



    // Øverst i filen - global variabel
    window.cardsReady = false;

    // I window load event - efter 3 sekunder bliver det aktiveret
    window.addEventListener('load', function() {
        setTimeout(function() {
            window.cardsReady = true;
        }, 3000);
    });

    // Hjælpefunktion: gem mobil-rækkefølge uden at kalde side-lokale helpers
    window.updateLightboxCollectors = function(orderedCards) {
        window.mobileOrderedCards = orderedCards || [];
    };
    
    // Tilføj resize event listener til at opdatere kort-ordering ved ændring af vinduesstørrelse
    let resizeTimeout;
    window.addEventListener('resize', function() {
        // Debounce resize eventet for at undgå for mange funktionskald
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setupMobileCardOrdering();
        }, 250);
    });
    // --- Phone reveal logic ---
    const showBtn = document.getElementById('showPhoneBtn');
    if (showBtn) {
      showBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const elapsed = Date.now() - loadTime;
        if (elapsed >= minTime && mouseMoves >= minMoves) {
          const response = await fetch('/protected/phone.txt');
          const number = await response.text();
          document.getElementById('phoneContainer').innerText = number;
        } else {
          window.location.href = 'https://da.wikipedia.org/wiki/Web_scraping';
        }
      });
    }

    // Parallax scroll effect for hero
    function initParallaxScroll() {
        const hero = document.querySelector('.hero');
        const contentGrid = document.querySelector('.content-grid');
        const leftColumn = document.querySelector('.left-column');
        const rightColumn = document.querySelector('.right-column');
        
        if (!hero || !contentGrid) return;
        
        function updateParallax() {
            const scrollY = window.pageYOffset;
            const heroHeight = hero.offsetHeight;
            
            // Apply effects
            const heroOffset = scrollY * 0.5;
            
            // Blur + fade + scale effect: starter ved 100px, maks ved 600px
            let blurAmount = 0;
            let opacity = 1;
            let scale = 1;
            
            if (scrollY > 100) {
                // Beregn blur, fade og scale mellem 100px og 600px scroll
                const effectProgress = Math.min((scrollY - 100) / (600 - 100), 1);
                blurAmount = effectProgress * 24; // Maks 24px blur
                opacity = 1 - effectProgress; // Fade ned til 0% (helt væk)
                scale = 1 - (effectProgress * 0.5); // Skaler ned til 50% (forsvinder i z-aksen)
            }
            
            // Anvend parallax via CSS custom property (kun hvis hero stadig er synlig)
            if (scrollY < heroHeight + 200) {
                hero.style.setProperty('--parallax-offset', `${heroOffset}px`);
            }
            
            // Anvend blur og fade på hero (med !important for at overskrive CSS)
            hero.style.filter = `blur(${blurAmount}px)`;
            hero.style.setProperty('opacity', opacity, 'important');
            
            // Skalér alle videoer/billeder i alle slides
            const allSlides = hero.querySelectorAll('.slide');
            allSlides.forEach(slide => {
                const video = slide.querySelector('video');
                if (video) {
                    video.style.transform = `scale(${scale})`;
                    video.style.transformOrigin = 'center';
                }
            });
            
            // Content scrolls at normal speed
            contentGrid.style.transform = `translateY(0px)`;
        }
        
        // Throttle scroll events for performance
        let ticking = false;
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
                setTimeout(() => ticking = false, 16); // ~60fps
            }
        }
        
        window.addEventListener('scroll', requestTick);
        
        // Initial call
        updateParallax();
    }
    
    // Initialize parallax after page load
    window.addEventListener('load', initParallaxScroll);
});

// Cleanup animation intervals when page unloads
window.addEventListener('beforeunload', () => {
    if (window.loaderAnimationInterval) {
        clearInterval(window.loaderAnimationInterval);
    }
});

// Debug helper - tilføjes i bunden af filen
function debugSiteFlow(event, data) {
    console.log(`%c[${new Date().toISOString().split('T')[1]}] ${event}`, 'color: #2196F3; font-weight: bold;', data || '');
} 