import { createClient, RedisClientType } from "redis";
import { RexSyncError } from "./errHandler"

class redisSubscriber {
    private redisUrl: string
    private redisChannel: `__keyevent@0__:expired`;
    private subscriber: RedisClientType | null = null;

    constructor(redisUrl: string) {
        if (!redisUrl) {
            this.handleError(`Error: Redis connection URL not specified. Please provide a valid Redis URL to establish the connection.`)
        }
        this.redisUrl = redisUrl;
        this.init();
    }

    private handleError(error: Error | string): void {
        const message = error instanceof Error ? error.message : error;
        throw new RexSyncError(message);
    }

    private init (): void {
        if (!this.subscriber) {
            this.subscriber = createClient({
                url: this.redisUrl
            });
            this.subscriber.on('error', (err) => {
                this.handleError(`[REDIS] Connection Error: ${err.message || err.code}`);
            });
    
            this.subscriber.connect().catch((err) => {
                this.handleError(`[REDIS] Error during initial connection: ${err.message || err.code}`);
            });
        }
    }

    client (): RedisClientType {
        return this.subscriber;
    }
 
    channel (): string {
        return this.redisChannel;
    }
}

export { redisSubscriber, RedisClientType }