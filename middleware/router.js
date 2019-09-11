const pathToRegexp = require('path-to-regexp');
const {
  nullMiddleware,
  nextMiddleware,
} = require('../middleware/basic');
const createStack = require('../middleware/create-stack');
const zip = require('../lib/zip');
const maybe = require('../lib/maybe');

const { METHODS: methods } = require('http');

let nullRoute = { stack: nextMiddleware };

let pathToMatcher = (path) => {
  let keys = [];
  let regexp = pathToRegexp(path, keys);
  let keyNames = keys.map(key => key.name);
  let matcher = (string) =>
    maybe(
      match => zip(keyNames, match.slice(1)),
      regexp.exec(string)
    );
  Object.assign(matcher, { pattern: path, keys });
  return matcher;
};
let match = (pattern, path) =>
  pathToMatcher(pattern)(path);

let router = () => {
  let routes = [];
  let stack = createStack([nextMiddleware]);

  let app = (ctx, next = nullMiddleware) => {
    let route = routes.find(({ method, matcher }) =>
      method === ctx.req.method && matcher(ctx.req.url)
    ) || nullRoute;

    let params = route === nullRoute ?
      {} : route.matcher(ctx.req.url);

    return stack({ ...ctx, params },
      ctx => route.stack(ctx, next));
  };

  app.use = (...args) => stack.use(...args);

  app.add = (method, path, ...middleware) => routes.push({
    method, path, matcher: pathToMatcher(path), stack: createStack(middleware)
  });
  methods.forEach(method => {
    app[method.toLowerCase()] = (...args) => app.add(method, ...args);
  });

  return app;
};

Object.assign(router, {
  match,
  pathToMatcher,
});

module.exports = router;
