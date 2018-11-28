import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureAutoTranslatePageComponent } from './configure-auto-translate-page.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AppModule} from '../app.module';

describe('ConfigureAutoTranslatePageComponent', () => {
  let component: ConfigureAutoTranslatePageComponent;
  let fixture: ComponentFixture<ConfigureAutoTranslatePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ AppModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureAutoTranslatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
