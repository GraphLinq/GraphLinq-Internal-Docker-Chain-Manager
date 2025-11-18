const fs = require('fs');

const home = (app, environement) => {
    app.get('/', async (req, res) => {
        // Redirect to status (which will redirect to login if needed)
        res.redirect('/status');
    });
};

module.exports = {
    home
};

