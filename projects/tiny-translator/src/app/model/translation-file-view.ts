import {TranslationUnit} from './translation-unit';
import {TranslationFile} from './translation-file';
import {ITranslationUnitFilter} from './filters/i-translation-unit-filter';
import {TranslationUnitFilterUntranslated} from './filters/translation-unit-filter-untranslated';

/**
 * A view on the current translation file.
 * It determines what trans units are currently visible (specified by the active filter).
 * It has a pointer to the current trans unit and allows scrolling through the trans units.
 * Created by roobm on 27.05.2017.
 */

export class TranslationFileView {

  private _translationFile: TranslationFile;

  private _filter: ITranslationUnitFilter;

  /**
   * The scroll list (either all or all unitranslated, depending on ScrollMode).
   */
  private _scrollableTransUnits: TranslationUnit[];

  /**
   * Pointer to current unit (points to _scrollableTransUnits).
   */
  private _currentTransUnitIndex: number = -1;

  constructor(translationFile: TranslationFile) {
    this._translationFile = translationFile;
    this.setActiveFilter(new TranslationUnitFilterUntranslated());
  }

  public activeFilter(): ITranslationUnitFilter {
    return this._filter;
  }

  /**
   * Change active filter.
   * @param {ITranslationUnitFilter} filter
   */
  public setActiveFilter(filter: ITranslationUnitFilter) {
    this._filter = filter;
    if (this._translationFile) {
      const oldCurrent = (this._currentTransUnitIndex >= 0) ? this.currentTransUnit() : null;
      this._scrollableTransUnits = this._translationFile.allTransUnits().filter((tu) => this._filter.filters(tu));
      if (oldCurrent) {
        this._currentTransUnitIndex = this._scrollableTransUnits.findIndex(tu => tu === oldCurrent);
      }
    } else {
      this._scrollableTransUnits = [];
      this._currentTransUnitIndex = -1;
    }
  }

  /**
   * Recalculate the view by applying the active filter again.
   */
  public refresh(): void {
    this.setActiveFilter(this.activeFilter());
  }

  public currentTransUnit(): TranslationUnit {
    if (this._scrollableTransUnits.length === 0) {
      return null;
    }
    if (this._currentTransUnitIndex < 0) {
      this._currentTransUnitIndex = 0;
    }
    if (this._currentTransUnitIndex >= 0 && this._currentTransUnitIndex < this._scrollableTransUnits.length) {
      return this._scrollableTransUnits[this._currentTransUnitIndex];
    } else {
      return null;
    }
  }

  /**
   * Select given TransUnit
   * @param selectedTransUnit
   * @return true, if selected, false if not in view.
   */
  public selectTransUnit(selectedTransUnit: TranslationUnit): boolean {
    const index = this._scrollableTransUnits.findIndex(tu => tu === selectedTransUnit);
    if (index >= 0) {
      this._currentTransUnitIndex = index;
      return true;
    } else {
      return false;
    }
  }

  public nextTransUnit(): TranslationUnit {
    if (this._currentTransUnitIndex >= 0) {
      this._currentTransUnitIndex++;
    }
    return this.currentTransUnit();
  }

  public prevTransUnit(): TranslationUnit {
    if (this._currentTransUnitIndex >= 1) {
      this._currentTransUnitIndex--;
    }
    return this.currentTransUnit();
  }

  public hasNext(): boolean {
    if (this._currentTransUnitIndex < 0) {
      return this._scrollableTransUnits.length > 0;
    } else {
      return this._currentTransUnitIndex < (this._scrollableTransUnits.length - 1);
    }
  }

  public hasPrev(): boolean {
    if (this._currentTransUnitIndex < 0) {
      return false;
    } else {
      return this._currentTransUnitIndex > 0;
    }
  }

  public scrollabeTransUnits(): TranslationUnit[] {
    return this._scrollableTransUnits;
  }

  public currentTransUnitIndex(): number {
    return (this._currentTransUnitIndex < 0) ? 0 : this._currentTransUnitIndex + 1;
  }

  public scrollabeTransUnitsLength(): number {
    return (this._scrollableTransUnits) ? this._scrollableTransUnits.length : 0;
  }

}
