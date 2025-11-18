const express = require('express');
const corsUtils = require('./utils/cors.js');
const environementLoader = require('./environements/environement.js');
const fs = require('fs');
const path = require('path');
const { parsePairNodes } = require('./utils/pairnodes.js');
const { getPasswordPath } = require('./utils/password-path.js');

const environement = environementLoader.load();

////////////////////////////////////////////
// CORS + JSON
////////////////////////////////////////////

const app = express();
app.use(express.json()) //Notice express.json middleware
corsUtils.setCors(app);
app.use(function (req, res, next) {
  if (req.path == '/favicon.png') {
    let templates = path.join(process.cwd(), 'html');
    res.sendFile('favicon.png', {root: templates});
    return ;
  }
  if (req.path == '/logo.png') {
    let templates = path.join(process.cwd(), 'html');
    res.sendFile('logo.png', {root: templates});
    return ;
  }

  environement.password = "";

  if (fs.existsSync(getPasswordPath())) {
    environement.password = fs.readFileSync(getPasswordPath()).toString();
  }

  // Routes that don't require authentication
  const publicRoutes = ['/enodes', '/login', '/status', '/check-password-exists'];
  const publicPostRoutes = ['/login'];
  
  const isPublicRoute = publicRoutes.includes(req.path) || 
                        (req.method === 'POST' && publicPostRoutes.includes(req.path));
  
  if (!isPublicRoute) { // access
    // Check if password file exists
    if (!fs.existsSync(getPasswordPath())) {
      // No password set - redirect to login page
      if (req.method === 'GET' && req.path === '/status') {
        res.redirect('/login');
      } else {
        res.status(401).json({ error: 'Authentication required' });
      }
      return;
    }
    
    // Verify access code
    const storedPassword = fs.readFileSync(getPasswordPath()).toString();
    const providedPassword = req.headers['access-code'] || req.query['access-code'];
    
    if (providedPassword !== storedPassword) {
      res.sendStatus(502); // simulate server is offline (Bad Gateway code).
      return ;
    }
    // end access
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,access-code');

  next();
});

////////////////////////////////////////////
// ROUTES
////////////////////////////////////////////

const main = async () => {
  const fs = require('fs');

  ////////////////////////////////////////////
  // ROUTES
  ////////////////////////////////////////////

  let routes = [... fs.readdirSync('./routes')]
    .filter(x => !['example.js'].includes(x)  && x.endsWith('.js'))
    .map(x => [x, require(`./routes/${x}`)])
    .map(x => ({ name: x[0].replace('.js', ''), use: Object.values(x[1])[0], type: 'normal' }));

  [... routes].forEach(routeUseFunction => {
    routeUseFunction.use(app, environement);

    let method = routeUseFunction.name.split('-', 1)[0];
    let path = routeUseFunction.name.replace(`${method}-`, '');
    console.log(`[GraphLinq Node - API] - ${method} - ${path}`);
  });
};

////////////////////////////////////////////
// SERVER
////////////////////////////////////////////

const PORT = process.env.PORT || environement?.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[GraphLinq Node - API] - Start Server Port ${PORT}`);
  main();
});
