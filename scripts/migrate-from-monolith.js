// Copies data from the old single "grocecart" database into the per-service databases.
//   mongosh "mongodb://localhost:27017" scripts/migrate-from-monolith.js
// Safe to re-run: documents are upserted by _id. The source database is not modified.
const src = db.getSiblingDB("grocecart");

function copy(collection, targetDb) {
  const target = db.getSiblingDB(targetDb)[collection];
  let n = 0;
  src[collection].find().forEach(doc => {
    target.replaceOne({ _id: doc._id }, doc, { upsert: true });
    n++;
  });
  print(`${collection}: ${n} -> ${targetDb}`);
}

copy("users", "grocecart_users");
copy("products", "grocecart_products");
copy("addresses", "grocecart_addresses");
copy("orders", "grocecart_orders");

// carts used to live on the user document (cartData); now one document per user in cart-service
const carts = db.getSiblingDB("grocecart_carts").carts;
let c = 0;
src.users.find({ cartData: { $exists: true } }, { cartData: 1 }).forEach(u => {
  if (u.cartData && Object.keys(u.cartData).length > 0) {
    carts.replaceOne({ _id: u._id }, { _id: u._id, cartData: u.cartData }, { upsert: true });
    c++;
  }
});
print(`carts: ${c} -> grocecart_carts`);
