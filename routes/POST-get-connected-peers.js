const getConnectedPeers = (app, environement) => {
    app.post('/get-connected-peers', async (req, res) => {
        try {
            const { nodeName } = req.body;

            if (!nodeName) {
                return res.status(400).send({ error: 'nodeName is required' });
            }

            let peers = [];
            
            if (nodeName === 'node1' && app.node1 && app.node1.status === '1') {
                const peersData = await app.node1.ipcExec('admin.peers', false);
                try {
                    peers = eval(peersData).map(peer => peer.enode);
                    console.log('peers:', peers, 'peersData:', peersData);
                } catch (e) {
                    console.error('Error parsing peers data:', e, peersData);
                }
            }

            res.send({ success: true, peers });
        } catch (error) {
            console.error('Error getting connected peers:', error);
            res.status(500).send({ error: error.message });
        }
    });
};

module.exports = {
    getConnectedPeers
};

