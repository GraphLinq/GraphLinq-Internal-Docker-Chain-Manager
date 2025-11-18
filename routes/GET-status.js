const fs = require('fs');

const getHtmlContent = () => {
    let content = (fs.readFileSync('./html/status.html')).toString();
    return content;
}

const keyth = require('keythereum');

const status = (app, environement) => {
    app.get('/status', async (req, res) => {
        // Check if password exists
        if (!fs.existsSync('./.password')) {
            // First time - redirect to login
            return res.redirect('/login');
        }

        // Check if user is authenticated via header
        const accessCode = req.headers['access-code'] || req.query['access-code'];
        const storedPassword = fs.readFileSync('./.password').toString();
        
        // If no access code provided, serve the HTML (it will check sessionStorage)
        // If access code is provided but wrong, return error
        if (accessCode && accessCode !== storedPassword) {
            return res.status(401).send('<script>sessionStorage.removeItem("access-code"); window.location.href="/login";</script>');
        }

        let htmlContent = getHtmlContent();

        htmlContent = htmlContent.replace(/\$status/, 'ONLINE');

        let setup = fs.existsSync('./nodes/node1');
        htmlContent = htmlContent.replace(/\$setup/, setup ? 'true' : 'false');

        if (setup) {
            let node1Address = fs.readFileSync('./nodes/node1/id').toString();
            htmlContent = htmlContent.replace(/\$node1Address/, node1Address);
            let node2Address = fs.readFileSync('./nodes/node2/id').toString();
            htmlContent = htmlContent.replace(/\$node2Address/, node2Address);
        }

        res.send(htmlContent);
    });
};

module.exports = {
    status
};