const http = require('http');

let nextMiddleware = (ctx, next) => next(ctx);
let nullMiddleware = (ctx) => ctx.res;

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

let top = async (ctx, next) => {
  let response = await next(ctx);
  let { status, headers, body } = response;
  ctx.res.writeHead(status, headers);
  ctx.res.end(body);
  return response;
};

let min = (initialStack = []) => {
  let stack = createStack([top, ...initialStack]);

  let app = (req, res) => stack({ req, res });

  app.use = (...args) => stack.use(...args);
  app.listen = (...args) =>
    http.createServer(app)
        .listen(...args);

  return app;
};

let json = data => ({ status: 200, headers: {}, body: JSON.stringify(data) });
let withHeaders = (res, headers) => ({ ...res, headers: { ...res.headers, ...headers } });

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

Object.assign(min, {
  json,
  withHeaders,
  nullMiddleware,
  nextMiddleware,
  createStack,
  router,
});

module.exports = min;