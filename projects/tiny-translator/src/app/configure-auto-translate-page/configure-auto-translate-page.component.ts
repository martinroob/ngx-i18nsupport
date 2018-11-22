import {Component, Inject, OnInit} from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

const TEST_MESSAGE = 'Hello world!';

@Component({
  selector: 'app-configure-auto-translate-page',
  templateUrl: './configure-auto-translate-page.component.html',
  styleUrls: ['./configure-auto-translate-page.component.css']
})
export class ConfigureAutoTranslatePageComponent implements OnInit {

  apiKey: string; // connected to input field

  _sourceLanguage: string;
  _targetLanguage: string;
  _sourceLanguageTest: string;
  _targetLanguageTest: string;
  testCallSourceResult: string;
  testCallTargetResult: string;

  constructor(private translatorService: TinyTranslatorService) {
    if (this.translatorService.currentProject() && this.translatorService.currentProject().canTranslate()) {
      this._sourceLanguage = this.translatorService.currentProject().translationFile.sourceLanguage();
      this._targetLanguage = this.translatorService.currentProject().translationFile.targetLanguage();
    }
    this._sourceLanguageTest = 'en';
    this._targetLanguageTest = 'de';
  }

  ngOnInit() {
    this.apiKey = this.translatorService.autoTranslateApiKey();
  }

  autoTranslateDisabled(): Observable<boolean> {
    return this.translatorService.canAutoTranslate().pipe(map((val) => !val));
  }

  autoTranslateDisabledReason(): Observable<string> {
    return this.translatorService.autoTranslateDisabledReason();
  }

  sourceLanguage(): string {
    return this._sourceLanguage;
  }

  targetLanguage(): string {
    return this._targetLanguage;
  }

  autoTranslateDisabledTest(): Observable<boolean> {
    return this.translatorService.canAutoTranslateForLanguages(this._sourceLanguageTest, this._targetLanguageTest).pipe(map((val) => !val));
  }

  autoTranslateDisabledReasonTest(): Observable<string> {
    return this.translatorService.autoTranslateDisabledReasonForLanguages(this._sourceLanguageTest, this._targetLanguageTest);
  }

  sourceLanguageTest(): string {
    return this._sourceLanguageTest;
  }

  targetLanguageTest(): string {
    return this._targetLanguageTest;
  }

  setApiKey() {
    this.translatorService.setAutoTranslateApiKey(this.apiKey);
  }

  testCall() {
    this.testCallSourceResult = null;
    this.testCallTargetResult = null;
    if (this._sourceLanguageTest !== 'en') {
      this.translatorService.testAutoTranslate(TEST_MESSAGE, 'en', this._sourceLanguageTest)
        .subscribe((translationToSource) => {
          this.testCallSourceResult = translationToSource;
          this.translatorService.testAutoTranslate(translationToSource, this._sourceLanguageTest, this._targetLanguageTest)
            .subscribe((translationToTarget) => {
              this.testCallTargetResult = translationToTarget;
            });
        });
    } else {
      this.testCallSourceResult = TEST_MESSAGE;
      this.translatorService.testAutoTranslate(this.testCallSourceResult, this._sourceLanguageTest, this._targetLanguageTest)
        .subscribe((translationToTarget) => {
          this.testCallTargetResult = translationToTarget;
        });
    }
  }
}
