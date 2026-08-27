import { Routes } from '@angular/router';
import { Search } from './pages/search/search';
import { Sell } from './pages/sell/sell';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ListingDetails } from './pages/listing-details/listing-details';
import { Favorites } from './pages/favorites/favorites';
import { Stats } from './pages/stats/stats';
import { Compare } from './pages/compare/compare';

export const routes: Routes = [
  {
    path: "search",
    component: Search
  },
  {
    path: "listing/:id",
    component: ListingDetails
  },
  {
    path: "sell",
    component: Sell
  },
  {
    path: "about",
    component: About
  },
  {
    path: "login",
    component: Login
  },
  {
    path: "register",
    component: Register
  },
  {
    path: "favorites",
    component: Favorites
  },
  {
    path: "stats",
    component: Stats
  },
  {
    path: "compare",
    component: Compare
  }
];
