## Running the Project
```
node simulation.js
```



https://github.com/user-attachments/assets/e1b2c492-6bca-4ed6-b434-62c78720cb73




Expected output (partial)
```
🚀 INITIALIZING DISTRIBUTED KEY-VALUE STORE

============================================================
  1. ADDING NODES TO THE SYSTEM
============================================================

➕ Adding node: node1 with 150 virtual nodes
✅ Node node1 added to ring
📊 Total positions on ring: 150

➕ Adding node: node2 with 150 virtual nodes
✅ Node node2 added to ring
📊 Total positions on ring: 300

...

============================================================
  2. INSERTING SAMPLE DATA
============================================================

✅ PUT "user:101" -> node3
✅ PUT "user:102" -> node1
...

============================================================
  4. CACHE PERFORMANCE DEMONSTRATION
============================================================

First read (cache miss):
📖 GET "user:101" -> node3 (cache miss)

Second read (should be cache hit):
📖 GET "user:101" -> CACHE HIT

============================================================
  11. TRANSPARENCY DEMONSTRATION
============================================================

The client sees a single unified interface:
- No knowledge of which node stores which key
- Automatic handling of node failures
- Transparent caching for performance
- Automatic rebalancing when nodes join/leave

✅ All data operations completed successfully!
```

## Key Features Demonstrated

The following table summarizes the core features implemented in this distributed key-value storage system:

| Feature | Implementation |
|---------|----------------|
| **Consistent Hashing** | MD5 hashing + virtual nodes (150 per physical node) for balanced distribution across the hash ring |
| **Node Join** | `addNode()` method with automatic rebalancing - only O(k/M) keys are moved where k is total keys and M is number of nodes |
| **Node Leave** | `removeNode()` method with minimal data movement - only keys that hash to the leaving node are redistributed |
| **Caching** | LRU (Least Recently Used) cache with configurable TTL (Time-To-Live) expiration policy (default: 60 seconds) |
| **Node Failures** | `simulateNodeFailure()` with graceful degradation - read/write operations fail gracefully with clear error messages |
| **Transparency** | Client interface completely abstracts node-level complexity - operations use simple `get()`/`put()` methods without node awareness |
| **Performance** | Cache hits dramatically reduce latency from O(log n) network operations to O(1) memory lookups |

### Additional Technical Details

| Component | Technology/Approach |
|-----------|---------------------|
| **Hash Function** | MD5 (128-bit) converted to 32-bit integer for ring positions |
| **Virtual Nodes** | 150 replicas per physical node for improved load balancing |
| **Cache Algorithm** | LRU with doubly-linked list simulation using Map() and access order array |
| **Cache Capacity** | Configurable (default: 50 items) |
| **Cache TTL** | Configurable in milliseconds (default: 30 seconds) |
| **Failure Simulation** | Random probability (10%) of node unavailability during operations |
| **Data Structure** | Nested Map(): node name → node object → data Map() for actual storage |
| **Search Algorithm** | Binary search on sorted hash ring for O(log n) node lookup |

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Cache Hit Rate** | Improves from 0% to ~80%+ with repeated access patterns |
| **Data Movement on Join/Leave** | Approximately 1/M of total keys (where M = number of nodes) |
| **Hash Ring Lookup** | O(log(V × M)) where V = virtual nodes, M = physical nodes |
| **Cache Lookup** | O(1) amortized |
| **Write Operation** | O(log n) for node lookup + O(1) for storage |
