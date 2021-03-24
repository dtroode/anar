module.exports = function (collection) {
  let partnersSet = new Set();
  collection.getAll().forEach(function (item) {
    if ("partner" in item.data) {
      let partner = item.data.partner;

      partnersSet.add(partner);
    }
  });

  // returning an array in addCollection works in Eleventy 0.5.3
  return [...partnersSet];
};
