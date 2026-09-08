/**
 * Job name -> payload shape for the default queue. Add new job types here
 * as you introduce them so `BullmqService.addJob` and the worker's
 * processor both get autocomplete + type checking for them.
 */
export interface DefaultQueueJobs {
  hello: { message: string };
}

export type DefaultQueueJobName = keyof DefaultQueueJobs & string;
