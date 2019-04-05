/**
 * A generic entry in a file system.
 */
import {IFileAccessConfiguration} from './i-file-access-configuration';
import {SerializationService} from '../../model/serialization.service';

export interface IFileDescription {
  readonly type: 'dir'|'file';
  configuration: IFileAccessConfiguration;
  path: string; // path relative to configuration root (including filename as last part)
  name: string; // pathless filename
  children?: IFileDescription[]; // children if it is a directory and it is fully loaded

  /**
   * Return a string representation of translation file content.
   * This will be stored in BackendService.
   */
  serialize(serializationService: SerializationService): string;

  /**
   * Test for equality.
   * They are equal if they describe the same storage position.
   * @param another file description
   */
  equals(another: IFileDescription): boolean;

  /**
   * Test, whether it is a directory.
   */
  isDirectory(): boolean;

  /**
   * Return the directory of this file.
   * (or the parent, if it is directory)
   */
  dirname(): IFileDescription|null;

  /**
   * Create a new FileDescription with the given name under this file or directory.
   * If this is a normal file, it returns a file at the same path, but with new name.
   * If this is directory, it returns a file contained in the directory.
   * @param name name of file
   * @return file
   */
  createFileDescription(name: string): IFileDescription;
}
