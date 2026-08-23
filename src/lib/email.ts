import { Resend } from "resend";
import { formatPrice } from "./format";
import { formatRomeDate } from "./time";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const from =
  process.env.EMAIL_FROM ?? "Desy Nails <onboarding@resend.dev>";

function wrap(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#fbf3f0;font-family:Georgia,serif;color:#3a2c2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff8f6;border:1px solid #e6c97a;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 4px;color:#c4a35a;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;">Desy Nails</p>
                <h1 style="margin:0 0 16px;font-size:28px;color:#8f4e56;">${title}</h1>
                ${body}
                <p style="margin:28px 0 0;font-size:13px;color:#8f4e56;">ogni dettaglio, la mia passione ♡</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type OrderEmail = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  notes: string;
  totalCents: number;
  items: { name: string; quantity: number; unitPriceCents: number; extraNote?: string }[];
};

export async function sendOrderEmails(order: OrderEmail) {
  const resend = getResend();
  const studio = process.env.STUDIO_EMAIL;
  const itemsHtml = order.items
    .map(
      (item) =>
        `<li>${item.quantity}× ${item.name} — ${formatPrice(item.unitPriceCents * item.quantity)}${item.extraNote ? ` (${item.extraNote})` : ""}</li>`,
    )
    .join("");

  const customerBody = wrap(
    "Ordine ricevuto",
    `<p>Ciao ${order.customerName}, grazie per il tuo ordine. Ti ricontatterò al più presto per confermare i dettagli.</p>
     <ul>${itemsHtml}</ul>
     <p><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
     ${order.notes ? `<p>Note: ${order.notes}</p>` : ""}`,
  );

  const studioBody = wrap(
    "Nuovo ordine shop",
    `<p><strong>${order.customerName}</strong> — ${order.email}${order.phone ? ` — ${order.phone}` : ""}</p>
     <p>ID ordine: ${order.id}</p>
     <ul>${itemsHtml}</ul>
     <p><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
     ${order.notes ? `<p>Note: ${order.notes}</p>` : ""}`,
  );

  if (!resend) {
    console.info("[email] RESEND_API_KEY assente, ordine salvato senza invio", order.id);
    return { sent: false };
  }

  const { error: customerError } = await resend.emails.send(
    {
      from,
      to: [order.email],
      subject: `Desy Nails — ordine ${order.id.slice(0, 8)}`,
      html: customerBody,
    },
    { idempotencyKey: `order-customer/${order.id}` },
  );
  if (customerError) console.error(customerError.message);

  if (studio) {
    const { error: studioError } = await resend.emails.send(
      {
        from,
        to: [studio],
        subject: `Nuovo ordine shop — ${order.customerName}`,
        html: studioBody,
      },
      { idempotencyKey: `order-studio/${order.id}` },
    );
    if (studioError) console.error(studioError.message);
  }

  return { sent: true };
}

type BookingEmail = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  notes: string;
  extras: { name: string; quantity: number }[];
};

export async function sendBookingEmails(booking: BookingEmail) {
  const resend = getResend();
  const studio = process.env.STUDIO_EMAIL;
  const when = `${formatRomeDate(booking.startAt, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const extras =
    booking.extras.length > 0
      ? `<p>Extra: ${booking.extras.map((extra) => extra.name).join(", ")}</p>`
      : "";

  const customerBody = wrap(
    "Prenotazione ricevuta",
    `<p>Ciao ${booking.customerName}, la tua richiesta è arrivata.</p>
     <p><strong>${booking.serviceName}</strong><br/>${when}</p>
     ${extras}
     <p>Ti confermerò l'appuntamento il prima possibile.</p>`,
  );

  const studioBody = wrap(
    "Nuova prenotazione",
    `<p><strong>${booking.customerName}</strong> — ${booking.email}${booking.phone ? ` — ${booking.phone}` : ""}</p>
     <p>${booking.serviceName}<br/>${when}</p>
     ${extras}
     ${booking.notes ? `<p>Note: ${booking.notes}</p>` : ""}`,
  );

  if (!resend) {
    console.info("[email] RESEND_API_KEY assente, prenotazione salvata senza invio", booking.id);
    return { sent: false };
  }

  const { error: customerError } = await resend.emails.send(
    {
      from,
      to: [booking.email],
      subject: `Desy Nails — prenotazione ${booking.serviceName}`,
      html: customerBody,
    },
    { idempotencyKey: `booking-customer/${booking.id}` },
  );
  if (customerError) console.error(customerError.message);

  if (studio) {
    const { error: studioError } = await resend.emails.send(
      {
        from,
        to: [studio],
        subject: `Nuova prenotazione — ${booking.customerName}`,
        html: studioBody,
      },
      { idempotencyKey: `booking-studio/${booking.id}` },
    );
    if (studioError) console.error(studioError.message);
  }

  return { sent: true };
}
