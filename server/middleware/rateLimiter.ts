const rateLimit = require('express-rate-limit');

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: 'Please waite before sending another request. :)',
});
