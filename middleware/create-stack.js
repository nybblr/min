const {
  nullMiddleware,
} = require('../middleware/basic');

let createStack = (initialStack = []) => {
  let stack = [...initialStack];
  let nextMiddleware = current =>
    stack[stack.indexOf(current) + 1];
  let getNext = (current, fallback) => {
    let next = nextMiddleware(current) || fallback;
    return ctx => next(ctx, getNext(next, fallback));
  };
  let app = async (ctx, next = nullMiddleware) => {
    let top = stack[0];
    return await top(ctx, getNext(top, next));
  };

  app.use = middleware =>
    stack.push(middleware);

  return app;
};

module.exports = createStack;