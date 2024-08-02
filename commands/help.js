const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    async execute(message, args) {
        if (message.channel.id !== '800545663125422100') return;

        const helpEmbed = new EmbedBuilder()
            .setTitle('Moderator Guide to Verification Bot Commands')
            .setColor('#00FF00')
            .setDescription('Quick reference guide for using the verification bot commands.')
            .addFields(
                { name: 'Prerequisites', value: 'Ensure you have the necessary roles and permissions. Use the designated channels for commands.' },
                { name: 'Commands Overview', value: '1. **`v <user_id> [age] [roles]`**\n2. **`top [day|week|month|total]`**\n3. **`myverif [day|week|month|total]`**\n4. **`whoverif <user_id>`**' },
                { name: '`v` Command', value: '**Usage**: `v <user_id> [age] [roles]`\n**Example**: `verify 123456789012345678 20 english scholar`\nUse in channel ID: `800640245992652840`' },
                { name: '`vtop` Command', value: '**Usage**: `top [day|week|month|total]`\n**Example**: `top day`\nUse in channel ID: `800545663125422100`' },
                { name: '`vmyverif` Command', value: '**Usage**: `myverif [day|week|month|total]`\n**Example**: `myverif week`\nUse in channel ID: `800545663125422100`' },
                { name: '`vwhoverif` Command', value: '**Usage**: `whoverif <user_id>`\n**Example**: `whoverif 123456789012345678`\nUse in channel ID: `800545663125422100`' },
                { name: 'Notes', value: 'Always use commands in the designated channels. Ensure you have the required roles. The bot will confirm successful operations or provide error messages if something goes wrong.' }
            )
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
};
