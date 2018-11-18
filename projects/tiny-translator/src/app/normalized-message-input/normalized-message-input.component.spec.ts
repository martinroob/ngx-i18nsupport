import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizedMessageInputComponent } from './normalized-message-input.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormBuilder} from '@angular/forms';

describe('NormalizedMessageInputComponent', () => {
  let component: NormalizedMessageInputComponent;
  let fixture: ComponentFixture<NormalizedMessageInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NormalizedMessageInputComponent ],
      providers: [FormBuilder],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NormalizedMessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
