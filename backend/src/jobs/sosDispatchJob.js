import cron from 'node-cron';
import { dispatchDueSOSRequests } from '../services/sosDispatchService.js';

const CRON_EXPRESSION = '*/15 * * * * *';
let task = null;

export const startSOSDispatchJob = () => {
  if (task) {
    return task;
  }

  task = cron.schedule(CRON_EXPRESSION, async () => {
    try {
      await dispatchDueSOSRequests();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[sosDispatchJob] run failed', error.message || error);
    }
  });

  return task;
};
