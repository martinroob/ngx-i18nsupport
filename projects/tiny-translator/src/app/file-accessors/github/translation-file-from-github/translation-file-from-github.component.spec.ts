import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationFileFromGithubComponent } from './translation-file-from-github.component';

describe('TranslationFileFromGithubComponent', () => {
  let component: TranslationFileFromGithubComponent;
  let fixture: ComponentFixture<TranslationFileFromGithubComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslationFileFromGithubComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationFileFromGithubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
