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

    const content = message.content.trim();
    const args = content.split(/ +/);
    const commandName = args.shift().toLowerCase();

    const specialCommands = {
        'r': 'role',
        'v': 'verify'
    };

    const commandKey = specialCommands[commandName] || commandName;
    const command = client.commands.get(commandKey);

    if (command) {
        try {
            await connectToDatabase(); // Ensure database connection
            const allowedChannelId = (commandKey === 'role' || commandKey === 'verify') ? config.allowedChannelId : '800545663125422100';

            if (message.channel.id !== allowedChannelId) {
                const reply = await message.reply(`This command only works in <#${allowedChannelId}>`);
                setTimeout(() => reply.delete().catch(console.error), 2500);
                message.delete().catch(console.error);
                return;
            }
            
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('There was an error executing that command.');
        }
    }
});

// Voice state update event listener
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (
        (newState.channelId === config.verificationVcId || newState.channelId === config.verificationVcId2) &&
        oldState.channelId !== newState.channelId
    ) {
        const member = newState.member;
        if (member.roles.cache.has(config.nonVerifiedRoleId)) {
            const channelId = newState.channelId;
            const joinDate = moment(member.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss');
            const accountCreationDate = moment(member.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss');
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

            const notificationChannel = client.channels.cache.get(config.notificationChannelId);
            if (notificationChannel) {
                notificationChannel.send({ content: `<@&${config.adminRoleId}> Someone needs verification`, embeds: [embed] });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
