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
                { name: 'Note', value: 'These commands require <@&812318686936825867> or <@&952275776303149176> roles. Use the appropriate channels for the commands.' },
                { name: 'Commands Overview', value: '1. **`v <user_id> [age] [roles]`** - Verifies a user and assigns roles.\n2. **`vtop [day|week|month|total]`** - Shows the top verifiers.\n3. **`vmyverif [day|week|month|total]`** - Shows the number of verifications you have made.\n4. **`vwhoverif <user_id>`** - Shows who verified a user.' },
                { name: '`v` Command', value: '**Description**: Verifies a user by assigning age-based and other specified roles.\n\n**Usage**: `v <user_id> [age] [roles]`\n**Example**: `v 123456789012345678 20 english scholar`\n**Channel**: <#800640245992652840>' },
                { name: '`vtop` Command', value: '**Description**: Displays the top verifiers for a specified timeframe.\n\n**Usage**: `vtop [day|week|month|total]`\n**Example**: `vtop day`\n**Channel**: <#800545663125422100>' },
                { name: '`vmyverif` Command', value: '**Description**: Shows the number of verifications you have made in a specified timeframe.\n\n**Usage**: `vmyverif [day|week|month|total]`\n**Example**: `vmyverif week`\n**Channel**: <#800545663125422100>' },
                { name: '`vwhoverif` Command', value: '**Description**: Shows who verified a specific user and provides detailed verification information.\n\n**Usage**: `vwhoverif <user_id>`\n**Example**: `vwhoverif 123456789012345678`\n**Channel**: <#800545663125422100>' },
                { name: 'Notes', value: 'Always use commands in the designated channels. Ensure you have <@&812318686936825867> or <@&952275776303149176> roles while using the bot. The bot will confirm successful operations or provide error messages if something goes wrong.' }
            )
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
};
