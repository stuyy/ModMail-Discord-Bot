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
        client.emit('modMessage', collected.first(), user, guild);
    }
});

client.on('modMessage', (msg, user, guild) => {
    console.log(msg.content);
    console.log(user.username);
    console.log(guild.name)
});