const fs = require('fs');
const path = require('path');

const listSnapshots = (app, environement) => {
    app.post('/list-snapshots', async (req, res) => {
        try {
            const { nodeName } = req.body;

            if (!nodeName) {
                return res.status(400).send({ error: 'nodeName is required' });
            }

            const snapshotsDir = path.join(__dirname, '..', 'nodes', nodeName, 'snapshots');

            // Create snapshots directory if it doesn't exist
            if (!fs.existsSync(snapshotsDir)) {
                fs.mkdirSync(snapshotsDir, { recursive: true });
            }

            // Read all files in the snapshots directory
            const files = fs.readdirSync(snapshotsDir);
            const snapshots = [];

            for (const file of files) {
                if (file.endsWith('.tar.gz')) {
                    const filePath = path.join(snapshotsDir, file);
                    const stats = fs.statSync(filePath);
                    
                    snapshots.push({
                        filename: file,
                        size: stats.size,
                        date: stats.mtime.toISOString().replace('T', ' ').substring(0, 19)
                    });
                }
            }

            // Sort by date (newest first)
            snapshots.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.send({ success: true, snapshots });
        } catch (error) {
            console.error('Error listing snapshots:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    listSnapshots
};

