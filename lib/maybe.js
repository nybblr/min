let maybe = (extract, value) => value ? extract(value) : value;

module.exports = maybe;