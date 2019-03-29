import {GenericFile} from '../common/generic-file';
import {IFileDescription} from '../common/i-file-description';
import {SerializationService} from '../../model/serialization.service';
import {IFile} from '../common/i-file';

interface SerializedFormV1 {
  version: '1';
  type: 'github';
  description: string;
  name: string;
  size: number;
  content: string;
  sha: string;
}

export class GithubFile extends GenericFile {
  sha?: string; // SHA1 of loaded file

  static deserialize(serializationService: SerializationService, serializedForm: string): GithubFile {
    const v1Object: SerializedFormV1 = JSON.parse(serializedForm);
    return new GithubFile(
      serializationService.deserializeIFileDescription(v1Object.description),
      v1Object.name,
      v1Object.size,
      v1Object.content,
      v1Object.sha);
  }

  constructor(_description: IFileDescription, _name: string, _size: number, _content: string, _sha: string) {
    super(_description, _name, _size, _content);
    this.sha = _sha;
  }

  public serialize(serializationService: SerializationService): string {
    return JSON.stringify({
      version: '1',
      type: 'github',
      description: this.description.serialize(serializationService),
      name: this.name,
      size: this.size,
      content: this.content,
      sha: this.sha
    } as SerializedFormV1);
  }

  /**
   * Return a copy that has some edited content.
   * @param newContent the changed content
   */
  public copyWithNewContent(newContent: string): IFile {
    return new GithubFile(this.description, this.name, newContent.length, newContent, this.sha);
  }

  /**
   * Create a copy that can be stored under a new location.
   * @param saveAs new location to save file
   */
  copyForNewDescription(saveAs: IFileDescription): IFile {
    return new GithubFile(saveAs, this.name, this.content.length, this.content, this.sha);
  }

}
