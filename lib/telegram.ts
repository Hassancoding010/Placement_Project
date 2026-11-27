import "server-only";

const scanTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatScanMessage(fullName: string, date: Date) {
  return `Profile ${fullName} was scanned at ${scanTime.format(date)}`;
}

export async function sendScanAlert(fullName: string, date = new Date()) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: formatScanMessage(fullName, date) }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.warn("Telegram scan alert failed", response.status);
  } catch {
    console.warn("Telegram scan alert failed");
  }
}
