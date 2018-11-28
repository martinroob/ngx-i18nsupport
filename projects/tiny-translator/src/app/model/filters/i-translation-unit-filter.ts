import {TranslationUnit} from '../translation-unit';
/**
 * A TranslationUnitFilter determines wether a trans unit belongs to the currently selected view.
 * Created by martin on 27.05.2017.
 */
export interface ITranslationUnitFilter {

  /**
   * The filter function.
   * @param transUnit
   * @return wether transUnit belongs to selection or not.
   */
  filters(transUnit: TranslationUnit): boolean;

  /**
   * Unique name of filter.
   */
  name(): string;
}
