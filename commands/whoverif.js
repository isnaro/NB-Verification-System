const { EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const Verification = require('../models/Verification');

module.exports = {
    name: 'whoverif',
    async execute(message, args) {
        const userId = args[0];
        const verification = await Verification.findOne({ userId });

        if (!verification) {
            return message.reply('This user has not been verified yet.');
        }

        const user = await message.guild.members.fetch(userId).catch(() => null);
        const moderator = await message.guild.members.fetch(verification.moderatorId).catch(() => null);

        const verificationDate = moment(verification.verificationDate).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
        const joinDate = user ? moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') : 'Unknown'; // GMT+1
        const accountCreationDate = user ? moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') : 'Unknown'; // GMT+1

        const embed = new EmbedBuilder()
            .setTitle('User Verification Details')
            .setColor('#00FF00')
            .setThumbnail(user ? user.user.displayAvatarURL({ dynamic: true }) : null)
            .addFields(
                { name: 'Verified User', value: `${user ? user.user.tag : 'Unknown'} (${userId})` },
                { name: 'Moderator', value: `${moderator ? moderator.user.tag : 'Unknown'} (${verification.moderatorId})` },
                { name: 'Verification Date', value: verificationDate },
                { name: 'Join Date', value: joinDate },
                { name: 'Account Creation Date', value: accountCreationDate }
            )
            .setFooter({ text: `Verified by ${moderator ? moderator.user.tag : 'Unknown'}`, iconURL: moderator ? moderator.user.displayAvatarURL({ dynamic: true }) : null })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
