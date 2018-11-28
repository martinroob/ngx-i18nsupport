import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoTranslateSummaryPageComponent } from './auto-translate-summary-page.component';
import {AppModule} from '../app.module';
import {AppMaterialModule} from '../app-material.module';

describe('AutoTranslateSummaryPageComponent', () => {
  let component: AutoTranslateSummaryPageComponent;
  let fixture: ComponentFixture<AutoTranslateSummaryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule, AppMaterialModule],
      declarations: []
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoTranslateSummaryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
