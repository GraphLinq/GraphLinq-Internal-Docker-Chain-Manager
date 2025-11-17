const fs = require('fs');
const path = require('path');

const removeSnapshot = (app, environement) => {
    app.post('/remove-snapshot', async (req, res) => {
        try {
            const { nodeName, filename } = req.body;

            if (!nodeName || !filename) {
                return res.status(400).send({ error: 'nodeName and filename are required' });
            }

            // Security: Prevent path traversal attacks
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).send({ error: 'Invalid filename' });
            }

            const snapshotPath = path.join(__dirname, '..', 'nodes', nodeName, 'snapshots', filename);

            // Check if file exists
            if (!fs.existsSync(snapshotPath)) {
                return res.status(404).send({ error: 'Snapshot not found' });
            }

            // Delete the file
            fs.unlinkSync(snapshotPath);

            console.log(`Snapshot deleted: ${filename}`);

            res.send({ 
                success: true, 
                message: 'Snapshot deleted successfully'
            });
        } catch (error) {
            console.error('Error removing snapshot:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    removeSnapshot
};

