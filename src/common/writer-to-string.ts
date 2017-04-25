import {Writable} from 'stream';
import {isString} from 'util';
/**
 * Created by martin on 20.02.2017.
 * A helper class for testing.
 * Can be used as a WritableStream and writes everything (synchronously) into a string,
 * that can easily be read by the tests.
 */

export class WriterToString extends Writable {

    private resultString: string;

    constructor() {
        super();
        this.resultString = '';
    }

    public _write(chunk: any, encoding: string, callback: Function): void {
        let chunkString;
        if (isString(chunk)) {
            chunkString = chunk;
        } else if (chunk instanceof Buffer) {
            chunkString = chunk.toString();
        } else {
            chunkString = new Buffer(chunk).toString(encoding);
        }
        this.resultString = this.resultString + chunkString;
        callback();
    }

    /**
     * Returns a string of everything, that was written to the stream so far.
     * @return {string}
     */
    public writtenData(): string {
        return this.resultString;
    }
}
