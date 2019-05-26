let nextMiddleware = (ctx, next) => next(ctx);
let nullMiddleware = (ctx) => ctx.res;

module.exports = {
  nextMiddleware,
  nullMiddleware,
};