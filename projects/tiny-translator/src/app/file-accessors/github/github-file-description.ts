import {SerializationService} from '../../model/serialization.service';
import {GithubConfiguration} from './github-configuration';
import {FileAccessorType} from '../common/file-accessor-type';
import {IFileDescription} from '../common/i-file-description';

interface SerializedFormV1 {
    accessorType: FileAccessorType.GITHUB;
    type: 'dir'|'file';
    version: '1';
    configuration: string;
    path: string;
    name: string;
    children?: string[];
}

export class GithubFileDescription implements IFileDescription {

    static deserialize(serializationService: SerializationService, serializedForm: string): GithubFileDescription {
        const v1Object: SerializedFormV1 = JSON.parse(serializedForm);
        const children = (v1Object.type === 'dir') ?
          v1Object.children.map(serializedChild => serializationService.deserializeIFileDescription(serializedChild)) :
          null;
        return new GithubFileDescription(
          v1Object.type,
          serializationService.deserializeIFileConfiguration(v1Object.configuration) as GithubConfiguration,
          v1Object.path,
          v1Object.name,
          children
        );
    }

    constructor(
      public readonly type: 'dir'|'file',
      public configuration: GithubConfiguration,
      public path: string,
      public name: string,
      public children?: IFileDescription[]) {}

    public serialize(serializationService: SerializationService): string {
        const v1Object: SerializedFormV1 = {
            accessorType: FileAccessorType.GITHUB,
            type: this.type,
            version: '1',
            configuration: this.configuration.serialize(serializationService),
            path: this.path,
            name: this.name,
            children: (this.children) ? this.children.map(fd => fd.serialize(serializationService)) : null

        };
        return JSON.stringify(v1Object);
    }

    public equals(another: IFileDescription): boolean {
        if (!another || !another.configuration) {
            return false;
        }
        if (!this.configuration.equals(another.configuration)) {
            return false;
        }
        return this.type === another.type
          && this.name === another.name
          && this.path === another.path;
    }

    /**
     * Test, whether it is a directory.
     */
    public isDirectory(): boolean {
        return this.type === 'dir';
    }

    /**
     * Return the directory of this file.
     * (or the parent, if it is directory)
     */
    public dirname(): IFileDescription|null {
        const slashIndex = this.path.lastIndexOf('/');
        if (slashIndex <= 0) {
            return null;
        }
        const mydir_path = this.path.substr(0, slashIndex - 1);
        const slashIndexPath = mydir_path.lastIndexOf('/');
        const mydir_name = (slashIndexPath >= 0) ? mydir_path.substr(slashIndexPath + 1) : mydir_path;
        return new GithubFileDescription('dir', this.configuration, mydir_path, mydir_name);
    }

    /**
     * Create a new FileDescription with the given name under this file or directory.
     * If this is a normal file, it returns a file at the same path, but with new name.
     * If this is directory, it returns a file contained in the directory.
     * @param newName name of file
     * @return file
     */
    public createFileDescription(newName: string): IFileDescription {
        if (this.isDirectory()) {
            const newPath = this.path ? this.path + '/' + newName : newName;
            return new GithubFileDescription('file', this.configuration, newPath, newName);
        } else {
            const dir = this.dirname();
            if (dir) {
                return dir.createFileDescription(newName);
            } else {
                return null;
            }
        }
    }

}
