import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { GeoapifyGeocoderAutocompleteModule } from '@geoapify/angular-geocoder-autocomplete';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { authInterceptor } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      GeoapifyGeocoderAutocompleteModule.withConfig("9818f96fef344aa388bf7452fe382826"),
      GalleryModule,
      LightboxModule
    )
  ]
};
