import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { TopHeader } from '../top-header/top-header';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [Sidebar, TopHeader, BottomNav, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {

}
