/**
 * Cookie Consent System - LGPD/GDPR Compliant
 * Manages user cookie preferences and blocks scripts until consent
 */

(function() {
    'use strict';

    const CONSENT_VERSION = '1.0';
    const CONSENT_COOKIE_NAME = 'cookie_consent';
    const CONSENT_EXPIRY_DAYS = 365;

    // Cookie categories
    const CATEGORIES = {
        NECESSARY: 'necessary',
        ANALYTICS: 'analytics',
        MARKETING: 'marketing'
    };

    // Default consent state
    const defaultConsent = {
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        necessary: true,
        analytics: false,
        marketing: false
    };

    /**
     * Cookie utilities with localStorage fallback
     */
    const CookieUtils = {
        set: function(name, value, days) {
            const expires = new Date();
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
            const cookieValue = encodeURIComponent(JSON.stringify(value));
            
            // Try to set cookie
            try {
                document.cookie = `${name}=${cookieValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
            } catch (e) {
                console.warn('Error setting cookie:', e);
            }
            
            // Also save to localStorage as backup
            try {
                localStorage.setItem(name, JSON.stringify(value));
            } catch (e) {
                console.warn('Error setting localStorage:', e);
            }
        },

        get: function(name) {
            // Try to get from cookie first
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    try {
                        const cookieValue = c.substring(nameEQ.length, c.length);
                        const parsed = JSON.parse(decodeURIComponent(cookieValue));
                        // Also sync to localStorage
                        try {
                            localStorage.setItem(name, JSON.stringify(parsed));
                        } catch (e) {}
                        return parsed;
                    } catch (e) {
                        console.warn('Error parsing cookie:', e);
                    }
                }
            }
            
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem(name);
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (e) {
                console.warn('Error reading localStorage:', e);
            }
            
            return null;
        },

        remove: function(name) {
            // Remove from cookie
            try {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
            } catch (e) {}
            
            // Remove from localStorage
            try {
                localStorage.removeItem(name);
            } catch (e) {}
        }
    };

    /**
     * Get current consent state
     */
    function getConsent() {
        try {
            const stored = CookieUtils.get(CONSENT_COOKIE_NAME);
            if (stored && typeof stored === 'object') {
                // Check if version matches (or if version doesn't exist, accept it for backward compatibility)
                if (stored.version === CONSENT_VERSION || !stored.version) {
                    // Ensure all required fields exist
                    if (typeof stored.necessary !== 'undefined' && 
                        typeof stored.analytics !== 'undefined' && 
                        typeof stored.marketing !== 'undefined') {
                        return stored;
                    }
                }
            }
        } catch (e) {
            console.warn('Error getting consent:', e);
        }
        return null;
    }

    /**
     * Save consent preferences
     */
    function saveConsent(consent) {
        const consentData = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            necessary: true, // Always true
            analytics: consent.analytics || false,
            marketing: consent.marketing || false
        };
        CookieUtils.set(CONSENT_COOKIE_NAME, consentData, CONSENT_EXPIRY_DAYS);
        
        // Verify cookie was saved
        const saved = CookieUtils.get(CONSENT_COOKIE_NAME);
        if (!saved || saved.version !== CONSENT_VERSION) {
            console.warn('Cookie consent may not have been saved correctly');
        }
        
        return consentData;
    }

    /**
     * Check if user has given consent
     */
    function hasConsent() {
        const consent = getConsent();
        // Return true only if consent exists and has valid structure
        return consent !== null && typeof consent === 'object' && consent.timestamp;
    }

    /**
     * Check if specific category is allowed
     */
    function isCategoryAllowed(category) {
        const consent = getConsent();
        if (!consent) return false;
        if (category === CATEGORIES.NECESSARY) return true;
        return consent[category] === true;
    }

    /**
     * Load scripts based on consent
     */
    function loadScripts() {
        const consent = getConsent();
        if (!consent) return;

        // Dispatch custom events for each category
        if (consent.analytics) {
            window.dispatchEvent(new CustomEvent('cookieConsent:analytics', { detail: consent }));
        }
        if (consent.marketing) {
            window.dispatchEvent(new CustomEvent('cookieConsent:marketing', { detail: consent }));
        }
        window.dispatchEvent(new CustomEvent('cookieConsent:necessary', { detail: consent }));
    }

    /**
     * Cookie Banner Component
     */
    function createCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie Consent');
        banner.setAttribute('aria-live', 'polite');

        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <p>We use cookies to improve your experience, analyze traffic, and personalize content. You can accept, reject, or manage your preferences.</p>
                    <div class="cookie-banner-links">
                        <a href="/privacy-policy" class="cookie-link">Privacy Policy</a>
                        <span class="cookie-link-separator">|</span>
                        <a href="/cookie-policy" class="cookie-link">Cookie Policy</a>
                    </div>
                </div>
                <div class="cookie-banner-buttons">
                    <button type="button" class="cookie-btn cookie-btn-reject" id="cookie-reject" aria-label="Reject all cookies">Reject</button>
                    <button type="button" class="cookie-btn cookie-btn-manage" id="cookie-manage" aria-label="Manage cookie preferences">Manage preferences</button>
                    <button type="button" class="cookie-btn cookie-btn-accept" id="cookie-accept-all" aria-label="Accept all cookies">Accept all</button>
                </div>
            </div>
        `;

        return banner;
    }

    /**
     * Cookie Preferences Modal Component
     */
    function createCookieModal() {
        const modal = document.createElement('div');
        modal.id = 'cookie-modal';
        modal.className = 'cookie-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'cookie-modal-title');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');

        const currentConsent = getConsent() || defaultConsent;

        modal.innerHTML = `
            <div class="cookie-modal-overlay" id="cookie-modal-overlay"></div>
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h2 id="cookie-modal-title">Cookie Preferences</h2>
                    <button type="button" class="cookie-modal-close" id="cookie-modal-close" aria-label="Close modal">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="cookie-modal-body">
                    <p class="cookie-modal-description">
                        Select which types of cookies you want to accept. Necessary cookies are always active.
                    </p>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div class="cookie-category-info">
                                <h3>Necessary Cookies</h3>
                                <p class="cookie-category-desc">Essential for the website to function. Always active.</p>
                            </div>
                            <label class="cookie-toggle cookie-toggle-disabled" aria-label="Necessary cookies always active">
                                <input type="checkbox" checked disabled aria-disabled="true">
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div class="cookie-category-info">
                                <h3>Analytics Cookies</h3>
                                <p class="cookie-category-desc">Help us understand how the website is used (statistics).</p>
                            </div>
                            <label class="cookie-toggle" aria-label="Allow analytics cookies">
                                <input type="checkbox" id="cookie-analytics" ${currentConsent.analytics ? 'checked' : ''}>
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div class="cookie-category-info">
                                <h3>Marketing Cookies</h3>
                                <p class="cookie-category-desc">Used for personalization and marketing campaigns.</p>
                            </div>
                            <label class="cookie-toggle" aria-label="Allow marketing cookies">
                                <input type="checkbox" id="cookie-marketing" ${currentConsent.marketing ? 'checked' : ''}>
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-modal-reject">Reject</button>
                    <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-modal-accept-all">Accept all</button>
                    <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-modal-save">Save preferences</button>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Show cookie banner
     */
    function showBanner() {
        if (hasConsent()) return;

        const banner = createCookieBanner();
        document.body.appendChild(banner);

        // Animate in
        setTimeout(() => {
            banner.classList.add('cookie-banner-visible');
        }, 100);

        // Event listeners
        document.getElementById('cookie-accept-all').addEventListener('click', handleAcceptAll);
        document.getElementById('cookie-reject').addEventListener('click', handleReject);
        document.getElementById('cookie-manage').addEventListener('click', handleManage);
    }

    /**
     * Hide cookie banner
     */
    function hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('cookie-banner-visible');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }

    /**
     * Show cookie modal
     */
    function showModal() {
        const modal = createCookieModal();
        document.body.appendChild(modal);

        // Focus trap
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Set initial focus
        setTimeout(() => {
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('cookie-modal-visible');
            firstFocusable.focus();
        }, 10);

        // Focus trap handler
        function trapFocus(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        }

        modal.addEventListener('keydown', trapFocus);

        // Event listeners
        document.getElementById('cookie-modal-close').addEventListener('click', hideModal);
        document.getElementById('cookie-modal-overlay').addEventListener('click', hideModal);
        document.getElementById('cookie-modal-save').addEventListener('click', handleSave);
        document.getElementById('cookie-modal-accept-all').addEventListener('click', handleAcceptAll);
        document.getElementById('cookie-modal-reject').addEventListener('click', handleReject);

        // ESC key handler
        function handleEsc(e) {
            if (e.key === 'Escape') {
                hideModal();
            }
        }
        modal.addEventListener('keydown', handleEsc);
    }

    /**
     * Hide cookie modal
     */
    function hideModal() {
        const modal = document.getElementById('cookie-modal');
        if (modal) {
            modal.classList.remove('cookie-modal-visible');
            modal.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Handle Accept All
     */
    function handleAcceptAll() {
        const consent = saveConsent({
            analytics: true,
            marketing: true
        });
        
        // Verify consent was saved before hiding
        if (hasConsent()) {
            hideBanner();
            hideModal();
            loadScripts();
        } else {
            console.error('Failed to save consent');
            // Retry saving
            setTimeout(function() {
                saveConsent({
                    analytics: true,
                    marketing: true
                });
                if (hasConsent()) {
                    hideBanner();
                    hideModal();
                    loadScripts();
                }
            }, 100);
        }
    }

    /**
     * Handle Reject
     */
    function handleReject() {
        const consent = saveConsent({
            analytics: false,
            marketing: false
        });
        
        // Verify consent was saved before hiding
        if (hasConsent()) {
            hideBanner();
            hideModal();
            loadScripts();
        } else {
            console.error('Failed to save consent');
            // Retry saving
            setTimeout(function() {
                saveConsent({
                    analytics: false,
                    marketing: false
                });
                if (hasConsent()) {
                    hideBanner();
                    hideModal();
                    loadScripts();
                }
            }, 100);
        }
    }

    /**
     * Handle Manage Preferences
     */
    function handleManage() {
        hideBanner();
        showModal();
    }

    /**
     * Handle Save Preferences
     */
    function handleSave() {
        const analytics = document.getElementById('cookie-analytics').checked;
        const marketing = document.getElementById('cookie-marketing').checked;

        const consent = saveConsent({
            analytics: analytics,
            marketing: marketing
        });
        
        // Verify consent was saved
        if (hasConsent()) {
            hideModal();
            loadScripts();
        } else {
            console.error('Failed to save consent');
            // Retry saving
            setTimeout(function() {
                saveConsent({
                    analytics: analytics,
                    marketing: marketing
                });
                if (hasConsent()) {
                    hideModal();
                    loadScripts();
                }
            }, 100);
        }
    }

    /**
     * Initialize cookie consent system
     */
    function init() {
        // Check if consent already exists immediately
        const consent = getConsent();
        const hasValidConsent = hasConsent();
        
        if (!consent || !hasValidConsent) {
            // Only show banner if no valid consent exists
            // Small delay to ensure DOM is ready
            setTimeout(function() {
                // Double-check before showing banner
                if (!hasConsent()) {
                    showBanner();
                }
            }, 100);
        } else {
            // Load scripts based on existing consent
            loadScripts();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export public API
    window.CookieConsent = {
        hasConsent: hasConsent,
        isCategoryAllowed: isCategoryAllowed,
        getConsent: getConsent,
        showBanner: showBanner,
        showModal: showModal,
        reset: function() {
            CookieUtils.remove(CONSENT_COOKIE_NAME);
            showBanner();
        }
    };
})();
