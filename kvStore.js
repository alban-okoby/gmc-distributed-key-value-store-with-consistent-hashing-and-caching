/**
 * Distributed Key-Value Store
 * Manages data across multiple nodes using consistent hashing
 * Provides transparency - clients don't know which node holds the data
 */

const ConsistentHashRing = require('./consistentHashRing');
const LRUCache = require('./cache');

class DistributedKVStore {
    constructor(virtualNodes = 150, cacheSize = 100, cacheTTL = 60000) {
        this.hashRing = new ConsistentHashRing(virtualNodes);
        this.nodes = new Map();           // node name -> node object
        this.cache = new LRUCache(cacheSize, cacheTTL);
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            totalOperations: 0
        };
    }

    /**
     * Add a new node to the system
     * @param {string} nodeName - Name of the node
     */
    addNode(nodeName) {
        if (this.nodes.has(nodeName)) {
            console.log(`⚠️ Node ${nodeName} already exists`);
            return;
        }

        // Create new node storage
        const node = {
            name: nodeName,
            data: new Map(),          // key -> value
            isHealthy: true,          // Simulate node failures
            failureProbability: 0.1   // 10% chance of failure for simulation
        };
        
        this.nodes.set(nodeName, node);
        this.hashRing.addNode(nodeName);
        
        this._rebalanceData(nodeName);
    }

    /**
     * Remove a node from the system
     * @param {string} nodeName - Name of the node to remove
     */
    removeNode(nodeName) {
        if (!this.nodes.has(nodeName)) {
            console.log(`⚠️ Node ${nodeName} does not exist`);
            return;
        }

        console.log(`🗑️ Removing node ${nodeName} and redistributing its data...`);
        
        // Get data from node being removed
        const node = this.nodes.get(nodeName);
        const dataToMove = new Map(node.data);
        
        // Remove node from hash ring
        this.hashRing.removeNode(nodeName);
        this.nodes.delete(nodeName);
        
        // Redistribute data to new responsible nodes
        for (const [key, value] of dataToMove) {
            const newNodeName = this.hashRing.getNode(key);
            const newNode = this.nodes.get(newNodeName);
            if (newNode && newNode.isHealthy) {
                newNode.data.set(key, value);
                console.log(`  ↪ Moved key "${key}" to ${newNodeName}`);
            }
        }
        
        // Clear cache entries for moved data
        for (const [key] of dataToMove) {
            this.cache.delete(key);
        }
        
        console.log(`✅ Node ${nodeName} removed successfully\n`);
    }

    /**
     * Rebalance data when a new node joins
     * @param {string} newNodeName - New node that joined
     */
    _rebalanceData(newNodeName) {
        console.log(`🔄 Rebalancing data for new node: ${newNodeName}`);
        let movedCount = 0;
        
        // Check all existing data across nodes
        for (const [nodeName, node] of this.nodes) {
            if (nodeName === newNodeName) continue;
            
            for (const [key, value] of node.data) {
                // Check if this key should now belong to the new node
                const responsibleNode = this.hashRing.getNode(key);
                if (responsibleNode === newNodeName) {
                    // Move data to new node
                    this.nodes.get(newNodeName).data.set(key, value);
                    node.data.delete(key);
                    movedCount++;
                    console.log(`  ↪ Moved key "${key}" to ${newNodeName}`);
                    
                    // Invalidate cache for moved key
                    this.cache.delete(key);
                }
            }
        }
        
        console.log(`📊 Moved ${movedCount} keys to ${newNodeName}\n`);
    }

    /**
     * Simulate node failure
     * @param {string} nodeName - Node to fail
     */
    simulateNodeFailure(nodeName) {
        if (!this.nodes.has(nodeName)) {
            console.log(`⚠️ Node ${nodeName} does not exist`);
            return;
        }
        
        const node = this.nodes.get(nodeName);
        node.isHealthy = false;
        console.log(`💀 Node ${nodeName} has FAILED!`);
        console.log(`⚠️ Data on failed node is temporarily unavailable\n`);
    }

    /**
     * Restore a failed node
     * @param {string} nodeName - Node to restore
     */
    restoreNode(nodeName) {
        if (!this.nodes.has(nodeName)) {
            console.log(`⚠️ Node ${nodeName} does not exist`);
            return;
        }
        
        const node = this.nodes.get(nodeName);
        node.isHealthy = true;
        console.log(`🔄 Node ${nodeName} has been RESTORED!\n`);
    }

    /**
     * Put a key-value pair into the store
     * @param {string} key - Data key
     * @param {any} value - Data value
     * @returns {boolean} - Success status
     */
    async put(key, value) {
        this.stats.totalOperations++;
        
        try {
            // Find responsible node
            const nodeName = this.hashRing.getNode(key);
            const node = this.nodes.get(nodeName);
            
            // Check if node is healthy
            if (!node || !node.isHealthy) {
                console.log(`❌ Cannot write "${key}" - node ${nodeName} is unavailable`);
                return false;
            }
            
            // Simulate random node failure (for demonstration)
            if (Math.random() < node.failureProbability) {
                console.log(`💥 Simulated failure: Node ${nodeName} failed during write`);
                return false;
            }
            
            // Write to node
            node.data.set(key, value);
            
            // Update cache
            this.cache.set(key, value);
            
            console.log(`✅ PUT "${key}" -> ${nodeName}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error writing "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Get a value from the store
     * @param {string} key - Data key
     * @returns {any|null} - Value or null if not found
     */
    async get(key) {
        this.stats.totalOperations++;
        
        // Check cache first
        const cachedValue = this.cache.get(key);
        if (cachedValue !== null) {
            this.stats.cacheHits++;
            console.log(`📖 GET "${key}" -> CACHE HIT`);
            return cachedValue;
        }
        
        this.stats.cacheMisses++;
        
        try {
            // Find responsible node
            const nodeName = this.hashRing.getNode(key);
            const node = this.nodes.get(nodeName);
            
            // Check if node is healthy
            if (!node || !node.isHealthy) {
                console.log(`❌ Cannot read "${key}" - node ${nodeName} is unavailable`);
                return null;
            }
            
            // Simulate random node failure (for demonstration)
            if (Math.random() < node.failureProbability) {
                console.log(`💥 Simulated failure: Node ${nodeName} failed during read`);
                return null;
            }
            
            // Get from node storage
            const value = node.data.get(key);
            
            if (value !== undefined) {
                // Update cache for future reads
                this.cache.set(key, value);
                console.log(`📖 GET "${key}" -> ${nodeName} (cache miss)`);
                return value;
            } else {
                console.log(`❓ GET "${key}" -> NOT FOUND`);
                return null;
            }
            
        } catch (error) {
            console.error(`❌ Error reading "${key}":`, error.message);
            return null;
        }
    }

    /**
     * Delete a key from the store
     * @param {string} key - Key to delete
     * @returns {boolean} - Success status
     */
    async delete(key) {
        this.stats.totalOperations++;
        
        try {
            const nodeName = this.hashRing.getNode(key);
            const node = this.nodes.get(nodeName);
            
            if (!node || !node.isHealthy) {
                console.log(`❌ Cannot delete "${key}" - node ${nodeName} is unavailable`);
                return false;
            }
            
            const deleted = node.data.delete(key);
            this.cache.delete(key);
            
            if (deleted) {
                console.log(`🗑️ DELETE "${key}" -> ${nodeName}`);
                return true;
            } else {
                console.log(`❓ DELETE "${key}" -> NOT FOUND`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Error deleting "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Get all data across all healthy nodes
     * @returns {Object} - All stored data
     */
    getAllData() {
        const allData = {};
        
        for (const [nodeName, node] of this.nodes) {
            if (node.isHealthy) {
                for (const [key, value] of node.data) {
                    allData[key] = {
                        value: value,
                        node: nodeName
                    };
                }
            }
        }
        
        return allData;
    }

    /**
     * Get system statistics
     * @returns {Object} - System stats
     */
    getStats() {
        let totalKeys = 0;
        let healthyNodes = 0;
        
        for (const [_, node] of this.nodes) {
            if (node.isHealthy) {
                healthyNodes++;
                totalKeys += node.data.size;
            }
        }
        
        const cacheHitRate = this.stats.cacheHits + this.stats.cacheMisses > 0
            ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2)
            : 0;
        
        return {
            nodes: {
                total: this.nodes.size,
                healthy: healthyNodes,
                failed: this.nodes.size - healthyNodes,
                names: Array.from(this.nodes.keys()),
                distribution: this.hashRing.getDistribution(Object.keys(this.getAllData()))
            },
            cache: this.cache.getStats(),
            operations: {
                total: this.stats.totalOperations,
                cacheHits: this.stats.cacheHits,
                cacheMisses: this.stats.cacheMisses,
                cacheHitRate: `${cacheHitRate}%`
            },
            storage: {
                totalKeys: totalKeys,
                data: this.getAllData()
            }
        };
    }
}

module.exports = DistributedKVStore;