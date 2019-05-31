import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import {IFileDescription} from '../file-accessors/common/i-file-description';
import {Observable} from 'rxjs';
import {ConfirmDialogComponent, ConfirmDialogData} from '../confirm-dialog/confirm-dialog.component';
import {IFileAccessConfiguration} from '../file-accessors/common/i-file-access-configuration';

@Component({
  selector: 'app-publish-project-page',
  templateUrl: './publish-project-page.component.html',
  styleUrls: ['./publish-project-page.component.scss']
})
export class PublishProjectPageComponent implements OnInit {

  translationFile: IFileDescription;
  _saveAs: IFileDescription;
  form: FormGroup;
  error: string;

  @ViewChild('confirmSaveQuestion', { static: false }) confirmSaveQuestion: ElementRef;
  @ViewChild('confirmSaveInfo', { static: false }) confirmSaveInfo: ElementRef;
  @ViewChild('confirmModifyQuestion', { static: false }) confirmModifyQuestion: ElementRef;
  @ViewChild('confirmModifyInfo', { static: false }) confirmModifyInfo: ElementRef;
  @ViewChild('publishOkMessage', { static: false }) publishOkMessage: ElementRef;

  constructor(private tinyTranslatorService: TinyTranslatorService,
              private formBuilder: FormBuilder,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.translationFile = this.tinyTranslatorService.currentProject().translationFile.fileDescription();
    this._saveAs = this.translationFile;
    this.initForm();
  }

  private initForm() {
    if (!this.form) {
      const translationFile = this.tinyTranslatorService.currentProject().translationFile;
      const name = translationFile.fileDescription().name;
      this.form = this.formBuilder.group({
        commitMessage: ['', Validators.required],
        name: [name]
      });
    }
  }

  private textFromElementRef(ref: ElementRef|null): string {
    if (!ref) {
      return '?';
    } else {
      return ref.nativeElement.innerText;
    }
  }

  openConfirmSaveDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        question: this.textFromElementRef(this.confirmSaveQuestion),
        info: this.textFromElementRef(this.confirmSaveInfo)
      } as ConfirmDialogData
    });
    return dialogRef.afterClosed();
  }

  openConfirmModifiedDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        question: this.textFromElementRef(this.confirmModifyQuestion),
        info: this.textFromElementRef(this.confirmModifyInfo)
      } as ConfirmDialogData
    });
    return dialogRef.afterClosed();
  }

  configurations(): Observable<IFileAccessConfiguration[]> {
    return this.tinyTranslatorService.getFileAccessConfigurations();
  }

  publish() {
    this.tinyTranslatorService.publishProject(this.tinyTranslatorService.currentProject(),
      this.saveAs(),
      {
        message: this.form.value.commitMessage
      },
      () => this.openConfirmModifiedDialog(),
      () => this.openConfirmSaveDialog()
    ).subscribe((done: boolean) => {
            this.error = null;
            if (done) {
              this.snackBar.open(this.textFromElementRef(this.publishOkMessage), undefined, {
                duration: 3000,
              });
            }
      }, (error) => {
          this.error = error.toString();
      });
  }

  setSaveAs(f: IFileDescription) {
    this._saveAs = f;
  }

  private saveAs(): IFileDescription|null {
    return this._saveAs === this.translationFile ? null : this._saveAs;
  }
}
