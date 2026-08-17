import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated requests but mark as guest
      req.userId = null;
      req.isGuest = true;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.isGuest = false;
    next();

  } catch (error) {
    // Invalid token — treat as guest
    req.userId = null;
    req.isGuest = true;
    next();
  }
}