const min = require('.');
const { json, withHeaders, router } = min;

const emails = [{ id: '1' }, { id: '2' }, { id: '3' }];

let app = min();

app.use(async (ctx, next) =>
  withHeaders(await next(ctx),
    { 'Content-Type': 'application/json' }
  )
);

let emailRoutes = router();

emailRoutes.get('/emails', async (ctx) =>
  json(emails)
);

emailRoutes.get('/emails/(id)', async (ctx) =>
  json(emails.find(email => email.id === ctx.params.id))
);

app.use(emailRoutes);

app.listen(3000);