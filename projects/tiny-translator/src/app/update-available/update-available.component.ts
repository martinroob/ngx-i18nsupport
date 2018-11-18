import { Component, OnInit } from '@angular/core';
import {MatSnackBarRef} from '@angular/material';

@Component({
  selector: 'app-update-available',
  templateUrl: './update-available.component.html',
  styleUrls: ['./update-available.component.css']
})
export class UpdateAvailableComponent implements OnInit {

  constructor(private snackBarRef: MatSnackBarRef<any>) { }

  ngOnInit() {
  }

  updateApplication() {
    window.location.reload()
  }

  closeSnackbar() {
    this.snackBarRef.dismiss();
  }
}
