import {IFileAccessConfiguration} from '../common/i-file-access-configuration';
import {FileAccessorType} from '../common/file-accessor-type';

interface SerializedFormV1 {
    version: '1';
    id: string;
    apiToken: string;
    repo: string;
    branch: string;
    path: string;
}

export class GithubConfiguration implements IFileAccessConfiguration {

    readonly type = FileAccessorType.GITHUB;

    static deserialize(serializedForm: string): GithubConfiguration {
        const v1 = JSON.parse(serializedForm) as SerializedFormV1;
        return new GithubConfiguration(v1.id, v1.apiToken, v1.repo, v1.branch, v1.path);
    }

    constructor(
        private _id: string|null,
        private _apiToken: string,
        private _repo: string,
        private _branch: string|null,
        private _path: string|null
    ) {}

    serialize(): string {
       const v1: SerializedFormV1 = {
           version: '1',
           id: this._id,
           apiToken: this._apiToken,
           repo: this._repo,
           branch: this._branch,
           path: this._path
       };
       return JSON.stringify(v1);
    }

    get id(): string {
        return this._id;
    }

    set id(newId: string) {
        this._id = newId;
    }

    get label(): string {
        return 'repository ' + this._repo;
    }

    get apiToken(): string {
        return this._apiToken;
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
}
