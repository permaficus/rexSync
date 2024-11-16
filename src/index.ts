import { redisSubscriber, RedisClientType} from "./libs/redis";
import { RexSyncInitConfig } from "../types/index";
import HttpClient from "./libs/httpClient";
import { timeStamp } from "./helper/timeStamp";

const apiConn = new HttpClient();

class RexSync {
    private args: RexSyncInitConfig;
    private client: RedisClientType;
    private redisChannel: string;

    constructor (args: RexSyncInitConfig) {
        this.args = args
        this.init()
    }

    private init(): void {
        const redis = new redisSubscriber(this.args.redisUrl);
        this.client = redis.client();
        this.redisChannel = redis.channel();
    }
    
    private async handleExpirationEvent(key: string, channel: string): Promise<void> {
        if (!channel) return;
        try {
            if (this.args.logExpireKey) {
                console.log(`[REX-EVENT] ${timeStamp()}: Received expiration event for key: ${key}`)
            }
            const { method } = this.args.transport;
            
            if (method === "webhook") {
                await apiConn.send(key, { url: this.args.transport.url, auth: this.args.transport.auth });
            }
            if (method === "function") {
                await this.args.transport.onExpiration(key);
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    async startListening(): Promise<void> {
        await this.client.configSet("notify-keyspace-events", "Ex");
        this.client.subscribe(this.redisChannel, this.handleExpirationEvent.bind(this));
    }

}

export default RexSync;