import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FlatTreeControl} from '@angular/cdk/tree';
import {IFileDescription} from '../i-file-description';
import {BehaviorSubject, EMPTY, merge, Observable, of} from 'rxjs';
import {CollectionViewer, SelectionChange} from '@angular/cdk/collections';
import {expand, last, map, } from 'rxjs/operators';
import {IFileAccessService} from '../i-file-access-service';
import {FileAccessServiceFactoryService} from '../file-access-service-factory.service';
import {isNullOrUndefined} from '../../../common/util';
import {IFileAccessConfiguration} from '../i-file-access-configuration';
import {FormBuilder, FormGroup} from '@angular/forms';

/** Flat node with expandable and level information */
class DynamicFlatNode {

  item: string;
  maticon?: string;
  icon?: string;

  constructor(public node: IFileDescription, public level = 1, public expandable = false,
              public isLoading = false) {
    if (level === 0) {
      const configLabel = node.configuration.fullLabel();
      this.item = configLabel.label;
      this.maticon = configLabel.maticon;
      this.icon = configLabel.icon;
    } else {
      this.item = node.name;
    }
  }
}

/**
 * Database for dynamic file accesss data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the service.
 */
class FileData {

  private rootLevelNodes: IFileDescription[];

  constructor(root: IFileDescription, private accessService: IFileAccessService, private onlyDirectories: boolean) {
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
      const children = node.children;
      if (isNullOrUndefined(children)) {
        return this.accessService.load(node).pipe(
            map((result: IFileDescription) => {
                return result.children.filter(fd => !this.onlyDirectories || fd.type === 'dir');
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
    this.treeControl.expansionModel.changed.subscribe(change => {
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
  toggleNode(node: DynamicFlatNode, expandNode: boolean) {
    const children = this.database.getChildren(node.node);
    const index = this.data.indexOf(node);
    if (index < 0) { // If cannot find the node, no op
      return;
    }

    node.isLoading = true;
    children.subscribe(childrenDescr => {
      if (expandNode) {
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
      console.log('error loading children', error); // TODO
      node.isLoading = false;
    });
  }

  /**
   * Open the tree up to the given node.
   * @param node node to be visible
   * @param callBack called when node is contained in the tree.
   */
  openNode(node: IFileDescription, callBack: (node: DynamicFlatNode) => void) {
    const start: {data: DynamicFlatNode[], index: number, path: string, pathIndex: number}
      = {data: this.data, index: 0, path: node.path, pathIndex: 0};
    of(start).pipe(
      expand(current => {
        if (current.index < 0 || current.pathIndex < 0) {
          return EMPTY;
        } else {
          return this.openSubdir(current);
        }
      }),
      last()
    ).subscribe(current => {
      this.dataChange.next(current.data);
      if (current.index >= 0) {
        callBack(current.data[current.index]);
      }
    });
  }

  openSubdir(current: {data: DynamicFlatNode[], index: number, path: string, pathIndex: number})
    : Observable<{data: DynamicFlatNode[], index: number, path: string, pathIndex: number}> {
    if (current.index < 0 || current.pathIndex < 0) {
      return of(current);
    }
    const nodeToExpand = current.data[current.index];
    const pathParts = (current.path) ? current.path.split('/') : [];
    if (!nodeToExpand || current.pathIndex >= pathParts.length) {
      return of({data: current.data, index: current.index, path: current.path, pathIndex: -1});
    }
    const dirNameToOpen = pathParts[current.pathIndex];
    return this.database.getChildren(nodeToExpand.node).pipe(
      map((childrenDescr: IFileDescription[]) => {
        const nodes = childrenDescr.map(filedescr =>
          new DynamicFlatNode(filedescr, nodeToExpand.level + 1, this.database.isExpandable(filedescr)));
        const newData = current.data.slice();
        newData.splice(current.index + 1, 0, ...nodes);
        const indexInNewNodes = nodes.findIndex((node) => node.node.name === dirNameToOpen);
        if (indexInNewNodes < 0) {
          return {data: current.data, index: -1, path: current.path, pathIndex: current.pathIndex};
        } else {
          const newIndex = current.index + 1 + indexInNewNodes;
          return {
            data: newData,
            index: newIndex,
            path: current.path,
            pathIndex: current.pathIndex + 1
          };
        }
      })
    );
  }
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss']
})
export class FileExplorerComponent implements OnInit {

  /**
   * The selectable configurations.
   * If null, there will be no selection.
   */
  @Input() configurations?: IFileAccessConfiguration[];

  /**
   * Root file (a directory) to be shown in the explorer.
   */
  @Input() root: IFileDescription;

  /**
   * Selected file when starting the component.
   */
  @Input() file: IFileDescription;

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

  form: FormGroup;
  _currentRoot: IFileDescription;
  treeControl: FlatTreeControl<DynamicFlatNode>;
  dataSource: DynamicFileDataSource;

  activeNode: DynamicFlatNode;

  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandable = (node: DynamicFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;

  constructor(private formBuilder: FormBuilder, private fileAccessServiceFactoryService: FileAccessServiceFactoryService) {
  }

  ngOnInit() {
    this.currentRoot = this.root.configuration.rootDescription();
    this.initForm();
    this.form.valueChanges.subscribe((val) => {
      this.currentRoot = this.configurations[val.selectedConfigurationIndex].rootDescription();
    });
  }

  initForm() {
    if (!this.form) {
      const index = (!this.root || !this.configurations) ?
        0 :
        this.configurations.findIndex(conf => conf.id === this.root.configuration.id);
      this.form = this.formBuilder.group(
        {
          selectedConfigurationIndex: [index]
        }
      );
    }
  }

  get currentRoot(): IFileDescription {
    return this._currentRoot;
  }

  set currentRoot(newRoot: IFileDescription) {
    if (newRoot) {
      const accessService = this.fileAccessServiceFactoryService.getFileAccessService(newRoot.configuration.type);
      const database = new FileData(newRoot, accessService, (this.selectableFileType === 'dir'));
      this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
      this.dataSource = new DynamicFileDataSource(this.treeControl, database);

      this.dataSource.data = database.initialData();
      if (this.file && !this._currentRoot) {
        this.dataSource.openNode(this.file, (node) => { this.activeNode = node; });
      } else {
        this.dataSource.openNode(newRoot, (node) => {
          this.activeNode = node;
          this.selected(this.activeNode);
        });
      }
      if (this.fileTypeMatches(newRoot)) {
        this.selectedFile.emit(newRoot);
      }
    } else {
      this.dataSource = null;
    }
    this._currentRoot = newRoot;
  }

  selected(node: DynamicFlatNode) {
    if (node && this.fileTypeMatches(node.node)) {
      this.selectedFile.emit(node.node);
      this.activeNode = node;
    } else {
      this.selectedFile.emit(null);
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
