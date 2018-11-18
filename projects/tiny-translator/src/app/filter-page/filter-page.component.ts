import { Component, OnInit } from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {TranslationProject} from '../model/translation-project';
import {TranslationFileView} from '../model/translation-file-view';
import {TranslationUnit} from '../model/translation-unit';
import {Router} from '@angular/router';

@Component({
  selector: 'app-filter-page',
  templateUrl: './filter-page.component.html',
  styleUrls: ['./filter-page.component.css']
})
export class FilterPageComponent implements OnInit {

  constructor(private translationService: TinyTranslatorService, private router: Router) { }

  ngOnInit() {
  }

  currentProject(): TranslationProject {
    return this.translationService.currentProject();
  }

  currentView(): TranslationFileView {
    return this.currentProject() ? this.currentProject().translationFileView : null;
  }

  /**
   * Navigate to another unit.
   * @param translationUnit
   */
  onChangeTranslationUnit(translationUnit: TranslationUnit) {
    this.translationService.selectTransUnit(translationUnit);
    this.router.navigateByUrl('translate');
  }

  hasAutotranslatedUnits(): boolean {
    return this.currentProject()
      && this.currentProject().autoTranslateSummaryReport()
      && this.currentProject().autoTranslateSummaryReport().total() > 0;
  }

}
