export interface BrokerExchangeInterface {
    channel: any
    name: string | undefined | null
    type: 'direct' | 'fanout' | 'headers' | 'topic'
    durable: boolean
    autoDelete?: boolean
    internal?: boolean
}

export interface QueueTypeInterface {
    name: string | undefined | null,
    channel: any,
    options?: {
        durable: boolean,
        arguments?: {
            'x-queue-type'?: 'classic' | 'quorum' | 'stream',
            'x-dead-letter-exchange'?: string | string[] | null,
            'x-dead-letter-routing-key'?: string | string[] | null
        }
    }
}
export type EventPayload = {
    key: string
    expireOn: string
}
export type AuthSchemes = 
    | BasicAuth
    | ApiKey
    | BearerToken
    | NoAuth

type BasicAuth = {
    type: 'basic'
    username: string
    password: string
}
type ApiKey = {
    type: 'apikey'
    name: string
    value: string
}
type BearerToken = {
    type: 'bearerToken'
    token: string
}
type NoAuth = {
    type: 'no-auth'
}
type WebhookMethod = {
    method: 'webhook';
    url: string;
    auth?: AuthSchemes;
};

type RabbitMQMethod = {
    method: 'rabbitmq';
    url: string;
    exchange: string
    queue: string
    routing: string
};

type FunctionMethod = {
    method: 'function';
    onExpiration: (key: string) => Promise<any>;
};

type TransportMethod = 
    | WebhookMethod
    | RabbitMQMethod
    | FunctionMethod;

export type RexSyncInitConfig = {
    redisUrl: string
    transport: TransportMethod
    logExpireKey?: boolean
}
