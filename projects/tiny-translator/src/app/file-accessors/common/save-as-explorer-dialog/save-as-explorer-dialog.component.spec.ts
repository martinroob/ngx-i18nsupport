import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveAsExplorerDialogComponent } from './save-as-explorer-dialog.component';

describe('SaveAsExplorerDialogComponent', () => {
  let component: SaveAsExplorerDialogComponent;
  let fixture: ComponentFixture<SaveAsExplorerDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveAsExplorerDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveAsExplorerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
