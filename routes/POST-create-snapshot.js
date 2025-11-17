const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { getNodeData } = require('../utils/node-functions');

const createSnapshot = (app, environement) => {
    app.post('/create-snapshot', async (req, res) => {
        try {
            const { nodeName } = req.body;

            if (!nodeName) {
                return res.status(400).send({ error: 'nodeName is required' });
            }

            // Check if node is running to get block height
            let metadata = getNodeData(nodeName).metadata;

            if (metadata.blockNumber == 0) {
                return res.status(400).send({ error: 'no block number found' });
            }

            // Create timestamp for filename: 2025-11-15_01-34-29
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/T/, '_')
                .replace(/:/g, '-')
                .substring(0, 19);

            // Create filename: snapshot_<height>_2025-11-15_01-34-29.tar.gz
            const filename = `snapshot_${metadata.blockNumber}_${timestamp}.tar.gz`;

            const nodeDir = path.join(__dirname, '..', 'nodes', nodeName);
            const snapshotsDir = path.join(nodeDir, 'snapshots');
            const gethDir = path.join(nodeDir, 'geth');
            const snapshotPath = path.join(snapshotsDir, filename);

            // Create snapshots directory if it doesn't exist
            if (!fs.existsSync(snapshotsDir)) {
                fs.mkdirSync(snapshotsDir, { recursive: true });
            }

            // Check if geth directory exists
            if (!fs.existsSync(gethDir)) {
                return res.status(400).send({ error: 'Node data directory not found' });
            }

            // Create tar.gz archive of geth directory
            // Exclude private files: nodekey and jwtsecret
            // Using tar -czf to create compressed archive
            let filesToInclude = ['geth', 'metadata.json', 'static-nodes.json', 'trusted-nodes.json'];
            let finalFilesToInclude = [];
            for (const file of filesToInclude) {
                if (fs.existsSync(path.join(nodeDir, file))) {
                    finalFilesToInclude.push(file);
                }
            }

            const tarCommand = `cd "${nodeDir}" && tar -czf "${snapshotPath}" --exclude='geth/nodekey' --exclude='geth/jwtsecret' ${finalFilesToInclude.join(" ")}`;
            
            console.log(`Creating snapshot: ${filename}`);
            await execPromise(tarCommand);
            console.log(`Snapshot created successfully: ${filename}`);

            res.send({ 
                success: true, 
                filename,
                message: 'Snapshot created successfully'
            });
        } catch (error) {
            console.error('Error creating snapshot:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    createSnapshot
};

