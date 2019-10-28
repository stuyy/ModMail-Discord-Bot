require('dotenv').config();
const discord = require('discord.js');
const client = new discord.Client();

client.login(process.env.BOT_TOKEN);

const openedTickets = new Map();

client.on('ready', () => console.log(`${client.user.tag}`));
client.on('message', async (message) => {
    if(message.author.bot) return;
    if(message.channel.type === 'dm' && !openedTickets.has(message.author.id)) {
        // Check the Guilds the Bot and User have in common.
        openedTickets.set(message.author.id);
        let userId = message.author.id; 
        var memberGuilds = [];
        let user = client.users.get(userId);
        client.guilds.forEach(guild => {
            guild.members.has(user.id) ? memberGuilds.push(guild) : null
        });
        let embed = new discord.MessageEmbed();
        embed.setTitle(`Please choose which server`);
        let desc = ''; 
        memberGuilds.forEach(guild => desc += guild.name + '\n');
        embed.setDescription(`${desc}`);
        let msg = await message.channel.send(embed);
        let msgFilter = m => m.author.id === message.author.id;
        let collected = await msg.channel.awaitMessages(msgFilter, { max: 1 });
        let guild = memberGuilds.find(g => g.name.toLowerCase() === collected.first().content);
        openedTickets.set(message.author.id, guild);
        message.channel.send("Your message has been received, we will be with you shortly.");
        client.emit('modMessage', message, user, guild);
    }
});

client.on('modMessage', async (message, user, guild) => {
    // Find channel for guild...
    let channel = guild.channels.find(c => c.name === 'mod-mail');
    let embed = new discord.MessageEmbed();
    embed.setTitle("New Message from: " + user.tag);
    embed.addField("Guild", `${guild.name}`);
    embed.setDescription(`Message: ${message.content}`);
    let msg = await channel.send(embed);

    await msg.react('✅');
    await msg.react('❎');
    
    let reactionFilter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❎') && !user.bot;

    let collector = new discord.ReactionCollector(msg, reactionFilter, { max: 1 });
    collector.on('end', async collected => {
        console.log(collected);
        if(collected.first().emoji.name === '✅') {
            console.log(guild.id);
            let newChannel = await guild.channels.create(`${user.id}-channel`, {
                type: 'text',
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['VIEW_CHANNEL']
                    },
                    {
                        id: '533096507667382289',
                        allow: ['VIEW_CHANNEL']
                    }
                ]
            }).catch(err => console.log(err));
            newChannel.send("Case created for " + user.tag);
            let msgFilter = (m) => !m.author.bot;
            let messageCollector = newChannel.createMessageCollector(msgFilter);
            messageCollector.on('collect', m => {
                user.send(m);
            });
            messageCollector.on('end', collected => { 
                console.log('done')
            });
            let DMChannelCollector = user.dmChannel.createMessageCollector(msgFilter);
            DMChannelCollector.on('collect', m => {
                newChannel.send(m);
            });
            DMChannelCollector.on('end', c => console.log('done'));
        } 
        else if(collected.first().emoji.name === '❎') {
            user.send("Request denied.")
            openedTickets.delete(user.id);
        }
    });
});