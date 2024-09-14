const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const keepAlive = require('./keep_alive'); // Import keep_alive.js
require('./anticrash'); // Import anticrash.js

// Load the configuration file
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Connect to MongoDB
async function connectToDatabase() {
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Map();

// Load command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await connectToDatabase(); // Ensure database connection
    keepAlive(); // Call the keepAlive function
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Check if the user has one of the allowed roles for 'verify' or 'role' commands
    const hasAllowedRole = message.member.roles.cache.some(role => config.allowedRoles.includes(role.id));

    // Handle 'v ' commands (verify)
    if (message.content.startsWith('v ')) {
        if (!hasAllowedRole) {
            return; // Ignore if the user doesn't have permission
        }

        const args = message.content.slice(2).trim().split(/ +/);
        const command = client.commands.get('verify');
        if (command) {
            try {
                await connectToDatabase(); // Ensure database connection
                if (message.channel.id !== config.allowedChannelId) {
                    const reply = await message.reply(`This command only works in <#${config.allowedChannelId}>`);
                    setTimeout(() => {
                        reply.delete().catch(console.error);
                    }, 2500);
                    message.delete().catch(console.error);
                    return;
                }
                await command.execute(message, args, client);
            } catch (error) {
                console.error(error);
                message.reply('There was an error executing that command.');
            }
        }
        return;
    }

    // Handle 'r ' commands (roles)
    if (message.content.startsWith('r ')) {
        if (!hasAllowedRole) {
            return; // Ignore if the user doesn't have permission
        }

        const args = message.content.slice(2).trim().split(/ +/);
        const command = client.commands.get('role');
        if (command) {
            try {
                await connectToDatabase(); // Ensure database connection
                if (message.channel.id !== config.allowedChannelId) {
                    const reply = await message.reply(`This command only works in <#${config.allowedChannelId}>`);
                    setTimeout(() => {
                        reply.delete().catch(console.error);
                    }, 2500);
                    message.delete().catch(console.error);
                    return;
                }
                await command.execute(message, args, client);
            } catch (error) {
                console.error(error);
                message.reply('There was an error executing that command.');
            }
        }
        return;
    }

    // All other commands
    if (!message.content.startsWith(config.prefix)) return;

    const commandName = args.shift().toLowerCase();

    // Handle other commands, ensure they only work in the specific channel
    if (message.channel.id !== '800545663125422100') {
        const reply = await message.reply('This command only works in <#800545663125422100>.');
        setTimeout(() => {
            reply.delete().catch(console.error);
        }, 2500);
        message.delete().catch(console.error);
        return;
    }

    const command = client.commands.get(commandName);
    if (command) {
        try {
            await connectToDatabase(); // Ensure database connection
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('There was an error executing that command.');
        }
    }
});

// Voice state update event listener
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if the user joined one of the verification voice channels
    if (
        (newState.channelId === config.verificationVcId || newState.channelId === config.verificationVcId2) &&
        oldState.channelId !== newState.channelId
    ) {
        const member = newState.member;
        // Check if the user has the non-verified role
        if (member.roles.cache.has(config.nonVerifiedRoleId)) {
            const channelId = newState.channelId; // Get the ID of the channel the user joined
            const joinDate = moment(member.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const accountCreationDate = moment(member.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const embed = new EmbedBuilder()
                .setTitle('User Needs Verification')
                .setColor('#FF0000')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})` },
                    { name: 'Join Date', value: joinDate },
                    { name: 'Account Creation Date', value: accountCreationDate },
                    { name: 'Action Required', value: `Join the voice channel <#${channelId}> to verify them.` }
                )
                .setFooter({ text: 'Verification Required', iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const notificationChannel = client.channels.cache.get(channelId); // Send the notification to the verification voice channel
            if (notificationChannel) {
                notificationChannel.send({ content: `<@&${config.adminRoleId}> Someone needs verification`, embeds: [embed] });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
