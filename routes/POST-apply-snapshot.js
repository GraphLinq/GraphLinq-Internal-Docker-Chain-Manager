const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const applySnapshot = (app, environement) => {
    app.post('/apply-snapshot', async (req, res) => {
        try {
            const { nodeName, filename } = req.body;

            if (!nodeName || !filename) {
                return res.status(400).send({ error: 'nodeName and filename are required' });
            }

            // Security: Prevent path traversal attacks
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).send({ error: 'Invalid filename' });
            }

            const nodeDir = path.join(__dirname, '..', 'nodes', nodeName);
            const gethDir = path.join(nodeDir, 'geth');
            const snapshotPath = path.join(nodeDir, 'snapshots', filename);
            const nodekeyPath = path.join(gethDir, 'nodekey');
            const jwtsecretPath = path.join(gethDir, 'jwtsecret');

            // Check if node exists
            if (!fs.existsSync(nodeDir)) {
                return res.status(400).send({ error: 'Node directory not found' });
            }

            // Check if snapshot exists
            if (!fs.existsSync(snapshotPath)) {
                return res.status(404).send({ error: 'Snapshot not found' });
            }

            // Save existing nodekey and jwtsecret if they exist
            let savedNodekey = null;
            let savedJwtsecret = null;

            if (fs.existsSync(nodekeyPath)) {
                savedNodekey = fs.readFileSync(nodekeyPath);
                console.log('Saved existing nodekey');
            }

            if (fs.existsSync(jwtsecretPath)) {
                savedJwtsecret = fs.readFileSync(jwtsecretPath);
                console.log('Saved existing jwtsecret');
            }

            // Stop the node if it's running
            let wasRunning = false;
            if (nodeName === 'node1' && app.node1 && app.node1.status === '1') {
                console.log('Stopping node1 before applying snapshot...');
                await app.node1.kill();
                wasRunning = true;
            } else if (nodeName === 'node2' && app.node2 && app.node2.status === '1') {
                console.log('Stopping node2 before applying snapshot...');
                await app.node2.kill();
                wasRunning = true;
            }

            // Wait a bit to ensure node is fully stopped
            if (wasRunning) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // delete old geth directory if it exists
            if (fs.existsSync(gethDir)) {
                fs.rmSync(gethDir, { recursive: true });
            }

            // Extract the snapshot
            console.log(`Extracting snapshot ${filename} to: ${nodeDir}`);
            const extractCommand = `cd "${nodeDir}" && tar -xzf "${snapshotPath}"`;
            await execPromise(extractCommand);

            // Restore nodekey and jwtsecret if they were saved
            if (savedNodekey) {
                fs.writeFileSync(nodekeyPath, savedNodekey);
                console.log('Restored nodekey');
            }

            if (savedJwtsecret) {
                fs.writeFileSync(jwtsecretPath, savedJwtsecret);
                console.log('Restored jwtsecret');
            }

            console.log(`Snapshot ${filename} applied successfully`);

            res.send({ 
                success: true, 
                message: 'Snapshot applied successfully',
                wasRunning: wasRunning
            });

        } catch (error) {
            console.error('Error applying snapshot:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    applySnapshot
};

