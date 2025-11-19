const fs = require('fs');
const path = require('path');
const { getSettingsPath, getDefaultSettings } = require('./GET-settings.js');

const saveSettings = (app, environement) => {
    app.post('/save-settings', async (req, res) => {
        try {
            const { settings } = req.body;
            
            if (!settings) {
                return res.status(400).send({ error: 'settings are required' });
            }
            
            const settingsPath = getSettingsPath();
            const nodesDir = path.join(process.cwd(), 'nodes');
            
            // Create nodes directory if it doesn't exist
            if (!fs.existsSync(nodesDir)) {
                fs.mkdirSync(nodesDir, { recursive: true });
            }
            
            // Merge with defaults to ensure all fields exist
            const defaultSettings = getDefaultSettings();
            const mergedSettings = {
                ...defaultSettings,
                ...settings,
                ports: { ...defaultSettings.ports, ...settings.ports },
                apis: { ...defaultSettings.apis, ...settings.apis },
                mining: { ...defaultSettings.mining, ...settings.mining },
                network: { ...defaultSettings.network, ...settings.network }
            };
            
            // Save settings to file
            fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
            
            console.log('Settings saved successfully');
            
            res.send({ 
                success: true, 
                message: 'Settings saved successfully',
                settings: mergedSettings
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    saveSettings
};

