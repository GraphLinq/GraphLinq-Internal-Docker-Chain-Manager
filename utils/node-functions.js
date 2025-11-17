const fs = require('fs');

const getNodeMetadata = (nodeName) => {
    try {
        return JSON.parse(fs.readFileSync(`./nodes/${nodeName}/metadata.json`));
    } catch (e) {
        return undefined;
    }
}

const getNodeStaticPeers = (nodeName) => {
    try {
        return JSON.parse(fs.readFileSync(`./nodes/${nodeName}/static-nodes.json`));
    } catch (e) {
        return undefined;
    }
}

const getNodeTrustedPeers = (nodeName) => {
    try {
        return JSON.parse(fs.readFileSync(`./nodes/${nodeName}/trusted-nodes.json`));
    } catch (e) {
        return undefined;
    }
}


module.exports = {
    getNodeData: (nodeName) => {
        let metadata = getNodeMetadata(nodeName);
        if (metadata == undefined) {
            metadata = {
                "blockHash": "",
                "blockNumber": 0,
                "difficulty": "2",
                "gasLimit": 30000000,
                "gasUsed": 0,
                "miner": "0x0000000000000000000000000000000000000000",
                "parentHash": "",
                "timestamp": 0,
                "txCount": 0
            }
        }

        let staticPeers = getNodeStaticPeers(nodeName);
        if (staticPeers == undefined) {
            staticPeers = [];
        }

        let trustedPeers = getNodeTrustedPeers(nodeName);
        if (trustedPeers == undefined) {
            trustedPeers = [];
        }

        return {
            metadata: metadata,
            staticPeers: staticPeers,
            trustedPeers: trustedPeers,
            currentBlock: metadata.blockNumber
        }
    },
    saveNodeTrustedPeers: (nodeName, trustedPeers) => {
        const trustedNodesPath = `./nodes/${nodeName}/trusted-nodes.json`;
        fs.writeFileSync(trustedNodesPath, JSON.stringify(trustedPeers, null, 2));
    }
}