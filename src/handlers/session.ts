import { IncomingMessage } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { IOidcClientFactory } from 'utils/oidc-client';

import { ISession } from '../session/session';
import { ISessionStore } from '../session/store';
import tokenCacheHandler from './token-cache';

export default function sessionHandler(sessionStore: ISessionStore) {
  return (req: IncomingMessage): Promise<ISession | null | undefined> => {
    if (!req) {
      throw new Error('Request is not available');
    }

    return sessionStore.read(req);
  };
}

export function RefreshSession(sessionStore: ISessionStore, clientProvider: IOidcClientFactory) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<ISession | null | undefined> => {
    if (!req) {
      throw new Error('Request is not available');
    }

    if (!res) {
      throw new Error('Response is not available');
    }

    const session = await sessionStore.read(req);
    if (!session || !session.user) {
      return;
    }

    const tokenCache = tokenCacheHandler(clientProvider, sessionStore)(req, res);
    const { accessToken } = await tokenCache.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available to refetch the profile');
    }

    const client = await clientProvider();
    const userInfo = await client.userinfo(accessToken);

    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        userInfo
      }
    };

    await sessionStore.save(req, res, updatedSession);

    return updatedSession;
  };
}
