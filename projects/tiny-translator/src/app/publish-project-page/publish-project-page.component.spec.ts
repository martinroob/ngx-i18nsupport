import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishProjectPageComponent } from './publish-project-page.component';

describe('PublishProjectPageComponent', () => {
  let component: PublishProjectPageComponent;
  let fixture: ComponentFixture<PublishProjectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PublishProjectPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PublishProjectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
