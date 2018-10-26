import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxI18nsupportLibComponent } from './ngx-i18nsupport-lib.component';

describe('NgxI18nsupportLibComponent', () => {
  let component: NgxI18nsupportLibComponent;
  let fixture: ComponentFixture<NgxI18nsupportLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxI18nsupportLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxI18nsupportLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
