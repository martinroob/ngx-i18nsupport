import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateAvailableComponent } from './update-available.component';

describe('UpdateAvailableComponent', () => {
  let component: UpdateAvailableComponent;
  let fixture: ComponentFixture<UpdateAvailableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateAvailableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateAvailableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
