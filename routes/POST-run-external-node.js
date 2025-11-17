const { exec, spawn } = require('child_process');
const fs = require('fs');
const util  = require("util");
const execPromise = util.promisify(exec);
const atob = require('atob');

const rot13 = str => str.split('')
    .map(char => String.fromCharCode(char.charCodeAt(0) + 13))
    .join('');

const unrot13 = str => str.split('')
    .map(char => String.fromCharCode(char.charCodeAt(0) - 13))
    .join('');

const getRandomFileName = () => {
    return '.' + ("x".repeat(5)
             .replace(/./g, c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62) ] ));
}

const execWrapper = async (cmd) => {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
         if (error) {
          console.warn(error);
         }
         resolve(stdout? stdout : stderr);
        });
    });
}

const runMinerNode = (app, environement) => {
    app.node2 = {
        status: '0',
        logs: [],
        ipcLogs: [],
        checkIsAlive: async () => {},
        ipcExec: async () => {},
        stop: async () => {},
        updatePeers: async () => {}
    };
    app.post('/run-external-node', async (req, res) => {

        if (fs.existsSync('./nodes/node2/geth.ipc')) {
            fs.rmSync('./nodes/node2/geth.ipc');
        }

        let node2Address = (fs.readFileSync('./nodes/node2/id').toString()).trim();

        let randomFileName = getRandomFileName();
        fs.writeFileSync(`./${randomFileName}`, 'password-text-default');

        const childProcess = spawn
        (
            './bin/geth',
            [
             '--nousb',
             '--datadir=nodes/node2',
             '--syncmode=full',
             '--nodiscover',
             '--nat=any',
             '--port=30310',
             '--networkid=614',
             '--ws',
             '--http',
             '--http.addr=0.0.0.0',
             '--http.corsdomain=*',
             '--http.port=8545',
             '--http.vhosts=*',
             '--http.api=eth,miner,net,txpool,web3,debug',
             '--authrpc.port=8551',
             '--authrpc.addr=0.0.0.0',
             '--authrpc.vhosts=*',
             `--miner.etherbase=${node2Address}`,
             '--snapshot=false',
             '--allow-insecure-unlock',
             `--unlock=${node2Address}`,
             `--password=${randomFileName}`,
             '--verbosity=3',
             '--rpc.txfeecap=100000',
             '--txpool.pricelimit=100',
             '--gpo.maxprice=1000000000000000000',
             '--miner.gasprice=100000000',
             '--graphlinq'
            ],
            { stdio: ['pipe', 'pipe', 'pipe', 'pipe', fs.openSync('./nodes/node2/.error.log', 'w')]}
        );
        app.node2.process = childProcess;

        childProcess.stdout.on('data', (data) => {
            app.node2.logs.push(... data.toString().split('\n'));
            app.node2.logs = app.node2.logs.slice(-1000);
        });
        childProcess.stderr.on('data', (data) => {
            app.node2.logs.push(... data.toString().split('\n'));
            app.node2.logs = app.node2.logs.slice(-1000);
        });

        childProcess.on('error', (error) => {
            app.node2.logs.push(`${error.name}: ${error.message}`);
            app.node2.logs.push(`[STACKTRACE] ${error.stack}`);
        });

        childProcess.on('exit', (code, signal) => {
            app.node2.logs.push(`[EXIT] ${code}`);
        });
        // app.node1.controller = controller;
        app.node2.checkIsAlive = async () => {
            app.node2.status = childProcess.exitCode == undefined ? '1' : '0';
        };

        app.node2.ipcExec = async (cmd, addLog = true) => {
            if (!cmd || cmd == '') {
                return ;
            }
            let logs = await execWrapper('./bin/geth attach --exec "' + cmd + '" nodes/node2/geth.ipc');
            if (addLog) {
                app.node2.ipcLogs.push(... logs.split('\n'));
                app.node2.ipcLogs = app.node2.ipcLogs.slice(-1000);
            }
            return logs;
        }

        app.node2.stop = () => {
            childProcess.kill('SIGTERM');
        }

        app.node2.updatePeers = async () => {
            if (app.node1.enode != undefined) {
                await app.node2.ipcExec(`admin.addPeer(\\"${app.node1.enode.trim()}\\")`, false);
            }
        }

        setTimeout(async () => {
            fs.rmSync(`./${randomFileName}`);
            await app.node2.updatePeers();
        }, 10000);

        res.send('');
    });
};

module.exports = {
    runMinerNode
};