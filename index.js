const { Client, GatewayIntentBits, Partials } = require('discord.js');
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

client.login(process.env.DISCORD_TOKEN);
