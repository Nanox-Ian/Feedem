// Facebook Dark Cleaner - Background Service Worker
// Version 2.0.0

// ===== DEFAULT SETTINGS =====
const DEFAULT_SETTINGS = {
    enabled: true,
    darkMode: true,
    nuclearDarkMode: false,
    aggressiveCleanup: false,
    hideSponsored: true,
    hideStories: true,
    hideVideos: true,
    hideTrending: true
};

// ===== INSTALLATION =====
chrome.runtime.onInstalled.addListener(() => {
    console.log('Facebook Dark Cleaner v2.0.0 installed');
    
    // Set default settings
    chrome.storage.sync.set(DEFAULT_SETTINGS);
    
    // Create context menus
    createContextMenus();
    
    // Show welcome page
    showWelcomePage();
});

// ===== CONTEXT MENUS =====
function createContextMenus() {
    // Remove existing menus
    chrome.contextMenus.removeAll(() => {
        // Create parent menu
        chrome.contextMenus.create({
            id: 'parent',
            title: 'Facebook Dark Cleaner',
            contexts: ['action']
        });
        
        // Create child menus
        chrome.contextMenus.create({
            id: 'toggleDark',
            parentId: 'parent',
            title: 'Toggle Dark Mode',
            contexts: ['action']
        });
        
        chrome.contextMenus.create({
            id: 'toggleNuclear',
            parentId: 'parent',
            title: 'Toggle Nuclear Mode',
            contexts: ['action']
        });
        
        chrome.contextMenus.create({
            id: 'refresh',
            parentId: 'parent',
            title: 'Refresh Facebook',
            contexts: ['action']
        });
        
        chrome.contextMenus.create({
            id: 'separator1',
            parentId: 'parent',
            type: 'separator',
            contexts: ['action']
        });
        
        chrome.contextMenus.create({
            id: 'openSettings',
            parentId: 'parent',
            title: 'Open Settings',
            contexts: ['action']
        });
    });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case 'toggleDark':
            toggleDarkMode(tab);
            break;
            
        case 'toggleNuclear':
            toggleNuclearMode(tab);
            break;
            
        case 'refresh':
            refreshTab(tab);
            break;
            
        case 'openSettings':
            openSettings();
            break;
    }
});

// ===== TAB MANAGEMENT =====
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isFacebookUrl(tab.url)) {
        // Check if extension is enabled
        chrome.storage.sync.get(['enabled'], (data) => {
            if (data.enabled) {
                // Inject content script
                injectContentScript(tabId);
            }
        });
    }
});

// ===== MESSAGE HANDLING =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'getSettings':
            chrome.storage.sync.get(null, sendResponse);
            return true;
            
        case 'openPopup':
            chrome.action.openPopup();
            sendResponse({success: true});
            break;
            
        case 'showNotification':
            showNotification(message.title, message.message);
            sendResponse({success: true});
            break;
    }
});

// ===== HELPER FUNCTIONS =====
function isFacebookUrl(url) {
    return url && (
        url.includes('facebook.com') ||
        url.includes('messenger.com') ||
        url.includes('fb.com')
    );
}

function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: {tabId: tabId},
        files: ['content.js']
    }).catch(err => {
        console.log('Script injection error:', err);
    });
}

function toggleDarkMode(tab) {
    if (!tab || !isFacebookUrl(tab.url)) return;
    
    chrome.storage.sync.get(['darkMode'], (data) => {
        const newMode = !data.darkMode;
        chrome.storage.sync.set({darkMode: newMode});
        
        // Notify content script
        chrome.tabs.sendMessage(tab.id, {
            action: 'toggleFeature',
            feature: 'darkMode',
            value: newMode
        });
    });
}

function toggleNuclearMode(tab) {
    if (!tab || !isFacebookUrl(tab.url)) return;
    
    chrome.storage.sync.get(['nuclearDarkMode'], (data) => {
        const newMode = !data.nuclearDarkMode;
        chrome.storage.sync.set({nuclearDarkMode: newMode});
        
        // Notify content script
        chrome.tabs.sendMessage(tab.id, {
            action: 'toggleFeature',
            feature: 'nuclearDarkMode',
            value: newMode
        });
    });
}

function refreshTab(tab) {
    if (tab && isFacebookUrl(tab.url)) {
        chrome.tabs.reload(tab.id);
    }
}

function openSettings() {
    chrome.action.openPopup();
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: title,
        message: message,
        priority: 1
    });
}

function showWelcomePage() {
    // You could open a welcome page here
    // chrome.tabs.create({url: 'welcome.html'});
}

// ===== RUNTIME MANAGEMENT =====
chrome.runtime.onStartup.addListener(() => {
    console.log('Facebook Dark Cleaner starting up');
});

// Keep service worker alive
setInterval(() => {
    // Ping to keep alive
}, 60000); // Every minute