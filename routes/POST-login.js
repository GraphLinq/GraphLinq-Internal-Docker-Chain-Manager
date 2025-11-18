const fs = require('fs');

// Anti-flood storage (in-memory, per IP)
const loginAttempts = new Map();
const LOCKOUT_DURATION = 300; // 5 minutes in seconds
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 300000; // 5 minutes in milliseconds

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of loginAttempts.entries()) {
        if (data.lockedUntil && data.lockedUntil < now) {
            loginAttempts.delete(ip);
        } else if (data.lastAttempt && (now - data.lastAttempt) > ATTEMPT_WINDOW) {
            loginAttempts.delete(ip);
        }
    }
}, 60000); // Clean every minute

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
}

const login = (app, environement) => {
    app.post('/login', async (req, res) => {
        const { password, isFirstTime } = req.body;
        const clientIp = getClientIp(req);
        const now = Date.now();
        
        // Check if IP is locked out
        const attemptData = loginAttempts.get(clientIp);
        if (attemptData && attemptData.lockedUntil && attemptData.lockedUntil > now) {
            const remainingTime = Math.ceil((attemptData.lockedUntil - now) / 1000);
            return res.json({
                success: false,
                locked: true,
                lockoutTime: remainingTime,
                error: `Too many failed attempts. Try again in ${remainingTime} seconds.`
            });
        }
        
        if (!password) {
            return res.json({
                success: false,
                error: 'Password is required'
            });
        }
        
        const passwordExists = fs.existsSync('./.password');
        
        if (isFirstTime && passwordExists) {
            return res.json({
                success: false,
                error: 'Password already exists. Please refresh the page.'
            });
        }
        
        if (!isFirstTime && !passwordExists) {
            return res.json({
                success: false,
                error: 'No password set. Please refresh the page.'
            });
        }
        
        if (isFirstTime) {
            // First time setup - create password
            try {
                fs.writeFileSync('./.password', password);
                environement.password = password;
                
                // Clear any attempt data for this IP
                loginAttempts.delete(clientIp);
                
                return res.json({
                    success: true,
                    message: 'Password created successfully'
                });
            } catch (error) {
                console.error('Error creating password:', error);
                return res.json({
                    success: false,
                    error: 'Failed to create password'
                });
            }
        } else {
            // Login - verify password
            const storedPassword = fs.readFileSync('./.password').toString();
            
            if (password === storedPassword) {
                // Successful login - clear attempts
                loginAttempts.delete(clientIp);
                
                return res.json({
                    success: true,
                    message: 'Login successful'
                });
            } else {
                // Failed login - track attempts
                let attempts = attemptData || {
                    count: 0,
                    firstAttempt: now,
                    lastAttempt: now
                };
                
                // Reset if attempt window expired
                if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
                    attempts = {
                        count: 1,
                        firstAttempt: now,
                        lastAttempt: now
                    };
                } else {
                    attempts.count += 1;
                    attempts.lastAttempt = now;
                }
                
                if (attempts.count >= MAX_ATTEMPTS) {
                    // Lock out the IP
                    attempts.lockedUntil = now + (LOCKOUT_DURATION * 1000);
                    loginAttempts.set(clientIp, attempts);
                    
                    return res.json({
                        success: false,
                        locked: true,
                        lockoutTime: LOCKOUT_DURATION,
                        error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION} seconds.`
                    });
                } else {
                    loginAttempts.set(clientIp, attempts);
                    
                    const remaining = MAX_ATTEMPTS - attempts.count;
                    return res.json({
                        success: false,
                        attemptsRemaining: remaining,
                        error: `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
                    });
                }
            }
        }
    });
};

module.exports = {
    login
};

