const fs = require('fs');
const path = require('path');

const getSettingsPath = () => {
    return path.join(process.cwd(), 'nodes', 'settings.json');
};

const getDefaultSettings = () => {
    return {
        verbosity: 3,
        ports: {
            http: {
                enabled: true,
                port: 8545
            },
            ws: {
                enabled: true,
                port: 8546
            },
            authrpc: {
                enabled: true,
                port: 8551
            },
            p2p: {
                port: 30311
            }
        },
        apis: {
            http: ['eth', 'miner', 'net', 'txpool', 'web3', 'debug'],
            ws: ['eth', 'net', 'web3']
        },
        mining: {
            gasprice: '100000000',
            txfeecap: '100000',
            pricelimit: '100'
        },
        network: {
            syncmode: 'full',
            networkid: 614
        }
    };
};

const getSettings = (app, environement) => {
    app.get('/settings', async (req, res) => {
        try {
            const settingsPath = getSettingsPath();
            
            let settings = getDefaultSettings();
            
            // Load settings from file if exists
            if (fs.existsSync(settingsPath)) {
                const fileSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                settings = { ...settings, ...fileSettings };
            }
            
            res.send({ success: true, settings });
        } catch (error) {
            console.error('Error loading settings:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    getSettings,
    getDefaultSettings,
    getSettingsPath
};

