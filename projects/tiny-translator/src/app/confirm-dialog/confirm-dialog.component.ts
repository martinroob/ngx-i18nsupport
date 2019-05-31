import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface ConfirmDialogData {
  question: string;
  info: string;
}

/**
 * Dialog used to confirm simple questions.
 * There are 2 possible results:
 * false: User says no to the question.
 * true: User says yes.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnInit {

  question: string;
  info: string;

  constructor(private dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) private data: ConfirmDialogData) { }

  ngOnInit() {
    this.question = this.data.question;
    this.info = this.data.info;
  }

  accept() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
