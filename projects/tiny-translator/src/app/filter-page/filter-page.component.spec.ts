import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPageComponent } from './filter-page.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AppModule} from '../app.module';

describe('FilterPageComponent', () => {
  let component: FilterPageComponent;
  let fixture: ComponentFixture<FilterPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ AppModule ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
