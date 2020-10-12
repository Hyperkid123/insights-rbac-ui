/*global module*/

const SECTION = 'settings';
const APP_ID = 'rbac';
const APP_ID2 = 'my-user-access'
const routes = {};

routes[`/beta/${SECTION}/${APP_ID}`] = { host: 'http://localhost:8080' };
routes[`/${SECTION}/${APP_ID}`] = { host: 'http://localhost:8080' };
routes[`/beta/apps/${APP_ID}`] = { host: 'http://localhost:8080' };
routes[`/apps/${APP_ID}`] = { host: 'http://localhost:8080' };

routes[`/beta/${SECTION}/${APP_ID2}`] = { host: 'http://localhost:8080' };
routes[`/${SECTION}/${APP_ID2}`] = { host: 'http://localhost:8080' };
routes[`/beta/apps/${APP_ID2}`] = { host: 'http://localhost:8080' };
routes[`/apps/${APP_ID2}`] = { host: 'http://localhost:8080' };

module.exports = { routes };