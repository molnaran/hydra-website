const asyncMiddleware = fun => (req, res, next) => {
  Promise.resolve(fun(req, res, next)).catch(next);
};
module.exports = asyncMiddleware;
