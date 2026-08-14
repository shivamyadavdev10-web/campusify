/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🚀 SimpleCache — Zero-Dependency In-Memory LRU-TTL Cache
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Purpose: Reduces MongoDB load by caching frequently accessed data in memory.
 * Used by: bunny.controller.js (stream URLs), isLoggedIn.middleware.js (user auth)
 * 
 * Design:
 *   - LRU eviction: Least Recently Used items evicted when maxSize is reached
 *   - TTL expiration: Items auto-expire after configurable ttlMs
 *   - Zero dependencies: Uses native JS Map (ordered by insertion)
 *   - Memory safe: Bounded by maxSize to prevent OOM on 512MB Render Free Tier
 * 
 * Memory footprint estimate:
 *   - 1,000 cached stream URLs ≈ 2-3 MB
 *   - 2,000 cached user objects ≈ 8-12 MB
 *   - Total ≈ 10-15 MB (well within 512MB limit)
 */

class SimpleCache {
    /**
     * @param {number} maxSize - Maximum number of entries (default: 1000)
     * @param {number} ttlMs - Time-to-live in milliseconds (default: 5 minutes)
     */
    constructor(maxSize = 1000, ttlMs = 5 * 60 * 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    /**
     * Retrieves a cached value by key. Returns null if expired or missing.
     * Refreshes LRU position on access (move-to-end).
     * @param {string} key
     * @returns {*|null}
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check TTL expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end for LRU (most recently used = last)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }

    /**
     * Stores a value with automatic TTL expiration.
     * Evicts the least recently used entry if cache is full.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        // If key already exists, delete it first (to refresh position)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest entry if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    /**
     * Removes a specific key from the cache.
     * Useful for invalidation after admin updates (e.g., banning a user).
     * @param {string} key
     * @returns {boolean} true if the key existed
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clears all cached entries.
     * Useful for admin "clear cache" endpoint if ever needed.
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Returns current number of (possibly expired) entries.
     * @returns {number}
     */
    get size() {
        return this.cache.size;
    }
}

export default SimpleCache;
