const {
  nullMiddleware,
  nextMiddleware,
} = require('../middleware/basic');
const createStack = require('../middleware/create-stack');

const methods = ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'];

let nullRoute = { path: '.*', stack: nextMiddleware };

let maybe = (extract, value) => value ? extract(value) : value;
let match = (pattern, path) =>
  maybe(
    m => ({ ...m.groups }),
    patternToRegExp(pattern).exec(
      path.endsWith('/') ? path.slice(0, -1) : path
    )
  );
let patternToRegExp = (pattern) =>
  new RegExp(`^${
    pattern.replace(/\((\w+)\)/g, (_, name) => `(?<${name}>.+)`)
  }$`);

let router = () => {
  let routes = [];
  let stack = createStack([nextMiddleware]);

  let app = (ctx, next = nullMiddleware) => {
    let route = routes.find(({ method, path }) =>
      method === ctx.req.method && match(path, ctx.req.url)
    ) || nullRoute;

    let params = route === nullRoute ?
      {} : match(route.path, ctx.req.url);
    
    return stack({ ...ctx, params },
      ctx => route.stack(ctx, next));
  };

  app.use = (...args) => stack.use(...args);

  app.add = (method, path, ...middleware) => routes.push({
    method, path, stack: createStack(middleware)
  });
  methods.forEach(method => {
    app[method.toLowerCase()] = (...args) => app.add(method, ...args);
  });

  return app;
};

Object.assign(router, {
  match,
});

module.exports = router;