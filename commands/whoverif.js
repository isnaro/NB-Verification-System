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

        const joinDate = user ? moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') : 'Unknown';
        const accountCreationDate = user ? moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') : 'Unknown';

        const logChannel = client.channels.cache.get(config.logChannelId);
        const logMessages = await logChannel.messages.fetch({ limit: 100 }); // Adjust the limit if necessary
        const logMessage = logMessages.find(m => m.embeds.length > 0 && m.embeds[0].fields.find(f => f.value.includes(userId)));

        const messageLink = logMessage ? `https://discord.com/channels/${message.guild.id}/${logChannel.id}/${logMessage.id}` : 'Log message not found';

        const embed = new EmbedBuilder()
            .setTitle('User Verified')
            .setColor('#ADD8E6') // Light blue color
            .setThumbnail(user ? user.user.displayAvatarURL({ dynamic: true }) : null)
            .addFields(
                { name: 'Verified User', value: `${user ? `${user.user.tag} (<@${user.id}>)` : userId}` },
                { name: 'Moderator', value: `${moderator ? `${moderator.user.tag} (<@${moderator.id}>)` : 'Unknown'}` },
                { name: 'Verification Date', value: verificationDate },
                { name: 'Join Date', value: joinDate },
                { name: 'Account Creation Date', value: accountCreationDate },
                { name: 'Assigned Roles', value: verification.assignedRoles || 'No roles assigned' },
                { name: 'Log Message', value: `[View Log Message](${messageLink})` },
                { name: 'Message Link', value: `[Jump to Message](${messageLink})` }
            )
            .setFooter({ text: `Verified by ${moderator ? moderator.user.tag : 'Unknown'}`, iconURL: moderator ? moderator.user.displayAvatarURL({ dynamic: true }) : null })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
