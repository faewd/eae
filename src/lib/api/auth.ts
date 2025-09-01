import {
  AbstractStateStore,
  type TransactionStore,
  ServerClient,
  type StateData,
  type TransactionData,
} from "@auth0/auth0-server-js";
import { env } from "$env/dynamic/private";
import type { Cookies } from "@sveltejs/kit";
import { upsertUser } from "./neo4j";

export interface StoreOptions {
  cookies: Cookies;
}

class StatelessTransactionStore implements TransactionStore<StoreOptions> {
  async set(
    identifier: string,
    transactionData: TransactionData,
    _removeIfExists?: boolean, // not used in Stateless storage, kept for compatibility with Stateful storage.
    options?: StoreOptions,
  ): Promise<void> {
    // We can not handle cookies when the `StoreOptions` are not provided.
    if (!options) {
      throw new Error();
    }

    const maxAge = 60 * 60;
    const cookieOpts = { httpOnly: true, sameSite: "lax", path: "/", maxAge } as const;

    options.cookies.set(identifier, JSON.stringify(transactionData), cookieOpts);
  }

  async get(identifier: string, options?: StoreOptions): Promise<TransactionData | undefined> {
    // We can not handle cookies when the `StoreOptions` are not provided.
    if (!options) {
      throw new Error();
    }

    const cookieValue = options.cookies.get(identifier);

    if (cookieValue) {
      return JSON.parse(cookieValue) as TransactionData;
    }
  }

  async delete(identifier: string, options?: StoreOptions | undefined): Promise<void> {
    // We can not handle cookies when the `StoreOptions` are not provided.
    if (!options) {
      throw new Error();
    }

    options.cookies.delete(identifier, { path: "/" });
  }
}

class StatelessStateStore extends AbstractStateStore<StoreOptions> {
  async set(
    identifier: string,
    stateData: StateData,
    _removeIfExists?: boolean, // not used in Stateless storage, kept for compatibility with Stateful storage.
    options?: StoreOptions | undefined,
  ): Promise<void> {
    // We can not handle cookies when the `StoreOptions` are not provided.
    if (!options) {
      throw new Error();
    }

    const maxAge = 2592000;

    const expiration = Math.floor(Date.now() / 1000 + maxAge);
    const encryptedStateData = await this.encrypt(identifier, stateData, expiration);

    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge,
    } as const;

    options.cookies.set(identifier, encryptedStateData, cookieOpts);
  }

  async get(
    identifier: string,
    options?: StoreOptions | undefined,
  ): Promise<StateData | undefined> {
    // We can not handle cookies when the `StoreOptions` are not provided.
    if (!options) {
      throw new Error();
    }

    const encryptedStateData = options.cookies.get(identifier);

    if (encryptedStateData) {
      return (await this.decrypt(identifier, encryptedStateData)) as StateData;
    }
  }

  async delete(identifier: string, options?: StoreOptions | undefined): Promise<void> {
    // We can not handle cookies when the `StoreOptions` are not provided.
    if (!options) {
      throw new Error();
    }

    options.cookies.delete(identifier, { path: "/" });
  }

  deleteByLogoutToken(): Promise<void> {
    throw new Error(
      "Backchannel logout is not available when using Stateless Storage. Use Stateful Storage instead.",
    );
  }
}

export const auth0 = new ServerClient<StoreOptions>({
  domain: env.AUTH0_DOMAIN,
  clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET,
  authorizationParams: {
    redirect_uri: new URL("auth/callback", env.BASE_URL).toString(),
  },
  transactionStore: new StatelessTransactionStore(),
  stateStore: new StatelessStateStore({ secret: env.AUTH0_STORE_SECRET }),
});

export interface User {
  name: string;
  icon: string;
  isAdmin: boolean;
}

export async function getUser(cookies: Cookies): Promise<User | null> {
  const claims = await auth0.getUser({ cookies });

  if (!claims) return null;

  const { name, icon } = normalizeUserInfo(claims);
  const user = await upsertUser(name, icon);
  return user;
}

type UserClaims = NonNullable<Awaited<ReturnType<typeof auth0.getUser>>>;

function normalizeUserInfo(claims: UserClaims): Omit<User, "isAdmin"> {
  return {
    name: claims.name ?? "Anonymous",
    icon:
      claims.picture ??
      `https://placehold.co/48x48/0c2b2b/96d3e3?font=Lora&text=${initials(claims.name)}`,
  };
}

function initials(name: string | undefined): string {
  if (name === undefined) return "??";
  return name
    .split(/\s+/g)
    .map((w) => w.charAt(0))
    .join("");
}
