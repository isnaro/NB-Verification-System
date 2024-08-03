const mongoose = require('mongoose');
const Verification = require('../models/Verification');
const config = require('../config.json');

async function resetDatabase(client) {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Drop the Verification collection
        await Verification.collection.drop();
        console.log('Dropped Verification collection');

        // Recreate the Verification collection
        await Verification.createCollection();
        console.log('Recreated Verification collection');

        // Get all members with the specified roles
        const guild = client.guilds.cache.get(config.guildId); // Ensure guildId is set in config.json
        if (!guild) throw new Error('Guild not found');

        const members = await guild.members.fetch();
        for (const member of members.values()) {
            if (member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
                await Verification.create({
                    moderatorId: member.id,
                    counts: { day: 0, week: 0, month: 0, total: 0 }
                });
            }
        }
        console.log('Initialized verifications for members with allowed roles');

        console.log('Database reset complete.');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

client.on('ready', async () => {
    if (process.argv.includes('--reset')) {
        await resetDatabase(client);
        process.exit(0);
    }
});

module.exports = { resetDatabase };
