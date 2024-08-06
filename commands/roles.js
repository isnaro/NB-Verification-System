const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json');

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
            return message.reply('This user is not verified. Please verify the member first using the command `v <user-id>`.');
        }

        // Assign roles to the user
        const rolesToAssign = args.map(role => {
            const roleObj = message.guild.roles.cache.find(r => r.name.toLowerCase() === role.toLowerCase());
            return roleObj ? roleObj.id : null;
        }).filter(Boolean);

        if (rolesToAssign.length === 0) {
            return message.reply('No valid roles specified.');
        }

        try {
            await user.roles.add(rolesToAssign);
            const assignedRolesMessage = rolesToAssign.map(roleId => `<@&${roleId}>`).join(', ');

            message.reply(`Successfully assigned roles to ${user.user.tag}: ${assignedRolesMessage}`);
        } catch (err) {
            console.error(err);
            message.reply('There was an error assigning the roles.');
        }
    }
};
