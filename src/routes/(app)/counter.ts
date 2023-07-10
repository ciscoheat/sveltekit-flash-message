let count = 0;

export default {
  next() {
    return ++count;
  },

  [Symbol.iterator]() {
    return this;
  },

  reset() {
    count = 0;
  }
};
