const { EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json');
const moment = require('moment-timezone');

module.exports = {
    name: 'myverif',
    async execute(message, args) {
        // Check if the user has one of the allowed roles
        if (!message.member.roles.cache.some(role => config.allowedRoles.includes(role.id))) {
            return message.reply('You do not have permission to use this command.');
        }

        const timeFrame = args[0] || 'total';
        const validTimeFrames = ['day', 'week', 'month', 'total'];

        if (!validTimeFrames.includes(timeFrame)) {
            return message.reply('Invalid time frame. Valid options are: day, week, month, total.');
        }

        try {
            const now = moment().tz('Africa/Algiers');
            let startOfTimeFrame;

            if (timeFrame === 'day') {
                startOfTimeFrame = now.startOf('day');
            } else if (timeFrame === 'week') {
                startOfTimeFrame = now.startOf('week');
            } else if (timeFrame === 'month') {
                startOfTimeFrame = now.startOf('month');
            } else {
                startOfTimeFrame = null;
            }

            const matchStage = startOfTimeFrame ? { moderatorId: message.author.id, verificationDate: { $gte: startOfTimeFrame.toDate() } } : { moderatorId: message.author.id };

            const count = await Verification.countDocuments(matchStage);

            const embed = new EmbedBuilder()
                .setTitle(`Your Verifications (${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)})`)
                .setColor('#00FF00')
                .setDescription(`You have made ${count} verifications.`)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing myverif command:', error);
            message.reply('There was an error executing the myverif command.');
        }
    }
};
