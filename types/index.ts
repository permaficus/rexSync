export type AuthSchemes = {
    type: 'basic' | 'apikey' | 'bearerToken' | 'no-auth';
    key: string
    value: string
};

type WebhookMethod = {
    method: 'webhook';
    url: string;
    auth?: AuthSchemes;
};

type RabbitMQMethod = {
    method: 'rabbitmq';
    url: string;
    auth?: AuthSchemes;
};

type KafkaMethod = {
    method: 'kafka';
    url: string;
    auth?: AuthSchemes;
};

type GraphQLMethod = {
    method: 'graphql';
    url: string;
    auth?: AuthSchemes;
};

type FunctionMethod = {
    method: 'function';
    onExpiration: (key: string) => Promise<any>;
};

type TransportMethod = 
    | WebhookMethod
    | RabbitMQMethod
    | KafkaMethod
    | GraphQLMethod
    | FunctionMethod;

export type RedisVaultInitConfig = {
    redis_url: string
    transport: TransportMethod
    logExpireKey?: boolean
}
