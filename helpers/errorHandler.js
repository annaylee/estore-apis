function errorHandler(err, req, res, next){

  if (err.name === "UnauthorizedError") {  // Jwt authentication error
    return res.status(401).json({success: false, error: "User not Authorized" });
  }
  if (err.name === "ValidationError") { //  Validation error
    return res.status(401).json({success: false, error: 'Validation Error' });
  }

  return res.status(500).json({success: false, error: err});  // Default to 500 server error
}

module.exports = errorHandler;