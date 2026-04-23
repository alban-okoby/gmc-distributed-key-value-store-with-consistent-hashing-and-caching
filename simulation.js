/**
 * Main Simulation Script
 * Demonstrates all features of the distributed KV store
 */

const DistributedKVStore = require('./kvStore');

// Sample data from requirements
const sampleData = {
    "user:101": { "name": "Alice" },
    "user:102": { "name": "Bob" },
    "user:103": { "name": "Charlie" },
    "user:104": { "name": "Diana" },
    "user:105": { "name": "Eve" },
    "user:106": { "name": "Frank" }
};

/**
 * Sleep utility for better readability in simulation
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print section divider
 */
function printDivider(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60) + '\n');
}

/**
 * Main simulation function
 */
async function runSimulation() {
    console.log('\n🚀 INITIALIZING DISTRIBUTED KEY-VALUE STORE\n');
    
    // Create distributed KV store with 3 physical nodes
    const store = new DistributedKVStore(
        150,    // 150 virtual nodes per physical node
        50,     // Cache capacity: 50 items
        30000   // Cache TTL: 30 seconds
    );
    
    // 1. Add initial nodes
    printDivider('1. ADDING NODES TO THE SYSTEM');
    store.addNode('node1');
    store.addNode('node2');
    store.addNode('node3');
    
    await sleep(1000);
    
    // 2. Insert sample data
    printDivider('2. INSERTING SAMPLE DATA');
    for (const [key, value] of Object.entries(sampleData)) {
        await store.put(key, JSON.stringify(value));
        await sleep(100);
    }
    
    await sleep(1000);
    
    // 3. Display initial system state
    printDivider('3. INITIAL SYSTEM STATE');
    console.log(JSON.stringify(store.getStats(), null, 2));
    
    await sleep(1000);
    
    // 4. Demonstrate cache performance
    printDivider('4. CACHE PERFORMANCE DEMONSTRATION');
    console.log('First read (cache miss):');
    await store.get('user:101');
    
    console.log('\nSecond read (should be cache hit):');
    await store.get('user:101');
    
    await sleep(1000);
    
    // 5. Add a new node (demonstrate rebalancing)
    printDivider('5. ADDING NEW NODE - REBALANCING DEMONSTRATION');
    store.addNode('node4');
    
    console.log('\n📊 Verifying data distribution after adding node4:');
    const statsAfterAdd = store.getStats();
    console.log('Node distribution:', statsAfterAdd.nodes.distribution);
    
    await sleep(1000);
    
    // 6. Simulate node failure
    printDivider('6. NODE FAILURE SIMULATION');
    console.log('Attempting to read data before failure:');
    await store.get('user:103');
    await store.get('user:104');
    
    console.log('\n💣 Simulating node2 failure...');
    store.simulateNodeFailure('node2');
    
    console.log('\nAttempting to read data from failed node:');
    await store.get('user:103');  // This might fail if on node2
    await store.get('user:104');
    
    await sleep(1000);
    
    // 7. Restore failed node
    printDivider('7. NODE RESTORATION');
    store.restoreNode('node2');
    
    console.log('\nAttempting to read after restoration:');
    await store.get('user:103');
    
    await sleep(1000);
    
    // 8. Remove a node (demonstrate minimal data movement)
    printDivider('8. REMOVING NODE - MINIMAL DATA MOVEMENT');
    console.log('Current node distribution before removal:');
    const beforeRemoval = store.getStats();
    console.log('Distribution:', beforeRemoval.nodes.distribution);
    
    store.removeNode('node1');
    
    console.log('\nDistribution after removal:');
    const afterRemoval = store.getStats();
    console.log('Distribution:', afterRemoval.nodes.distribution);
    
    await sleep(1000);
    
    // 9. Update and delete operations
    printDivider('9. UPDATE AND DELETE OPERATIONS');
    console.log('Updating user:101...');
    await store.put('user:101', JSON.stringify({ name: "Alice Updated", age: 30 }));
    
    console.log('\nReading updated value:');
    const updatedValue = await store.get('user:101');
    console.log('Value:', updatedValue);
    
    console.log('\nDeleting user:106...');
    await store.delete('user:106');
    
    console.log('\nAttempting to read deleted value:');
    await store.get('user:106');
    
    await sleep(1000);
    
    // 10. Final system statistics
    printDivider('10. FINAL SYSTEM STATISTICS');
    const finalStats = store.getStats();
    console.log(JSON.stringify(finalStats, null, 2));
    
    // 11. Transparency demonstration
    printDivider('11. TRANSPARENCY DEMONSTRATION');
    console.log('The client sees a single unified interface:');
    console.log('- No knowledge of which node stores which key');
    console.log('- Automatic handling of node failures');
    console.log('- Transparent caching for performance');
    console.log('- Automatic rebalancing when nodes join/leave');
    
    console.log('\n✅ All data operations completed successfully!');
}

// Run the simulation
runSimulation().catch(console.error);