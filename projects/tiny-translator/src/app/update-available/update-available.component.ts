import {Component, OnInit, Optional} from '@angular/core';
import { MatSnackBarRef } from "@angular/material/snack-bar";
import {SwUpdate, UpdateAvailableEvent} from '@angular/service-worker';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-update-available',
  templateUrl: './update-available.component.html',
  styleUrls: ['./update-available.component.css']
})
export class UpdateAvailableComponent implements OnInit {

  actualVersion: string;
  availableVersion: string;

  constructor(private snackBarRef: MatSnackBarRef<any>, @Optional() private updates: SwUpdate) { }

  ngOnInit() {
    this.actualVersion = 'unknown';
    this.availableVersion = 'unknown';
    if (this.updates) {
      this.updates.available.pipe(take(1)).subscribe((availableEvent: UpdateAvailableEvent) => {
        if (availableEvent.current.appData) {
          this.actualVersion = (<any> availableEvent.current.appData).version;
        }
        if (availableEvent.available.appData) {
            this.availableVersion = (<any> availableEvent.available.appData).version;
        }
      });
    }
  }

  updateApplication() {
    if (this.updates) {
        this.updates.activateUpdate().then(() => document.location.reload());
    }
  }

  closeSnackbar() {
    this.snackBarRef.dismiss();
  }
}
