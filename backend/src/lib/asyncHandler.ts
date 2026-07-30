export function asyncHandler(handler: any) {
  return function wrappedHandler(req: any, res: any, next: any) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
