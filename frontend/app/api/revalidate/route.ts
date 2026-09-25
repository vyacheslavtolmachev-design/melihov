import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    return Response.json({ error: "REVALIDATE_SECRET не задан" }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as { secret?: string; reason?: string } | null;

  if (!payload || payload.secret !== secret) {
    return Response.json({ error: "Неверный секрет" }, { status: 403 });
  }

  // Next 16 требует профиль времени жизни: "max" помечает тег устаревшим немедленно
  revalidateTag("wp", "max");

  return Response.json({ revalidated: true, reason: payload.reason ?? null });
}
