import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExplorerForConfigurationsComponent } from './file-explorer-for-configurations.component';

describe('FileExplorerForConfigurationsComponent', () => {
  let component: FileExplorerForConfigurationsComponent;
  let fixture: ComponentFixture<FileExplorerForConfigurationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileExplorerForConfigurationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileExplorerForConfigurationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
