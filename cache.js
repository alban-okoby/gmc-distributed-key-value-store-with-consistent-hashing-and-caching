/**
 * LRU (Least Recently Used) Cache Implementation
 * Improves read performance by caching frequently accessed data
 */

class LRUCache {
    constructor(capacity = 100, ttl = 60000) {  // TTL default: 60 seconds
        this.capacity = capacity;      // Maximum number of items in cache
        this.ttl = ttl;                // Time to live in milliseconds
        this.cache = new Map();        // key -> {value, timestamp}
        this.accessOrder = [];         // Queue for LRU ordering
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if not found/expired
     */
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }
        
        const item = this.cache.get(key);
        const now = Date.now();
        
        // Check if item has expired
        if (now - item.timestamp > this.ttl) {
            this.delete(key);
            return null;
        }
        
        // Update access order (move to end = most recently used)
        this._updateAccessOrder(key);
        
        return item.value;
    }

    /**
     * Store value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to store
     */
    set(key, value) {
        // If cache is at capacity, remove least recently used item
        if (this.cache.size >= this.capacity && !this.cache.has(key)) {
            this._evictLRU();
        }
        
        // Store or update the item
        this.cache.set(key, {
            value: value,
            timestamp: Date.now()
        });
        
        this._updateAccessOrder(key);
    }

    /**
     * Delete item from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        // Remove from access order
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Clear all items from cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            capacity: this.capacity,
            utilization: `${((this.cache.size / this.capacity) * 100).toFixed(2)}%`
        };
    }

    /**
     * Update access order (move key to end = most recently used)
     * @private
     */
    _updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * Evict the least recently used item
     * @private
     */
    _evictLRU() {
        if (this.accessOrder.length === 0) return;
        
        const lruKey = this.accessOrder.shift();
        this.cache.delete(lruKey);
        console.log(`🗑️ Cache evicted: ${lruKey}`);
    }
}

module.exports = LRUCache;