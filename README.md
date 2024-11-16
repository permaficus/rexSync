# rexSync

rexSync is a lightweight NodeJS module designed to listen to Redis key expiration events in real-time. By leveraging Redis keyspace notifications, rexSync allows you to handle expired keys efficiently, whether it's for syncing data, triggering workflows, or maintaining logs. This module simplifies the process of capturing and responding to key expiration events, making it an essential tool for managing Redis cache objects.

### Key Features

* <b>Real-Time Expiration Listening:</b> Automatically listens to Redis key expiration events using keyspace notifications.

* <b>Lightweight and Fast:</b> Optimized for high-performance Redis environments with minimal overhead.

* <b>Easy Integration:</b> Simple to set up and integrate with existing Node.js applications.

* <b>Flexible Use Cases:</b> Ideal for data syncing, logging, workflow automation, and more.

<b>Configurable Storage Options:</b> Sync expired keys to databases or external systems (optional).