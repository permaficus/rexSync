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
// ES6
import { RexSync } from "rexsync";

const rex = new RexSync({
    redisUrl: "<redis-url">,
    // Print out which key is expired. set to false to deactivate
    logExpireKey: true or false,
    // There are 3 method you can select to 
    transport: {
        method: "function",
        onExpiration: async (key) => {
            // do whatever you want with this key.
            // you can re-sync your cache by fetching the data from your DB or
            // refresh your redis cache object with this key
            // example:
            await refreshCache(key)
        }
    }
    // Using webhooks
    transport: {
        method: "webhook",
        url: "https://yourapp.com/webhooks",
        auth: {
            type: 'apikey', // valid type: bearerToken, basic, apikey and no-auth
            key: 'x-api-key',
            value: '<your api key>'
        }
    }
    // Using RabbitMQ
    transport: {
        method: "rabbitmq",
        exchange: "<rabbitmq-exchange>",
        queue: "<rabbitmq-queue>",
        routing: "<rabbitmq-routing-key>",
        url: "<rabbitmq-url>"
    }
})
```