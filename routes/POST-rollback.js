const { exec } = require('child_process');
const util = require("util");
const execPromise = util.promisify(exec);

const rollback = (app, environement) => {
    app.post('/rollback', async (req, res) => {
        const { nodeName } = req.body;
        
        if (!nodeName) {
            return res.status(400).json({ 
                success: false, 
                error: 'nodeName is required' 
            });
        }

        // Validate node name
        if (nodeName !== 'node1' && nodeName !== 'node2') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid node name. Must be node1 or node2' 
            });
        }

        try {
            // Execute geth rollback command
            const { stdout, stderr } = await execPromise(`./bin/geth rollback --datadir=nodes/${nodeName}`);
            
            console.log(`Rollback executed for ${nodeName}`);
            console.log('stdout:', stdout);
            if (stderr) {
                console.log('stderr:', stderr);
            }

            console.log("rollback executed successfully");
            res.json({ 
                success: true, 
                message: `Rollback executed successfully for ${nodeName}`,
                output: stdout || stderr
            });
        } catch (error) {
            console.error(`Error executing rollback for ${nodeName}:`, error);
            res.status(500).json({ 
                success: false, 
                error: error.message,
                output: error.stdout || error.stderr
            });
        }
    });
};

module.exports = {
    rollback
};

