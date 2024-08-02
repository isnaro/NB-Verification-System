const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    async execute(message, args) {
        if (message.channel.id !== '800545663125422100') return;

        const helpEmbed = new EmbedBuilder()
            .setTitle('STAFF Guide to Algerian Realm Verification Bot Commands')
            .setColor('#00FF00')
            .setDescription('Quick reference guide for using the verification bot commands.')
            .addFields(
                { name: 'Note', value: 'These commands reuires <@&812318686936825867> or <@&952275776303149176> roles. Use the appropriate channels for the commands.' },
                { name: 'Commands Overview', value: '1. **`v <user_id> [age] [roles]`**\n2. **`vtop [day|week|month|total]`**\n3. **`vmyverif [day|week|month|total]`**\n4. **`vwhoverif <user_id>`**' },
                { name: '`v` Command', value: '**Usage**: `v <user_id> [age] [roles]`\n**Example**: `v 123456789012345678 20 english scholar`\nUse in channel : `<#800640245992652840>`' },
                { name: '`vtop` Command', value: '**Usage**: `vtop [day|week|month|total]`\n**Example**: `vtop day`\nUse in channel : `<#800545663125422100>`' },
                { name: '`vmyverif` Command', value: '**Usage**: `vmyverif [day|week|month|total]`\n**Example**: `vmyverif week`\nUse in channel : `<#800545663125422100>`' },
                { name: '`vwhoverif` Command', value: '**Usage**: `vwhoverif <user_id>`\n**Example**: `vwhoverif 123456789012345678`\nUse in channel : `<#800545663125422100>`' },
                { name: 'Notes', value: 'Always use commands in the designated channels. Ensure you have the required roles. The bot will confirm successful operations or provide error messages if something goes wrong.' }
            )
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
};
