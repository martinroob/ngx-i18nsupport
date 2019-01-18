/**
 * Interface to read and save file like objects from a backend system.
 */
import {Observable} from 'rxjs';
import {IFile} from './i-file';
import {IFileDescription} from './i-file-description';

export interface IFileAccessService {

    /**
     * Load a file from the backend system.
     * @param desription backend dependent description of the file to load.
     * @return Observable of the loaded file.
     */
    load(description: IFileDescription): Observable<IFile>;

    /**
     * Save a file in the backend.
     * @param file file loaded from the same backend.
     * @return TODO information about successful or failed save.
     */
    save(file: IFile): Observable<any>;

}
