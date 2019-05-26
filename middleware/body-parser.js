const streamToPromise = require('../lib/stream-to-promise');

let streamToJSONPromise = async stream => JSON.parse(await streamToPromise(stream));

let bodyParser = {
  json: () => (ctx, next) =>next({ ...ctx,body: streamToJSONPromise(ctx.req) }),
};

module.exports = bodyParser;