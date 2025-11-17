const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const multer = require('multer');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'temp_uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `snapshot_${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 * 1024 } // 50GB max
}).single('snapshot');

const uploadSnapshot = (app, environement) => {
    app.post('/upload-snapshot', (req, res) => {
        upload(req, res, async function (err) {
            if (err) {
                console.error('Upload error:', err);
                return res.status(500).send({ error: 'Error uploading file: ' + err.message });
            }

            try {
                const { nodeName } = req.body;
                const uploadedFile = req.file;

                if (!nodeName || !uploadedFile) {
                    if (uploadedFile) fs.unlinkSync(uploadedFile.path);
                    return res.status(400).send({ error: 'nodeName and snapshot file are required' });
                }

                const nodeDir = path.join(__dirname, '..', 'nodes', nodeName);
                const snapshotsDir = path.join(nodeDir, 'snapshots');

                // Check if node exists
                if (!fs.existsSync(nodeDir)) {
                    fs.unlinkSync(uploadedFile.path);
                    return res.status(400).send({ error: 'Node directory not found' });
                }

                // Create snapshots directory if it doesn't exist
                if (!fs.existsSync(snapshotsDir)) {
                    fs.mkdirSync(snapshotsDir, { recursive: true });
                }

                // Move uploaded file to snapshots directory
                const finalPath = path.join(snapshotsDir, uploadedFile.originalname);
                fs.renameSync(uploadedFile.path, finalPath);
                
                console.log(`Snapshot uploaded: ${uploadedFile.originalname}`);

                res.send({ 
                    success: true, 
                    message: 'Snapshot uploaded successfully',
                    filename: uploadedFile.originalname
                });

            } catch (error) {
                console.error('Error uploading snapshot:', error);
                // Clean up uploaded file on error
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(500).send({ error: error.message });
            }
        });
    });
};

module.exports = {
    uploadSnapshot
};

