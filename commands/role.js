const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const stringSimilarity = require('string-similarity');
const config = require('../config.json'); // Make sure to include the config

module.exports = {
    name: 'role',
    async execute(message, args) {
        const userId = args.shift();
        const user = await message.guild.members.fetch(userId).catch(() => null);

        if (!user) {
            return message.reply('User not found.');
        }

        // Check if the user is verified
        if (user.roles.cache.has(config.nonVerifiedRoleId)) {
            return message.reply('This user is not verified. Please verify them first.');
        }

        const roleNames = args;
        const allRoles = message.guild.roles.cache;
        const validRoles = [];

        roleNames.forEach(roleName => {
            const role = getClosestRole(roleName, allRoles);
            if (role) {
                validRoles.push(role);
            }
        });

        if (validRoles.length === 0) {
            return message.reply('No valid roles specified.');
        }

        // Check if the bot has permission to manage roles
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('I do not have permission to manage roles.');
        }

        // Check if the bot's highest role is higher than the roles it's trying to assign
        const botHighestRole = message.guild.members.me.roles.highest.position;
        for (const role of validRoles) {
            if (role.position >= botHighestRole) {
                return message.reply(`I cannot assign the role ${role.name} because it is higher or equal to my highest role.`);
            }
        }

        try {
            await user.roles.add(validRoles);

            const assignedRolesMessage = `Successfully assigned roles to ${user}: ${validRoles.map(role => role.name).join(', ')}`;

            const embed = new EmbedBuilder()
                .setTitle('Roles Assigned')
                .setColor('#00FF00')
                .setDescription(assignedRolesMessage)
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            message.reply('There was an error assigning the roles.');
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
