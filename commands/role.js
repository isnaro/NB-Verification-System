const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const stringSimilarity = require('string-similarity');

module.exports = {
    name: 'role',
    async execute(message, args, client, loadingMessage) {
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            await loadingMessage.delete();
            return message.reply('You do not have permission to use this command.');
        }

        const userId = args.shift();
        const user = await message.guild.members.fetch(userId).catch(() => null);

        if (!user) {
            await loadingMessage.delete();
            return message.reply('User not found.');
        }

        // Check if the user is verified
        const verification = await Verification.findOne({ userId });
        if (!verification) {
            await loadingMessage.delete();
            return message.reply('The specified user is not verified. Please verify the user first.');
        }

        const roleNames = args.map(roleName => roleName.trim().toLowerCase());
        const allRoles = message.guild.roles.cache.map(role => role.name.toLowerCase());
        const roles = roleNames.map(roleName => {
            let bestMatch = stringSimilarity.findBestMatch(roleName, allRoles).bestMatch.target;
            return message.guild.roles.cache.find(role => role.name.toLowerCase() === bestMatch);
        }).filter(role => role !== undefined);

        if (roles.length === 0) {
            await loadingMessage.delete();
            return message.reply('No valid roles specified.');
        }

        try {
            await user.roles.add(roles);
            const assignedRolesMessage = roles.map(role => role.name).join(', ');

            const embed = new EmbedBuilder()
                .setTitle('Roles Assigned')
                .setColor('#00FF00')
                .setDescription(`Successfully assigned roles to <@${user.id}>: ${assignedRolesMessage}`)
                .setTimestamp();

            await loadingMessage.delete();
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error assigning roles:', error);
            await loadingMessage.delete();
            message.reply('There was an error assigning the roles.');
        }
    },
};
