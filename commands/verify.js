const { EmbedBuilder } = require('discord.js');
const stringSimilarity = require('string-similarity');
const moment = require('moment-timezone');
const Verification = require('../models/Verification');
const config = require('../config.json');

module.exports = {
    name: 'verify',
    async execute(message, args, client) {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return message.reply('You do not have permission to use this command.');
        }

        // Check if the command is used in the allowed channel
        if (message.channel.id !== config.allowedChannelId) {
            return message.reply(`This command only works in <#${config.allowedChannelId}>.`);
        }

        const userId = args.shift();
        const user = await message.guild.members.fetch(userId).catch(() => null);

        if (!user) {
            return message.reply('User not found.');
        }

        // Check if the user has the "non-verified" role
        if (!user.roles.cache.has(config.nonVerifiedRoleId)) {
            return message.reply('This user is already verified.');
        }

        const age = parseInt(args.find(arg => !isNaN(arg)));
        let ageRole;
        if (age >= 15 && age <= 17) {
            ageRole = config.roles["15 - 17 YO"];
        } else if (age >= 18 && age <= 24) {
            ageRole = config.roles["18 - 24 YO"];
        } else if (age >= 25 && age <= 30) {
            ageRole = config.roles["25 - 30 YO"];
        }

        const otherRoles = args.filter(arg => isNaN(arg)).map(role => {
            const matchedRole = getClosestRoleName(role.trim().toLowerCase(), config.roles);
            return matchedRole ? config.roles[matchedRole] : null;
        }).filter(Boolean);

        if (ageRole) {
            otherRoles.push(ageRole);
        }

        // Always add the "Giveaways" and "Events" roles
        otherRoles.push(config.roles.Giveaways, config.roles.Events);

        try {
            await user.roles.remove(config.nonVerifiedRoleId);

            let assignedRolesMessage = 'No roles assigned';
            if (otherRoles.length) {
                await user.roles.add(otherRoles);
                assignedRolesMessage = `Assigned roles: ${otherRoles.map(roleId => message.guild.roles.cache.get(roleId).name).join(', ')}`;
            }

            // Update verification counts in MongoDB for the moderator
            const moderatorId = message.author.id;

            // Increment verification counts
            const verificationUpdate = {
                $inc: { 'counts.day': 1, 'counts.week': 1, 'counts.month': 1, 'counts.total': 1 },
                $set: { verificationDate: new Date() }
            };

            await Verification.updateOne(
                { moderatorId },
                verificationUpdate,
                { upsert: true }
            );

            // Create or update the verification record for the user
            await Verification.updateOne(
                { userId: user.id },
                {
                    $set: {
                        userId: user.id,
                        moderatorId,
                        verificationDate: new Date(),
                        assignedRoles: assignedRolesMessage
                    }
                },
                { upsert: true }
            );

            const verificationDate = moment().tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const joinDate = moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const accountCreationDate = moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1

            const verificationEmbed = new EmbedBuilder()
                .setTitle('User Verified')
                .setColor('#00FF00')
                .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Verified User', value: `${user.user.tag} (<@${user.id}>)` },
                    { name: 'Moderator', value: `${message.author.tag} (<@${message.author.id}>)` },
                    { name: 'Verification Date', value: verificationDate },
                    { name: 'Join Date', value: joinDate },
                    { name: 'Account Creation Date', value: accountCreationDate },
                    { name: 'Assigned Roles', value: assignedRolesMessage }
                )
                .setFooter({ text: `Verified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const logChannel = client.channels.cache.get(config.logChannelId);
            logChannel.send({ embeds: [verificationEmbed] });

            message.reply(`Successfully verified ${user.user.tag}. ${assignedRolesMessage}`);
        } catch (err) {
            console.error(err);
            message.reply('There was an error processing the verification.');
        }
    }
};

function getClosestRoleName(input, roles) {
    const roleNames = Object.keys(roles);
    const matches = stringSimilarity.findBestMatch(input, roleNames);
    if (matches.bestMatch.rating >= 0.6) {
        return matches.bestMatch.target;
    }
    return null;
}
