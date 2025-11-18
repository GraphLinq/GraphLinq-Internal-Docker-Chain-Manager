const fs = require('fs');

const checkPasswordExists = (app, environement) => {
    app.get('/check-password-exists', async (req, res) => {
        const exists = fs.existsSync('./.password');
        res.json({ exists });
    });
};

module.exports = {
    checkPasswordExists
};

