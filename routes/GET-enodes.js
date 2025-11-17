const fs = require('fs');
const { execSync } = require('child_process');
const { getNodeData } = require("../utils/node-functions");

const getIP = require('external-ip')({
    replace: true,
    services: [
        'http://ifconfig.me/ip',
        'http://icanhazip.com/',
        'http://ident.me/',
        'https://api.ipify.org/',
        'http://checkip.dyndns.org/',
        'http://ipinfo.io/ip',
        'http://myexternalip.com/raw',
        'http://ip.42.pl/raw'
    ]
});

const enodes = (app, environement) => {
    app.get('/enodes', async (req, res) => {

        let currentAddr = await new Promise((resolve) => {
            getIP((err, ip) => {
                if (err) {
                  console.error('Erreur :', err);
                  resolve(undefined);
                } else {
                  resolve(ip);
                }
            });
        });

        let nodes = [];

        if (fs.existsSync('./nodes/node1/geth/nodekey')) {
            let node1Enode = fs.readFileSync('./nodes/node1/geth/nodekey').toString();

            try {
                const output = execSync(`./bin/bootnode -nodekeyhex ${node1Enode} -writeaddress`);
                nodes.push(`enode://${output.toString().trim()}@${currentAddr}:30311`);
            } catch (error) {
                console.error(`Erreur-GET-enodes : ${error}`);
            }
        }
        if (fs.existsSync('./nodes/node2/geth/nodekey')) {
            let node2Enode = fs.readFileSync('./nodes/node2/geth/nodekey').toString();
            try {
                const output = execSync(`./bin/bootnode -nodekeyhex ${node2Enode} -writeaddress`);
                nodes.push(`enode://${output.toString().trim()}@${currentAddr}:30310`);
            } catch (error) {
                console.error(`Erreur-GET-enodes : ${error}`);
            }
        }

        nodes.push(... getNodeData('node1').staticPeers);
        nodes.push(... getNodeData('node2').staticPeers);

        // if (app.pairNodes != undefined) {
        //     nodes.push(... app.pairNodes);
        // }

        res.send(nodes);
    });
};

module.exports = {
    enodes
};