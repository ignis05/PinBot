/** @typedef {import("discord.js").Message} Message */
/** @typedef {import("discord.js").ContextMenuInteraction} ContextMenuInteraction */

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

		if (msg.pinned) {
			await msg.unpin()
			inter.reply('Unpinned message.')
		} else {
			await msg.pin()
			inter.reply('Pinned message.')
		}
	},
}
