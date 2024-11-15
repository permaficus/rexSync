class RedisVaultError extends Error {
    constructor(message: string) {
        super(message)
        this.name = this.constructor.name

        Object.setPrototypeOf(this, RedisVaultError.prototype)
    }
}

export { RedisVaultError }