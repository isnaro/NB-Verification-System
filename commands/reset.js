const Verification = require('../models/Verification');
const config = require('../config.json');

module.exports = {
    name: 'reset',
    async execute(message, args, client) {
        // Check if the user is authorized to use this command
        if (message.author.id !== '1252982138656129148') {
            return message.reply('You do not have permission to use this command.');
        }

        try {
            // Find all moderators with the allowed roles
            const guild = client.guilds.cache.get(config.guildId);
            const moderators = guild.members.cache.filter(member => 
                member.roles.cache.some(role => config.allowedRoles.includes(role.id))
            );

            // Reset verification counts for all moderators
            for (const moderator of moderators.values()) {
                await Verification.updateOne(
                    { moderatorId: moderator.id },
                    { $set: { 'counts.day': 0, 'counts.week': 0, 'counts.month': 0, 'counts.total': 0 } },
                    { upsert: true }
                );
            }

            message.reply('All verification counts have been reset.');
        } catch (error) {
            console.error('Error executing reset command:', error);
            message.reply('There was an error executing the reset command.');
        }
    }
};
