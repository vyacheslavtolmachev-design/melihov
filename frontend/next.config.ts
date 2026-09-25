import type { NextConfig } from "next";

const wpPublicUrl = process.env.NEXT_PUBLIC_WP_URL ?? "http://localhost:8080";
const wpInternalUrl = process.env.WP_INTERNAL_URL ?? "http://wordpress";
const pub = new URL(wpPublicUrl);
const int = new URL(wpInternalUrl);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Внутренний хост WordPress резолвится в приватный docker-IP — Next 16 по умолчанию
    // считает это SSRF-риском. Источник URL не пользовательский ввод, а наш собственный
    // WPGraphQL (frontend/lib/wp/media.ts, toOptimizerMediaUrl), поэтому это безопасно.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: pub.protocol.replace(":", "") as "http" | "https",
        hostname: pub.hostname,
        port: pub.port,
        pathname: "/wp-content/uploads/**",
      },
      // Оптимизатор next/image ходит за оригиналом с сервера, изнутри docker-сети
      // (frontend/lib/wp/media.ts, toOptimizerMediaUrl) — этот хост для него, не для браузера.
      {
        protocol: int.protocol.replace(":", "") as "http" | "https",
        hostname: int.hostname,
        port: int.port,
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
