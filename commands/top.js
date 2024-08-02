const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Verification = require('../models/Verification');
const config = require('../config.json');

module.exports = {
    name: 'top',
    async execute(message, args, client) {
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
            // Aggregate verifications by moderatorId, excluding those with zero verifications
            const aggregation = await Verification.aggregate([
                {
                    $group: {
                        _id: "$moderatorId",
                        count: { $sum: `$counts.${timeFrame}` }
                    }
                },
                {
                    $match: { count: { $gt: 0 } } // Exclude users with zero verifications
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            if (aggregation.length === 0) {
                return message.channel.send('No verifications yet.');
            }

            const itemsPerPage = 5;
            let page = 0;

            const generateEmbed = (start) => {
                const current = aggregation.slice(start, start + itemsPerPage);
                const topVerifiers = current.map((item, index) => {
                    const moderator = message.guild.members.cache.get(item._id);
                    return `#${start + index + 1} ${moderator ? `${moderator.user.tag} (<@${moderator.id}>)` : 'Unknown'} - ${item.count} verifications`;
                });

                const embed = new EmbedBuilder()
                    .setTitle(`Top Verifiers (${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)})`)
                    .setColor('#00FF00')
                    .setDescription(topVerifiers.join('\n') || 'No verifications yet.')
                    .setFooter({ text: `Page ${page + 1} of ${Math.ceil(aggregation.length / itemsPerPage)}` })
                    .setTimestamp();

                return embed;
            };

            const canFitOnOnePage = aggregation.length <= itemsPerPage;
            const embedMessage = await message.channel.send({
                embeds: [generateEmbed(0)],
                components: canFitOnOnePage ? [] : [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === Math.ceil(aggregation.length / itemsPerPage) - 1)
                )]
            });

            if (canFitOnOnePage) return;

            const collector = embedMessage.createMessageComponentCollector({
                filter: interaction => interaction.user.id === message.author.id,
                time: 60000
            });

            collector.on('collect', interaction => {
                if (interaction.customId === 'prev') {
                    page--;
                } else if (interaction.customId === 'next') {
                    page++;
                }

                interaction.update({
                    embeds: [generateEmbed(page * itemsPerPage)],
                    components: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === Math.ceil(aggregation.length / itemsPerPage) - 1)
                    )]
                });
            });

            collector.on('end', () => {
                embedMessage.edit({ components: [] });
            });
        } catch (error) {
            console.error('Error executing top command:', error);
            message.reply('There was an error executing the top command.');
        }
    }
};
