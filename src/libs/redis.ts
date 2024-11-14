import { createClient, RedisClientType } from "redis";

class redisSubscriber {
    private redis_url: string
    private redis_channel: `__keyevent@0__:expired`;
    private subscriber: RedisClientType | null = null;

    constructor(redis_url: string) {
        this.redis_url = redis_url;
        this.init();
    }

    private init (): void {
        if (!this.subscriber) {
            this.subscriber = createClient({
                url: this.redis_url
            });
            this.subscriber.on('error', (err) => {
                console.error(`[REDIS] Connection Error: ${err.message || err.code}`);
            });
    
            this.subscriber.connect().catch((err) => {
                console.error(`[REDIS] Error during initial connection: ${err.message || err.code}`);
            });
        }
    }

    client (): RedisClientType {
        return this.subscriber;
    }
 
    channel (): string {
        return this.redis_channel;
    }
}

export { redisSubscriber, RedisClientType }