import LoginHandler from './login';
import LogoutHandler from './logout';
import CallbackHandler from './callback';
import { ProfileHandler, RefreshProfile } from './profile';
import SessionHandler, { RefreshSession } from './session';
import RequireAuthentication from './require-authentication';
import TokenCache from './token-cache';

export default {
  CallbackHandler,
  LoginHandler,
  LogoutHandler,
  ProfileHandler,
  RefreshProfile,
  SessionHandler,
  RefreshSession,
  RequireAuthentication,
  TokenCache
};
