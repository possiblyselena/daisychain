import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const ADJECTIVES = [
	'sparkly',
	'sunny',
	'fuzzy',
	'bubbly',
	'cosmic',
	'lucky',
	'mellow',
	'peachy',
	'dreamy',
	'zippy',
	'starry',
	'cozy',
	'glowy',
	'minty',
	'jolly',
	'velvet'
];
const NOUNS = [
	'bunny',
	'daisy',
	'comet',
	'panda',
	'otter',
	'mochi',
	'pixel',
	'kitten',
	'sprout',
	'boba',
	'clover',
	'froggy',
	'moth',
	'petal',
	'star',
	'dumpling'
];

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/** Creates a new hairclip with a friendly, unique share-link name like "sparkly-bunny-42". */
export const create = mutation({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		for (let attempt = 0; attempt < 20; attempt++) {
			const slug = `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(Math.random() * 90) + 10}`;
			const taken = await ctx.db
				.query('clips')
				.withIndex('by_slug', (q) => q.eq('slug', slug))
				.unique();
			if (!taken) {
				await ctx.db.insert('clips', { slug });
				return slug;
			}
		}
		throw new Error('Could not find a free name for your hairclip. Please try again.');
	}
});

/** Checks a share-link name exists. */
export const get = query({
	args: { slug: v.string() },
	returns: v.union(v.object({ slug: v.string() }), v.null()),
	handler: async (ctx, { slug }) => {
		const clip = await ctx.db
			.query('clips')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.unique();
		return clip ? { slug: clip.slug } : null;
	}
});
