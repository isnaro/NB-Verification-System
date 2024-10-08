const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const keepAlive = require('./keep_alive');
require('./anticrash');

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
    await connectToDatabase();
    keepAlive();
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Check if the user has required roles to use commands
    const allowedRoles = ['952275776303149176', '812318686936825867'];
    if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) return;

    const content = message.content.slice(config.prefix.length).trim();
    const args = content.split(/ +/);

    // Special handling for the role command
    if (message.content.startsWith('r ')) {
        const args = message.content.slice(2).trim().split(/ +/);
        const command = client.commands.get('role');
        if (command) {
            try {
                await connectToDatabase();
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

    // Special handling for the verify command
    if (message.content.startsWith('v ')) {
        const args = message.content.slice(2).trim().split(/ +/);
        const command = client.commands.get('verify');
        if (command) {
            try {
                await connectToDatabase();
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
            await connectToDatabase();
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

            const notificationChannel = client.channels.cache.get(channelId);
            if (notificationChannel) {
                notificationChannel.send({ content: `<@&${config.adminRoleId}> Someone needs verification`, embeds: [embed] });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
