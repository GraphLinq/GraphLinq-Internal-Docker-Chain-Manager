const fs = require('fs');
const path = require('path');

const moveSnapshot = (app, environement) => {
    app.post('/move-snapshot', async (req, res) => {
        try {
            const { sourceNode, targetNode, filename } = req.body;

            if (!sourceNode || !targetNode || !filename) {
                return res.status(400).send({ error: 'sourceNode, targetNode and filename are required' });
            }

            // Security: Prevent path traversal attacks
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).send({ error: 'Invalid filename' });
            }

            // Validate node names
            const validNodes = ['node1'];
            if (!validNodes.includes(sourceNode) || !validNodes.includes(targetNode)) {
                return res.status(400).send({ error: 'Invalid node name' });
            }

            if (sourceNode === targetNode) {
                return res.status(400).send({ error: 'Source and target nodes must be different' });
            }

            const sourcePath = path.join(__dirname, '..', 'nodes', sourceNode, 'snapshots', filename);
            const targetDir = path.join(__dirname, '..', 'nodes', targetNode, 'snapshots');
            const targetPath = path.join(targetDir, filename);

            // Check if source file exists
            if (!fs.existsSync(sourcePath)) {
                return res.status(404).send({ error: 'Source snapshot not found' });
            }

            // Create target snapshots directory if it doesn't exist
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Check if target file already exists
            if (fs.existsSync(targetPath)) {
                return res.status(400).send({ error: 'A snapshot with the same name already exists in the target node' });
            }

            // Move the file
            fs.renameSync(sourcePath, targetPath);

            console.log(`Snapshot moved from ${sourceNode} to ${targetNode}: ${filename}`);

            res.send({ 
                success: true, 
                message: `Snapshot moved successfully from ${sourceNode} to ${targetNode}`
            });
        } catch (error) {
            console.error('Error moving snapshot:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    moveSnapshot
};

