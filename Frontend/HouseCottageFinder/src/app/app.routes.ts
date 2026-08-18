import { Routes } from '@angular/router';
import { Search } from './pages/search/search';
import { Sell } from './pages/sell/sell';
import { About } from './pages/about/about';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

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
