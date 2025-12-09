// Facebook Dark Cleaner - Complete Content Script
// Version 2.0.0 - Nuclear Dark Mode Enabled

(function() {
    'use strict';
    
    console.log('Facebook Dark Cleaner v2.0.0 loaded');
    
    // ===== SETTINGS =====
    let settings = {
        enabled: true,
        darkMode: true,
        nuclearDarkMode: false,
        aggressiveCleanup: false,
        hideSponsored: true,
        hideStories: true,
        hideVideos: true,
        hideTrending: true
    };
    
    // ===== ELEMENT OBSERVERS =====
    let mainObserver = null;
    let nuclearObserver = null;
    
    // ===== INITIALIZATION =====
    function init() {
        // Load settings from storage
        chrome.storage.sync.get([
            'enabled',
            'darkMode', 
            'nuclearDarkMode',
            'aggressiveCleanup',
            'hideSponsored',
            'hideStories',
            'hideVideos',
            'hideTrending'
        ], (data) => {
            Object.assign(settings, data);
            
            if (settings.enabled) {
                applyAllFeatures();
                startObservers();
            }
        });
        
        // Listen for settings changes
        chrome.storage.onChanged.addListener(handleSettingsChange);
        
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener(handleMessage);
        
        // Make API available for debugging
        window.FacebookDarkCleaner = {
            settings,
            applyAllFeatures,
            toggleFeature: toggleFeature,
            forceNuclearDarkMode: applyNuclearDarkMode,
            forceAggressiveCleanup: applyAggressiveCleanup
        };
    }
    
    // ===== SETTINGS HANDLERS =====
    function handleSettingsChange(changes, namespace) {
        let needsReapply = false;
        
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (settings[key] !== undefined) {
                settings[key] = newValue;
                
                if (key === 'enabled') {
                    if (newValue) {
                        applyAllFeatures();
                        startObservers();
                    } else {
                        removeAllFeatures();
                        stopObservers();
                    }
                    return;
                }
                
                needsReapply = true;
            }
        }
        
        if (needsReapply && settings.enabled) {
            applyAllFeatures();
        }
    }
    
    function handleMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'applySettings':
                Object.assign(settings, message.settings);
                applyAllFeatures();
                sendResponse({ success: true });
                break;
                
            case 'toggleFeature':
                toggleFeature(message.feature, message.value);
                sendResponse({ success: true });
                break;
                
            case 'getSettings':
                sendResponse(settings);
                break;
                
            case 'forceRefresh':
                applyAllFeatures();
                sendResponse({ success: true });
                break;
        }
        return true;
    }
    
    // ===== MAIN FEATURE APPLICATION =====
    function applyAllFeatures() {
        if (!settings.enabled) return;
        
        console.log('Applying all Facebook Dark Cleaner features');
        
        // Apply base dark mode
        if (settings.darkMode) {
            applyDarkMode();
        } else {
            removeDarkMode();
        }
        
        // Apply nuclear dark mode
        if (settings.nuclearDarkMode) {
            applyNuclearDarkMode();
        } else {
            removeNuclearDarkMode();
        }
        
        // Apply aggressive cleanup
        if (settings.aggressiveCleanup) {
            applyAggressiveCleanup();
        } else {
            removeAggressiveCleanup();
        }
        
        // Apply specific cleanup features
        applyCleanupFeatures();
        
        // Force initial style application
        setTimeout(forceStyleApplication, 500);
        setTimeout(forceStyleApplication, 1500);
    }
    
    function removeAllFeatures() {
        console.log('Removing all Facebook Dark Cleaner features');
        
        document.body.classList.remove(
            'fb-dark-forced',
            'fb-nuclear-dark',
            'fb-aggressive-cleanup'
        );
        
        // Remove any injected styles
        document.querySelectorAll('[data-fb-dark-cleaner]').forEach(el => el.remove());
    }
    
    // ===== DARK MODE FUNCTIONS =====
    function applyDarkMode() {
        document.body.classList.add('fb-dark-forced');
        fixDarkModeElements();
    }
    
    function removeDarkMode() {
        document.body.classList.remove('fb-dark-forced');
    }
    
    function fixDarkModeElements() {
        // Fix Facebook's own dark mode toggles
        document.querySelectorAll('[aria-label*="Dark mode"], [aria-label*="dark mode"]').forEach(btn => {
            btn.setAttribute('aria-checked', 'true');
            btn.setAttribute('data-active', 'true');
        });
        
        // Fix any light backgrounds
        document.querySelectorAll('[style*="background-color: white"], [style*="background-color: #fff"], [style*="background-color: rgb(255, 255, 255)"]').forEach(el => {
            if (!el.closest('.fb-nuclear-dark')) {
                el.style.backgroundColor = '#242526 !important';
            }
        });
        
        // Fix white text
        document.querySelectorAll('[style*="color: black"], [style*="color: #000"]').forEach(el => {
            if (!el.closest('.fb-nuclear-dark')) {
                el.style.color = '#e4e6eb !important';
            }
        });
    }
    
    // ===== NUCLEAR DARK MODE FUNCTIONS =====
    function applyNuclearDarkMode() {
        console.log('Applying NUCLEAR dark mode...');
        document.body.classList.add('fb-nuclear-dark');
        
        // Force all inline styles
        forceAllInlineStylesToDark();
        
        // Start observer for new elements
        startNuclearObserver();
        
        // Add nuclear style sheet
        addNuclearStyleSheet();
    }
    
    function removeNuclearDarkMode() {
        document.body.classList.remove('fb-nuclear-dark');
        
        if (nuclearObserver) {
            nuclearObserver.disconnect();
            nuclearObserver = null;
        }
        
        // Remove nuclear style sheet
        const nuclearStyle = document.getElementById('nuclear-dark-styles');
        if (nuclearStyle) nuclearStyle.remove();
    }
    
    function forceAllInlineStylesToDark() {
        // This is heavy - run carefully
        const allElements = document.querySelectorAll('*');
        const skipTags = ['svg', 'path', 'g', 'circle', 'rect', 'line', 'script', 'style'];
        
        allElements.forEach(element => {
            if (skipTags.includes(element.tagName.toLowerCase())) return;
            
            try {
                const style = window.getComputedStyle(element);
                
                // Force background
                if (style.backgroundColor && 
                    !isDarkColor(style.backgroundColor) && 
                    style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                    style.backgroundColor !== 'transparent') {
                    element.style.setProperty('background-color', '#242526', 'important');
                }
                
                // Force text color
                if (style.color && !isDarkColor(style.color)) {
                    element.style.setProperty('color', '#e4e6eb', 'important');
                }
                
                // Force border
                if (style.borderColor && style.borderColor !== 'rgba(0, 0, 0, 0)') {
                    element.style.setProperty('border-color', '#3e4042', 'important');
                }
            } catch (e) {
                // Skip elements that cause errors
            }
        });
    }
    
    function isDarkColor(color) {
        if (!color) return true;
        
        try {
            let r, g, b;
            
            if (color.startsWith('rgb')) {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    r = parseInt(match[1]);
                    g = parseInt(match[2]);
                    b = parseInt(match[3]);
                }
            } else if (color.startsWith('#')) {
                const hex = color.substring(1);
                if (hex.length === 3) {
                    r = parseInt(hex[0] + hex[0], 16);
                    g = parseInt(hex[1] + hex[1], 16);
                    b = parseInt(hex[2] + hex[2], 16);
                } else if (hex.length >= 6) {
                    r = parseInt(hex.substr(0, 2), 16);
                    g = parseInt(hex.substr(2, 2), 16);
                    b = parseInt(hex.substr(4, 2), 16);
                }
            }
            
            if (r === undefined || g === undefined || b === undefined) {
                return true; // Assume dark
            }
            
            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
        } catch (e) {
            return true; // Assume dark on error
        }
    }
    
    function addNuclearStyleSheet() {
        // Remove existing
        const existing = document.getElementById('nuclear-dark-styles');
        if (existing) existing.remove();
        
        // Add new
        const styleSheet = document.createElement('style');
        styleSheet.id = 'nuclear-dark-styles';
        styleSheet.setAttribute('data-fb-dark-cleaner', 'true');
        styleSheet.textContent = `
            .fb-nuclear-dark :root {
                --primary-color: #2d88ff !important;
                --secondary-color: #3a3b3c !important;
                --surface-color: #242526 !important;
                --background-color: #18191a !important;
                --text-primary: #e4e6eb !important;
                --text-secondary: #b0b3b8 !important;
                --divider-color: #3e4042 !important;
            }
            
            .fb-nuclear-dark [style*="color:"] {
                color: #e4e6eb !important;
            }
            
            .fb-nuclear-dark [style*="background-color:"] {
                background-color: #242526 !important;
            }
            
            .fb-nuclear-dark [style*="background:"] {
                background: #242526 !important;
            }
            
            .fb-nuclear-dark [style*="border-color:"] {
                border-color: #3e4042 !important;
            }
        `;
        
        document.head.appendChild(styleSheet);
    }
    
    // ===== AGGRESSIVE CLEANUP FUNCTIONS =====
    function applyAggressiveCleanup() {
        document.body.classList.add('fb-aggressive-cleanup');
        
        const aggressiveSelectors = [
            '[aria-label*="Trending"]',
            '[aria-label*="Suggested"]',
            '[aria-label*="Popular"]',
            '[aria-label*="Recommended"]',
            '[aria-label*="Birthday"]',
            '[aria-label*="Memory"]',
            '[aria-label*="Friendversary"]',
            '[aria-label*="Marketplace"]',
            '[aria-label*="Buy"]',
            '[aria-label*="Sell"]',
            '[aria-label*="Game"]',
            '[aria-label*="Gaming"]',
            '[aria-label*="Watch"]',
            '[aria-label*="Video"]',
            '[aria-label*="People you may know"]',
            '[aria-label*="Friend suggestions"]',
            '[aria-label*="Event"]',
            '[aria-label*="Events"]',
            '[aria-label*="Group"]',
            '[aria-label*="Groups"]'
        ];
        
        aggressiveSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.cssText = `
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    width: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    overflow: hidden !important;
                `;
            });
        });
        
        // Remove empty containers
        document.querySelectorAll('div:empty, span:empty, section:empty').forEach(el => {
            if (el.children.length === 0 && el.textContent.trim() === '') {
                el.remove();
            }
        });
    }
    
    function removeAggressiveCleanup() {
        document.body.classList.remove('fb-aggressive-cleanup');
    }
    
    // ===== CLEANUP FEATURES =====
    function applyCleanupFeatures() {
        // Hide sponsored content
        if (settings.hideSponsored) {
            hideSponsoredContent();
        }
        
        // Hide stories
        if (settings.hideStories) {
            hideStories();
        }
        
        // Hide videos
        if (settings.hideVideos) {
            hideVideos();
        }
        
        // Hide trending
        if (settings.hideTrending) {
            hideTrending();
        }
    }
    
    function hideSponsoredContent() {
        document.querySelectorAll('[aria-label*="Sponsored"], [data-pagelet*="FeedUnit"][aria-label*="Sponsored"], [aria-label*="广告"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    function hideStories() {
        document.querySelectorAll('[aria-label="Stories"], [data-pagelet="Stories"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    function hideVideos() {
        document.querySelectorAll('a[href*="/watch/"], a[href*="/reels/"], [aria-label*="Reels"], [aria-label*="Watch"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    function hideTrending() {
        document.querySelectorAll('[aria-label*="Trending"], [aria-label*="趋势"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // ===== OBSERVER FUNCTIONS =====
    function startObservers() {
        // Main observer for Facebook's dynamic content
        if (!mainObserver) {
            mainObserver = new MutationObserver(() => {
                if (settings.enabled) {
                    applyCleanupFeatures();
                    
                    if (settings.darkMode) {
                        fixDarkModeElements();
                    }
                    
                    if (settings.nuclearDarkMode) {
                        fixNewElementsForNuclearMode();
                    }
                }
            });
            
            mainObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    function stopObservers() {
        if (mainObserver) {
            mainObserver.disconnect();
            mainObserver = null;
        }
        
        if (nuclearObserver) {
            nuclearObserver.disconnect();
            nuclearObserver = null;
        }
    }
    
    function startNuclearObserver() {
        if (nuclearObserver) {
            nuclearObserver.disconnect();
        }
        
        nuclearObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            forceElementToDark(node);
                            
                            if (node.querySelectorAll) {
                                node.querySelectorAll('*').forEach(child => {
                                    forceElementToDark(child);
                                });
                            }
                        }
                    });
                }
            });
        });
        
        nuclearObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    function fixNewElementsForNuclearMode() {
        document.querySelectorAll('*:not(.fb-nuclear-dark *)').forEach(el => {
            if (!el.closest('.fb-nuclear-dark')) {
                forceElementToDark(el);
            }
        });
    }
    
    function forceElementToDark(element) {
        if (!element || !element.style) return;
        
        const tag = element.tagName.toLowerCase();
        if (['svg', 'path', 'g', 'circle', 'rect', 'line', 'script', 'style'].includes(tag)) {
            return;
        }
        
        try {
            element.style.setProperty('background-color', '#242526', 'important');
            element.style.setProperty('color', '#e4e6eb', 'important');
            element.style.setProperty('border-color', '#3e4042', 'important');
        } catch (e) {
            // Skip elements that cause errors
        }
    }
    
    // ===== UTILITY FUNCTIONS =====
    function toggleFeature(feature, value) {
        if (settings[feature] !== undefined) {
            settings[feature] = value;
            
            // Save to storage
            const update = {};
            update[feature] = value;
            chrome.storage.sync.set(update);
            
            // Apply changes
            if (settings.enabled) {
                applyAllFeatures();
            }
        }
    }
    
    function forceStyleApplication() {
        // Force styles to apply by toggling classes
        document.body.classList.remove('fb-dark-forced');
        setTimeout(() => {
            if (settings.darkMode) {
                document.body.classList.add('fb-dark-forced');
            }
        }, 10);
    }
    
    // ===== FACEBOOK SPA NAVIGATION DETECTION =====
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('Facebook page changed, reapplying styles');
            
            setTimeout(() => {
                if (settings.enabled) {
                    applyAllFeatures();
                }
            }, 300);
        }
    }, 500);
    
    // ===== INITIALIZATION CALL =====
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();