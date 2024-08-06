const { EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const Verification = require('../models/Verification');
const stringSimilarity = require('string-similarity');

module.exports = {
    name: 'verify',
    async execute(message, args) {
        const loadingMessage = await message.reply('<a:loadingnb:1270196992747896893> Loading...');

        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => ['812318686936825867', '952275776303149176'].includes(role.id))) {
            return loadingMessage.edit('You do not have permission to use this command.');
        }

        const userId = args.shift();
        const user = await message.guild.members.fetch(userId).catch(() => null);

        if (!user) {
            return loadingMessage.edit('User not found.');
        }

        // Check if the user has the "non-verified" role
        if (!user.roles.cache.has('862862160156426300')) {
            return loadingMessage.edit('This user is already verified.');
        }

        const age = parseInt(args.find(arg => !isNaN(arg)));
        let ageRole;
        if (age >= 15 && age <= 17) {
            ageRole = '801160166712148020';
        } else if (age >= 18 && age <= 24) {
            ageRole = '952260704679886859';
        } else if (age >= 25 && age <= 30) {
            ageRole = '952260851207925810';
        }

        const otherRoles = args.filter(arg => isNaN(arg)).map(role => {
            const matchedRole = getClosestRole(role.trim().toLowerCase(), message.guild.roles.cache);
            return matchedRole ? matchedRole.id : null;
        }).filter(Boolean);

        if (ageRole) {
            otherRoles.push(ageRole);
        }

        // Always add the "Giveaways" and "Events" roles
        otherRoles.push('809166576989372466', '801187769179308062');

        try {
            await user.roles.remove('862862160156426300');

            let assignedRolesMessage = 'No roles assigned';
            if (otherRoles.length) {
                await user.roles.add(otherRoles);
                assignedRolesMessage = `Assigned roles: ${otherRoles.map(roleId => message.guild.roles.cache.get(roleId).name).join(', ')}`;
            }

            // Update verification counts in MongoDB
            const moderatorId = message.author.id;
            const verificationDate = new Date();

            const newVerification = new Verification({
                userId: user.id,
                moderatorId,
                verificationDate,
                assignedRoles: assignedRolesMessage,
                counts: { day: 1, week: 1, month: 1, total: 1 }
            });

            await newVerification.save();

            const joinDate = moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const accountCreationDate = moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1

            const embed = new EmbedBuilder()
                .setTitle('User Verified')
                .setColor('#00FF00')
                .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Verified User', value: `${user.user.tag} (<@${user.id}>)` },
                    { name: 'Moderator', value: `${message.author.tag} (<@${message.author.id}>)` },
                    { name: 'Verification Date', value: moment(verificationDate).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') },
                    { name: 'Join Date', value: joinDate },
                    { name: 'Account Creation Date', value: accountCreationDate },
                    { name: 'Assigned Roles', value: assignedRolesMessage }
                )
                .setFooter({ text: `Verified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const logChannel = client.channels.cache.get('1254231233630834788');
            const logMessage = await logChannel.send({ embeds: [embed] });

            const responseEmbed = new EmbedBuilder()
                .setTitle('User Verified')
                .setColor('#00FF00')
                .setDescription(`Successfully verified <@${user.id}>. Assigned roles: ${assignedRolesMessage}`)
                .addFields({ name: 'View Log Message', value: `[Click Here](${logMessage.url})` })
                .setTimestamp();

            await loadingMessage.edit({ content: '', embeds: [responseEmbed] });
        } catch (err) {
            console.error(err);
            loadingMessage.edit('There was an error processing the verification.');
        }
    }
};

function getClosestRole(roleName, allRoles) {
    const roleNames = allRoles.map(role => role.name);
    const matches = stringSimilarity.findBestMatch(roleName, roleNames);
    if (matches.bestMatch.rating >= 0.6) {
        return allRoles.find(role => role.name === matches.bestMatch.target);
    }
    return null;
}
