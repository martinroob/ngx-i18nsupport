import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolingComponent } from './tooling.component';

describe('ToolingComponent', () => {
  let component: ToolingComponent;
  let fixture: ComponentFixture<ToolingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ToolingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
