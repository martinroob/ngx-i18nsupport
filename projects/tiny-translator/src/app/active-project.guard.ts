import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import {TinyTranslatorService} from './model/tiny-translator.service';
import {Observable} from 'rxjs';

/**
 * Created by martin on 30.03.2017.
 * Guard that checks wether there is an active project selected.
 * If not, it redirects to the home page, where you can select one.
 */
@Injectable()
export class ActiveProjectGuard implements CanActivate {

  constructor(private translatorService: TinyTranslatorService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    routerState: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean>|boolean {
      if (this.translatorService.currentProject()) {
        return true;
      } else {
        this.router.navigateByUrl('home');
        return false;
      }
  }
}
