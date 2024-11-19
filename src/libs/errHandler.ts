class RexSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name

    Object.setPrototypeOf(this, RexSyncError.prototype)
  }
}

export { RexSyncError }