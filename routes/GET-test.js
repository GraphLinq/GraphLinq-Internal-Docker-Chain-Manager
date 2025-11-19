const { getNodeData } = require("../utils/node-functions");

const test = (app, environement) => {
    app.get('/test', async (req, res) => {

        if (app.node1) {
            await app.node1.checkIsAlive();
        }

        if (app.ethStats) {
            await app.ethStats.checkIsAlive();
        }
        
        // Get additional node info
        let peersCount = 0;
        let gasPrice = null;
        
        if (app.node1 && app.node1.status === '1') {
            try {
                // Get peers count
                const peersData = await app.node1.ipcExec('admin.peers.length', false);
                peersCount = parseInt(peersData.trim()) || 0;
                
                // Get gas price
                const gasPriceData = await app.node1.ipcExec('eth.gasPrice', false);
                gasPrice = gasPriceData.trim();
            } catch (e) {
                console.error('Error getting node info:', e);
            }
        }
        
        let data = {
            node1: {
                status: app.node1?.status ? app.node1?.status : '0',
                mining: app.node1?.mining ? app.node1?.mining : '0',
                logs: app.node1?.logs ? app.node1?.logs : [],
                ipcLogs: app.node1?.ipcLogs ? app.node1?.ipcLogs : [],
                peersCount: peersCount,
                gasPrice: gasPrice,
                ... getNodeData('node1'),

            },
            ethStats: {
                status: app.ethStats?.status ? app.ethStats?.status : '0',
                logs: app.ethStats?.logs ? app.ethStats?.logs : [],
                nodeName: app.ethStats?.nodeName ? app.ethStats?.nodeName : '',
                serverUrl: app.ethStats?.serverUrl ? app.ethStats?.serverUrl : '',
            }
        };
        res.send(data);
    });
};

module.exports = {
    test
};