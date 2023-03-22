/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
import Queue from '@segment/localstorage-retry';
import { getCurrentTimeFormatted } from './utils';

class CustomQueue {
  constructor() {
    this.transport = null;
    this.queue = null;
  }

  init(customTransport, queueOptions) {
    this.transport = customTransport;
    this.payloadQueue = new Queue(
      'rudder',
      queueOptions,
      function (item, done) {
        // apply sentAt at flush time and reset on each retry
        item.message.sentAt = getCurrentTimeFormatted();
        // send this item for processing, with a callback to enable queue to get the done status
        // eslint-disable-next-line no-use-before-define
        this.processQueueElement(
          item.type,
          item.message,
          // eslint-disable-next-line consistent-return
          function (err, res) {
            if (err) {
              return done(err);
            }
            done(null, res);
          },
        );
      }.bind(this),
    );

    // start queue
    this.payloadQueue.start();
  }

  /**
   * the queue item proceesor
   * @param {*} type the event type
   * @param {*} message
   * @param {*} queueFn the function to call after request completion
   */
  processQueueElement(type, message, queueFn) {
    try {
      this.transport.push(type, message);
    } catch (error) {
      queueFn(error);
    }
  }

  enqueue(message, type) {
    // add items to the queue
    this.payloadQueue.addItem({
      type,
      message,
    });
  }
}

export default CustomQueue;