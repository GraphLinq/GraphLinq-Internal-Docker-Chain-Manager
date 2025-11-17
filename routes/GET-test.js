const { getNodeData } = require("../utils/node-functions");

const test = (app, environement) => {
    app.get('/test', async (req, res) => {

        if (app.node1) {
            await app.node1.checkIsAlive();
        }

        if (app.node2) {
            await app.node2.checkIsAlive();
        }

        if (app.ethStats) {
            await app.ethStats.checkIsAlive();
        }
        
        let data = {
            node1: {
                status: app.node1?.status ? app.node1?.status : '0',
                mining: app.node1?.mining ? app.node1?.mining : '0',
                logs: app.node1?.logs ? app.node1?.logs : [],
                ipcLogs: app.node1?.ipcLogs ? app.node1?.ipcLogs : [],
                ... getNodeData('node1'),

            },
            node2: {
                status: app.node2?.status ? app.node2?.status : '0',
                mining: '0',
                logs: app.node2?.logs ? app.node2?.logs : [],
                ipcLogs: app.node2?.ipcLogs ? app.node2?.ipcLogs : [],
                ... getNodeData('node2'),
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