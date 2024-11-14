export type AuthSchemes = {
    type: 'ApiKey' | 'BearerToken' | 'BasicAuth'
    key?: string
    value?: string
}
type TransportMethod = {
    method: 'webhook' | 'rabbitmq' | 'kafka' | 'graphql'
    url: string
    auth?: AuthSchemes
}
export type RedisVaultInitConfig = {
    redis_url: string
    transport: TransportMethod
}