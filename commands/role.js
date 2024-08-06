const { EmbedBuilder } = require('discord.js');
const stringSimilarity = require('string-similarity');

module.exports = {
    name: 'role',
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

        // Check if the user is verified
        if (user.roles.cache.has('862862160156426300')) {
            return loadingMessage.edit('This user is not verified. Please verify them first.');
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
            return loadingMessage.edit('No valid roles specified.');
        }

        try {
            await user.roles.add(validRoles);

            const assignedRolesMessage = `Successfully assigned roles to ${user}: ${validRoles.map(role => role.name).join(', ')}`;

            const embed = new EmbedBuilder()
                .setTitle('Roles Assigned')
                .setColor('#00FF00')
                .setDescription(assignedRolesMessage)
                .setTimestamp();

            await loadingMessage.edit({ content: '', embeds: [embed] });
        } catch (err) {
            console.error(err);
            loadingMessage.edit('There was an error assigning the roles.');
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
