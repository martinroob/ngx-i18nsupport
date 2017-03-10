/**
 * Created by martin on 17.02.2017.
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var XliffMergeError = (function (_super) {
    __extends(XliffMergeError, _super);
    function XliffMergeError(msg) {
        var _this = _super.call(this, msg) || this;
        // Set the prototype explicitly.
        Object.setPrototypeOf(_this, XliffMergeError.prototype);
        return _this;
    }
    return XliffMergeError;
}(Error));
exports.XliffMergeError = XliffMergeError;
