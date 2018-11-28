import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterStatusComponent } from './filter-status.component';
import {AppModule} from '../app.module';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('FilterStatusComponent', () => {
  let component: FilterStatusComponent;
  let fixture: ComponentFixture<FilterStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ AppModule ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
