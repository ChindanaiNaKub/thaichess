type Loader<TModule> = () => Promise<TModule>;

function once<TModule>(loader: Loader<TModule>): Loader<TModule> {
  let promise: Promise<TModule> | null = null;
  return () => {
    promise ??= loader();
    return promise;
  };
}

export const loadQuickPlayRoute = once(() => import('../components/QuickPlay'));
export const loadLocalGameRoute = once(() => import('../components/LocalGame'));
export const loadBotGameRoute = once(() => import('../components/BotGame'));

export function prefetchPrimaryPlayRoutes(): void {
  void loadQuickPlayRoute();
  void loadLocalGameRoute();
  void loadBotGameRoute();
}
