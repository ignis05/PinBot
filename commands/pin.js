/** @typedef {import("discord.js").Message} Message */
/** @typedef {import("discord.js").ContextMenuInteraction} ContextMenuInteraction */
/** @typedef {import("discord.js").MessageComponentInteraction} MessageComponentInteraction */

const { MessageActionRow, MessageButton, Collection } = require('discord.js')

const yesVotesLead = 5
const timeout = 1000 * 60 * 60

/**
 * Ends voting and checks results
 * @param {ContextMenuInteraction} inter
 * @param {Message} targetMsg
 * @param {Collection} results
 * @param {boolean} [unpin]
 */
async function endVoting(inter, targetMsg, results, unpin = false) {
	let { yes, no } = results.getCounts
	console.log(`yes: ${yes}, no: ${no}`)
	let lead = yes - no
	let resp = ''
	if (lead >= yesVotesLead) {
		resp = `${unpin ? 'Unp' : 'P'}inning the message`
		if (unpin) await targetMsg.unpin()
		else await targetMsg.pin()
	} else {
		resp = `Not enough "yes" votes to ${unpin && 'un'}pin the message`
	}
	inter.editReply({
		content: `${unpin ? 'Unp' : 'P'}in [this](${targetMsg.url}) message?\nVote results:\n\tyes: ${yes}\n\tno: ${no}\n${resp}`,
		ephemeral: false,
		embeds: [],
		components: [],
	})
}

module.exports = {
	interaction: {
		name: 'PIN',
		type: 3, // message
	},
	/** @param {ContextMenuInteraction} inter */
	async handler(inter) {
		/** @type {Message} */
		let msg = inter.options.getMessage('message')

		if (!msg.pinnable) {
			return inter.reply(
				`I'm missing permissions in this channel to pin this message ("view channel", "read message history" or "manage messages").`
			)
		}

		let unpin = msg.pinned

		// voting
		const row = new MessageActionRow().addComponents(
			new MessageButton().setCustomId('yes').setLabel('Yes').setStyle('SUCCESS'),
			new MessageButton().setCustomId('no').setLabel('No').setStyle('DANGER')
		)

		await inter.reply({ content: `${unpin ? 'Unp' : 'P'}in [this](${msg.url}) message?`, ephemeral: false, embeds: [], components: [row] })

		const collector = inter.channel.createMessageComponentCollector({ filter: (i) => i.message.interaction.id == inter.id, time: timeout })

		let votingDone = false

		// result collection
		const results = new Collection()
		Object.defineProperty(results, 'getCounts', {
			get: function () {
				let yes = this.filter((yes) => yes).size
				return { yes, no: this.size - yes }
			},
		})

		/** @param {MessageComponentInteraction} i */
		collector.on('collect', async (btInter) => {
			let votedYes = btInter.customId === 'yes'
			results.set(btInter.user.id, votedYes)

			let { yes, no } = results.getCounts

			await btInter.update(`${unpin ? 'Unp' : 'P'}in [this](${msg.url}) message? (yes:${yes}, no:${no})`)

			if (yes - no >= yesVotesLead) {
				votingDone = true
				endVoting(inter, msg, results, unpin)
			}
		})
		collector.on('end', (collected) => {
			if (!votingDone) endVoting(inter, msg, results, unpin)
		})
	},
}
