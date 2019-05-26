const http = require('http');

const {
  nullMiddleware,
  nextMiddleware,
} = require('./middleware/basic');
const createStack = require('./middleware/create-stack');

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
let withStatus = (res, status) => ({ ...res, status });
let withBody = (res, body) => ({ ...res, body });

const bodyParser = require('./middleware/body-parser');
const router = require('./middleware/router');
Object.assign(min, {
  json,
  withHeaders,
  withStatus,
  withBody,
  createStack,
  nullMiddleware,
  nextMiddleware,
  router,
  bodyParser,
});

module.exports = min;