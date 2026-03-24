import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/lidia.tsx"),     // /
  route("heat", "routes/heat.tsx"), // /heat
  // route("lidia", "routes/lidia.tsx"), // /lidia
  // index("routes/home.tsx"),     // /
] satisfies RouteConfig
