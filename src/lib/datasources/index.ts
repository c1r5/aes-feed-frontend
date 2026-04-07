import type { IAuthDataSource } from './auth/IAuthDataSource'
import type { IPostsDataSource } from './posts/IPostsDataSource'
import type { IFeedDataSource } from './feed/IFeedDataSource'
import type { ISubscriptionDataSource } from './subscription/ISubscriptionDataSource'
import type { IPayoutDataSource } from './payout/IPayoutDataSource'

import { MockAuthDataSource } from './auth/MockAuthDataSource'
import { MockPostsDataSource } from './posts/MockPostsDataSource'
import { MockFeedDataSource } from './feed/MockFeedDataSource'
import { MockSubscriptionDataSource } from './subscription/MockSubscriptionDataSource'
import { MockPayoutDataSource } from './payout/MockPayoutDataSource'

import { ApiAuthDataSource } from './auth/ApiAuthDataSource'
import { ApiPostsDataSource } from './posts/ApiPostsDataSource'
import { ApiFeedDataSource } from './feed/ApiFeedDataSource'
import { ApiSubscriptionDataSource } from './subscription/ApiSubscriptionDataSource'
import { ApiPayoutDataSource } from './payout/ApiPayoutDataSource'

const useMock = import.meta.env.DEV

export const authDataSource: IAuthDataSource = useMock
	? new MockAuthDataSource()
	: new ApiAuthDataSource()

export const postsDataSource: IPostsDataSource = useMock
	? new MockPostsDataSource()
	: new ApiPostsDataSource()

export const feedDataSource: IFeedDataSource = useMock
	? new MockFeedDataSource()
	: new ApiFeedDataSource()

export const subscriptionDataSource: ISubscriptionDataSource = useMock
	? new MockSubscriptionDataSource()
	: new ApiSubscriptionDataSource()

export const payoutDataSource: IPayoutDataSource = useMock
	? new MockPayoutDataSource()
	: new ApiPayoutDataSource()
