import { Component, OnInit } from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {TranslationUnit} from '../model/translation-unit';
import {TranslationProject, UserRole} from '../model/translation-project';
import {TranslationFileView} from '../model/translation-file-view';
import {NavigationDirection, TranslateUnitChange} from '../translate-unit/translate-unit.component';

@Component({
  selector: 'app-translate-page',
  templateUrl: './translate-page.component.html',
  styleUrls: ['./translate-page.component.css']
})
export class TranslatePageComponent implements OnInit {

  constructor(private translationService: TinyTranslatorService) { }

  ngOnInit() {
  }

  currentProject(): TranslationProject {
    return this.translationService.currentProject();
  }

  currentView(): TranslationFileView {
    return this.currentProject() ? this.currentProject().translationFileView : null;
  }

  currentTranslationUnit(): TranslationUnit {
    const currentProject = this.currentProject();
    return currentProject ? currentProject.translationFileView.currentTransUnit() : null;
  }

  commitChanges(translateUnitChange: TranslateUnitChange) {
    const direction = translateUnitChange.navigationDirection;
    if (direction === NavigationDirection.NEXT) {
      this.translationService.nextTransUnit();
    } else if (direction === NavigationDirection.PREV) {
      this.translationService.prevTransUnit();
    }
    if (translateUnitChange.changedUnit) {
      this.translationService.commitChanges(this.currentProject());
      if (this.currentView()) {
        this.currentView().refresh();
      }
    }
  }

  /**
   * Navigate to another unit.
   * @param translationUnit
   */
  onChangeTranslationUnit(translationUnit: TranslationUnit) {
    this.translationService.selectTransUnit(translationUnit);
  }

  save() {
    this.translationService.downloadProject(this.currentProject());
  }

  isInReviewMode(): boolean {
    return this.currentProject() && this.currentProject().userRole === UserRole.REVIEWER;
  }

  hasAutotranslatedUnits(): boolean {
    return this.currentProject()
      && this.currentProject().autoTranslateSummaryReport()
      && this.currentProject().autoTranslateSummaryReport().total() > 0;
  }

}
