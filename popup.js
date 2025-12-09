// Facebook Dark Cleaner - Popup Script
// Version 2.0.0

document.addEventListener('DOMContentLoaded', function() {
    // ===== ELEMENT REFERENCES =====
    const toggleEnabled = document.getElementById('toggleEnabled');
    const toggleDarkMode = document.getElementById('toggleDarkMode');
    const toggleNuclearDark = document.getElementById('toggleNuclearDark');
    const toggleAggressive = document.getElementById('toggleAggressive');
    const toggleSponsored = document.getElementById('toggleSponsored');
    const toggleStories = document.getElementById('toggleStories');
    const toggleVideos = document.getElementById('toggleVideos');
    const toggleTrending = document.getElementById('toggleTrending');
    
    const themeDark = document.getElementById('themeDark');
    const themeLight = document.getElementById('themeLight');
    
    const applyBtn = document.getElementById('applyBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const savePresetBtn = document.getElementById('savePresetBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const status = document.getElementById('status');
    
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
    
    // ===== INITIALIZATION =====
    function init() {
        loadSettings();
        setupEventListeners();
        checkCurrentTab();
    }
    
    // ===== SETTINGS MANAGEMENT =====
    function loadSettings() {
        chrome.storage.sync.get(DEFAULT_SETTINGS, function(data) {
            toggleEnabled.checked = data.enabled;
            toggleDarkMode.checked = data.darkMode;
            toggleNuclearDark.checked = data.nuclearDarkMode;
            toggleAggressive.checked = data.aggressiveCleanup;
            toggleSponsored.checked = data.hideSponsored;
            toggleStories.checked = data.hideStories;
            toggleVideos.checked = data.hideVideos;
            toggleTrending.checked = data.hideTrending;
            
            updateThemePreview(data.darkMode);
            updateNuclearWarning(data.nuclearDarkMode);
        });
    }
    
    function saveSettings() {
        const settings = {
            enabled: toggleEnabled.checked,
            darkMode: toggleDarkMode.checked,
            nuclearDarkMode: toggleNuclearDark.checked,
            aggressiveCleanup: toggleAggressive.checked,
            hideSponsored: toggleSponsored.checked,
            hideStories: toggleStories.checked,
            hideVideos: toggleVideos.checked,
            hideTrending: toggleTrending.checked
        };
        
        chrome.storage.sync.set(settings);
        return settings;
    }
    
    function saveSetting(key, value) {
        const data = {};
        data[key] = value;
        chrome.storage.sync.set(data);
    }
    
    function resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            chrome.storage.sync.set(DEFAULT_SETTINGS, function() {
                loadSettings();
                showStatus('Settings reset to defaults', 'success');
                applySettingsToCurrentTab();
            });
        }
    }
    
    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Core toggles
        toggleEnabled.addEventListener('change', function() {
            saveSetting('enabled', this.checked);
            updateStatusText();
            applySettingsToCurrentTab();
        });
        
        toggleDarkMode.addEventListener('change', function() {
            saveSetting('darkMode', this.checked);
            updateThemePreview(this.checked);
            applySettingsToCurrentTab();
        });
        
        // Nuclear toggles
        toggleNuclearDark.addEventListener('change', function() {
            saveSetting('nuclearDarkMode', this.checked);
            updateNuclearWarning(this.checked);
            applySettingsToCurrentTab();
        });
        
        toggleAggressive.addEventListener('change', function() {
            saveSetting('aggressiveCleanup', this.checked);
            applySettingsToCurrentTab();
        });
        
        // Cleanup toggles
        toggleSponsored.addEventListener('change', function() {
            saveSetting('hideSponsored', this.checked);
            applySettingsToCurrentTab();
        });
        
        toggleStories.addEventListener('change', function() {
            saveSetting('hideStories', this.checked);
            applySettingsToCurrentTab();
        });
        
        toggleVideos.addEventListener('change', function() {
            saveSetting('hideVideos', this.checked);
            applySettingsToCurrentTab();
        });
        
        toggleTrending.addEventListener('change', function() {
            saveSetting('hideTrending', this.checked);
            applySettingsToCurrentTab();
        });
        
        // Theme selection
        themeDark.addEventListener('click', function() {
            toggleDarkMode.checked = true;
            saveSetting('darkMode', true);
            updateThemePreview(true);
            applySettingsToCurrentTab();
        });
        
        themeLight.addEventListener('click', function() {
            toggleDarkMode.checked = false;
            saveSetting('darkMode', false);
            updateThemePreview(false);
            applySettingsToCurrentTab();
        });
        
        // Buttons
        applyBtn.addEventListener('click', applySettingsToCurrentTab);
        
        refreshBtn.addEventListener('click', function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (isFacebookTab(tabs[0])) {
                    chrome.tabs.reload(tabs[0].id);
                    showStatus('Refreshing page...', 'warning');
                } else {
                    showStatus('Open Facebook first', 'error');
                }
            });
        });
        
        savePresetBtn.addEventListener('click', function() {
            saveSettings();
            showStatus('Settings saved', 'success');
        });
        
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // ===== TAB & MESSAGING =====
    function applySettingsToCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) return;
            
            if (isFacebookTab(tabs[0])) {
                const settings = saveSettings();
                
                // Send settings to content script
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applySettings',
                    settings: settings
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        // Content script not ready, inject it
                        injectContentScript(tabs[0].id, settings);
                    } else {
                        showStatus('Settings applied!', 'success');
                    }
                });
            } else {
                showStatus('Open Facebook to apply settings', 'error');
            }
        });
    }
    
    function injectContentScript(tabId, settings) {
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['content.js']
        }, function() {
            if (chrome.runtime.lastError) {
                showStatus('Error injecting script', 'error');
            } else {
                // Send settings after injection
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'applySettings',
                        settings: settings
                    }, function(response) {
                        showStatus('Script injected & applied!', 'success');
                    });
                }, 100);
            }
        });
    }
    
    function checkCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && isFacebookTab(tabs[0])) {
                updateStatusText();
                
                // Check if content script is responsive
                chrome.tabs.sendMessage(tabs[0].id, {action: 'getSettings'}, function(response) {
                    if (chrome.runtime.lastError) {
                        showStatus('Click "Apply" to activate', 'warning');
                    } else if (response) {
                        showStatus('Active on this page', 'success');
                    }
                });
            } else {
                showStatus('Open Facebook to use extension', 'error');
            }
        });
    }
    
    // ===== UI UPDATES =====
    function updateThemePreview(isDark) {
        if (isDark) {
            themeDark.classList.add('theme-active');
            themeLight.classList.remove('theme-active');
            themeDark.innerHTML = '🌙 Dark Mode';
            themeLight.innerHTML = 'Light Mode';
        } else {
            themeDark.classList.remove('theme-active');
            themeLight.classList.add('theme-active');
            themeDark.innerHTML = 'Dark Mode';
            themeLight.innerHTML = '☀️ Light Mode';
        }
    }
    
    function updateNuclearWarning(isNuclear) {
        const warningNote = document.querySelector('.warning-note');
        if (warningNote) {
            if (isNuclear) {
                warningNote.style.display = 'flex';
                warningNote.innerHTML = `
                    <span class="icon">⚠️</span>
                    <div>
                        <strong>Nuclear Mode Active:</strong><br>
                        Forces every element to dark colors. May affect performance and break some functionality.
                        Use with caution!
                    </div>
                `;
            } else {
                warningNote.style.display = 'none';
            }
        }
    }
    
    function updateStatusText() {
        if (!toggleEnabled.checked) {
            showStatus('Extension disabled', 'error');
        }
    }
    
    function showStatus(message, type = 'success') {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        const classes = {
            success: 'status-success',
            warning: 'status-warning',
            error: 'status-error'
        };
        
        status.innerHTML = `<span class="icon">${icons[type]}</span> ${message}`;
        status.className = `status ${classes[type]}`;
        
        // Auto-clear success messages
        if (type === 'success') {
            setTimeout(() => {
                if (status.textContent.includes(message)) {
                    checkCurrentTab();
                }
            }, 3000);
        }
    }
    
    // ===== UTILITY FUNCTIONS =====
    function isFacebookTab(tab) {
        return tab.url && (
            tab.url.includes('facebook.com') ||
            tab.url.includes('messenger.com') ||
            tab.url.includes('fb.com')
        );
    }
    
    // ===== INITIALIZE =====
    init();
});