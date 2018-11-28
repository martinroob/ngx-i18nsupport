/**
 * Created by martin on 31.03.2017.
 */
import { TestBed, async, inject } from '@angular/core/testing';

import { ActiveProjectGuard } from './active-project.guard';
import {TinyTranslatorService} from './model/tiny-translator.service';
import {RouterTestingModule} from '@angular/router/testing';
import {Router} from '@angular/router';

class TinyTranslatorServiceStub {
  public currentProject(): any {
    return 'a project dummy';
  }
}

describe('ActiveProjectGuard', () => {
  beforeEach(() => {
    const translatorServiceStub = new TinyTranslatorServiceStub();
    TestBed.configureTestingModule({
      providers: [ActiveProjectGuard, {provide: TinyTranslatorService, useValue: translatorServiceStub}],
      imports: [RouterTestingModule]
    });
  });

  it('should create an instance', inject([ActiveProjectGuard], (guard: ActiveProjectGuard) => {
    expect(guard).toBeTruthy();
  }));

  it('should allow activation when there is a current project', inject([ActiveProjectGuard, TinyTranslatorService], (guard: ActiveProjectGuard, tinyTranslatorService) => {
    spyOn(tinyTranslatorService, 'currentProject').and.returnValue('anything, but not null');
    expect(guard.canActivate(null, null)).toBeTruthy();
    expect(tinyTranslatorService.currentProject).toHaveBeenCalled();
  }));

  it('should forbid activation and navigate to home when there is no current project', inject([ActiveProjectGuard, TinyTranslatorService, Router], (guard: ActiveProjectGuard, tinyTranslatorService, router) => {
    spyOn(tinyTranslatorService, 'currentProject').and.returnValue(null);
    spyOn(router, 'navigateByUrl');
    expect(guard.canActivate(null, null)).toBeFalsy();
    expect(tinyTranslatorService.currentProject).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('home');
  }));

});
