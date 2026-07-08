const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const authHeader = req.headers.authorization || '';
        const token = req.cookies?.token || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ message: 'Not authorized' });
    }
};

module.exports = protect;
