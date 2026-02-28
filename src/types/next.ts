export interface RouteContext<TParams extends object> {
  params: Promise<TParams>;
}
