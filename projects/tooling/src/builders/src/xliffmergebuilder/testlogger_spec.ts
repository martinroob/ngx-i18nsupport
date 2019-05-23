import {logging} from '@angular-devkit/core';

/**
 * TestLogger stores all log entries and has some tests to check logs.
 * (a helper class for testing)
 */
export class TestLogger extends logging.Logger {
  logs: string[];
  debugEnabled: boolean;

  constructor(name: string, parent?: logging.Logger|null) {
    super(name, parent);
    this.debugEnabled = false;
    this.logs = [];
    this.subscribe(ev => {
      if (this.debugEnabled) {
        console.log('LogEvent', ev);
      }
      this.logs.push(ev.message);
    });
  }

  public clear(): void {
    this.logs = [];
  }

  public debugEnable(flag: boolean) {
    this.debugEnabled = flag;
  }

  public includes(message: string): boolean {
    return this.logs.findIndex(msg => msg.indexOf(message) >= 0) >= 0;
  }

  public test(re: RegExp): boolean {
    return this.logs.findIndex(msg => re.test(msg)) >= 0;
  }

}
