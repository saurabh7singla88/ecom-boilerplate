import { env } from "../env";

/**
 * Every domain event and its payload. Add entries as modules start emitting, e.g.
 *   "order.paid": { orderId: string };
 * then register handlers in src/subscribers/index.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- filled in as modules add events
export interface EventPayloads {}

export type EventName = keyof EventPayloads;

export interface DomainEvent<Name extends EventName = EventName> {
  name: Name;
  data: EventPayloads[Name];
}

/**
 * Publish an event for background processing. On AWS it goes to the SQS "Events" queue
 * (handled by src/subscribers/lambda.ts, with retries). Locally it runs the subscribers
 * in-process after the current request, so no queue is needed.
 */
export async function emit<Name extends EventName>(name: Name, data: EventPayloads[Name]) {
  const event: DomainEvent<Name> = { name, data };

  if (env.EVENTS_QUEUE_URL) {
    // Imported lazily so request paths that never emit don't pay for the SDK on cold start.
    const { SQSClient, SendMessageCommand } = await import("@aws-sdk/client-sqs");
    const sqs = new SQSClient({});
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: env.EVENTS_QUEUE_URL,
        MessageBody: JSON.stringify(event),
      }),
    );
    return;
  }

  const { dispatch } = await import("../subscribers");
  setImmediate(() => {
    dispatch(event).catch((error: unknown) =>
      console.error(`Subscriber failed for "${name}"`, error),
    );
  });
}
