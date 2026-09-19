import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { NavMenuComponent } from './layout/nav-menu/nav-menu.component';
import { ToasterComponent } from './ui/toast/toaster.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavMenuComponent, ToasterComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
