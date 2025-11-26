import logger from "@/common/logger";
import { REDIS_URI } from "@/common/enviroment";
import { QueueOptions } from "bull";
import ioredis, { Redis } from "ioredis";

export class RedisAdapter {
	private static client: Redis;
	private static subscriber: Redis;
	private static allClients: Redis[] = [];

	static async getClient(): Promise<Redis> {
		if (!RedisAdapter.client) {
			await RedisAdapter.connect();
		}
		return RedisAdapter.client;
	}

	static async connect(overrideClient = true, options = {}): Promise<Redis> {
		const tmp = new ioredis(REDIS_URI, {
			lazyConnect: true,
			maxRetriesPerRequest: null,
			retryStrategy: (times) => {
				const delay = Math.min(times * 50, 2000);
				if (times < 5) {
					return delay;
				}
				process.exit(1);
			},
			...options,
		});

		tmp.on("ready", () => {
			logger.info("Connect to redis successfully!");
		});
		tmp.on("end", () => {
			logger.info("Connect to redis ended!");
		});

		tmp.on("error", (error) => {
			logger.error("Connect to redis error!", error);
		});

		try {
			await tmp.connect();
		} catch (error) {
			logger.error("Connect to redis error!", error);
			process.exit(1);
		}

		if (overrideClient) {
			RedisAdapter.client = tmp;
		}
		RedisAdapter.allClients.push(tmp);
		return tmp;
	}

	static async disconnect(): Promise<void> {
		logger.info("Closing redis connection...");
		try {
			await Promise.all(
				RedisAdapter.allClients.map((client) => client.quit())
			);
		} catch (error) {
			logger.error("Closing redis connection error!", error);
		}
	}

	static createClient(options = {}): Redis {
		const tmp = new ioredis(REDIS_URI, {
			maxRetriesPerRequest: null,
			retryStrategy: (times) => {
				const delay = Math.min(times * 50, 2000);
				if (times < 5) {
					return delay;
				}
				process.exit(1);
			},
			...options,
		});

		tmp.on("ready", () => {
			logger.info("(Create client) Connect to redis successfully!");
		});
		tmp.on("end", () => {
			logger.info("(Create client) Connect to redis ended!");
		});

		tmp.on("error", (error) => {
			logger.error("(Create client)Connect to redis error!", error);
			process.exit(1);
		});

		RedisAdapter.allClients.push(tmp);

		return tmp;
	}

	static async getQueueOptions(): Promise<QueueOptions> {
		if (!RedisAdapter.subscriber) {
			RedisAdapter.subscriber = await RedisAdapter.connect(false, {
				maxRetriesPerRequest: null,
				enableReadyCheck: false,
			});
		}
		return {
			prefix: `Jobs:`,
			defaultJobOptions: {
				removeOnComplete: 1000,
				removeOnFail: 1000,
			},
			createClient: (type) => {
				switch (type) {
					case "client":
						return RedisAdapter.client;
					case "subscriber":
						return RedisAdapter.subscriber;
					default:
						return RedisAdapter.createClient({
							maxRetriesPerRequest: null,
							enableReadyCheck: false,
						});
				}
			},
		};
	}

	static serialize(value: unknown): string {
		if (value) {
			return JSON.stringify(value);
		}
		return value as string;
	}

	static deserialize(value: unknown): unknown {
		if (value && typeof value === "string") {
			return JSON.parse(value);
		}
		return value;
	}

	static async get(key: string, shouldDeserialize = false): Promise<unknown> {
		const value = await (await RedisAdapter.getClient()).get(key);
		return shouldDeserialize ? RedisAdapter.deserialize(value) : value;
	}

	static async set(
		key: string,
		value: unknown,
		ttl = 0,
		shouldSerialize = false
	): Promise<unknown> {
		const stringValue: string = shouldSerialize
			? RedisAdapter.serialize(value)
			: (value as string);
		if (ttl > 0) {
			return (await RedisAdapter.getClient()).set(
				key,
				stringValue,
				"EX",
				ttl
			);
		}
		return (await RedisAdapter.getClient()).set(key, stringValue);
	}

	static async delete(key: string): Promise<unknown> {
		return (await RedisAdapter.getClient()).del(key);
	}
	static async deleteKeysWithPrefix(prefix: string): Promise<void> {
		let cursor = "0";
		do {
			const [newCursor, keys] = await (
				await RedisAdapter.getClient()
			).scan(cursor, "MATCH", `${prefix}*`);

			if (keys.length > 0) {
				await (await RedisAdapter.getClient()).del(...keys);
			}

			cursor = newCursor;
		} while (cursor !== "0");
	}
}
