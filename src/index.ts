import { redisSubscriber, RedisClientType} from "./libs/redis";
import { EventPayload, RexSyncInitConfig } from "../types/index";
import HttpClient from "./libs/httpClient";
import { timeStamp } from "./helper/timeStamp";
import { sendMessage } from "./libs/rmq";
import { RexSyncError } from "./libs/errHandler";
import { isValidRabbitMQUrl, isValidUrl } from "./helper/urlValidator";

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

    private validateRabbitMQConfig (
        url: string,
        exchange: string | undefined,
        queue: string | undefined,
        routing: string | undefined
    ): void {
        if (!isValidRabbitMQUrl(url)) {
            throw new RexSyncError(
                `Invalid RabbitMQ URL. Ensure the URL follows the format: 
                'amqp(s)://[user:password@]host[:port][/vhost]'. Examples of valid URLs include:
                  - amqp://guest:guest@localhost:5672
                  - amqps://user:password@rabbit.example.com:5671/vhost
                  - amqp://localhost
                For more details, refer to the RabbitMQ URL specification.`
            );
        }
    
        if (!exchange || !queue || !routing) {
            throw new RexSyncError(
                "RabbitMQ transport requires 'exchange', 'queue', and 'routing' parameters."
            );
        }
    }

    private async handleWebhook(payload: EventPayload, transportConfig: Record<string, any>): Promise<void> {
        const { url, auth } = transportConfig;
        if (!isValidUrl(url)) throw new RexSyncError("Invalid URL. Please provide a valid and correctly formatted URL.");
        if (!url || !auth) throw new RexSyncError("Webhook transport requires 'url' and 'auth' parameters.");
        await apiConn.send(payload, { url, auth });
    }
    
    private async handleFunctionExpiration(key: string): Promise<void> {
        // @ts-ignore
        const { onExpiration } = this.args.transport;
        if (typeof onExpiration !== "function") {
            throw new RexSyncError("Function transport requires an 'onExpiration' callback.");
        }
        await onExpiration(key);
    }
    
    private async handleRabbitMQ(payload: EventPayload, transportConfig: Record<string, any>): Promise<void> {
        const { url, exchange, queue, routing } = transportConfig;
        this.validateRabbitMQConfig(url, exchange, queue, routing);
        await sendMessage(payload, { url, exchange, queue, routing });
    }

    private async handleExpirationEvent(key: string, channel: string): Promise<void> {
        if (!channel) return;
        try {
            if (this.args.logExpireKey) {
                console.log(`[REX-EVENT] ${timeStamp()}: Received expiration event for key: ${key}`)
            }
            const { method, ...transportConfig } = this.args.transport;
            const payload: EventPayload = { key, expireOn: timeStamp() };
    
            const methodHandlers: Record<string, () => Promise<void>> = {
                webhook: () => this.handleWebhook(payload, transportConfig),
                function: () => this.handleFunctionExpiration(key),
                rabbitmq: () => this.handleRabbitMQ(payload, transportConfig),
            };
    
            const handler = methodHandlers[method];
            if (!handler) {
                throw new RexSyncError(`Unsupported transport method: ${method}`);
            }
    
            await handler();
        } catch (error) {
            throw new RexSyncError(error.message)
        }
    }

    async startListening(): Promise<void> {
        await this.client.configSet("notify-keyspace-events", "Ex");
        this.client.subscribe(this.redisChannel, this.handleExpirationEvent.bind(this));
    }
}

export  { RexSync };