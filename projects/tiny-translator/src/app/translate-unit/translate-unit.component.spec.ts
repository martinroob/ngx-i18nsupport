import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateUnitComponent } from './translate-unit.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import {AppModule} from '../app.module';

describe('TranslateUnitComponent', () => {
  let component: TranslateUnitComponent;
  let fixture: ComponentFixture<TranslateUnitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [AppModule, MatDialogModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslateUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
