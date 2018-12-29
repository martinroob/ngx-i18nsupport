/**
 * Created by martin on 19.02.2017.
 */
import * as path from 'path';

let pkg = null;
try {
    pkg = require(path.resolve(__dirname, '..', 'package.json'));
} catch (e) {
    try {
        pkg = require(path.resolve(__dirname, '..', '..', 'package.json'));
    } catch (e) {
        pkg = null;
    }
}

export const VERSION = (pkg ? pkg.version : 'unknown');
