const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json');

module.exports = {
    name: 'whoverif',
    async execute(message, args, client) {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return message.reply('You do not have permission to use this command.');
        }

        const userId = args[0];

        if (!userId) {
            return message.reply('Please provide a user ID.');
        }

        const verification = await Verification.findOne({ userId });

        if (!verification) {
            return message.reply('No verification record found for this user.');
        }

        const moderator = message.guild.members.cache.get(verification.moderatorId);
        const verificationDate = moment(verification.verificationDate).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss');

        const embed = new EmbedBuilder()
            .setTitle('Verification Details')
            .setColor('#00FF00')
            .setThumbnail(moderator.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'User', value: `<@${userId}> (${userId})` },
                { name: 'Moderator', value: `${moderator ? moderator.user.tag : 'Unknown'} (${verification.moderatorId})` },
                { name: 'Verification Date', value: verificationDate },
                { name: 'Counts', value: `Day: ${verification.counts.day}, Week: ${verification.counts.week}, Month: ${verification.counts.month}, Total: ${verification.counts.total}` }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
