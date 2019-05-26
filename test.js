const assert = require('assert');
const { strictEqual: eql, deepStrictEqual: deep } = assert;
const min = require('.');

let req = {};
let res = { end: () => {}, writeHead: () => {} };
let ctx = { req, res };

// Empty app returns res
(async () => {
  let app = min();

  let response = await app(req, res);

  eql(response, res);
})();

// Singleton stack returns
(async () => {
  let app = min();

  let mock = {};
  app.use(async (ctx) => {
    return mock;
  });

  let response = await app(req, res);

  eql(response, mock);
})();

// Singleton with passthrough returns res
(async () => {
  let app = min();

  app.use(async (ctx, next) => {
    return await next(ctx);
  });

  let response = await app(req, res);

  eql(response, res);
})();

// Middleware is called before and after
(async () => {
  let app = min();

  let order = [];

  app.use(async (ctx, next) => {
    order.push(1);
    let response = await next(ctx);
    order.push(3);
    return response;
  });

  let mock = {};
  app.use(async (ctx) => {
    order.push(2);
    return mock;
  });

  let response = await app(req, res);

  eql(response, mock);
  deep(order, [1, 2, 3]);
})();

// Deep stack is called in order
(async () => {
  let app = min();

  let order = [];

  app.use(async (ctx, next) => {
    order.push(1);
    let response = await next(ctx);
    order.push(5);
    return response;
  });

  app.use(async (ctx, next) => {
    order.push(2);
    let response = await next(ctx);
    order.push(4);
    return response;
  });

  let mock = {};
  app.use(async (ctx) => {
    order.push(3);
    return mock;
  });

  let response = await app(req, res);

  eql(response, mock);
  deep(order, [...order].sort());
})();

// Singleton stack errors
(async () => {
  let app = min();
  let error = new Error('Boom');

  let mock = {};
  app.use(async (ctx) => {
    throw error;
  });

  let thrown;

  try {
    await app(req, res);
  } catch (e) {
    thrown = e;
  } finally {
    eql(thrown, error);
  }
})();

// Deep stack blows up
(async () => {
  let app = min();
  let error = new Error('Boom');

  let order = [];

  app.use(async (ctx, next) => {
    return await next(ctx);
  });

  app.use(async (ctx, next) => {
    return await next(ctx);
  });

  app.use(async (ctx) => {
    throw error;
  });

  let thrown;

  try {
    await app(req, res);
  } catch (e) {
    thrown = e;
  } finally {
    eql(thrown, error);
  }
})();


const emails = [1, 2, 3];

// JSON response
(async () => {
  let app = min();

  app.use(async (ctx) =>
    min.json(emails)
  );

  let response = await app(req, res);

  deep(response, { status: 200, headers: { 'Content-Type': 'application/json' }, body: '[1,2,3]'} );
})();

// With headers
(async () => {
  let app = min();

  app.use(async (ctx, next) =>
    min.withHeaders({ 'X-API-Version': '1.0' },
      await next(ctx)
    )
  );

  app.use(async (ctx) =>
    min.json(emails)
  );

  let response = await app(req, res);

  deep(response, { status: 200, headers: { 'Content-Type': 'application/json', 'X-API-Version': '1.0' }, body: '[1,2,3]'} );
})();

// Substacks
(async () => {
  let app = min();

  let order = [];

  app.use(async (ctx, next) => {
    order.push(1);
    let response = await next(ctx);
    order.push(7);
    return response;
  });

  app.use(async (ctx, next) => {
    order.push(2);
    let response = await next(ctx);
    order.push(6);
    return response;
  });

  let subStack = min.createStack();

  subStack.use(async (ctx, next) => {
    order.push(3);
    let response = await next(ctx);
    order.push(5);
    return response;
  });

  app.use(subStack);

  let mock = {};
  app.use(async (ctx) => {
    order.push(4);
    return mock;
  });

  let response = await app(req, res);

  eql(response, mock);
  deep(order, [...order].sort());
})();

// Router
(async () => {
  let req = { method: 'GET', url: '/emails' };
  let ctx = { req, res };

  let mock = {};

  let routes = min.router();

  routes.get('/emails', async (ctx) =>
    mock
  );

  eql((await routes({
    req: { method: 'GET', url: '/emails' }, res
  })), mock);
  eql((await routes({
    req: { method: 'POST', url: '/emails' }, res
  })), res);
  eql((await routes({
    req: { method: 'GET', url: '/users' }, res
  })), res);
})();

// Router in a middleware stack
(async () => {
  let req = { method: 'GET', url: '/emails' };
  let ctx = { req, res };

  let mock = {};

  let app = min.createStack();

  let order = [];

  app.use(async (ctx, next) => {
    order.push(1);
    let response = await next(ctx);
    order.push(6);
    return response;
  });

  let routes = min.router();
  routes.get('/emails', async (ctx, next) => {
    order.push(2);
    await next(ctx);
    order.push(5);
    return mock;
  });
  app.use(routes);

  app.use(async (ctx, next) => {
    order.push(3);
    let response = await next(ctx);
    order.push(4);
    return response;
  });

  order = [];
  eql((await app({
    req: { method: 'GET', url: '/emails' }, res
  })), mock);
  deep(order, [1,2,3,4,5,6].sort());

  order = [];
  eql((await app({
    req: { method: 'POST', url: '/emails' }, res
  })), res);
  deep(order, [1,3,4,6].sort());
  
  order = [];
  eql((await app({
    req: { method: 'GET', url: '/users' }, res
  })), res);
  deep(order, [1,3,4,6].sort());
})();

// Router matcher
(async () => {
  const { match } = min.router;
  assert( match('/emails', '/emails'));
  assert( match('/emails', '/emails/'));
  assert(!match('/emails', '/emails/1'));

  deep(match('/emails/(id)', '/emails/123'), { id: '123' });
  deep(match('/emails/(id)', '/emails/'), null);
  deep(match('/emails/(from)/(to)', '/emails/me/you'), { from: 'me', to: 'you' });
})();

// Router with dynamic segments
(async () => {
  let routes = min.router();
  routes.get('/emails/(from)/(to)', async (ctx) => {
    return ctx.params;
  });

  eql((await routes({
    req: { method: 'GET', url: '/emails' }, res
  })), res);
  deep((await routes({
    req: { method: 'GET', url: '/emails/me/you' }, res
  })), { from: 'me', to: 'you' });
})();

// Router without dynamic segments
(async () => {
  let routes = min.router();
  routes.get('/emails', async (ctx) => {
    return ctx.params;
  });

  deep((await routes({
    req: { method: 'GET', url: '/emails' }, res
  })), {});
})();