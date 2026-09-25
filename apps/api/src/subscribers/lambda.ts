import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import type { DomainEvent } from "../lib/events";
import { dispatch } from "./index";

/** SQS entry point. Failed messages are reported individually so only they are retried. */
export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      await dispatch(JSON.parse(record.body) as DomainEvent);
    } catch (error) {
      console.error(`Failed to process message ${record.messageId}`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}
