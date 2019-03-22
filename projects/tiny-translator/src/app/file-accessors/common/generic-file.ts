import {IFile} from './i-file';
import {IFileDescription} from './i-file-description';
import {SerializationService} from '../../model/serialization.service';

interface SerializedFormV1 {
    version: '1';
    description: string;
    name: string;
    size: number;
    content: string;
}

export class GenericFile implements IFile {

    static deserialize(serializationService: SerializationService, serializedForm: string): GenericFile {
        const v1Object: SerializedFormV1 = JSON.parse(serializedForm);
        return new GenericFile(
            serializationService.deserializeIFileDescription(v1Object.description),
            v1Object.name,
            v1Object.size,
            v1Object.content);
    }

    constructor(public description: IFileDescription, public name: string, public size: number, public content: string) { }

    public serialize(serializationService: SerializationService): string {
        const v1Object: SerializedFormV1 = {
            version: '1',
            description: this.description.serialize(serializationService),
            name: this.name,
            content: this.content,
            size: this.size
        };
        return JSON.stringify(v1Object);
    }

    /**
     * Return a copy that has some edited content.
     * @param newContent the changed content
     */
    public copyWithNewContent(newContent: string): IFile {
        return new GenericFile(this.description, this.name, newContent.length, newContent);
    }

    /**
     * Create a copy that can be stored under a new location.
     * @param saveAs new location to save file
     */
    copyForNewDescription(saveAs: IFileDescription): IFile {
        return new GenericFile(saveAs, this.name, this.content.length, this.content);
    }

}
