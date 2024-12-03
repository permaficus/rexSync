# rexSync

rexSync is a lightweight NodeJS module designed to listen to Redis key expiration events in real-time. By leveraging Redis keyspace notifications, rexSync allows you to handle expired keys efficiently, whether it's for syncing data, triggering workflows, or maintaining logs. This module simplifies the process of capturing and responding to key expiration events, making it an essential tool for managing Redis cache objects.

### Key Features

* <b>Real-Time Expiration Listening:</b> Automatically listens to Redis key expiration events using keyspace notifications.
* <b>Lightweight and Fast:</b> Optimized for high-performance Redis environments with minimal overhead.
* <b>Easy Integration:</b> Simple to set up and integrate with existing Node.js applications.
* <b>Flexible Use Cases:</b> Ideal for data syncing, logging, workflow automation, and more.
* <b>Configurable Storage Options:</b> Sync expired keys to databases or external systems (optional).

### Installation
```bash
# install locally
npm i --save rexsync
```

### Usage
```javascript
// ES6 import
import { RexSync } from "rexsync";

const rex = new RexSync({
    redisUrl: "<redis-url>",
    
    // Enable or disable logging of expired keys.
    // Set to `true` to log which key expired, or `false` to disable logging.
    logExpireKey: true, // or false
    
    // Define the transport method for handling expiration events.
    transport: {
        // Option 1: Use a custom function to handle expiration events.
        method: "function",
        onExpiration: async (key) => {
            // Handle the expired key as needed.
            // For example, refresh your Redis cache or synchronize it with your database:
            await refreshCache(key);
        }
    },
    
    // Option 2: Use a webhook to handle expiration events.
    transport: {
        method: "webhook",
        url: "https://yourapp.com/webhooks",
        auth: {
            type: 'apikey', // Valid types: 'bearerToken', 'basic', 'apikey', or 'no-auth'.
            name: 'x-api-key',
            value: '<your-api-key>'
        }
    },
    
    // Option 3: Use RabbitMQ to handle expiration events.
    transport: {
        method: "rabbitmq",
        exchange: "<rabbitmq-exchange>",
        type: "<rabbitmq-exchange-type>",
        queue: "<rabbitmq-queue>",
        routing: "<rabbitmq-routing-key>",
        url: "<rabbitmq-url>"
    }
});

// Start listening for key expiration events.
rex.startListening();

```
>[!NOTE]
>
> The `type` in RabbitMQ transport defines the exchange type used for routing messages. Supported types are: `direct`, `fanout`, `headers`, `topic`, and `x-consistent-hash`. If no type is specified, the default exchange type is `topic`.

### Webhook Auth

1. `bearerToken`

```javascript
transport: {
    method: "webhook",
    auth: {
        type: "bearerToken",
        token: "<authorization token>"
    }
}
```

2. `basic`

```javascript
transport: {
    method: "webhook",
    auth: {
        type: "basic",
        username: "<username>",
        password: "<password>"
    }
}
```
