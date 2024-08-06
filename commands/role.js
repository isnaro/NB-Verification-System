const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json'); // Add this line

module.exports = {
    name: 'role',
    async execute(message, args, client) {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return message.reply('You do not have permission to use this command.');
        }

        const userId = args.shift();
        const user = await message.guild.members.fetch(userId).catch(() => null);

        if (!user) {
            return message.reply('User not found.');
        }

        // Check if the user is verified
        const verification = await Verification.findOne({ userId });
        if (!verification) {
            return message.reply('This user is not verified. Please verify the user first.');
        }

        const rolesToAdd = args.map(roleName => {
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            return role ? role.id : null;
        }).filter(Boolean);

        if (rolesToAdd.length === 0) {
            return message.reply('No valid roles specified.');
        }

        try {
            await user.roles.add(rolesToAdd);
            const assignedRolesMessage = rolesToAdd.map(roleId => `<@&${roleId}>`).join(', ');
            message.reply(`Successfully assigned roles to <@${user.id}>: ${assignedRolesMessage}`);
        } catch (err) {
            console.error(err);
            message.reply('There was an error assigning roles.');
        }
    }
};
