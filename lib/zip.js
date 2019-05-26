let zip = (keys, values) => keys.reduce((obj, key, i) => {
  obj[key] = values[i];
  return obj;
}, {});

module.exports = zip;