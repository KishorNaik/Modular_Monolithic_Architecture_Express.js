import { logger } from "./logger";

export const Job = (callBack: Function) => {
    Promise.resolve(callBack()).catch(error => {
      logger.error(`Error in fire and forget job: ${error}`);
    });
  }