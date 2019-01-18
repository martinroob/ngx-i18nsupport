/**
 * A generic description of a "file".
 * It contains enough information to load and save it.
 */
import {FileAccessorType} from './file-accessor-type';

export interface IFileDescription {
    type(): FileAccessorType;
}
