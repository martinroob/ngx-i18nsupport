"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require("stream");
var util_1 = require("util");
/**
 * Created by martin on 20.02.2017.
 * A helper class for testing.
 * Can be used as a WritableStream and writes everything (synchronously) into a string,
 * that can easily be read by the tests.
 */
var WriterToString = (function (_super) {
    __extends(WriterToString, _super);
    function WriterToString() {
        var _this = _super.call(this) || this;
        _this.resultString = '';
        return _this;
    }
    WriterToString.prototype._write = function (chunk, encoding, callback) {
        var chunkString;
        if (util_1.isString(chunk)) {
            chunkString = chunk;
        }
        else if (chunk instanceof Buffer) {
            chunkString = chunk.toString();
        }
        else {
            chunkString = new Buffer(chunk).toString(encoding);
        }
        this.resultString = this.resultString + chunkString;
        callback();
    };
    /**
     * Returns a string of everything, that was written to the stream so far.
     * @return {string}
     */
    WriterToString.prototype.writtenData = function () {
        return this.resultString;
    };
    return WriterToString;
}(stream_1.Writable));
exports.WriterToString = WriterToString;
