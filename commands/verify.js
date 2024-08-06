const { EmbedBuilder } = require('discord.js');
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
        if (age < 17) {
            // Ban the user for being underage
            const banDuration = 17 - age; // Calculate ban duration in years
            const banEndDate = moment().add(banDuration, 'years').toDate();
            await user.ban({ reason: 'Underage', days: 0 });

            // Send a ban report
            const banReportChannel = client.channels.cache.get('914984046646415470');
            const embed = new EmbedBuilder()
                .setTitle('User Banned for Underage')
                .setColor('#FF0000')
                .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Banned User', value: `${user.user.tag} (<@${user.id}>)` },
                    { name: 'Moderator', value: `${message.author.tag} (<@${message.author.id}>)` },
                    { name: 'Ban Duration', value: `${banDuration} years` },
                    { name: 'Reason', value: 'Underage (required age: 17)' }
                )
                .setFooter({ text: `Banned by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            banReportChannel.send({ embeds: [embed] });

            return message.reply(`${user.user.tag} is banned for ${banDuration} years for being underage. Required age: 17`);
        }

        if (age >= 17 && age <= 24) {
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
