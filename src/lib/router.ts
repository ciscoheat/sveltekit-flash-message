/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { writable, type Writable } from 'svelte/store';
import { FlashMessage, type FlashMessageType } from './flashMessage.js';
import { mergeOptions, type FlashOptions } from './options.js';
import { onDestroy } from 'svelte';

export class FlashRouter {
  public readonly routes = new Map<string, FlashMessage>();
  private messageStore: Writable<FlashMessageType>;

  constructor() {
    this.messageStore = writable<FlashMessageType>();
    this.routes.set('', new FlashMessage(this.messageStore));

    onDestroy(() => {
      for (const route of this.routes.values()) {
        clearTimeout(route.flashTimeout);
      }
    });
  }

  get defaultRoute() {
    return this.routes.get('')!;
  }

  has(routeId: string) {
    return this.routes.has(routeId);
  }

  getFlashMessage(routeId: string | null | undefined) {
    if (!routeId) return this.defaultRoute;

    if (this.routes.has(routeId)) return this.routes.get(routeId)!;
    return this.getClosestRoute(routeId);
  }

  getClosestRoute(routeId: string): FlashMessage {
    const matchingRoutes = Array.from(this.routes.keys()).filter((key) => routeId.includes(key));

    if (!matchingRoutes.length) {
      return this.defaultRoute;
    }

    const longestRoute = matchingRoutes.reduce((prev, curr) =>
      curr.length > prev.length ? curr : prev
    );

    return this.routes.get(longestRoute)!;
  }

  createRoute(routeId: string, data: FlashMessageType, options?: Partial<FlashOptions>) {
    console.log('createRoute', routeId, options);
    const closest = this.getClosestRoute(routeId);
    const newRoute = new FlashMessage(this.messageStore, mergeOptions(closest.options, options));

    // Update flash data
    newRoute.message.set(data);

    this.routes.set(routeId, newRoute);
    return newRoute;
  }
}
