import { TestBed, async } from '@angular/core/testing';

import { AppComponent } from './app.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {APP_CONFIG, APP_CONFIG_VALUE} from './app.config';
import {AppModule} from './app.module';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{provide: APP_CONFIG, useValue: APP_CONFIG_VALUE}]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have a build version`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app: AppComponent = fixture.debugElement.componentInstance;
    expect(app.buildversion()).toMatch(/\d+\.\d+\.\d+/);
  }));

  it('should render mat-toolbar', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
    expect(compiled.querySelector('#apptitle').textContent).toBe('Tiny Translator');
  }));

});
