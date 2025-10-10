import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided, unauthorized" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        // Fetch the full user from DB
        const user = await User.findById(decoded.id);
        
        if (!user) return res.status(401).json({ message: "User not found" });
        
        req.user = user; // attach full user document
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token, unauthorized" });
    }
};

export default authMiddleware;
