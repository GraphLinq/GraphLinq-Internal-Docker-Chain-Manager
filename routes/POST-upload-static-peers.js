const fs = require('fs');
const path = require('path');

const uploadStaticPeers = (app, environement) => {
    app.post('/upload-static-peers', async (req, res) => {
        try {
            const { nodeName, staticPeers } = req.body;

            if (!nodeName || !staticPeers) {
                return res.status(400).send({ error: 'nodeName and staticPeers are required' });
            }

            // Validate that staticPeers is an array
            if (!Array.isArray(staticPeers)) {
                return res.status(400).send({ error: 'staticPeers must be an array' });
            }

            const staticNodesPath = path.join(process.cwd(), `nodes/${nodeName}/static-nodes.json`);
            
            // Write the file
            fs.writeFileSync(staticNodesPath, JSON.stringify(staticPeers, null, 2));

            // Apply to running node if active
            if (nodeName === 'node1' && app.node1 && app.node1.status === '1') {
                for (let peerEnode of staticPeers) {
                    await app.node1.ipcExec(`admin.addPeer(\\"${peerEnode.trim()}\\")`, false);
                }
            }

            res.send({ success: true, staticPeers });
        } catch (error) {
            console.error('Error uploading static peers:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    uploadStaticPeers
};

