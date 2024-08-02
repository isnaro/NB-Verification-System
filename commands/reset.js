const Verification = require('../models/Verification');

module.exports = {
    name: 'reset',
    async execute(message, args, client) {
        // Check if the user has the specific ID allowed to use this command
        const allowedUserId = '1252982138656129148';
        if (message.author.id !== allowedUserId) {
            return message.reply('You do not have permission to use this command.');
        }

        try {
            // Find all verifications and reset their counts
            const verifications = await Verification.find({});
            for (const verification of verifications) {
                verification.counts = { day: 0, week: 0, month: 0, total: 0 };
                await verification.save();
            }

            message.reply('Successfully reset all verification counts.');
        } catch (err) {
            console.error(err);
            message.reply('There was an error resetting the verification counts.');
        }
    }
};
