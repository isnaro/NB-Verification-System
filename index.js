const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const moment = require('moment-timezone');
const stringSimilarity = require('string-similarity');
require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const keepAlive = require('./keep_alive'); // Import keep_alive.js
require('./anticrash'); // Import anticrash.js

// Load the configuration file
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// Define the Verification schema
const verificationSchema = new mongoose.Schema({
    moderatorId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    verificationDate: {
        type: Date,
        default: Date.now
    },
    counts: {
        day: {
            type: Number,
            default: 0
        },
        week: {
            type: Number,
            default: 0
        },
        month: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    }
});

const Verification = mongoose.model('Verification', verificationSchema);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates // Added for voice state updates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const prefix = config.prefix; // Prefix for commands

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    keepAlive(); // Call the keepAlive function
});

function getClosestRoleName(input, roles) {
    const roleNames = Object.keys(roles);
    const matches = stringSimilarity.findBestMatch(input, roleNames);
    if (matches.bestMatch.rating >= 0.6) { // Use a threshold to avoid assigning incorrect roles
        return matches.bestMatch.target;
    }
    return null;
}

client.on('messageCreate', async message => {
    // Ignore messages from bots and non-command messages
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'v') {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return;
        }

        // Check if the command is used in the allowed channel
        if (message.channel.id !== config.allowedChannelId) {
            return message.reply(`This command only works in <#${config.allowedChannelId}>.`);
        }

        const userId = args.shift();
        const user = await message.guild.members.fetch(userId).catch(() => null);

        if (!user) {
            return message.reply('User not found.');
        }

        // Check if the user has the "non-verified" role
        if (!user.roles.cache.has(config.nonVerifiedRoleId)) {
            return message.reply('This user is already verified.');
        }

        const age = parseInt(args.find(arg => !isNaN(arg)));
        let ageRole;
        if (age >= 15 && age <= 17) {
            ageRole = config.roles["15 - 17 YO"];
        } else if (age >= 18 && age <= 24) {
            ageRole = config.roles["18 - 24 YO"];
        } else if (age >= 25 && age <= 30) {
            ageRole = config.roles["25 - 30 YO"];
        }

        const otherRoles = args.filter(arg => isNaN(arg)).map(role => {
            const matchedRole = getClosestRoleName(role.trim().toLowerCase(), config.roles);
            return matchedRole ? config.roles[matchedRole] : null;
        }).filter(Boolean);

        if (ageRole) {
            otherRoles.push(ageRole);
        }

        // Always add the "Giveaways" and "Events" roles
        otherRoles.push(config.roles.Giveaways, config.roles.Events);

        try {
            await user.roles.remove(config.nonVerifiedRoleId);

            let assignedRolesMessage = 'No roles assigned';
            if (otherRoles.length) {
                await user.roles.add(otherRoles);
                assignedRolesMessage = `Assigned roles: ${otherRoles.map(roleId => message.guild.roles.cache.get(roleId).name).join(', ')}`;
            }

            // Update verification counts in MongoDB
            const moderatorId = message.author.id;
            let verification = await Verification.findOne({ userId });
            if (!verification) {
                verification = new Verification({ moderatorId, userId });
            }
            verification.counts.day++;
            verification.counts.week++;
            verification.counts.month++;
            verification.counts.total++;
            verification.verificationDate = new Date();
            await verification.save();

            const verificationDate = moment().tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const joinDate = moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
            const accountCreationDate = moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1

            const verificationEmbed = new EmbedBuilder()
                .setTitle('User Verified')
                .setColor('#00FF00')
                .setThumbnail(user.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Verified User', value: `${user.user.tag} (${user.id})` },
                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                    { name: 'Verification Date', value: verificationDate },
                    { name: 'Join Date', value: joinDate },
                    { name: 'Account Creation Date', value: accountCreationDate },
                    { name: 'Assigned Roles', value: assignedRolesMessage }
                )
                .setFooter({ text: `Verified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            const logChannel = client.channels.cache.get(config.logChannelId);
            logChannel.send({ embeds: [verificationEmbed] });

            message.reply(`Successfully verified ${user.user.tag}. ${assignedRolesMessage}`);
        } catch (err) {
            console.error(err);
            message.reply('There was an error processing the verification.');
        }
    }

    if ((message.author.id !== '387923086730723329' && message.author.id !== '1252982138656129148') || (message.channel.id !== '800545663125422100' && message.channel.id !== config.allowedChannelId)) {
        return;
    }

    if (command === 'vtop') {
        const timeFrame = args[0] || 'total';
        const validTimeFrames = ['day', 'week', 'month', 'total'];

        if (!validTimeFrames.includes(timeFrame)) {
            return message.reply('Invalid time frame. Valid options are: day, week, month, total.');
        }

        const verifications = await Verification.find().sort({ [`counts.${timeFrame}`]: -1 }).limit(5);

        const topVerifiers = verifications.map((verification, index) => {
            const moderator = message.guild.members.cache.get(verification.moderatorId);
            return `#${index + 1} ${moderator ? moderator.user.tag : 'Unknown'} - ${verification.counts[timeFrame]} verifications`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`Top Verifiers (${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)})`)
            .setColor('#00FF00')
            .setDescription(topVerifiers.join('\n') || 'No verifications yet.')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (command === 'vmyverif') {
        const timeFrame = args[0] || 'total';
        const validTimeFrames = ['day', 'week', 'month', 'total'];

        if (!validTimeFrames.includes(timeFrame)) {
            return message.reply('Invalid time frame. Valid options are: day, week, month, total.');
        }

        const verification = await Verification.findOne({ moderatorId: message.author.id });

        if (!verification) {
            return message.reply('You have not made any verifications yet.');
        }

        message.reply(`You have made ${verification.counts[timeFrame]} verifications in the ${timeFrame}.`);
    }

    if (command === 'vwhoverif') {
        const userId = args[0];
        const verification = await Verification.findOne({ userId });

        if (!verification) {
            return message.reply('This user has not been verified yet.');
        }

        const user = await message.guild.members.fetch(userId).catch(() => null);
        const moderator = await message.guild.members.fetch(verification.moderatorId).catch(() => null);

        const verificationDate = moment(verification.verificationDate).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss'); // GMT+1
        const joinDate = user ? moment(user.joinedAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') : 'Unknown'; // GMT+1
        const accountCreationDate = user ? moment(user.user.createdAt).tz('Africa/Algiers').format('YYYY-MM-DD HH:mm:ss') : 'Unknown'; // GMT+1

        const embed = new EmbedBuilder()
            .setTitle('User Verification Details')
            .setColor('#00FF00')
            .setThumbnail(user ? user.user.displayAvatarURL({ dynamic: true }) : null)
            .addFields(
                { name: 'Verified User', value: `${user ? user.user.tag : 'Unknown'} (${userId})` },
                { name: 'Moderator', value: `${moderator ? moderator.user.tag : 'Unknown'} (${verification.moderatorId})` },
                { name: 'Verification Date', value: verificationDate },
                { name: 'Join Date', value: joinDate },
                { name: 'Account Creation Date', value: accountCreationDate }
            )
            .setFooter({ text: `Verified by ${moderator ? moderator.user.tag : 'Unknown'}`, iconURL: moderator ? moderator.user.displayAvatarURL({ dynamic: true }) : null })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
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

// New event listener for auto-reacting to messages in the polls channel
client.on('messageCreate', async message => {
    if (message.channel.id === config.pollsChannelId) {
        try {
            await message.react(`<:ALG_stonks_up:${config.upVoteEmojiId}>`);
            await message.react(`<:ALG_stonks_down:${config.downVoteEmojiId}>`);
        } catch (error) {
            console.error('Failed to react to the message:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

// Schedule resets
cron.schedule('0 0 * * *', async () => {
    await Verification.updateMany({}, { $set: { 'counts.day': 0 } });
});

cron.schedule('0 0 * * 0', async () => {
    await Verification.updateMany({}, { $set: { 'counts.week': 0 } });
});

cron.schedule('0 0 1 * *', async () => {
    await Verification.updateMany({}, { $set: { 'counts.month': 0 } });
});
