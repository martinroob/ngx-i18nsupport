import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProjectPageComponent } from './edit-project-page.component';
import {ProjectEditorComponent} from '../project-editor/project-editor.component';
import {AppModule} from '../app.module';

describe('EditProjectPageComponent', () => {
  let component: EditProjectPageComponent;
  let fixture: ComponentFixture<EditProjectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProjectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
