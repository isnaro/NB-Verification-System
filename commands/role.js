const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');

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
        const verification = await Verification.findOne({ userId: user.id });
        if (!verification) {
            return message.reply('This user is not verified. Please verify the member first.');
        }

        // Get the roles to be assigned
        const rolesToAssign = args.map(roleName => 
            message.guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase())
        ).filter(Boolean);

        if (!rolesToAssign.length) {
            return message.reply('No valid roles specified.');
        }

        try {
            await user.roles.add(rolesToAssign);

            const assignedRolesMessage = rolesToAssign.map(role => role.name).join(', ');
            const embed = new EmbedBuilder()
                .setTitle('Roles Assigned')
                .setColor('#00FF00')
                .setDescription(`Successfully assigned roles to ${user}: ${assignedRolesMessage}`)
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('There was an error executing that command.');
        }
    }
};
