import { redisSubscriber, RedisClientType} from "./libs/redis";
import { RedisVaultInitConfig } from "../types/index";
import HttpClient from "./libs/httpClient";

const apiConn = new HttpClient();

class RedisVault {
    private args: RedisVaultInitConfig;
    private client: RedisClientType;
    private redisChannel: string;

    constructor (args: RedisVaultInitConfig) {
        this.args = args
        this.init()
    }

    private init(): void {
        const redisClient = new redisSubscriber(this.args.redis_url);
        this.client = redisClient.client();
        this.redisChannel = redisClient.channel();
    }
    
    private async handleExpirationEvent(key: string, channel: string): Promise<void> {
        if (!channel) return;
        try {
            const { method, auth, url } = this.args.transport;
            
            if (method === "webhook") {
                await apiConn.send(key, { url, auth });
            }
        } catch (error) {
            console.error(`Error retrieving expired data for key ${key}:`, error);
        }
    }

    async startListening(): Promise<void> {
        await this.client.configSet("notify-keyspace-events", "Ex");
        this.client.subscribe(this.redisChannel, this.handleExpirationEvent.bind(this));
    }

}

export default RedisVault;