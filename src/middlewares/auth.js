import jwt from 'jsonwebtoken';

export const protectDashboard = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Developer ID request object par attach ho jayega
      req.user = { id: decoded.id };
      return next();
    } catch (error) {
      return res.status(401).json({ error: { message: 'Not authorized, token failed' } });
    }
  }

  if (!token) {
    return res.status(401).json({ error: { message: 'Not authorized, no token provided' } });
  }
};