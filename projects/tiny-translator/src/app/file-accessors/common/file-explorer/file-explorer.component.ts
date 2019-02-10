import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {IFileDescriptionDirectory} from '../i-file-description-directory';
import {FlatTreeControl} from '@angular/cdk/tree';
import {IFileDescription} from '../i-file-description';
import {BehaviorSubject, merge, Observable, of} from 'rxjs';
import {CollectionViewer, SelectionChange} from '@angular/cdk/collections';
import {map} from 'rxjs/operators';
import {IFileAccessService} from '../i-file-access-service';
import {FileAccessServiceFactoryService} from '../file-access-service-factory.service';
import {isNullOrUndefined} from '../../../common/util';

/** Flat node with expandable and level information */
class DynamicFlatNode {

  item: string;

  constructor(public node: IFileDescription, public level = 1, public expandable = false,
              public isLoading = false) {
    this.item = node.name;
  }
}

/**
 * Database for dynamic file accesss data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the service.
 */
class FileData {

  private rootLevelNodes: IFileDescriptionDirectory[];

  constructor(root: IFileDescriptionDirectory, private accessService: IFileAccessService, private onlyDirectories: boolean) {
    this.rootLevelNodes = [root];
  }

  /** Initial data from database */
  initialData(): DynamicFlatNode[] {
    return this.rootLevelNodes.map(dir => new DynamicFlatNode(dir, 0, true));
  }

  getChildren(node: IFileDescription): Observable<IFileDescription[] | undefined> {
    if (node.type === 'file') {
      return of(undefined);
    } else {
      const children = (node as IFileDescriptionDirectory).children;
      if (isNullOrUndefined(children)) {
        return this.accessService.load(node).pipe(
            map(result => {
                return (result as IFileDescriptionDirectory).children.filter(fd => !this.onlyDirectories || fd.type === 'dir');
            })
        );
      } else {
        return of(children.filter(fd => !this.onlyDirectories || fd.type === 'dir'));
      }
    }
  }

  isExpandable(node: IFileDescription): boolean {
    return node.type === 'dir';
  }
}
/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
class DynamicFileDataSource {

  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] { return this.dataChange.value; }
  set data(value: DynamicFlatNode[]) {
    this.treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(private treeControl: FlatTreeControl<DynamicFlatNode>,
              private database: FileData) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this.treeControl.expansionModel.onChange.subscribe(change => {
      if ((change as SelectionChange<DynamicFlatNode>).added ||
          (change as SelectionChange<DynamicFlatNode>).removed) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed.slice().reverse().forEach(node => this.toggleNode(node, false));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    const children = this.database.getChildren(node.node);
    const index = this.data.indexOf(node);
    if (index < 0) { // If cannot find the node, no op
      return;
    }

    node.isLoading = true;
    children.subscribe(childrenDescr => {
      if (expand) {
        const nodes = childrenDescr.map(filedescr =>
            new DynamicFlatNode(filedescr, node.level + 1, this.database.isExpandable(filedescr)));
        this.data.splice(index + 1, 0, ...nodes);
      } else {
        let count = 0;
        for (let i = index + 1; i < this.data.length
        && this.data[i].level > node.level; i++, count++) {}
        this.data.splice(index + 1, count);
      }

      // notify the change
      this.dataChange.next(this.data);
      node.isLoading = false;
    }, (error) => {
      console.log('oops loading children', error);
    });
  }
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss']
})
export class FileExplorerComponent implements OnInit, OnChanges {

  /**
   * Root file (a directory) to be shown in the explorer.
   */
  @Input() root: IFileDescriptionDirectory;
  /**
   * Determine what sort of entries can be selected.
   * 'file': only files.
   * 'dir': only directories
   * undefined: everything.
   */
  @Input() selectableFileType?: 'file'|'dir';

  /**
   * The selected file node.
   */
  @Output() selectedFile: EventEmitter<IFileDescription> = new EventEmitter<IFileDescription>();

  treeControl: FlatTreeControl<DynamicFlatNode>;
  dataSource: DynamicFileDataSource;

  activeNode: DynamicFlatNode;

  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandable = (node: DynamicFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;

  constructor(private fileAccessServiceFactoryService: FileAccessServiceFactoryService) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['root']) {
          if (this.root) {
              const accessService = this.fileAccessServiceFactoryService.getFileAccessService(this.root.configuration.type);
              const database = new FileData(this.root, accessService, (this.selectableFileType === 'dir'));
              this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
              this.dataSource = new DynamicFileDataSource(this.treeControl, database);

              this.dataSource.data = database.initialData();
          }
      }
  }

  selected(node: DynamicFlatNode) {
    if (node && this.fileTypeMatches(node.node)) {
      this.selectedFile.emit(node.node);
      this.activeNode = node;
    } else {
      this.activeNode = null;
    }
  }

  private fileTypeMatches(file: IFileDescription): boolean {
    if (isNullOrUndefined(this.selectableFileType)) {
      return true;
    } else {
      return this.selectableFileType === file.type;
    }
  }
}
