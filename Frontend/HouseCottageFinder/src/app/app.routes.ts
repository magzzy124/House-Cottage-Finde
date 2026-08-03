import { Routes } from '@angular/router';
import { Search } from './pages/search/search';
import { Sell } from './pages/sell/sell';
import { About } from './pages/about/about';

export const routes: Routes = [
  {
    path: "search",
    component: Search
  },
  {
    path: "sell",
    component: Sell
  },
  {
    path: "about",
    component: About
  }
];
