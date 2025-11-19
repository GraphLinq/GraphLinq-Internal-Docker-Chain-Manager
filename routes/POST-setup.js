const fs = require('fs');
const ethers = require('ethers');
const atob = require('atob');

const setup = (app, environement) => {
    app.post('/setup', async (req, res) => {
        try {
            let keyStoreNode1 = req.body['keyStoreNode1'];

            if (!fs.existsSync('./nodes')) {
                fs.mkdirSync('./nodes');
            }
            if (!fs.existsSync('./nodes/node1')) {
                fs.mkdirSync('./nodes/node1');
            }
            if (!fs.existsSync('./nodes/node1/keystore')) {
                fs.mkdirSync('./nodes/node1/keystore');
            }

            let jsonKeyStoreNode1 = JSON.parse(keyStoreNode1);

            fs.writeFileSync(`./nodes/node1/id`, jsonKeyStoreNode1.address);

            fs.writeFileSync(`./nodes/node1/keystore/UTC--${(new Date()).toISOString()}--${jsonKeyStoreNode1.address}`, keyStoreNode1);

            res.send({
                status: 'ready'
            });
        } catch (e) {
            res.send({
                status: 'ko'
            });
            console.log(e);
        }
    });
};

module.exports = {
    setup
};