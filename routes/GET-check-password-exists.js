const fs = require('fs');
const { getPasswordPath } = require('../utils/password-path.js');

const checkPasswordExists = (app, environement) => {
    app.get('/check-password-exists', async (req, res) => {
        const exists = fs.existsSync(getPasswordPath());
        res.json({ exists });
    });
};

module.exports = {
    checkPasswordExists
};

