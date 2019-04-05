import {IFileAccessConfiguration} from '../common/i-file-access-configuration';
import {FileAccessorType} from '../common/file-accessor-type';
import {SerializationService} from '../../model/serialization.service';
import {IFileDescription} from '../common/i-file-description';
import {GithubFileDescription} from './github-file-description';

interface SerializedFormV1 {
    accessorType: FileAccessorType.GITHUB;
    version: '1';
    id: string;
    apiToken: string;
    owner: string;
    repo: string;
    branch: string;
    path: string;
}

export class GithubConfiguration implements IFileAccessConfiguration {

    readonly type = FileAccessorType.GITHUB;

    static deserialize(serializationService: SerializationService, serializedForm: string): GithubConfiguration {
        const v1 = JSON.parse(serializedForm) as SerializedFormV1;
        return new GithubConfiguration(v1.id, v1.apiToken, v1.owner, v1.repo, v1.branch, v1.path);
    }

    constructor(
        private _id: string|null,
        private _apiToken: string,
        private _owner: string,
        private _repo: string,
        private _branch: string|null,
        private _path: string|null
    ) {}

    serialize(serializationService: SerializationService): string {
       const v1: SerializedFormV1 = {
           accessorType: FileAccessorType.GITHUB,
           version: '1',
           id: this._id,
           apiToken: this._apiToken,
           owner: this._owner,
           repo: this._repo,
           branch: this._branch,
           path: this._path
       };
       return JSON.stringify(v1);
    }

    copy(): GithubConfiguration {
        return new GithubConfiguration(this._id, this._apiToken, this._owner, this._repo, this._branch, this._path);
    }

    get id(): string {
        return this._id;
    }

    set id(newId: string) {
        this._id = newId;
    }

    public equals(another: IFileAccessConfiguration): boolean {
        if (!another || another.type !== FileAccessorType.GITHUB) {
            return false;
        }
        const anotherGitConfiguration = another as GithubConfiguration;
        return this.apiToken === anotherGitConfiguration.apiToken
          && this.repo === anotherGitConfiguration.repo
          && this.branch === anotherGitConfiguration.branch
          && this.path === anotherGitConfiguration.path;
    }

    public shortLabel(): string {
        return 'repository ' + this._repo;
    }

    public fullLabel(): { maticon?: string; icon?: string; label: string } {
        const branch = (this._branch) ? this._branch : 'master';
        const owner = (this._owner) ? this._owner : '?';
        const repo = (this._repo) ? this._repo : '?';
        const path = (this._path) ? this._path : '';
        return {
            icon: 'Octocat.jpg',
            label: `${owner}/${repo}@${branch}/${path}`
        };
    }

    get apiToken(): string {
        return this._apiToken;
    }

    get owner(): string {
        return this._owner;
    }

    get repo(): string {
        return this._repo;
    }

    get branch(): string {
        return this._branch;
    }

    get path(): string {
        return this._path;
    }

    public rootDescription(): IFileDescription {
        return new GithubFileDescription('dir', this, '', '');
    }

    public directoryDescription(dirPath: string): IFileDescription {
        if (!dirPath) {
            dirPath = '';
        }
        const slashIndex = dirPath.lastIndexOf('/');
        const newName = (slashIndex >= 0) ? dirPath.substr(slashIndex + 1) : dirPath;
        return new GithubFileDescription('dir', this, dirPath, newName);
    }

    /**
     * Check, wether a publish is possible.
     */
    public canPublish(): boolean {
        return true;
    }

}
