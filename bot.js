const { exit } = require('process')
const fs = require('fs')

const Discord = require('discord.js')
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] })

// load token
try {
	var { token } = require('./data/token.json')
	if (token == 'bot_token_here') {
		console.error(`./data/token.json is placehoder`)
		exit(0)
	}
} catch (err) {
	if (!fs.existsSync('./data')) fs.mkdirSync('./data')
	fs.writeFileSync('./data/token.json', `{"token":"bot_token_here"}`)
	console.error('Token not found: You need to paste bot token to ./data/token.json')
	exit(0)
}

const commands = require('./commands')

client.on('ready', async () => {
	await client.application.fetch()
	client.application.owner.send('Active and ready')
	console.log('Ready!')
})

client.once('ready', () => {
	// save client id for register script
	fs.writeFileSync('./data/clientId.json', JSON.stringify({ clientId: client.user.id }))
})

client.on('guildCreate', (guild) => {
	client.application.owner.send(`${client.application.owner} - bot just joined a new guild: **${guild.name}**`)
})

/** @param {Discord.CommandInteraction} inter */
client.on('interactionCreate', (inter) => {
	if (!inter.isCommand() && !inter.isContextMenu()) return
	console.log(`Received interaction ${inter.commandName} from ${inter.user.tag}`)
	if (!inter.guild) return inter.reply({ content: "Bot doesn't work in DMs", ephemeral: true })

	if (!commands[inter.commandName]) return console.error(`interaction ${inter.commandName} not recognized`)

	commands[inter.commandName]?.handler(inter)
})

client.on('error', console.error)
client.login(token)
