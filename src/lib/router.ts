/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FlashMessage, type FlashMessageType, type FlashOptions } from './flashMessage.js';

export class FlashRouter {
  public readonly routes = new Map<string, FlashMessage>();

  constructor(initialData: FlashMessageType) {
    this.routes.set('', new FlashMessage(initialData));
  }

  get defaultRoute() {
    return this.routes.get('')!;
  }

  has(routeId: string) {
    return this.routes.has(routeId);
  }

  getFlashMessage(routeId: string | null) {
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
    const newRoute = new FlashMessage(data, options);
    this.routes.set(routeId, newRoute);
    return newRoute;
  }
}
