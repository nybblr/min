let streamToPromise = (req) =>
  new Promise(resolve => {
    let chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });

module.exports = streamToPromise; 