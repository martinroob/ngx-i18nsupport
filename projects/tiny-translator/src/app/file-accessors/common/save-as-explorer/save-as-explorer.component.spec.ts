import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveAsExplorerComponent } from './save-as-explorer.component';

describe('SaveAsExplorerComponent', () => {
  let component: SaveAsExplorerComponent;
  let fixture: ComponentFixture<SaveAsExplorerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveAsExplorerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveAsExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
