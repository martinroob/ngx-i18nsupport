import {NgModule} from '@angular/core';
import {
  MatButtonModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatIconModule, MatInputModule, MatListModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatRadioModule, MatSlideToggleModule, MatSnackBarModule,
  MatToolbarModule, MatTooltipModule
} from '@angular/material';
import {OverlayModule} from '@angular/cdk/overlay';
import {FlexLayoutModule} from '@angular/flex-layout';
/**
 * All imports of used material components.
 */
@NgModule({
  declarations: [],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    OverlayModule,
    FlexLayoutModule
  ],
  exports: [
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
    OverlayModule,
    FlexLayoutModule
  ],
  providers: [],
})
export class AppMaterialModule { }
