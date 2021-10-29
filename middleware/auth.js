const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  //get token from request header
  const token = req.header('x-auth-token');

  //check if token is missing
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  //verify token if present
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    //take request object and assign decoded value to user
    req.user = decoded.user;
    //call next operation
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};
