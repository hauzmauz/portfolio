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
    const isStaticPage = document.body.classList.contains('static-page') || slides.length === 1;
    const heroText = document.getElementById('hero-text');
    const heroInitialState = heroText ? {
        html: heroText.innerHTML,
        color: getComputedStyle(heroText).color
    } : null;
    let staticContentInitialized = false;
    let heroSequenceStarted = false;
    let heroStartQueued = false;
    let contentCascadeStarted = false;

    // START INTELLIGENT LOADING SYSTEM
    try {
        console.time?.('HeroReady');
    } catch (err) {
        /* no-op */
    }
    const heroReadyPromise = monitorHeroReadiness();
    heroReadyPromise.then(reason => queueHeroStart(reason || 'hero-ready'));
    
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
                queueHeroStart('global-failsafe');
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
        try {
            console.time?.('EssentialsReady');
        } catch (err) {
            /* no-op */
        }
        
        // Wait for fonts to load
        if (document.fonts && document.fonts.ready) {
            const fontPromise = new Promise(resolve => {
                let resolved = false;
                const finish = () => {
                    if (resolved) return;
                    resolved = true;
                    resolve();
                };
                document.fonts.ready.then(finish).catch(finish);
                setTimeout(finish, 800); // Safari fallback
            });
            promises.push(fontPromise);
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
        
        // Wait for all promises to resolve (don't fail if some assets don't load)
        await Promise.allSettled(promises);
        try {
            console.timeEnd?.('EssentialsReady');
        } catch (err) {
            /* no-op */
        }
        
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
        if (isStaticPage) {
            startStaticContentAnimation();
        } else {
            startContentCascade();
        }
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
        queueHeroStart('loader-complete');
        
        console.log('All assets loaded and functionality enabled');
    }

    function scheduleLoaderHide(delay = 1200) {
        if (scheduleLoaderHide.scheduled) return;
        scheduleLoaderHide.scheduled = true;
        setTimeout(() => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hide');
            }
            stopLoaderAnimation();
        }, delay);
    }
    scheduleLoaderHide.scheduled = false;

    function monitorHeroReadiness() {
        if (!isIndexPage || isStaticPage) {
            return Promise.resolve();
        }

        const firstHeroVideo = document.querySelector('.hero .slide video');
        if (!firstHeroVideo) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            let finished = false;
            const conclude = (label = 'timeout') => {
                if (finished) return;
                finished = true;
                try {
                    console.timeEnd?.('HeroReady');
                    console.debug?.('[HeroReady]', label);
                } catch (err) {
                    /* no-op */
                }
                resolve(label);
            };

            if (firstHeroVideo.readyState >= 1) {
                conclude('readyState>=1');
                return;
            }

            const onMeta = () => conclude('loadedmetadata');
            const onData = () => conclude('loadeddata');
            const onError = () => conclude('error');

            firstHeroVideo.addEventListener('loadedmetadata', onMeta, { once: true });
            firstHeroVideo.addEventListener('loadeddata', onData, { once: true });
            firstHeroVideo.addEventListener('error', onError, { once: true });

            if (firstHeroVideo.readyState === 0 && typeof firstHeroVideo.load === 'function') {
                firstHeroVideo.load();
            }

            setTimeout(() => conclude('timeout'), 5000);
        });
    }

    function queueHeroStart(reason = 'direct') {
        if (!isIndexPage || isStaticPage) {
            if (!heroSequenceStarted && typeof window.startAllAnimations === 'function') {
                heroSequenceStarted = true;
                window.startAllAnimations();
            }
            return;
        }

        const slidesArray = Array.from(slides);
        const firstVideo = slidesArray[0]?.querySelector('video');

        if (reason === 'timeout' && firstVideo && firstVideo.readyState < 2) {
            console.warn('[Hero] Safari timed out – waiting for loadeddata before starting timeline');
            if (typeof firstVideo.load === 'function') {
                firstVideo.load();
            }
            firstVideo.addEventListener('loadeddata', () => queueHeroStart('loadeddata'), { once: true });
            scheduleLoaderHide(1600);
            return;
        }

        if (heroStartQueued) return;
        heroStartQueued = true;

        if (firstVideo && firstVideo.readyState === 0 && typeof firstVideo.load === 'function') {
            firstVideo.load();
        }

        const beginSequence = () => {
            if (heroSequenceStarted) return;
            if (!contentCascadeStarted) {
                setTimeout(beginSequence, 100);
                return;
            }

            heroSequenceStarted = true;

            if (reason === 'timeout') {
                console.warn('[Hero] Starting after timeout fallback');
            }

            slidesArray.forEach(slide => {
                const video = slide.querySelector('video');
                ensureVideoPlayback(video);
            });

            if (typeof window.startAllAnimations === 'function') {
                window.startAllAnimations();
            }
            scheduleLoaderHide(1200);
        };

        if (!firstVideo) {
            beginSequence();
            return;
        }

        if (firstVideo.readyState >= 3) {
            beginSequence();
            return;
        }

        const readyHandler = () => {
            beginSequence();
        };

        firstVideo.addEventListener('canplaythrough', readyHandler, { once: true });
        firstVideo.addEventListener('loadeddata', readyHandler, { once: true });
        firstVideo.addEventListener('error', readyHandler, { once: true });
        setTimeout(readyHandler, 6000);
    }

    function getAlternatingCardSequence(options = {}) {
        const { includeTextCard = true } = options;
        const leftColumn = document.querySelector('.left-column');
        const rightColumn = document.querySelector('.right-column');

        if (!leftColumn || !rightColumn) return [];

        const leftCards = Array.from(leftColumn.querySelectorAll('.card'));
        const rightCards = Array.from(rightColumn.querySelectorAll('.card'));

        let textCard = null;
        const textIndex = leftCards.findIndex(card => card.classList.contains('double-height'));

        if (textIndex !== -1) {
            textCard = leftCards.splice(textIndex, 1)[0];
        }

        const sequence = [];

        if (includeTextCard && textCard) {
            sequence.push(textCard);
        }

        const maxLength = Math.max(leftCards.length, rightCards.length);
        for (let i = 0; i < maxLength; i++) {
            if (rightCards[i]) {
                sequence.push(rightCards[i]);
            }
            if (leftCards[i]) {
                sequence.push(leftCards[i]);
            }
        }

        return sequence;
    }

    // DYNAMISK CONTENT CASCADE ANIMATION
    function startContentCascade() {
        if (contentCascadeStarted) return;
        contentCascadeStarted = true;

        // Vent kort tid så hero kan starte
        setTimeout(() => {
            document.body.classList.add('content-ready');

            const cascadeCards = getAlternatingCardSequence({ includeTextCard: true });
            const cascadeDelay = 200; // 200ms mellem hver card
            let currentDelay = 200; // Start kort efter hero-zoom begynder

            const animateCard = (card, delay) => {
                setTimeout(() => {
                    card.style.animation = 'cardFadeIn 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';

                    if (card.classList.contains('double-height')) {
                        setTimeout(() => {
                            animateTextWordsFixed(card);
                        }, 200);
                    }
                }, delay);
            };

            cascadeCards.forEach(card => {
                animateCard(card, currentDelay);
                currentDelay += cascadeDelay;
            });

            scheduleLoaderHide(1200);
        }, 100); // Kort delay efter loading er færdig
    }

    // STATISK CONTENT ANIMATION (for projekt-sider)
    function startStaticContentAnimation() {
        if (staticContentInitialized) return;
        staticContentInitialized = true;
        contentCascadeStarted = true;
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
            scheduleLoaderHide(800);
        }, 300); // Kort delay så hero kan starte
    }

    // END INTELLIGENT LOADING SYSTEM

    const loadTime = Date.now();
    let interactionScore = 0;
    const minTime = 1000;
    const isCoarsePointer = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)').matches : false;
    const requiredInteractions = isCoarsePointer ? 2 : 5;
    const registerUserActivity = () => {
        interactionScore = Math.min(interactionScore + 1, requiredInteractions);
    };
    const supportsPointerEvents = 'PointerEvent' in window;
    if (supportsPointerEvents) {
        document.addEventListener('pointermove', registerUserActivity, { passive: true });
        document.addEventListener('pointerdown', registerUserActivity, { passive: true });
    } else {
        document.addEventListener('mousemove', registerUserActivity, { passive: true });
        document.addEventListener('touchmove', registerUserActivity, { passive: true });
        document.addEventListener('touchstart', registerUserActivity, { passive: true });
    }
    document.addEventListener('keydown', registerUserActivity);
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

        if (textContainer === cardTextElement && !cardTextElement.querySelector('.auto-text-block')) {
            const heading = cardTextElement.querySelector('h1, h2, h3, h4, h5, h6');
            let startCollecting = !heading;
            const nodesToWrap = [];

            Array.from(cardTextElement.childNodes).forEach(node => {
                if (node === heading) {
                    startCollecting = true;
                    return;
                }

                if (!startCollecting) {
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length === 0) {
                    cardTextElement.removeChild(node);
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('auto-text-block')) {
                    startCollecting = false;
                    return;
                }

                nodesToWrap.push(node);
            });

            if (nodesToWrap.length) {
                const autoParagraph = document.createElement('p');
                autoParagraph.className = 'auto-text-block';
                const firstNode = nodesToWrap[0];
                cardTextElement.insertBefore(autoParagraph, firstNode);
                nodesToWrap.forEach(node => {
                    autoParagraph.appendChild(node);
                });
            }
        }
        
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

        const sequence = Array.from(textContainer.querySelectorAll('.word-animate, .ty-divider'));

        const isRegappPage = document.body.classList.contains('regapp');
        const baseDelay = isRegappPage ? 6 : 12;
        const maxEasedDelay = isRegappPage ? 50 : 100;
        const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        let wordIndex = -1;
        let lastDelay = 0;

        sequence.forEach(element => {
            if (element.classList.contains('word-animate')) {
                wordIndex += 1;
                const totalWords = Math.max(wordSpans.length - 1, 1);
                const progress = wordSpans.length <= 1 ? 1 : wordIndex / totalWords;
                const easedDelay = easeOutExpo(progress) * maxEasedDelay;
                const totalDelay = (wordIndex * baseDelay) + easedDelay;

                setTimeout(() => {
                    element.classList.add('visible');
                }, totalDelay);

                lastDelay = totalDelay;
            } else {
                const dividerDelay = lastDelay + baseDelay;
                setTimeout(() => {
                    element.classList.add('visible');
                }, dividerDelay);
                lastDelay = dividerDelay;
            }
        });
    }

    // Tilføj kortsorterings-funktion til mobil-view
    function setupMobileCardOrdering() {
        // Brug samme interleaving som desktop, men udelad tekstkortet (order 0)
        const cards = getAlternatingCardSequence({ includeTextCard: false });

        if (!cards.length) return;

        cards.forEach((card, index) => {
            const orderValue = index + 1;
            card.setAttribute('data-mobile-order', orderValue);
            card.style.setProperty('--mobile-order', orderValue);
        });

        if (window.updateLightboxCollectors) {
            window.updateLightboxCollectors(cards);
        }
    }
    
    // Initialiser mobilkortsorterings-funktionen
    setupMobileCardOrdering();

    function calibrateVideoCardAspects() {
        const cards = document.querySelectorAll('.card.has-video, .card.video-default');
        cards.forEach(card => {
            const img = card.querySelector('.thumbnail-image');
            if (!img) return;

            const applyRatio = () => {
                if (!img.naturalWidth || !img.naturalHeight) return;
                const ratio = `${img.naturalWidth} / ${img.naturalHeight}`;
                card.style.setProperty('--card-aspect', ratio);
            };

            if (img.complete) {
                applyRatio();
            } else {
                img.addEventListener('load', applyRatio, { once: true });
            }
        });
    }

    calibrateVideoCardAspects();
    function ensureVideoPlayback(video) {
        if (!video) return;

        const applyReadyState = () => {
            video.classList.add('video-ready');
            const slide = video.closest('.slide');
            if (slide) slide.classList.add('video-loaded');
        };

        const tryPlay = () => {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        };

        if (video.dataset.ensureBound === 'true') {
            if (video.readyState >= 2) {
                applyReadyState();
                tryPlay();
            } else {
                video.addEventListener('loadeddata', () => {
                    applyReadyState();
                    tryPlay();
                }, { once: true });
                if (video.readyState === 0 && typeof video.load === 'function') {
                    video.load();
                }
            }
            return;
        }

        video.dataset.ensureBound = 'true';

        if (video.readyState >= 2) {
            applyReadyState();
            tryPlay();
        } else {
            video.addEventListener('loadeddata', () => {
                applyReadyState();
                tryPlay();
            }, { once: true });
            video.addEventListener('error', applyReadyState, { once: true });
            if (typeof video.load === 'function') {
                video.load();
            }
        }
    }



    // *** HISTORY NAVIGATION RESTORE ***
    let historyRestored = false;
    function restoreFromHistoryNavigation(source = 'unknown') {
        if (historyRestored) return;
        historyRestored = true;

        document.body.classList.add('loaded');
        document.body.classList.add('content-ready');
        document.body.classList.add('hover-effects-ready');

        window.cardsReady = true;
        window.hoverEffectsEnabled = true;
        // Nulstil animation flags så animationerne kan starte igen
        contentCascadeStarted = false;
        staticContentInitialized = false;
        scheduleLoaderHide.scheduled = true;

        if (isStaticPage) {
            heroSequenceStarted = true;
            heroStartQueued = true;
        } else {
            heroSequenceStarted = false;
            heroStartQueued = false;
        }

        const hero = document.querySelector('.hero');
        if (hero) {
            hero.classList.remove('fade-out');
            hero.style.removeProperty('filter');
            hero.style.removeProperty('opacity');
        }

        if (heroText) {
            heroText.classList.remove('blur');
            heroText.style.removeProperty('opacity');
            heroText.style.removeProperty('filter');
            heroText.style.removeProperty('transition');
        }

        const content = document.querySelector('.content-grid');
        if (content) {
            content.style.removeProperty('opacity');
            content.style.removeProperty('filter');
            content.style.removeProperty('transition');
        }

        const header = document.querySelector('.header');
        if (header) {
            header.classList.remove('page-transition');
            header.style.removeProperty('--header-bg-opacity');
        }

        const overlay = document.querySelector('.background-transition-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
        }

        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hide');
        }

        stopLoaderAnimation();
        cacheLinkColorData();
        if (typeof applyTextCardColorScheme === 'function') {
            applyTextCardColorScheme();
        }

        resetHeroStateForHistory();

        // Nulstil kortene så de kan animeres igen
        const allCards = document.querySelectorAll('.content-grid .card');
        allCards.forEach(card => {
            // Fjern inline styles så kortene går tilbage til CSS initial state (opacity: 0, transform: scale(0.92) translateY(40px))
            card.style.animation = '';
            card.style.opacity = '';
            card.style.transform = '';
            // Fjern visible klasse fra word-animate spans hvis de findes
            const wordSpans = card.querySelectorAll('.word-animate.visible');
            wordSpans.forEach(span => span.classList.remove('visible'));
            // Fjern animating klasse fra card-text
            const cardText = card.querySelector('.card-text');
            if (cardText) {
                cardText.classList.remove('animating');
            }
        });

        // Start card animations igen - nulstil først så de kan starte
        if (isStaticPage) {
            startStaticContentAnimation();
            
            // Start hero video på statiske sider
            const firstSlide = slides[0];
            if (firstSlide) {
                const video = firstSlide.querySelector('video');
                if (video) {
                    ensureVideoPlayback(video);
                }
            }
        } else {
            startContentCascade();
        }

        if (!isStaticPage) {
            queueHeroStart('history-nav');
        }

        if (!isStaticPage) {
            const firstVideo = document.querySelector('.slide video');
            if (firstVideo && firstVideo.paused) {
                const playPromise = firstVideo.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            }
        }

        debug('Restored from history navigation', { source });
    }

    function resetHeroStateForHistory() {
        if (!heroText) return;

        if (isStaticPage) {
            heroText.classList.remove('blur');
            heroText.style.removeProperty('filter');
            heroText.style.removeProperty('transition');
            heroText.style.opacity = '1';
            return;
        }

        if (!isIndexPage) return;

        heroText.classList.remove('blur');
        heroText.style.removeProperty('filter');
        heroText.style.removeProperty('transition');

        if (heroInitialState) {
            heroText.innerHTML = heroInitialState.html;
            heroText.style.color = heroInitialState.color;
        }

        heroText.style.opacity = '1';

        slides.forEach((slide, index) => {
            if (!slide) return;
            slide.style.removeProperty('transition');
            slide.style.opacity = index === 0 ? '1' : '0';
            slide.style.zIndex = index === 0 ? '0' : '';
        });

        if (window.timeline && Array.isArray(window.timeline.slides) && window.timeline.slides.length) {
            window.timeline.currentIndex = 0;
        }

        const firstSlideVideo = slides[0] ? slides[0].querySelector('video') : null;
        if (firstSlideVideo) {
            try {
                firstSlideVideo.currentTime = 0;
            } catch (err) {
                /* ignore reset errors */
            }
            ensureVideoPlayback(firstSlideVideo);
        }
    }

    function shouldRestoreFromPerformance() {
        if (performance && typeof performance.getEntriesByType === 'function') {
            const entries = performance.getEntriesByType('navigation');
            if (entries && entries.length) {
                return entries[0].type === 'back_forward';
            }
        }
        return false;
    }

    if (shouldRestoreFromPerformance()) {
        restoreFromHistoryNavigation('performance-entry');
    }

    window.addEventListener('pageshow', function(event) {
        if (event.persisted || shouldRestoreFromPerformance()) {
            restoreFromHistoryNavigation(event.persisted ? 'pageshow-persisted' : 'pageshow-nav-entry');
        }
    });

    window.addEventListener('popstate', function() {
        restoreFromHistoryNavigation('popstate');
    });

    window.addEventListener('pagehide', function() {
        historyRestored = false;
    });

    // Page type variables already declared above
    


    // Globale variabler
    const logo = document.getElementById('dynamic-logo');
    
    // Markér straks kort med video med en klasse (TIDLIGT i indlæsningsprocessen)
    document.querySelectorAll('.card:not(.double-height)').forEach(card => {
        const video = card.querySelector('.thumbnail-video');
        if (video) card.classList.add('has-video');
    });
    
    // Håndtering af tekstkort farver baseret på baggrundsfarve
    function applyTextCardColorScheme() {
        if (typeof window.hasDarkBackground !== 'function') return;

        const hasDarkBg = window.hasDarkBackground(window.location.href) ||
                          document.body.classList.contains('xrpa') ||
                          document.body.classList.contains('nqs');

        const textCards = document.querySelectorAll('.card.double-height');
        textCards.forEach(card => {
            card.classList.remove('dark-text-card', 'light-text-card');
            card.style.removeProperty('background');

            const targetClass = hasDarkBg ? 'dark-text-card' : 'light-text-card';
            card.classList.add(targetClass);
        });
    }
    
    function cacheLinkColorData() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) {
                return;
            }

            if (typeof getPageColor === 'function') {
                const color = getPageColor(href);
                if (color) {
                    link.dataset.destinationColor = color;
                }
            }

            if (typeof getLogoColor === 'function') {
                const logoPreference = getLogoColor(href);
                if (logoPreference) {
                    link.dataset.destinationLogo = logoPreference;
                }
            }
        });
    }

    // Anvend tekstkort-farver baseret på baggrundsfarve
    applyTextCardColorScheme();
    cacheLinkColorData();
    
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
                ensureVideoPlayback(video);
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
                    text: "Turning ideas into<br>form and function",
                    heroTextDelay: 3,         // Forsinkelse på 2 sekunder før hero-teksten opdateres
                    logoSwitchDelay: 0,       // Øjeblikkelig, ingen ændring – logoet forbliver uændret
                    heroTextColor: "#000"
                },
                {
                    duration: 7000,
                    text: "Creating intuitive<br>user experiences",
                    logoSwitchDelay: 2.7,      // Skift logo efter 2.5 sekunder
                    heroTextDelay: 2.7,          // Skift hero-tekst (og farve) efter 3 sekunder
                    heroTextColor: "#fff"
                },
                {
                    duration: 10000,
                    text: "Elevating concepts<br>through motion",
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
                if (firstVideo) {
                    try {
                        firstVideo.currentTime = 0;
                    } catch (err) {
                        console.warn('Could not reset first hero video time', err);
                    }
                    ensureVideoPlayback(firstVideo);
                }

                // Start med heroText skjult (opacity 0) og med blur
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
            if (vidNew) {
                vidNew.currentTime = 0;
                ensureVideoPlayback(vidNew);
            }
            
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
                const oldVideo = oldSlide.querySelector('video');
                if (oldVideo) {
                    try {
                        oldVideo.pause();
                        if (!oldVideo.loop) {
                            oldVideo.currentTime = 0;
                        }
                    } catch (err) {
                        console.warn('Could not reset old hero video', err);
                    }
                }
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
        
        if (video) {
            const showVideo = () => {
                video.style.visibility = 'visible';
                video.style.opacity = '1';
                video.style.zIndex = '2';
                if (image) {
                    image.style.opacity = '0';
                    image.style.zIndex = '1';
                }
                video.play().catch(() => {});
                card.classList.add('video-active');
            };
            
            const hideVideo = () => {
                video.pause();
                video.currentTime = 0;
                video.style.visibility = 'hidden';
                video.style.opacity = '0';
                video.style.zIndex = '0';
                if (image) {
                    image.style.opacity = '1';
                    image.style.zIndex = '2';
                }
                card.classList.remove('video-active');
            };
            
            const isDefaultVideo = card.classList.contains('video-default');
            
            if (isDefaultVideo) {
                const initVideo = () => showVideo();
                if (video.readyState === 0) {
                    video.addEventListener('loadeddata', initVideo, { once: true });
                    video.load();
                } else {
                    showVideo();
                }
                
                card.addEventListener('mouseenter', () => {
                    if (!window.cardsReady) return;
                    hideVideo();
                });
                
                card.addEventListener('mouseleave', () => {
                    if (!window.cardsReady) return;
                    showVideo();
                });
            } else {
                hideVideo();
                
                card.addEventListener('mouseenter', () => {
                    if (!window.cardsReady) return;
                    showVideo();
                });
                
                card.addEventListener('mouseleave', () => {
                    if (!window.cardsReady) return;
                    hideVideo();
                });
            }
        }
    });

    class LightboxManager {
        constructor(lightbox) {
            this.lightbox = lightbox;
            this.container = lightbox.querySelector('.lightbox-image-container');
            this.imageEl = lightbox.querySelector('.lightbox-image');
            this.videoEl = lightbox.querySelector('.lightbox-video');
            this.videoSource = this.videoEl ? this.videoEl.querySelector('source') || null : null;
            this.captionWrapper = lightbox.querySelector('.lightbox-caption');
            this.prevBtn = lightbox.querySelector('.lightbox-nav.prev');
            this.nextBtn = lightbox.querySelector('.lightbox-nav.next');
            this.closeBtn = lightbox.querySelector('.lightbox-close');
            this.items = [];
            this.currentIndex = -1;
            this.touchStartX = 0;
            this.touchThreshold = 40;
            this.focusReturnEl = null;
            this.bindEvents();
            this.refresh();
        }

        getOrderedCards() {
            if (Array.isArray(window.mobileOrderedCards) && window.mobileOrderedCards.length) {
                return window.mobileOrderedCards.filter(card => card && !card.classList.contains('double-height'));
            }
            if (typeof getAlternatingCardSequence === 'function') {
                return getAlternatingCardSequence({ includeTextCard: false }).filter(card => card && !card.classList.contains('double-height'));
            }
            return Array.from(document.querySelectorAll('.card:not(.double-height)'));
        }

        buildItems() {
            const cards = this.getOrderedCards();
            const seen = new Set();
            const collection = [];

            cards.forEach(card => {
                if (!card) return;
                const videoSource = card.querySelector('video source');
                const img = card.querySelector('img');
                const overlay = card.querySelector('.overlay');
                const heading = overlay?.querySelector('h3');
                const body = overlay?.querySelector('p');
                const captionHTML = overlay ? overlay.innerHTML.trim() : '';

                if (videoSource && videoSource.src) {
                    const key = `video|${videoSource.src}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    collection.push({
                        type: 'video',
                        src: videoSource.src,
                        card,
                        captionHTML,
                        title: heading?.textContent?.trim() || '',
                        body: body?.innerHTML?.trim() || '',
                        alt: img?.alt || ''
                    });
                } else if (img && img.src) {
                    const key = `image|${img.src}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    collection.push({
                        type: 'image',
                        src: img.src,
                        card,
                        captionHTML,
                        title: heading?.textContent?.trim() || '',
                        body: body?.innerHTML?.trim() || '',
                        alt: img.alt || ''
                    });
                }
            });

            return collection;
        }

        refresh() {
            this.items = this.buildItems();
            this.bindCardTriggers();
        }

        bindCardTriggers() {
            const cards = this.getOrderedCards();
            cards.forEach(card => {
                if (!card || card.dataset.lightboxBound === 'true') return;
                card.dataset.lightboxBound = 'true';
                card.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link) e.preventDefault();
                    e.stopPropagation();
                    this.open(card);
                });
            });
        }

        bindEvents() {
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showPrev();
                });
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showNext();
                });
            }
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.close();
                });
            }

            this.lightbox.addEventListener('click', (e) => {
                if (e.target.closest('.lightbox-close') || e.target.closest('.lightbox-nav')) return;
                if (this.container && this.container.contains(e.target)) {
                    if (this.isPointInsideMedia(e.clientX, e.clientY)) return;
                }
                this.close();
            });

            document.addEventListener('keydown', (e) => {
                if (!this.lightbox.classList.contains('active')) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.close();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.showPrev();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.showNext();
                }
            });

            this.lightbox.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].clientX;
            });

            this.lightbox.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const dx = touchEndX - this.touchStartX;
                if (Math.abs(dx) > this.touchThreshold) {
                    if (dx < 0) this.showNext();
                    else this.showPrev();
                }
            });

            window.addEventListener('resize', () => {
                if (this.lightbox.classList.contains('active')) {
                    this.adjustMediaBounds();
                }
                this.refresh();
            });
        }

        open(card) {
            if (typeof setupMobileCardOrdering === 'function') {
                setupMobileCardOrdering();
            }
            this.refresh();
            if (!this.items.length) return;

            const targetSource = (card.querySelector('video source') || card.querySelector('img'))?.src;
            const index = targetSource ? this.items.findIndex(item => item.src === targetSource) : 0;

            this.lightbox.classList.add('active');
            this.lightbox.setAttribute('role', 'dialog');
            this.lightbox.setAttribute('aria-modal', 'true');
            this.lightbox.setAttribute('aria-hidden', 'false');
            this.focusReturnEl = document.activeElement;
            document.body.style.overflow = 'hidden';
            this.showItem(index >= 0 ? index : 0);
            if (this.closeBtn) {
                this.closeBtn.focus({ preventScroll: true });
            }
        }

        close() {
            if (!this.lightbox.classList.contains('active')) return;
            this.lightbox.classList.remove('active');
            this.lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            this.stopMedia();
            if (this.focusReturnEl && typeof this.focusReturnEl.focus === 'function') {
                this.focusReturnEl.focus({ preventScroll: true });
            }
        }

        stopMedia() {
            if (this.videoEl) {
                try { this.videoEl.pause(); } catch (e) {}
                if (this.videoSource) {
                    this.videoSource.src = '';
                } else {
                    this.videoEl.removeAttribute('src');
                }
                this.videoEl.load();
                this.videoEl.classList.remove('visible');
            }
            if (this.imageEl) {
                this.imageEl.src = '';
                this.imageEl.alt = '';
                this.imageEl.classList.remove('visible');
            }
        }

        showItem(index) {
            if (!this.items.length) return;
            this.currentIndex = (index + this.items.length) % this.items.length;
            const item = this.items[this.currentIndex];

            this.stopMedia();

            if (item.type === 'video' && this.videoEl) {
                if (this.videoSource) {
                    this.videoSource.src = item.src;
                } else {
                    this.videoEl.src = item.src;
                }
                this.videoEl.load();
                this.videoEl.play().catch(() => {});
                this.videoEl.classList.add('visible');
            } else if (item.type === 'image' && this.imageEl) {
                this.imageEl.src = item.src;
                if (item.alt) this.imageEl.alt = item.alt;
                this.imageEl.classList.add('visible');
            }

            this.populateCaption(item);
            this.adjustMediaBounds();
        }

        populateCaption(item) {
            if (!this.captionWrapper) return;

            if (item.captionHTML) {
                this.captionWrapper.innerHTML = item.captionHTML;
                return;
            }

            this.captionWrapper.innerHTML = '';

            if (item.title) {
                const headingEl = document.createElement('h3');
                headingEl.className = 'ty-heading';
                headingEl.textContent = item.title;
                this.captionWrapper.appendChild(headingEl);
            }

            if (item.body) {
                const paragraphEl = document.createElement('p');
                paragraphEl.className = 'lightbox ty-body';
                paragraphEl.innerHTML = item.body;
                this.captionWrapper.appendChild(paragraphEl);
            }
        }

        adjustMediaBounds() {
            if (!this.container) return;
            const captionHeight = this.captionWrapper ? this.captionWrapper.getBoundingClientRect().height : 0;
            const margin = 32;
            this.container.style.maxWidth = `calc(100dvw - ${margin}px)`;
            this.container.style.maxHeight = `calc(100dvh - ${Math.ceil(captionHeight) + margin}px)`;
        }

        getMediaAspect(media) {
            if (media.videoWidth && media.videoHeight) {
                if (media.videoHeight === 0) return null;
                return media.videoWidth / media.videoHeight;
            }
            if (media.naturalWidth && media.naturalHeight) {
                if (media.naturalHeight === 0) return null;
                return media.naturalWidth / media.naturalHeight;
            }
            return null;
        }

        isPointInsideMedia(x, y) {
            if (!this.container) return false;
            const media = this.lightbox.querySelector('.lightbox-image.visible, .lightbox-video.visible');
            if (!media) return false;

            const containerRect = this.container.getBoundingClientRect();
            let displayWidth = containerRect.width;
            let displayHeight = containerRect.height;

            const aspect = this.getMediaAspect(media);
            if (aspect) {
                const containerAspect = containerRect.width / containerRect.height;
                if (containerAspect > aspect) {
                    displayHeight = containerRect.height;
                    displayWidth = displayHeight * aspect;
                } else {
                    displayWidth = containerRect.width;
                    displayHeight = displayWidth / aspect;
                }
            } else {
                const rect = media.getBoundingClientRect();
                displayWidth = rect.width;
                displayHeight = rect.height;
            }

            const left = containerRect.left + (containerRect.width - displayWidth) / 2;
            const top = containerRect.top + (containerRect.height - displayHeight) / 2;
            const right = left + displayWidth;
            const bottom = top + displayHeight;

            return x >= left && x <= right && y >= top && y <= bottom;
        }

        showNext() {
            if (!this.items.length) return;
            this.showItem(this.currentIndex + 1);
        }

        showPrev() {
            if (!this.items.length) return;
            this.showItem(this.currentIndex - 1);
        }
    }

    const lightboxInstance = (() => {
        const lb = document.querySelector('.lightbox');
        if (!lb) return null;
        return new LightboxManager(lb);
    })();

    if (lightboxInstance) {
        window.lightboxManager = lightboxInstance;
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
                startPageTransition(href, isLogoClick, linkElement);
            }, 200); // Lille forsinkelse for logo-klik
        } else {
            startPageTransition(href, isLogoClick, linkElement);
        }
    });

    // Helper funktion til at starte page transition
    function startPageTransition(href, isLogoClick, linkElement) {
        const bodyAttrColor = document.body.getAttribute('data-background-color');
        const currentComputedColor = getComputedStyle(document.body).backgroundColor;
        let destinationColor = linkElement?.dataset.destinationColor || null;

        if (!destinationColor && typeof getPageColor === 'function') {
            destinationColor = getPageColor(href);
        }

        if (!destinationColor) {
            destinationColor = bodyAttrColor || window.pageBackgroundColor || currentComputedColor || '#ffffff';
        }

        let destinationLogoIsDark;
        const linkLogoPref = linkElement?.dataset.destinationLogo;
        if (linkLogoPref) {
            destinationLogoIsDark = linkLogoPref === 'dark';
        } else if (typeof getLogoColor === 'function') {
            destinationLogoIsDark = getLogoColor(href) === 'dark';
        } else {
            const bodyLogoHint = document.body.getAttribute('data-logo-color');
            destinationLogoIsDark = (bodyLogoHint || 'dark') === 'dark';
        }

        performPageTransition(destinationColor, href, isLogoClick, destinationLogoIsDark);
    }

    // Udfør side-transition
    function performPageTransition(destinationColor, targetUrl, isLogoClick, destinationLogoIsDark = true) {

        const transitionDuration = 1000; // Præcis 1 sekund samlet
        const contentFadeDuration = 600; // Indholdet fader ud på 600ms
        
        // Detect if we're on a static page like uiux.html (not index.html)
        const isStaticPage = document.body.classList.contains('static-page') || slides.length === 1;
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
        if (window.lightboxManager) {
            window.lightboxManager.refresh();
        }
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
        let revealAttempts = 0;
        showBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (showBtn.dataset.revealed === 'true') return;

            revealAttempts++;
            const elapsed = Date.now() - loadTime;
            const phoneContainer = document.getElementById('phoneContainer');

            if (elapsed >= minTime && interactionScore >= requiredInteractions) {
                try {
                    const response = await fetch('protected/phone.txt', { cache: 'no-store' });
                    if (!response.ok) {
                        throw new Error(`Phone fetch failed: ${response.status}`);
                    }
                    const number = (await response.text()).trim();
                    if (phoneContainer && number.length) {
                        phoneContainer.innerText = number;
                    }
                    showBtn.dataset.revealed = 'true';
                    showBtn.classList.add('revealed');
                } catch (error) {
                    debug('WARNING: could not reveal phone number', error);
                    if (phoneContainer) {
                        phoneContainer.innerText = '+45 51 26 28 93';
                    }
                    showBtn.dataset.revealed = 'true';
                }
            } else {
                if (phoneContainer) {
                    const remainingMoves = Math.max(requiredInteractions - interactionScore, 0);
                    if (remainingMoves > 0) {
                        phoneContainer.innerText = `Almost there – give it ${remainingMoves} more move${remainingMoves === 1 ? '' : 's'} and try again.`;
                    } else {
                        const waitMillis = Math.max(minTime - elapsed, 0);
                        if (waitMillis > 0) {
                            const waitSeconds = Math.ceil(waitMillis / 100) / 10;
                            phoneContainer.innerText = `Hang on ${waitSeconds.toFixed(1)}s and then tap once more.`;
                        } else {
                            phoneContainer.innerText = `Give it a second and try again – it's worth the suspense.`;
                        }
                    }
                }
                if (revealAttempts > 2) {
                    window.open('https://da.wikipedia.org/wiki/Web_scraping', '_blank', 'noopener');
                }
            }
        });
    }

    // Parallax scroll effect for hero
    function initParallaxScroll() {
        const hero = document.querySelector('.hero');
        const contentGrid = document.querySelector('.content-grid');
        const leftColumn = document.querySelector('.left-column');
        const rightColumn = document.querySelector('.right-column');
        const isVideoPage = document.body.classList.contains('video-page');
        
        if (!hero || !contentGrid) return;
        
        function updateParallax() {
            const scrollY = window.pageYOffset;
            
            if (isVideoPage) {
                // Bevar hero fast uden parallax eller skalering på video sider
                hero.style.setProperty('--parallax-offset', '0px');
                hero.style.filter = 'none';
                hero.style.setProperty('opacity', '1', 'important');
                
                const allSlides = hero.querySelectorAll('.slide');
                allSlides.forEach(slide => {
                    const video = slide.querySelector('video');
                    if (video) {
                        video.style.transform = 'none';
                        video.style.transformOrigin = 'center';
                    }
                });
                return;
            }
            
            const heroHeight = hero.offsetHeight;
            const heroOffset = scrollY * 0.5;
            
            // Blur + fade + scale effect: starter ved 100px, maks ved 600px
            let blurAmount = 0;
            let opacity = 1;
            let scale = 1;
            
            if (scrollY > 100) {
                const effectProgress = Math.min((scrollY - 100) / (600 - 100), 1);
                blurAmount = effectProgress * 24; // Maks 24px blur
                opacity = 1 - effectProgress; // Fade ned til 0% (helt væk)
                scale = 1 - (effectProgress * 0.5); // Skaler ned til 50% (forsvinder i z-aksen)
            }
            
            if (scrollY < heroHeight + 200) {
                hero.style.setProperty('--parallax-offset', `${heroOffset}px`);
            }
            
            hero.style.filter = `blur(${blurAmount}px)`;
            hero.style.setProperty('opacity', opacity, 'important');
            
            const allSlides = hero.querySelectorAll('.slide');
            allSlides.forEach(slide => {
                const video = slide.querySelector('video');
                if (video) {
                    video.style.transform = `scale(${scale})`;
                    video.style.transformOrigin = 'center';
                }
            });
            
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
