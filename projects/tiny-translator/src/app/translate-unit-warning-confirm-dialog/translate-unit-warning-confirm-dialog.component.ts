import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

/**
 * Dialog used by translate-unit-component to show errors and warning.
 * There are 3 possible results:
 * 'cancel': do not do anything, stay on this trans unit.
 * 'discard': do not translate, leave transunit unchanged, but go to the next/prev unit.
 * 'accept': translate tu as given, ignoring warnings (errors cannot be ignored).
 */
@Component({
  selector: 'app-translate-unit-warning-confirm-dialog',
  templateUrl: './translate-unit-warning-confirm-dialog.component.html',
  styleUrls: ['./translate-unit-warning-confirm-dialog.component.css']
})
export class TranslateUnitWarningConfirmDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<TranslateUnitWarningConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any ) { }

  ngOnInit() {
  }

  accept() {
    this.dialogRef.close('accept');
  }

  discard() {
    this.dialogRef.close('discard');
  }

  cancel() {
    this.dialogRef.close('cancel');
  }
}
