/**
 * Created by martin on 19.02.2017.
 */
import * as path from 'path';

const pkg = require(path.resolve(__dirname, '..', '..', 'package.json'));

export const VERSION = (pkg? pkg.version : 'unknown');