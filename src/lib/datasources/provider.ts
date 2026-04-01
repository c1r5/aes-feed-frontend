import { MockAuthDataSource } from './mock/MockAuthDataSource';
import { MockPostsDataSource } from './mock/MockPostsDataSource';
import { MockFeedDataSource } from './mock/MockFeedDataSource';
import { MockSubscriptionDataSource } from './mock/MockSubscriptionDataSource';
import { ApiAuthDataSource } from './api/ApiAuthDataSource';
import { ApiPostsDataSource } from './api/ApiPostsDataSource';
import { ApiFeedDataSource } from './api/ApiFeedDataSource';
import { ApiSubscriptionDataSource } from './api/ApiSubscriptionDataSource';
import type { IAuthDataSource } from './interfaces/IAuthDataSource';
import type { IPostsDataSource } from './interfaces/IPostsDataSource';
import type { IFeedDataSource } from './interfaces/IFeedDataSource';
import type { ISubscriptionDataSource } from './interfaces/ISubscriptionDataSource';

// DEV sem override → mocks (comportamento atual preservado)
// DEV + PUBLIC_USE_MOCKS=false → API real (testes de integração local)
// PROD → API real sempre
export const USE_MOCKS: boolean =
  import.meta.env.DEV && import.meta.env.PUBLIC_USE_MOCKS !== 'false';

export const authDataSource: IAuthDataSource = USE_MOCKS
  ? new MockAuthDataSource()
  : new ApiAuthDataSource();

export const postsDataSource: IPostsDataSource = USE_MOCKS
  ? new MockPostsDataSource()
  : new ApiPostsDataSource();

export const feedDataSource: IFeedDataSource = USE_MOCKS
  ? new MockFeedDataSource()
  : new ApiFeedDataSource();

// instância única exportada para uso direto em componentes dev que precisam de métodos mock-específicos
export const mockSubscriptionDatasource: MockSubscriptionDataSource | null = USE_MOCKS
  ? new MockSubscriptionDataSource()
  : null;

export const subscriptionDataSource: ISubscriptionDataSource =
  mockSubscriptionDatasource ?? new ApiSubscriptionDataSource();
