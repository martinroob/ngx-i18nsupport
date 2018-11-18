import { AbbreviatePipe } from './abbreviate.pipe';

describe('AbbreviatePipe', () => {
  it('create an instance', () => {
    const pipe = new AbbreviatePipe();
    expect(pipe).toBeTruthy();
  });

  it('do not change short text', () => {
    const pipe = new AbbreviatePipe();
    const shortText = 'a short text';
    expect(pipe.transform(shortText)).toBe(shortText);
  });

  it('abbreviate long text', () => {
    const pipe = new AbbreviatePipe();
    const longText = 'a very very very very very long text';
    const abbreviatedText = longText.substr(0, 20) + '..';
    expect(pipe.transform(longText)).toBe(abbreviatedText);
  });

  it('can set length as parameter', () => {
    const pipe = new AbbreviatePipe();
    const longText = 'a very very very very very long text';
    const abbreviatedText = longText.substr(0, 10) + '..';
    expect(pipe.transform(longText, 10)).toBe(abbreviatedText);
  });

});
