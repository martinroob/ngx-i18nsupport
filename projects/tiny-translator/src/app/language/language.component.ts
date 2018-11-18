import {Component, Input, OnInit} from '@angular/core';

/**
 * A component that shows a language.
 * The input is some ISO 639-1 Code like "de", "de-ch", "en", "en-uk"..
 * The component tries to show a matching flag icon and the given code.
 */
@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss']
})
export class LanguageComponent implements OnInit {

  @Input() public code: string; // the ISO 639-1 code

  @Input() public showCode = true; // if false, just show a flag, otherwise flag + code as text

  constructor() { }

  ngOnInit() {
  }

  /**
   * Classes used by flag-icon-css
   * @return {{flag-icon: boolean}}
   */
  public flagClasses(): any {
    const countryCode = this.languageCodeToCountryCode(this.code);
    if (!countryCode) {
      return {
        'flag-icon': true,
        'missing-code': true};
    }
    const flagIconCountry = 'flag-icon-' + countryCode.toLowerCase();
    const result = {
      'flag-icon': true
    };
    result[flagIconCountry] = true;
    return result;
  }

  /**
   * Map a given language code (ISO 639-1) to country code (ISO-3166-1-alpha 2 code).
   * This is just a best effort approach.
   */
  public languageCodeToCountryCode(languageCode: string): string {
    if (!languageCode) {
      return null;
    }
    const lang = this.langFromLanguageCode(languageCode);
    const region = this.regionFromLanguageCode(languageCode);
    if (region && region.length === 2) {
      return region;
    }
    // table of all lang codes, that are different from country code
    // based on Microsofts Table of Language Culture Names https://msdn.microsoft.com/de-de/library/ee825488%28v=cs.20%29.aspx
    switch (lang.toLowerCase()) {
      case 'af': return 'ZA';
      case 'sq': return 'AL';
      case 'ar': return 'SA';
      case 'hy': return 'AM';
      case 'eu': return 'ES';
      case 'be': return 'BY';
      case 'ca': return 'ES';
      case 'zh': return 'CN';
      case 'cs': return 'CZ';
      case 'da': return 'DK';
      case 'div': return 'MV';
      case 'en': return 'GB';
      case 'et': return 'EE';
      case 'fa': return 'IR';
      case 'gl': return 'IS';
      case 'ka': return 'GE';
      case 'el': return 'GR';
      case 'gu': return 'IN';
      case 'he': return 'IL';
      case 'hi': return 'IN';
      case 'ja': return 'JP';
      case 'kn': return 'IN';
      case 'kk': return 'KZ';
      case 'kok': return 'IN';
      case 'ko': return 'KR';
      case 'ky': return 'KZ';
      case 'ms': return 'MY';
      case 'mr': return 'IN';
      case 'nb': return 'NO';
      case 'nn': return 'NO';
      case 'pa': return 'IN';
      case 'sa': return 'IN';
      case 'sl': return 'SI';
      case 'sw': return 'KE';
      case 'sv': return 'SE';
      case 'syr': return 'SY';
      case 'ta': return 'IN';
      case 'tt': return 'RU';
      case 'te': return 'IN';
      case 'uk': return 'UA';
      case 'ur': return 'PK';
      case 'vi': return 'VN';
      default: return lang;
    }
  }

  private langFromLanguageCode(languageCode: string): string {
    const parts: string[] = languageCode.split('-');
    if (parts.length > 0) {
      return parts[0];
    } else {
      return null;
    }
  }

  private regionFromLanguageCode(languageCode: string): string {
    const parts: string[] = languageCode.split('-');
    if (parts.length > 1) {
      return parts[1];
    } else {
      return null;
    }
  }
}
