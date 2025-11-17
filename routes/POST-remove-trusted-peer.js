const fs = require('fs');
const path = require('path');

const removeTrustedPeer = (app, environement) => {
    app.post('/remove-trusted-peer', async (req, res) => {
        try {
            const { nodeName, peerEnode } = req.body;

            if (!nodeName || !peerEnode) {
                return res.status(400).send({ error: 'nodeName and peerEnode are required' });
            }

            const trustedNodesPath = path.join(process.cwd(), `nodes/${nodeName}/trusted-nodes.json`);
            
            let trustedNodes = [];
            if (fs.existsSync(trustedNodesPath)) {
                trustedNodes = JSON.parse(fs.readFileSync(trustedNodesPath, 'utf8'));
            }

            // Remove peer from array
            trustedNodes = trustedNodes.filter(node => node !== peerEnode);
            fs.writeFileSync(trustedNodesPath, JSON.stringify(trustedNodes, null, 2));

            // Remove peer via IPC if node is running
            if (nodeName === 'node1' && app.node1 && app.node1.status === '1') {
                await app.node1.ipcExec(`admin.removeTrustedPeer(\\"${peerEnode.trim()}\\")`, false);
            } else if (nodeName === 'node2' && app.node2 && app.node2.status === '1') {
                await app.node2.ipcExec(`admin.removeTrustedPeer(\\"${peerEnode.trim()}\\")`, false);
            }

            res.send({ success: true, trustedNodes });
        } catch (error) {
            console.error('Error removing trusted peer:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    removeTrustedPeer
};

