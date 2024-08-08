const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json');
const moment = require('moment-timezone');
const stringSimilarity = require('string-similarity');

module.exports = {
    name: 'verify',
    async execute(message, args, client) {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return;
        }

        // Check if the command is used in the allowed channel
        if (message.channel.id !== config.allowedChannelId) {
            const reply = await message.reply(`This command only works in <#${config.allowedChannelId}>`);
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 2500);
            message.delete().catch(console.error);
            return;
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
        if (age && age < 17) {
            return message.reply('User is underage. I am unable to verify the user. Must be at least 17 years old. Please use the ban command to ban the user or report it to staff <#914984046646415470>.');
        } else if (age === 17) {
            ageRole = config.roles["15 - 17 YO"];
        } else if (age >= 18 && age <= 24) {
            ageRole = config.roles["18 - 24 YO"];
        } else if (age >= 25 && age <= 30) {
            ageRole = config.roles["25 - 30 YO"];
        }

        const otherRoles = args.filter(arg => isNaN(arg)).map(role => {
            const matchedRole = getClosestRoleName(role.trim().toLowerCase(), message.guild.roles.cache);
            return matchedRole ? matchedRole.id : null;
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

            // Send the loading emoji
            const loadingMessage = await message.channel.send('<a:loadingnb:1271226695537524847>');

            // Update verification counts in MongoDB
            const moderatorId = message.author.id;
            let verification = await Verification.findOne({ userId });

            if (!verification) {
                verification = new Verification({
                    userId,
                    moderatorId,
                    verificationDate: new Date(),
                    assignedRoles: assignedRolesMessage,
                    counts: { day: 1, week: 1, month: 1, total: 1 }
                });
            } else {
                verification.moderatorId = moderatorId; // Update the moderatorId if the userId already exists
                verification.verificationDate = new Date();
                verification.assignedRoles = assignedRolesMessage;
                verification.counts.day++;
                verification.counts.week++;
                verification.counts.month++;
                verification.counts.total++;
            }

            await verification.save();

            const verificationDate = moment().tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const joinDate = moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const accountCreationDate = moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1

            const verificationEmbed = new EmbedBuilder()
                .setTitle('User Verified')
                .setColor('#00FF00')
                .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Verified User', value: `${user ? `${user.user.tag} (<@${user.id}>)` : userId}` },
                    { name: 'Moderator', value: `${message.author.tag} (<@${message.author.id}>)` },
                    { name: 'Verification Date', value: verificationDate },
                    { name: 'Join Date', value: joinDate },
                    { name: 'Account Creation Date', value: accountCreationDate },
                    { name: 'Assigned Roles', value: assignedRolesMessage },
                    { name: 'Message Link', value: `[Jump to Message](${message.url})` }
                )
                .setFooter({ text: `Verified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const logChannel = client.channels.cache.get(config.logChannelId);
            const logMessage = await logChannel.send({ embeds: [verificationEmbed] });

            const replyEmbed = new EmbedBuilder()
                .setTitle('User Verified')
                .setColor('#00FF00')
                .setDescription(`Successfully verified <@${user.id}>. ${assignedRolesMessage}`)
                .addFields(
                    { name: 'Log Report', value: `[View Log Report](${logMessage.url})` }
                )
                .setTimestamp();

            // Edit the loading message to the embed
            await loadingMessage.edit({ content: '', embeds: [replyEmbed] });
        } catch (err) {
            console.error(err);
            message.reply('There was an error processing the verification.');
        }
    }
};

function getClosestRoleName(input, roles) {
    const roleNames = Array.from(roles.values()).map(role => role.name.toLowerCase());
    const matches = stringSimilarity.findBestMatch(input, roleNames);
    if (matches.bestMatch.rating >= 0.6) {
        return roles.find(role => role.name.toLowerCase() === matches.bestMatch.target);
    }
    return null;
}
