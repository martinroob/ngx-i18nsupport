/**
 * Created by martin on 17.02.2017.
 */

export class XliffMergeError extends Error {

    constructor(msg: string) {
        super(msg);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, XliffMergeError.prototype);
    }
}