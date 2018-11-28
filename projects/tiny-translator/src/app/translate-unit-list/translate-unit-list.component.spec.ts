import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateUnitListComponent } from './translate-unit-list.component';
import {AbbreviatePipe} from '../common/abbreviate.pipe';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TranslationUnitFilterService} from '../model/filters/translation-unit-filter.service';

describe('TranslateUnitListComponent', () => {
  let component: TranslateUnitListComponent;
  let fixture: ComponentFixture<TranslateUnitListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslateUnitListComponent, AbbreviatePipe ],
      providers: [TranslationUnitFilterService],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslateUnitListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
