const mongoose = require('mongoose');
const Verification = require('../models/Verification');
const config = require('../config.json');

module.exports = {
    name: 'reset',
    async execute(message, args, client) {
        // Only allow the command if the author has the specified user ID
        if (message.author.id !== '1252982138656129148') {
            return message.reply('You do not have permission to use this command.');
        }

        try {
            // Connect to MongoDB
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(process.env.MONGODB_URI);
                console.log('Connected to MongoDB');
            }

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
                        counts: { day: 0, week: 0, month: 0, total: 0 }
                    });
                    await newVerification.save();
                }
            }

            console.log('Database reset complete.');
            message.reply('Database reset complete.');
        } catch (error) {
            console.error('Error resetting database:', error);
            message.reply('There was an error resetting the database.');
        }
    }
};
