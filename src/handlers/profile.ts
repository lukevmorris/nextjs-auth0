import { NextApiResponse, NextApiRequest } from 'next';

import { IClaims, ISession } from '../session/session';
import tokenCacheHandler from './token-cache';
import { ISessionStore } from '../session/store';
import { IOidcClientFactory } from '../utils/oidc-client';

export type ProfileOptions = {
  refetch?: boolean;
};

export function ProfileHandler(sessionStore: ISessionStore, clientProvider: IOidcClientFactory) {
  return async (req: NextApiRequest, res: NextApiResponse, options?: ProfileOptions): Promise<void> => {
    if (!req) {
      throw new Error('Request is not available');
    }

    if (!res) {
      throw new Error('Response is not available');
    }

    const session = await sessionStore.read(req);
    if (!session || !session.user) {
      res.status(401).json({
        error: 'not_authenticated',
        description: 'The user does not have an active session or is not authenticated'
      });
      return;
    }

    let userResponse = session.user;

    if (options && options.refetch) {
      userResponse = await RefreshProfile(sessionStore, clientProvider)(req, res, session);
    }

    res.json(userResponse);
  };
}

export function RefreshProfile(sessionStore: ISessionStore, clientProvider: IOidcClientFactory) {
  return async (req: NextApiRequest, res: NextApiResponse, session: ISession): Promise<IClaims> => {
    const tokenCache = tokenCacheHandler(clientProvider, sessionStore)(req, res);
    const { accessToken } = await tokenCache.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available to refetch the profile');
    }

    const client = await clientProvider();
    const userInfo = await client.userinfo(accessToken);

    const updatedUser = {
      ...session.user,
      ...userInfo
    };

    await sessionStore.save(req, res, {
      ...session,
      user: updatedUser
    });

    return updatedUser;
  };
}
