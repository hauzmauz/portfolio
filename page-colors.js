// page-colors.js - Farveinformation for alle sider
// Indeholder baggrundsfarver for hver side og logo-type (lyst eller mørkt)

// Farvekonstanter
const PAGE_COLORS = {
    'index.html': '#F9F9F9',           // Lysegrå til hovedsiden
    'proj-motion.html': '#121212',     // Sort til motion design
    'proj-ai-video.html': '#201e1f',   // Mørk til AI-projektsiden
    'proj-xrpa.html': '#081c32',       // Mørkeblå til XRPA projektsiden
    'proj-nqs.html': '#000000',        // Sort baggrund til NQS projektsiden
    'proj-confidential.html': '#8C8C8C', // Grå baggrund til confidential projektsiden
    'proj-regapp.html': '#262626'      // Mørk grå til RegApp projektsiden
};

// Logo definitioner (true = dark logo, false = light/white logo)
const LOGO_COLORS = {
    'index.html': true,               // Mørkt logo på index (lys baggrund)
    'proj-motion.html': false,        // Lyst logo på motion projekt (mørk baggrund)
    'proj-ai-video.html': false,      // Lyst logo på AI projekt (mørk baggrund)
    'proj-xrpa.html': false,          // Lyst logo på mørk baggrund (mørkeblå)
    'proj-nqs.html': false,           // Lyst logo på mørk baggrund (sort)
    'proj-confidential.html': false,   // Lyst logo på grå baggrund
    'proj-regapp.html': false          // Lyst logo på mørk grå baggrund
};

// Sider med mørk baggrund - disse vil bruge mørk tekstkort-stil
const DARK_BACKGROUND_PAGES = {
    'proj-motion.html': true,        // Motion projekt har mørk baggrund
    'proj-ai-video.html': true,      // AI projekt har mørk baggrund
    'proj-xrpa.html': true,          // XRPA har mørk baggrund (mørkeblå)
    'proj-nqs.html': true,           // NQS har mørk baggrund (sort)
    'proj-confidential.html': true,   // Confidential har mørk (grå) baggrund
    'proj-regapp.html': true          // RegApp har mørk baggrund
};

// Funktion til at få en sides farve
function getPageColor(url) {
    // Ekstraher sidenavn fra URL
    const pageName = url.split('/').pop();
    
    // Standardfarve hvis siden ikke er defineret
    let bgColor = '#FFFFFF';
    
    // Tjek om siden findes i vores farvekort
    if (PAGE_COLORS[pageName]) {
        bgColor = PAGE_COLORS[pageName];
    }
    
    return bgColor;
}

// Funktion til at få logofarven for en side (dark eller light)
function getLogoColor(url) {
    // Ekstraher sidenavn fra URL
    const pageName = url.split('/').pop();
    
    // Standard er 'dark' (sort logo på lys baggrund)
    let logoColor = 'dark';
    
    // Tjek om siden findes i vores logo-definitioner
    if (LOGO_COLORS.hasOwnProperty(pageName)) {
        logoColor = LOGO_COLORS[pageName] ? 'dark' : 'light';
    }
    
    return logoColor;
}

// Funktion til at tjekke om en side har mørk baggrund
function hasDarkBackground(url) {
    // Ekstraher sidenavn fra URL
    const pageName = url.split('/').pop();
    
    // Standard er false (lys baggrund)
    let isDark = false;
    
    // Tjek om siden findes i vores mørk baggrund-definitioner
    if (DARK_BACKGROUND_PAGES.hasOwnProperty(pageName)) {
        isDark = DARK_BACKGROUND_PAGES[pageName];
    }
    
    return isDark;
}

// Exporter funktionerne for global brug
window.getPageColor = getPageColor;
window.getLogoColor = getLogoColor;
window.hasDarkBackground = hasDarkBackground; 
