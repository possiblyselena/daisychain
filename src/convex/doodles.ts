import { mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';

const PIXELS_PATTERN = /^[0-9a-f]{2048}$/;
const MAX_NAME_LENGTH = 24;

/** A friend sends a doodle to a hairclip. */
export const send = mutation({
	args: { slug: v.string(), pixels: v.string(), from: v.union(v.string(), v.null()) },
	returns: v.null(),
	handler: async (ctx, { slug, pixels, from }) => {
		const clip = await ctx.db
			.query('clips')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.unique();
		if (!clip) throw new ConvexError('That hairclip link doesn’t exist.');
		if (!PIXELS_PATTERN.test(pixels)) throw new ConvexError('That doodle isn’t the right size.');
		const name = from?.trim().slice(0, MAX_NAME_LENGTH) || null;
		await ctx.db.insert('doodles', { clipId: clip._id, pixels, from: name });
		return null;
	}
});

/** The owner of a hairclip deletes a doodle they received. */
export const remove = mutation({
	args: { id: v.id('doodles'), ownerKey: v.string() },
	returns: v.null(),
	handler: async (ctx, { id, ownerKey }) => {
		const doodle = await ctx.db.get('doodles', id);
		if (!doodle) return null; // Already deleted.
		const clip = await ctx.db.get('clips', doodle.clipId);
		if (!clip) return null;
		if (clip.ownerKey === undefined) {
			// Links made before deleting existed have no key yet: the owner's first delete claims it.
			if (ownerKey.length < 16 || ownerKey.length > 100)
				throw new ConvexError('Invalid owner key.');
			await ctx.db.patch('clips', clip._id, { ownerKey });
		} else if (clip.ownerKey !== ownerKey) {
			throw new ConvexError('Only the owner of this hairclip can delete its doodles.');
		}
		await ctx.db.delete('doodles', id);
		return null;
	}
});

/** The newest doodles sent to a hairclip (newest first). Updates live. */
export const latest = query({
	args: { slug: v.string() },
	returns: v.array(
		v.object({
			_id: v.id('doodles'),
			_creationTime: v.number(),
			pixels: v.string(),
			from: v.union(v.string(), v.null())
		})
	),
	handler: async (ctx, { slug }) => {
		const clip = await ctx.db
			.query('clips')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.unique();
		if (!clip) return [];
		const doodles = await ctx.db
			.query('doodles')
			.withIndex('by_clipId', (q) => q.eq('clipId', clip._id))
			.order('desc')
			.take(50);
		return doodles.map(({ _id, _creationTime, pixels, from }) => ({
			_id,
			_creationTime,
			pixels,
			from
		}));
	}
});
