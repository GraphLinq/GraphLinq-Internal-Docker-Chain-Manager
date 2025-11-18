const fs = require('fs');
const path = require('path');

const login = (app, environement) => {
    app.get('/login', async (req, res) => {
        let templates = path.join(process.cwd(), 'html');
        res.sendFile('login.html', {root: templates});
    });
};

module.exports = {
    login
};

