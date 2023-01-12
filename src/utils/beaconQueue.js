/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import { Store } from './storage/store';
import { replacer } from './utils';
import { handleError } from './errorHandler';

const defaults = {
  queue: 'queue',
  maxPayloadSize: 64 * 1000,
};

class BeaconQueue {
  constructor() {
    this.storage = Store;
    this.maxItems = 10;
    this.flushQueueTimeOut = undefined;
    this.timeOutActive = false;
    this.flushQueueTimeOutInterval = 1000 * 60 * 10; // 10 mins
    this.url = '';
    this.writekey = '';
    this.queueName = `${defaults.queue}.${Date.now()}`;
    this.send = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
  }

  sendQueueDataForBeacon() {
    this.sendDataFromQueueAndDestroyQueue();
  }

  init(writekey, url, options) {
    this.url = url;
    this.writekey = writekey;
    if (options.maxItems) this.maxItems = options.maxItems;
    if (options.flushQueueInterval) this.flushQueueTimeOutInterval = options.flushQueueInterval;
    const sendQueueData = this.sendQueueDataForBeacon.bind(this);
    window.addEventListener('unload', sendQueueData);
  }

  getQueue() {
    return this.storage.get(this.queueName);
  }

  setQueue(value) {
    this.storage.set(this.queueName, value);
  }

  enqueue(message) {
    let queue = this.getQueue() || [];
    queue = queue.slice(-(this.maxItems - 1));
    queue.push(message);
    let batch = queue.slice(0);
    const data = { batch };
    const dataToSend = JSON.stringify(data, replacer);
    if (dataToSend.length > defaults.maxPayloadSize) {
      batch = queue.slice(0, queue.length - 1);
      this.flushQueue(batch);
      queue = this.getQueue();
      queue.push(message);
    }
    this.setQueue(queue);
    this.setTimer();

    if (queue.length === this.maxItems) {
      this.flushQueue(batch);
    }
  }

  sendDataFromQueueAndDestroyQueue() {
    this.sendDataFromQueue();
    this.storage.remove(this.queueName);
  }

  sendDataFromQueue() {
    const queue = this.getQueue();
    if (queue && queue.length > 0) {
      const batch = queue.slice(0, queue.length);
      this.flushQueue(batch);
    }
  }

  flushQueue(batch) {
    batch.forEach((event) => {
      event.sentAt = new Date().toISOString();
    });
    const data = { batch };
    const payload = JSON.stringify(data, replacer);
    const blob = new Blob([payload], { type: 'text/plain' });
    try {
      const isPushed = this.send(`${this.url}?writeKey=${this.writekey}`, blob);
      if (!isPushed) {
        handleError(new Error("Unable to queue data to browser's beacon queue"));
      }
    } catch (e) {
      handleError(e);
    }
    this.setQueue([]);
    this.clearTimer();
  }

  setTimer() {
    if (!this.timeOutActive) {
      this.flushQueueTimeOut = setTimeout(
        this.sendDataFromQueue.bind(this),
        this.flushQueueTimeOutInterval,
      );
      this.timeOutActive = true;
    }
  }

  clearTimer() {
    if (this.timeOutActive) {
      clearTimeout(this.flushQueueTimeOut);
      this.timeOutActive = false;
    }
  }
}
export default BeaconQueue;
