import type { JwtClaims } from './jwt';
import type { Tenant } from '@puzzlebox/shared';

export interface AppVariables {
  tenant: Tenant;
  claims?: JwtClaims;
  playerId?: string;
  apiScopes?: string[];
}

export type AppBindings = {
  Variables: AppVariables;
};
