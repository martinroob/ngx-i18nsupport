import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslatePageComponent } from './translate-page.component';
import {AppModule} from '../app.module';

describe('TranslatePageComponent', () => {
  let component: TranslatePageComponent;
  let fixture: ComponentFixture<TranslatePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [AppModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
