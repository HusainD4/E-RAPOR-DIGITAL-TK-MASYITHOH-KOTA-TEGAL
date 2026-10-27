import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient, isRedisConnected } from '../../config/redis.config';
import { SendPdfPayload, sendPdfWithDelay } from '../messaging/messaging.service';

const QUEUE_NAME = 'wa-pdf-delivery';

// In-memory sequential queue fallback saat Redis tidak aktif
const inMemoryQueue: Array<{ id: string; payload: SendPdfPayload }> = [];
let isProcessingInMemory = false;

class QueueServiceClass {
  private bullQueue: Queue | null = null;

  async enqueue(payload: SendPdfPayload): Promise<string> {
    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      if (!this.bullQueue) {
        this.bullQueue = new Queue(QUEUE_NAME, {
          connection: { host: '127.0.0.1', port: 6379 },
        });
      }
      try {
        const reportId = payload.metadata?.reportId || Date.now();
        const studentId = payload.metadata?.studentId || 'std';
        const semester = payload.metadata?.semester || 'sem';
        const job = await this.bullQueue.add('send-pdf', payload, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          jobId: `${reportId}_${studentId}_${semester}_${Date.now()}`,
        });
        return job.id ?? 'unknown';
      } catch {
        // Fallback ke in-memory jika BullMQ gagal
      }
    }

    // In-memory fallback: proses antrean tanpa hang
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    inMemoryQueue.push({ id, payload });
    this.processInMemoryQueue();
    return id;
  }

  async enqueueBulk(items: SendPdfPayload[]): Promise<string[]> {
    const ids: string[] = [];
    for (const item of items) {
      ids.push(await this.enqueue(item));
    }
    return ids;
  }

  private async processInMemoryQueue(): Promise<void> {
    if (isProcessingInMemory || inMemoryQueue.length === 0) return;
    isProcessingInMemory = true;

    while (inMemoryQueue.length > 0) {
      const job = inMemoryQueue.shift();
      if (!job) break;
      try {
        await sendPdfWithDelay(job.payload);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        console.error(`[InMemoryQueue] Job ${job.id} failed: ${msg}`);
      }
    }
    isProcessingInMemory = false;
  }
}

export const queueService = new QueueServiceClass();
