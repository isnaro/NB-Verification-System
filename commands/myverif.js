const Verification = require('../models/Verification');

module.exports = {
    name: 'myverif',
    async execute(message, args) {
        const timeFrame = args[0] || 'total';
        const validTimeFrames = ['day', 'week', 'month', 'total'];

        if (!validTimeFrames.includes(timeFrame)) {
            return message.reply('Invalid time frame. Valid options are: day, week, month, total.');
        }

        const verification = await Verification.findOne({ moderatorId: message.author.id });

        if (!verification) {
            return message.reply('You have not made any verifications yet.');
        }

        message.reply(`You have made ${verification.counts[timeFrame]} verifications in the ${timeFrame}.`);
    }
};
