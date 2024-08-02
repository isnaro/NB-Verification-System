const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');

module.exports = {
    name: 'top',
    async execute(message, args, client) {
        const timeFrame = args[0] || 'total';
        const validTimeFrames = ['day', 'week', 'month', 'total'];

        if (!validTimeFrames.includes(timeFrame)) {
            return message.reply('Invalid time frame. Valid options are: day, week, month, total.');
        }

        const verifications = await Verification.find().sort({ [`counts.${timeFrame}`]: -1 }).limit(5);

        const topVerifiers = verifications.map((verification, index) => {
            const moderator = message.guild.members.cache.get(verification.moderatorId);
            return `#${index + 1} ${moderator ? moderator.user.tag : 'Unknown'} - ${verification.counts[timeFrame]} verifications`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`Top Verifiers (${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)})`)
            .setColor('#00FF00')
            .setDescription(topVerifiers.join('\n') || 'No verifications yet.')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
