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
import { Profile } from './pages/profile/profile';
import { ChatPage } from './pages/chat-page/chat-page';
import { Notifications } from './pages/notifications/notifications';
import { SavedSearches } from './pages/saved-searches/saved-searches';
import { MyListings } from './pages/my-listings/my-listings';
import { EditListing } from './pages/edit-listing/edit-listing';

export const routes: Routes = [
  {
    path: "",
    redirectTo: "search",
    pathMatch: "full"
  },
  {
    path: "search",
    component: Search,
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
  },
  {
    path: "profile",
    component: Profile
  },
  {
    path: "chat/:id",
    component: ChatPage
  },
  {
    path: "notifications",
    component: Notifications
  },
  {
    path: "saved-searches",
    component: SavedSearches
  },
  {
    path: "my-listings",
    component: MyListings
  },
  {
    path: "edit-listing/:id",
    component: EditListing
  }
];
