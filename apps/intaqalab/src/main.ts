import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { Config } from './app/app.config';

bootstrapApplication(App, Config).catch((err) => console.error(err));
