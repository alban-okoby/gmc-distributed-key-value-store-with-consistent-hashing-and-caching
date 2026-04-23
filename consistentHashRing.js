/**
 * Consistent Hash Ring Implementation
 * Handles distribution of keys across multiple nodes
 * Uses virtual nodes for better load balancing
 */

const crypto = require('crypto');

class ConsistentHashRing {
    constructor(virtualNodes = 150) {
        this.virtualNodes = virtualNodes;      // Number of virtual nodes per physical node
        this.ring = new Map();                  // hash -> physical node
        this.sortedHashes = [];                 // Sorted list of hash positions
        this.nodes = new Set();                 // Physical node identifiers
    }

    /**
     * Hash function using MD5 for consistent distribution
     * @param {string} key - Key to hash
     * @returns {number} - 64-bit integer hash
     */
    _hash(key) {
        const hash = crypto.createHash('md5').update(key).digest('hex');
        // Take first 8 characters (32 bits) and convert to integer
        return parseInt(hash.substring(0, 8), 16);
    }

    /**
     * Add a physical node to the ring with virtual replicas
     * @param {string} node - Physical node identifier (e.g., "node1")
     */
    addNode(node) {
        if (this.nodes.has(node)) {
            console.log(`⚠️ Node ${node} already exists`);
            return;
        }

        this.nodes.add(node);
        console.log(`➕ Adding node: ${node} with ${this.virtualNodes} virtual nodes`);

        // Create virtual nodes for better distribution
        for (let i = 0; i < this.virtualNodes; i++) {
            const virtualKey = `${node}:virtual:${i}`;
            const hashValue = this._hash(virtualKey);
            
            this.ring.set(hashValue, node);
            this.sortedHashes.push(hashValue);
        }

        // Sort the hash ring for binary search
        this.sortedHashes.sort((a, b) => a - b);
        
        console.log(`✅ Node ${node} added to ring`);
        console.log(`📊 Total positions on ring: ${this.ring.size}\n`);
    }

    /**
     * Remove a physical node and all its virtual replicas
     * @param {string} node - Physical node to remove
     */
    removeNode(node) {
        if (!this.nodes.has(node)) {
            console.log(`⚠️ Node ${node} does not exist`);
            return;
        }

        console.log(`➖ Removing node: ${node}`);

        // Remove all virtual nodes belonging to this physical node
        const toRemove = [];
        for (const [hashValue, physicalNode] of this.ring.entries()) {
            if (physicalNode === node) {
                toRemove.push(hashValue);
            }
        }

        for (const hashValue of toRemove) {
            this.ring.delete(hashValue);
            const index = this.sortedHashes.indexOf(hashValue);
            if (index !== -1) {
                this.sortedHashes.splice(index, 1);
            }
        }

        this.nodes.delete(node);
        console.log(`✅ Node ${node} removed from ring`);
        console.log(`📊 Remaining positions on ring: ${this.ring.size}\n`);
    }

    /**
     * Get the physical node responsible for a given key
     * @param {string} key - Data key
     * @returns {string} - Physical node identifier
     */
    getNode(key) {
        if (this.nodes.size === 0) {
            throw new Error('No nodes available in the ring');
        }

        const hashValue = this._hash(key);
        
        // Find the first node with hash >= key's hash
        let index = bisectLeft(this.sortedHashes, hashValue);
        
        // If we're at the end, wrap around to the beginning
        if (index === this.sortedHashes.length) {
            index = 0;
        }
        
        const assignedHash = this.sortedHashes[index];
        return this.ring.get(assignedHash);
    }

    /**
     * Get all nodes in the system
     * @returns {Array} - List of physical nodes
     */
    getAllNodes() {
        return Array.from(this.nodes);
    }

    /**
     * Get distribution of keys across nodes
     * @param {Array} keys - List of keys to analyze
     * @returns {Object} - Distribution map
     */
    getDistribution(keys) {
        const distribution = {};
        
        for (const node of this.nodes) {
            distribution[node] = 0;
        }
        
        for (const key of keys) {
            const node = this.getNode(key);
            distribution[node]++;
        }
        
        return distribution;
    }
}

/**
 * Binary search utility for sorted array
 * Returns the index where to insert value to maintain sorted order
 */
function bisectLeft(arr, value) {
    let left = 0;
    let right = arr.length;
    
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] < value) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    
    return left;
}

module.exports = ConsistentHashRing;