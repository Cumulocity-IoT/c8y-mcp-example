import { Client, ICredentials } from '@c8y/client';
import { Injectable, Logger } from '@nestjs/common';
import {
  NEVER,
  Observable,
  catchError,
  defer,
  filter,
  from,
  map,
  pairwise,
  shareReplay,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import { ConfigurationService } from '../config/configuration.service';

export interface SubscriptionChange {
  added: ICredentials[];
  removed: ICredentials[];
}

@Injectable()
export class MicroserviceAuthService {
  private readonly logger = new Logger(MicroserviceAuthService.name);
  subscriptions$: Observable<ICredentials[]>;
  subscriptionChanges$: Observable<SubscriptionChange>;

  constructor() {
    this.subscriptions$ = timer(0, 30_000).pipe(
      switchMap(() => this.getMicroserviceSubscriptions$()),
      startWith([]),
      shareReplay(),
    );
    this.subscriptionChanges$ = this.subscriptions$.pipe(
      pairwise(),
      map(([prev, current]) => {
        // checking both tenant and password because the password might have changed during a quick unsubscribe/resubscribe
        const added = current.filter(
          (sub) =>
            !prev.some(
              (prevSub) =>
                prevSub.tenant === sub.tenant &&
                prevSub.password === sub.password,
            ),
        );
        const removed = prev.filter(
          (prevSub) =>
            !current.some(
              (sub) =>
                sub.tenant === prevSub.tenant &&
                prevSub.password === sub.password,
            ),
        );
        return { added, removed };
      }),
      filter((change) => change.added.length > 0 || change.removed.length > 0),
    );
  }

  async getMicroserviceSubscriptions(): Promise<ICredentials[]> {
    const bootstrapCredentials: ICredentials = {
      tenant: ConfigurationService.getBootstrapTenant(),
      user: ConfigurationService.getBootstrapUser(),
      password: ConfigurationService.getBootstrapPassword(),
    };
    const baseUrl = ConfigurationService.getBaseUrl();
    return Client.getMicroserviceSubscriptions(bootstrapCredentials, baseUrl);
  }

  private getMicroserviceSubscriptions$() {
    return defer(() => from(this.getMicroserviceSubscriptions())).pipe(
      catchError((error) => {
        this.logger.warn('Failed to get microservice subscriptions', error);
        return NEVER;
      }),
    );
  }
}
