import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureGithubPageComponent } from './configure-github-page.component';

describe('ConfigureGithubPageComponent', () => {
  let component: ConfigureGithubPageComponent;
  let fixture: ComponentFixture<ConfigureGithubPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureGithubPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureGithubPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
