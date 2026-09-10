const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/db');

module.exports = async (req, res) => {
  // Ensure database is connected on every serverless function invocation
  await connectDB();
  
  // Forward request/response handling to our fully featured Express app
  return app(req, res);
};
