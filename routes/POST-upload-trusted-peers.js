const fs = require('fs');
const path = require('path');

const uploadTrustedPeers = (app, environement) => {
    app.post('/upload-trusted-peers', async (req, res) => {
        try {
            const { nodeName, trustedPeers } = req.body;

            if (!nodeName || !trustedPeers) {
                return res.status(400).send({ error: 'nodeName and trustedPeers are required' });
            }

            // Validate that trustedPeers is an array
            if (!Array.isArray(trustedPeers)) {
                return res.status(400).send({ error: 'trustedPeers must be an array' });
            }

            const trustedNodesPath = path.join(process.cwd(), `nodes/${nodeName}/trusted-nodes.json`);
            
            // Write the file
            fs.writeFileSync(trustedNodesPath, JSON.stringify(trustedPeers, null, 2));

            // Apply to running node if active
            if (nodeName === 'node1' && app.node1 && app.node1.status === '1') {
                for (let peerEnode of trustedPeers) {
                    await app.node1.ipcExec(`admin.addTrustedPeer(\\"${peerEnode.trim()}\\")`, false);
                }
            } else if (nodeName === 'node2' && app.node2 && app.node2.status === '1') {
                for (let peerEnode of trustedPeers) {
                    await app.node2.ipcExec(`admin.addTrustedPeer(\\"${peerEnode.trim()}\\")`, false);
                }
            }

            res.send({ success: true, trustedPeers });
        } catch (error) {
            console.error('Error uploading trusted peers:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    uploadTrustedPeers
};

