export type AuthSchemes = {
    type: 'basic' | 'oauth2' | 'apikey' | 'bearerToken';
    key: string
    value: string
};

// Define individual transport method types
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
    func: (args: any) => Promise<any>;
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
}
