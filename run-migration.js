// Script to run the subscription_payments migration
console.log('Running migration for subscription_payments table...');

const createSubscriptionPayments = require('./migrations/create_subscription_payments');

createSubscriptionPayments()
  .then(result => {
    if (result) {
      console.log('Migration completed successfully!');
    } else {
      console.error('Migration failed!');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }); 