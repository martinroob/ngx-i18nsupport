import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TranslationUnit} from '../model/translation-unit';
import { MatRadioChange } from "@angular/material/radio";
import {TranslationFileView} from '../model/translation-file-view';
import {WorkflowType} from '../model/translation-project';
import {Subject, Subscription} from 'rxjs';
import {
  FILTER_ALL, FILTER_AUTOTRANSLATED, FILTER_AUTOTRANSLATED_FAILED, FILTER_AUTOTRANSLATED_IGNORED, FILTER_NEEDS_REVIEW,
  FILTER_SUBSTRING,
  FILTER_UNTRANSLATED,
  TranslationUnitFilterService
} from '../model/filters/translation-unit-filter.service';
import {debounceTime} from 'rxjs/operators';

/**
 * Component that shows a list of trans units.
 * It allows to filter by different criteria and to select a unit.
 */
@Component({
  selector: 'app-translate-unit-list',
  templateUrl: './translate-unit-list.component.html',
  styleUrls: ['./translate-unit-list.component.scss']
})
export class TranslateUnitListComponent implements OnInit {

  private _translationFileView: TranslationFileView;
  public _selectedFilterName = 'all';
  public substringToSearch: string;
  private substringSubject: Subject<string>;
  private substringSubscription: Subscription;

  /**
   * workflowType determines, what filters are visibile.
   */
  @Input() workflowType: WorkflowType;

  @Input() hasAutotranslatedUnits: boolean;

  /**
   * Emitted, when user wants to navigate to another unit.
   */
  @Output() changeTranslationUnit: EventEmitter<TranslationUnit> = new EventEmitter();

  constructor(private translationUnitFilterService: TranslationUnitFilterService) {
    this.translationFileView = new TranslationFileView(null);
    this.substringSubject = new Subject<string>();
  }

  @Input() public get translationFileView() {
    return this._translationFileView;
  }

  public set translationFileView(view: TranslationFileView) {
    if (view) {
      this._translationFileView = view;
    } else {
      this._translationFileView = new TranslationFileView(null);
    }
    this._selectedFilterName = this._translationFileView.activeFilter().name();
  }

  ngOnInit() {
  }

  public transUnits(): TranslationUnit[] {
    return this.translationFileView.scrollabeTransUnits();
  }

  public showAll() {
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_ALL));
  }

  public showUntranslated() {
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_UNTRANSLATED));
  }

  public showNeedsReview() {
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_NEEDS_REVIEW));
  }

  public showBySearchFilter() {
    if (this.substringSubscription) {
      this.substringSubscription.unsubscribe();
    }
    const substr = this.substringToSearch ? this.substringToSearch : '';
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_SUBSTRING, substr));
    this.substringSubscription = this.substringSubject.pipe(debounceTime(200)).subscribe((sub) => {
      this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_SUBSTRING, sub));
    });
  }

  substringToSearchChange() {
    this.substringSubject.next(this.substringToSearch);
  }

  public showAutotranslated() {
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_AUTOTRANSLATED));
  }

  public showAutotranslatedFailed() {
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_AUTOTRANSLATED_FAILED));
  }

  public showAutotranslatedIgnored() {
    this.translationFileView.setActiveFilter(this.translationUnitFilterService.getFilter(FILTER_AUTOTRANSLATED_IGNORED));
  }

  filterChanged(changeEvent: MatRadioChange) {
    switch (changeEvent.value) {
      case 'all':
        this.showAll();
        break;
      case 'untranslated':
        this.showUntranslated();
        break;
      case 'needsReview':
        this.showNeedsReview();
        break;
      case 'bySubstring':
        this.showBySearchFilter();
        break;
      case 'autotranslated':
        this.showAutotranslated();
        break;
      case 'autotranslatedFailed':
        this.showAutotranslatedFailed();
        break;
      case 'autotranslatedIgnored':
        this.showAutotranslatedIgnored();
        break;
      default:
        // do nothing
    }
  }

  public selectTransUnit(tu: TranslationUnit) {
    this.changeTranslationUnit.emit(tu);
  }

  isSelected(tu: TranslationUnit): boolean {
    return tu && tu === this.translationFileView.currentTransUnit();
  }

  isWorkflowWithReview(): boolean {
    return this.workflowType === WorkflowType.WITH_REVIEW;
  }

}
