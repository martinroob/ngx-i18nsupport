/**
 * A file loaded from any source (Upload, GitHub, ..)
 */
export interface IFile {
    name: string; // name of file
    size: number; // size in bytes
    content: string; // content of file
}
