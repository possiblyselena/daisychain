import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	/** A hairclip that friends can send doodles to, found by its share-link name. */
	clips: defineTable({
		slug: v.string()
	}).index('by_slug', ['slug']),

	/** A doodle a friend sent to a hairclip. */
	doodles: defineTable({
		clipId: v.id('clips'),
		/** 128×64 pixels packed as hex (MicroPython MONO_HLSB): 2048 characters. */
		pixels: v.string(),
		/** Optional name of whoever sent it. */
		from: v.union(v.string(), v.null())
	}).index('by_clipId', ['clipId'])
});
