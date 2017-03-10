"use strict";
/**
 * Created by martin on 19.02.2017.
 */
var path = require("path");
var pkg = require(path.resolve(__dirname, '..', 'package.json'));
exports.VERSION = (pkg ? pkg.version : 'unknown');
