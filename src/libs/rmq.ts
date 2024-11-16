import * as MessageBroker from 'amqplib';
import EventEmitter from 'events';
import { BrokerExchangeInterface, QueueTypeInterface } from "../../types";
import { RexSyncError } from './errHandler';

class RabbitInstance extends EventEmitter {
    private static instance: RabbitInstance;
    private connection: MessageBroker.Connection | null = null;
    private channel: MessageBroker.Channel | null = null;
    private attempt: number = 0;
    private maxAttempt: number = 20;
    private userClosedConnection: boolean = false;
    private defaultExchange: string = null;
    private readonly MIN_RETRY_INTERVAL = 5000; // 5 seconds for retry
    private readonly MAX_RETRY_INTERVAL = 10000; // 10 seconds max for retry
    private reconnecting: boolean = false;
    private rmqUrl: string = null

    private constructor() {
        super();
        this.setMaxListeners(20);
        this.onError = this.onError.bind(this);
        this.onClosed = this.onClosed.bind(this);
    }

    private calculateRetryInterval(): number {
        return Math.min(
            this.MIN_RETRY_INTERVAL * Math.pow(2, this.attempt),
            this.MAX_RETRY_INTERVAL
        );
    }

    private async cleanUp(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            };
        } catch (error) {
            // silent the error
        } finally {
            this.channel = null;
            this.connection = null;
            this.removeAllListeners();
        }
    }

    public static getInstance(): RabbitInstance {
        if (!RabbitInstance.instance) {
            RabbitInstance.instance = new RabbitInstance();
        }
        return RabbitInstance.instance;
    }

    public async setClosingState(value: boolean): Promise<void> {
        this.userClosedConnection = value;
        await this.cleanUp();
    }

    public async connect(): Promise<void> {
        if (this.connection) {
            this.emit('connected', { conn: this.connection, channel: this.channel });
            return;
        }
        try {
            const conn = await MessageBroker.connect(this.rmqUrl);
            const channel = await conn.createChannel();

            conn.on('error', this.onError);
            conn.on('close', this.onClosed);
            channel.on('error', this.onError);
            channel.on('close', this.onClosed);

            this.connection = conn;
            this.channel = channel;
            this.attempt = 0;
            this.reconnecting = false;

            this.emit('connected', { conn, channel });
        } catch (error: any) {
            this.handleError(error);
        }
    }

    public async initiateExchange({ ...args }: BrokerExchangeInterface): Promise<{ exchange: string, url: string}> {
        try {
            await args.channel.assertExchange(
                args.name || this.defaultExchange,
                args.type,
                {
                    durable: args.durable,
                    autoDelete: args.autoDelete,
                    internal: args.internal
                }
            );
            return {
                exchange: args.name || this.defaultExchange,
                url: this.rmqUrl
            }
        } catch (error) {
            this.onError(error);
            throw new RexSyncError(error.message);
        }
    }

    public async createQueue({ ...args }: QueueTypeInterface): Promise<void> {
        try {
            await args.channel.assertQueue(args.name, { ...args.options });
        } catch (error) {
            this.onError(error);
            throw new RexSyncError(error.message);
        }
    }

    private async reconnect(): Promise<void> {
        if (this.reconnecting || this.userClosedConnection) return; // Prevent multiple reconnection attempts
        
        this.reconnecting = true;
        this.attempt++;
        try {
            if (this.attempt > this.maxAttempt) {
                this.reconnecting = false;
                console.log(`[REXSYNC] Max reconnection attempts (${this.maxAttempt}) reached`);
                setTimeout(async () => {
                    this.attempt = 0;
                    await this.reconnect();
                }, 60000); // Retry after 1 minutes
                return;
            }
    
            this.emit('reconnect', this.attempt);
    
            setTimeout(async () => {
                await this.connect();
            }, this.calculateRetryInterval());
        } catch (error) {
            throw new RexSyncError(error.message)
        }
    }

    private async onError(error: any): Promise<void> {
        try {
            this.emit('error', error.code);
            await this.cleanUp();
            this.reconnecting = false;
            if (!this.userClosedConnection && error.message !== 'Connection closing') {
                if (['ENOTFOUND', 'ETIMEDOUT'].includes(error.code)) {
                    setTimeout(async () => {
                        await this.reconnect();
                    }, 35000)
                } else {
                    await this.reconnect();
                }
            }
            
        } catch (error) {
            throw new RexSyncError(error.message)
        }
    }

    private async onClosed(): Promise<void> {
        await this.cleanUp();
        if (!this.userClosedConnection) {
            await this.reconnect();
        }
    }

    private handleError(error: any): void {
        if (error.code === 'ECONNREFUSED') {
            this.emit('ECONNREFUSED', error.message);
        } else if (/ACCESS_REFUSED/gi.test(error.message)) {
            this.emit('ACCREFUSED', error.message);
        } else if (error.code === 'ENOTFOUND') {
            this.emit(`ENOTFOUND`, error.message);
        } else if (error.code === 'EHOSTUNREACH') {
            this.emit(`EHOSTUNREACH`, error)
        }
            
        this.onError(error);
    }
}

const sendMessage = async (
    payload: { key: string, expireOn: string },
    config: { exchange: string, queue?: string, routing?: string }
): Promise<void> => {
    const rbmq = RabbitInstance.getInstance();
    let rmqUrl: string | null = null;

    rbmq.on('connected', async (EventListener) => {
        const { channel, conn } = EventListener;

        try {
            // Initiate exchange
            const { exchange, url } = await rbmq.initiateExchange({
                name: config.exchange,
                type: `topic`,
                durable: true,
                autoDelete: false,
                internal: false,
                channel: channel
            });
            rmqUrl = url;
            // Create queue
            await rbmq.createQueue({
                name: config.queue,
                channel: channel,
                options: {
                    durable: true,
                    arguments: {
                        'x-queue-type': 'classic',
                        'x-dead-letter-exchange': exchange
                    }
                }
            });

            // Bind queue
            await channel.bindQueue(config.queue, exchange, config.routing);
            // Publish the message
            await channel.publish(exchange, config.routing, Buffer.from(JSON.stringify({...payload})));
            // Close the channel only after all operations are complete
            await rbmq.setClosingState(true);
        } catch (error) {
            //  if somehow the server throing EHOSTUNREACH error, throw that error to re-instate pgw push notif
            if (error.code === `EHOSTUNREACH`) {
                throw error;
            }
        } finally {
            await rbmq.setClosingState(true);
        }
    });

    rbmq.on('error', error => {
        console.info(`[RBMQ] Error: ${error}}`);
    });

    rbmq.on('ENOTFOUND', () => {
        console.error(`[RBMQ] Error: cannot reach ${rmqUrl.split('@')[1].split(`/`)[0]}.\n[RBMQ] Please check your internet connection}`);
    });

    rbmq.on('reconnect', attempt => {
        console.info(`[RBMQ] Retrying connect to: ${rmqUrl.split('@')[1]}, attempt: ${attempt}`);
    });

    rbmq.on('ECONNREFUSED', () => {
        console.error(`[RBMQ] Connection to ${rmqUrl.split('@')[1]} refused}`);
    });

    rbmq.on('access_refused', error => {
        console.info(`[RBMQ] Error: ${error.message}}`);
    });

    rbmq.on('EHOSTUNREACH', error => {
        throw error;
    })

    await rbmq.connect();
};


export { sendMessage }