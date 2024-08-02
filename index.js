const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const keepAlive = require('./keep_alive'); // Import keep_alive.js
require('./anticrash'); // Import anticrash.js

// Load the configuration file
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Map();

// Load command files
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    keepAlive(); // Call the keepAlive function
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const content = message.content.slice(config.prefix.length).trim();
    const args = content.split(/ +/);

    // Check if the first argument is a number
    if (!isNaN(args[0])) {
        const command = client.commands.get('verify');
        if (command) {
            try {
                await command.execute(message, args, client);
            } catch (error) {
                console.error(error);
                message.reply('There was an error executing that command.');
            }
        }
    } else {
        // Handle other commands
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if (command) {
            try {
                await command.execute(message, args, client);
            } catch (error) {
                console.error(error);
                message.reply('There was an error executing that command.');
            }
        }
    }
});

// Voice state update event listener
client.on('voiceStateUpdate', async (oldState, newState) => {
    // Check if the user joined one of the verification voice channels
    if ((newState.channelId === config.verificationVcId || newState.channelId === config.verificationVcId2) 
        && oldState.channelId !== newState.channelId) {
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
                notificationChannel.send({ content: `<@&${config.adminRoleId}>`, embeds: [embed] });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
