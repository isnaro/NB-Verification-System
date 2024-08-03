const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Drop the collection
        await mongoose.connection.db.dropCollection('verifications');
        console.log('Dropped Verification collection');

        // Recreate the collection
        await mongoose.connection.db.createCollection('verifications');
        console.log('Recreated Verification collection');

        console.log('Database reset complete.');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        mongoose.connection.close();
    }
}

resetDatabase();
