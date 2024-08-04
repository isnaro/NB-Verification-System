const mongoose = require('mongoose');
const Verification = require('./models/Verification');
const config = require('./config.json');
require('dotenv').config();

async function resetDatabase(client) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        // Drop the Verification collection
        await Verification.collection.drop();
        console.log('Dropped Verification collection');

        // Recreate the Verification collection
        await Verification.createCollection();
        console.log('Recreated Verification collection');

        // Fetch the guild
        const guild = await client.guilds.fetch(config.guildId);
        if (!guild) {
            throw new Error('Guild not found');
        }

        // Add all members with the specified roles to the Verification collection
        const members = await guild.members.fetch();
        for (const member of members.values()) {
            if (member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
                const newVerification = new Verification({
                    userId: member.id,
                    moderatorId: null,
                    verificationDate: null,
                    assignedRoles: '',
                    counts: { day: 0, week: 0, month: 0, total: 0 },
                });
                await newVerification.save();
            }
        }

        console.log('Database reset complete.');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        mongoose.connection.close();
    }
}

module.exports = resetDatabase;
