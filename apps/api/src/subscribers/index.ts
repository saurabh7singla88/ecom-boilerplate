import type { DomainEvent, EventName, EventPayloads } from "../lib/events";

type Subscriber<Name extends EventName> = (data: EventPayloads[Name]) => Promise<void>;

/**
 * Event name → handlers, e.g.
 *   "order.paid": [sendOrderConfirmation, decrementStock],
 * Handlers must be idempotent: SQS delivers at least once.
 */
const subscribers: { [Name in EventName]?: Subscriber<Name>[] } = {};

export async function dispatch(event: DomainEvent): Promise<void> {
  const handlers: Subscriber<EventName>[] = subscribers[event.name] ?? [];
  if (handlers.length === 0) {
    console.warn(`No subscribers registered for event "${String(event.name)}"`);
    return;
  }
  await Promise.all(handlers.map((handler) => handler(event.data)));
}
