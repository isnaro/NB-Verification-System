const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json');
const moment = require('moment-timezone');

module.exports = {
    name: 'whoverif',
    async execute(message, args, client) {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return message.reply('You do not have permission to use this command.');
        }

        const userId = args[0];
        const verification = await Verification.findOne({ userId });

        if (!verification) {
            return message.reply('No verification record found for this user.');
        }

        const user = await message.guild.members.fetch(userId).catch(() => null);
        const moderator = await message.guild.members.fetch(verification.moderatorId).catch(() => null);
        const verificationDate = moment(verification.verificationDate).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1

        const embed = new EmbedBuilder()
            .setTitle('User Verification Details')
            .setColor('#00FF00')
            .setThumbnail(user ? user.user.displayAvatarURL({ dynamic: true }) : null)
            .addFields(
                { name: 'Verified User', value: `${user ? `${user.user.tag} (${user.id})` : userId}` },
                { name: 'Moderator', value: `${moderator ? moderator.user.tag : 'Unknown'} (<@${verification.moderatorId}>)` },
                { name: 'Verification Date', value: verificationDate }
            )
            .setFooter({ text: `Verified by ${moderator ? moderator.user.tag : 'Unknown'}`, iconURL: moderator ? moderator.user.displayAvatarURL({ dynamic: true }) : null })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
