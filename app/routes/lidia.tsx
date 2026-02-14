import type { Route } from "./+types/home";
import { Lidia } from "../lidia/lidia";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Heat() {
  return <Lidia />;
}
