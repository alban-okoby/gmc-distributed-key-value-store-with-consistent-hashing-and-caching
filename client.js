/**
 * Simple client interface for the distributed KV store
 * Demonstrates transparency - client doesn't need to know about nodes
 */

const DistributedKVStore = require('./kvStore');

class KVClient {
    constructor() {
        this.store = new DistributedKVStore();
        this.initialized = false;
    }
    
    async initialize() {
        // Initialize with some nodes
        this.store.addNode('node1');
        this.store.addNode('node2');
        this.store.addNode('node3');
        this.initialized = true;
        console.log('Client initialized successfully\n');
    }
    
    async put(key, value) {
        if (!this.initialized) throw new Error('Client not initialized');
        return await this.store.put(key, value);
    }
    
    async get(key) {
        if (!this.initialized) throw new Error('Client not initialized');
        return await this.store.get(key);
    }
    
    async delete(key) {
        if (!this.initialized) throw new Error('Client not initialized');
        return await this.store.delete(key);
    }
    
    async getAll() {
        if (!this.initialized) throw new Error('Client not initialized');
        return this.store.getAllData();
    }
    
    getStats() {
        return this.store.getStats();
    }
}

// Example usage
async function main() {
    console.log('🌟 DISTRIBUTED KV STORE - CLIENT DEMO\n');
    
    const client = new KVClient();
    await client.initialize();
    
    // Client just uses simple put/get operations
    // No knowledge of underlying distribution
    
    console.log('📝 Storing data...');
    await client.put('user:101', '{"name":"Alice"}');
    await client.put('user:102', '{"name":"Bob"}');
    await client.put('user:103', '{"name":"Charlie"}');
    
    console.log('\n📖 Retrieving data...');
    for (let i = 101; i <= 103; i++) {
        const value = await client.get(`user:${i}`);
        console.log(`user:${i} = ${value}`);
    }
    
    console.log('\n📊 System statistics:');
    console.log(JSON.stringify(client.getStats(), null, 2));
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = KVClient;