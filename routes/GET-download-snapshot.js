const fs = require('fs');
const path = require('path');

const downloadSnapshot = (app, environement) => {
    app.get('/download-snapshot', async (req, res) => {
        try {
            const { nodeName, filename } = req.query;

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

            // Set headers for download
            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Stream the file
            const fileStream = fs.createReadStream(snapshotPath);
            fileStream.pipe(res);

            fileStream.on('error', (error) => {
                console.error('Error streaming file:', error);
                if (!res.headersSent) {
                    res.status(500).send({ error: 'Error downloading snapshot' });
                }
            });

        } catch (error) {
            console.error('Error downloading snapshot:', error);
            if (!res.headersSent) {
                res.status(500).send({ error: error.message });
            }
        }
    });
};

module.exports = {
    downloadSnapshot
};

