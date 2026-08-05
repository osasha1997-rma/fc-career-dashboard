// ==========================================
// Career Hub Router
// ==========================================

const routes = {};

export function registerRoute(name, renderer) {
    routes[name] = renderer;
}

export function getRoute(name) {
    return routes[name];
}

export function getRoutes() {
    return routes;
}