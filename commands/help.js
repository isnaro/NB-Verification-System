const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    async execute(message, args) {
        if (message.channel.id !== '800545663125422100') return;

        const helpEmbed = new EmbedBuilder()
            .setTitle('Moderator Guide to Verification Bot Commands')
            .setColor('#00FF00')
            .setDescription('This guide will walk you through how to use the new verification bot commands effectively.')
            .addFields(
                { name: 'Prerequisites', value: 'Ensure you have the necessary roles and permissions as configured in the bot.\nMake sure you\'re using the designated channels for commands.' },
                { name: 'Commands Overview', value: '1. **`verify <user_id> [age] [roles]`**\n2. **`top [day|week|month|total]`**\n3. **`myverif [day|week|month|total]`**\n4. **`whoverif <user_id>`**' },
                { name: 'Command Details - `verify`', value: 'This command allows you to verify a user, assign age-based roles, and other specified roles.\n\n**Usage**: `verify <user_id> [age] [roles]`\n\n**Example**: `verify 123456789012345678 20 english scholar`\n\n**Steps**:\n1. **Find User ID**:\n- Right-click on the user\'s name in Discord and select "Copy ID".\n- Make sure you have Developer Mode enabled in Discord settings under "Appearance".\n\n2. **Enter Command**:\n- Replace `<user_id>` with the copied user ID.\n- Replace `[age]` with the user\'s age.\n- Replace `[roles]` with any additional roles you want to assign (separated by spaces).\n\n**Note**: This command must be used in the channel designated for verification (ID: `800640245992652840`).' },
                { name: 'Command Details - `top`', value: 'This command displays the top verifiers for a specified timeframe.\n\n**Usage**: `top [day|week|month|total]`\n\n**Example**: `top day`\n\n**Steps**:\n1. **Choose Timeframe**:\n- `day`: Shows top verifiers for the current day.\n- `week`: Shows top verifiers for the current week.\n- `month`: Shows top verifiers for the current month.\n- `total`: Shows top verifiers for all time.\n\n2. **Enter Command**:\n- Simply type the command in the designated channel (ID: `800545663125422100`).\n- The bot will respond with an embed showing the top verifiers for the specified timeframe.' },
                { name: 'Command Details - `myverif`', value: 'This command shows the moderator how many verifications they have made in a specified timeframe.\n\n**Usage**: `myverif [day|week|month|total]`\n\n**Example**: `myverif week`\n\n**Steps**:\n1. **Choose Timeframe**:\n- `day`: Shows your verifications for the current day.\n- `week`: Shows your verifications for the current week.\n- `month`: Shows your verifications for the current month.\n- `total`: Shows your verifications for all time.\n\n2. **Enter Command**:\n- Simply type the command in the designated channel (ID: `800545663125422100`).\n- The bot will respond with the number of verifications you have made in the specified timeframe.' },
                { name: 'Command Details - `whoverif`', value: 'This command shows who verified a user and displays a detailed embed.\n\n**Usage**: `whoverif <user_id>`\n\n**Example**: `whoverif 123456789012345678`\n\n**Steps**:\n1. **Find User ID**:\n- Right-click on the user\'s name in Discord and select "Copy ID".\n- Make sure you have Developer Mode enabled in Discord settings under "Appearance".\n\n2. **Enter Command**:\n- Replace `<user_id>` with the copied user ID.\n\n3. **View Result**:\n- The bot will respond with an embed showing the verification details of the specified user.' },
                { name: 'Visual Example', value: '#### Verification Process\n1. **Copy User ID**:\n- Right-click on the user and select "Copy ID".\n\n![Copy User ID](https://i.imgur.com/cLmToKQ.png)\n\n2. **Use `verify` Command**:\n- Example: `verify 123456789012345678 20 english scholar`\n- The bot will respond with a confirmation message.\n\n![Verification Command](https://i.imgur.com/3CpOmHH.png)\n\n#### Viewing Top Verifiers\n1. **Use `top` Command**:\n- Example: `top day`\n- The bot will respond with an embed showing the top verifiers for the day.\n\n![Top Verifiers Command](https://i.imgur.com/O6tFQ5G.png)' },
                { name: 'Important Notes', value: '- **Command Channels**: Always use the commands in the designated channels (`800545663125422100` for `top`, `myverif`, and `whoverif` and `800640245992652840` for `verify`).\n- **Roles and Permissions**: Ensure you have the required roles to use these commands.\n- **Bot Response**: The bot will confirm successful operations or provide error messages if something goes wrong.\n\nBy following these steps, you\'ll be able to efficiently manage verifications and track the top verifiers within your server. Happy moderating!' }
            )
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
};
