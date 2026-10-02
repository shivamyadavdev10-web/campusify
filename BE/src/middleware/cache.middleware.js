import NodeCache from "node-cache";

// StdTTL: 5 minutes default cache time, checkperiod: 1 minute (disable interval in tests)
const cache = new NodeCache({ 
    stdTTL: 300, 
    checkperiod: process.env.NODE_ENV === 'test' ? 0 : 60 
});

/**
 * Advanced Dynamic Caching Middleware
 * Caches API responses to handle 10k+ concurrent users seamlessly.
 * @param {number} durationInSeconds - How long to cache the data
 */
export const apiCache = (durationInSeconds = 300) => {
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== "GET") {
            return next();
        }

        // Create a unique cache key based on URL and user
        const userId = req.user ? req.user._id.toString() : "public";
        const cacheKey = `${userId}__${req.originalUrl || req.url}`;

        const cachedResponse = cache.get(cacheKey);

        if (cachedResponse) {
            console.log(`[CACHE HIT] Delivering instant response for: ${req.originalUrl || req.url}`);
            res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
            return res.status(200).json(cachedResponse);
        } else {
            // Intercept res.json to store the response before sending it
            const originalJson = res.json;
            res.json = function (body) {
                // Only cache successful responses
                if (body && body.status === true) {
                    cache.set(cacheKey, body, durationInSeconds);
                    res.setHeader('Cache-Control', `public, max-age=${durationInSeconds}`);
                }
                originalJson.call(this, body);
            };
            next();
        }
    };
};

export const clearCache = () => {
    cache.flushAll();
    console.log("[CACHE CLEARED] All API caches have been flushed.");
};
