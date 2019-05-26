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

  let app = (req, res) => stack({ req, res, headers: req.headers });

  app.use = (...args) => stack.use(...args);
  app.listen = (...args) =>
    http.createServer(app)
        .listen(...args);

  return app;
};

let json = data => ({ status: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
let text = data => ({ status: 200, headers: { 'Content-Type': 'text/plain' }, body: data });
let status = status => ({ status, headers: {}, body: '' });
let withHeaders = (headers, res) => ({ ...res, headers: { ...res.headers, ...headers } });
let withStatus = (status, res) => ({ ...res, status });
let withBody = (body, res) => ({ ...res, body });
let rescue = (type, err) => {
  if (!(err instanceof type)) {
    throw err;
  }
};

const bodyParser = require('./middleware/body-parser');
const router = require('./middleware/router');
Object.assign(min, {
  json,
  text,
  status,
  rescue,
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