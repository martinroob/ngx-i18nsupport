import {Component, Input, OnInit} from '@angular/core';
import {TranslationFileView} from '../model/translation-file-view';
import {TranslationUnitFilterSubstring} from '../model/filters/translation-unit-filter-substring';

@Component({
  selector: 'app-filter-status',
  templateUrl: './filter-status.component.html',
  styleUrls: ['./filter-status.component.css']
})
export class FilterStatusComponent implements OnInit {

  @Input() translationFileView: TranslationFileView;

  constructor() { }

  ngOnInit() {
  }

  currentFilterName(): string {
    if (this.translationFileView) {
      return this.translationFileView.activeFilter().name();
    } else {
      return null;
    }
  }

  substringFilterPattern(): string {
    const activeFilter = this.translationFileView.activeFilter();
    if (activeFilter.name() === 'bySubstring') {
      const filter: TranslationUnitFilterSubstring = <TranslationUnitFilterSubstring> activeFilter;
      return filter.substringFilterPattern();
    }
  }
}
