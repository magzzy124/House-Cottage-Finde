import { Routes } from '@angular/router';
import { Search } from './pages/search/search';
import { Sell } from './pages/sell/sell';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ListingDetails } from './pages/listing-details/listing-details';

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
  }
];
