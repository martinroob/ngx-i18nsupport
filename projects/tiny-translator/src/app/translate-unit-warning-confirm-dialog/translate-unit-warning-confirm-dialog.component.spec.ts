import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateUnitWarningConfirmDialogComponent } from './translate-unit-warning-confirm-dialog.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContainer, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import {AppModule} from '../app.module';

class MatDialogRefMock {
}

describe('TranslateUnitWarningConfirmDialogComponent', () => {
  let dialog: MatDialog;
  let component: TranslateUnitWarningConfirmDialogComponent;
  let fixture: ComponentFixture<TranslateUnitWarningConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [AppModule, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: "lmaa"}],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    dialog = TestBed.get(MatDialog);
    let dialogRef = dialog.open(TranslateUnitWarningConfirmDialogComponent);
    fixture = TestBed.createComponent(TranslateUnitWarningConfirmDialogComponent);
    component = dialogRef.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
