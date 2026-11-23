import { Resend } from "resend";
import { formatPrice } from "./format";
import { formatRomeDate } from "./time";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const from = process.env.EMAIL_FROM || "Desy Nails <prenotazioni@bitora.it>";

const studioEmail = () => process.env.STUDIO_EMAIL || "tropini.desi06@gmail.com";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  const studio = studioEmail();
  const itemsHtml = order.items
    .map(
      (item) =>
        `<li>${item.quantity}× ${esc(item.name)} — ${formatPrice(item.unitPriceCents * item.quantity)}${item.extraNote ? ` (${esc(item.extraNote)})` : ""}</li>`,
    )
    .join("");

  const customerBody = wrap(
    "Ordine ricevuto",
    `<p>Ciao ${esc(order.customerName)}, grazie per il tuo ordine. Ti ricontatterò al più presto per confermare i dettagli.</p>
     <ul>${itemsHtml}</ul>
     <p><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
     ${order.notes ? `<p>Note: ${esc(order.notes)}</p>` : ""}`,
  );

  const studioBody = wrap(
    "Nuovo ordine shop",
    `<p><strong>${esc(order.customerName)}</strong> — ${esc(order.email)}${order.phone ? ` — ${esc(order.phone)}` : ""}</p>
     <p>ID ordine: ${order.id}</p>
     <ul>${itemsHtml}</ul>
     <p><strong>Totale: ${formatPrice(order.totalCents)}</strong></p>
     ${order.notes ? `<p>Note: ${esc(order.notes)}</p>` : ""}`,
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

function bookingWhen(startAt: Date, endAt: Date) {
  const day = formatRomeDate(startAt, { weekday: "long", day: "numeric", month: "long" });
  const time = (date: Date) => formatRomeDate(date, { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time(startAt)}–${time(endAt)}`;
}

export async function sendBookingEmails(booking: BookingEmail) {
  const resend = getResend();
  const when = bookingWhen(booking.startAt, booking.endAt);
  const extras =
    booking.extras.length > 0
      ? `<p>Extra: ${esc(booking.extras.map((extra) => extra.name).join(", "))}</p>`
      : "";
  const appUrl = process.env.APP_URL ?? "";

  const customerBody = wrap(
    "Prenotazione ricevuta",
    `<p>Ciao ${esc(booking.customerName)}, la tua richiesta è arrivata.</p>
     <p><strong>${esc(booking.serviceName)}</strong><br/>${when}</p>
     ${extras}
     <p>Ti confermerò l'appuntamento il prima possibile.</p>`,
  );

  const studioBody = wrap(
    "Nuova prenotazione",
    `<p><strong>${esc(booking.customerName)}</strong></p>
     <p>Email: <a href="mailto:${esc(booking.email)}">${esc(booking.email)}</a><br/>
        Telefono: <a href="tel:${esc(booking.phone)}">${esc(booking.phone)}</a></p>
     <p><strong>${esc(booking.serviceName)}</strong><br/>${when}</p>
     ${extras}
     ${booking.notes ? `<p>Note: ${esc(booking.notes)}</p>` : ""}
     ${appUrl ? `<p><a href="${esc(appUrl)}/admin/prenotazioni" style="color:#8f4e56;">Apri nel pannello admin</a></p>` : ""}`,
  );

  if (!resend) {
    console.info("[email] RESEND_API_KEY assente, prenotazione salvata senza invio", booking.id);
    return { sent: false };
  }

  const { error: studioError } = await resend.emails.send(
    {
      from,
      to: [studioEmail()],
      replyTo: booking.email,
      subject: `Nuova prenotazione — ${booking.customerName}`,
      html: studioBody,
    },
    { idempotencyKey: `booking-studio/${booking.id}` },
  );
  if (studioError) console.error(studioError.message);

  const { error: customerError } = await resend.emails.send(
    {
      from,
      to: [booking.email],
      replyTo: studioEmail(),
      subject: `Desy Nails — prenotazione ${booking.serviceName}`,
      html: customerBody,
    },
    { idempotencyKey: `booking-customer/${booking.id}` },
  );
  if (customerError) console.error(customerError.message);

  return { sent: true };
}

export async function sendBookingUpdateEmail(booking: {
  id: string;
  customerName: string;
  email: string;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  status: string;
}) {
  const resend = getResend();
  if (!resend) return { sent: false };

  const when = bookingWhen(booking.startAt, booking.endAt);
  const cancelled = booking.status === "cancelled";
  const title = cancelled
    ? "Appuntamento annullato"
    : booking.status === "confirmed"
      ? "Appuntamento confermato"
      : "Appuntamento aggiornato";
  const body = wrap(
    title,
    cancelled
      ? `<p>Ciao ${esc(booking.customerName)}, il tuo appuntamento per <strong>${esc(booking.serviceName)}</strong> di ${when} è stato annullato.</p>
         <p>Per fissare una nuova data rispondi a questa email.</p>`
      : `<p>Ciao ${esc(booking.customerName)}, ecco i dettagli del tuo appuntamento:</p>
         <p><strong>${esc(booking.serviceName)}</strong><br/>${when}</p>
         <p>Se l'orario non ti va bene rispondi a questa email.</p>`,
  );

  const { error } = await resend.emails.send(
    {
      from,
      to: [booking.email],
      replyTo: studioEmail(),
      subject: `Desy Nails — ${title.toLowerCase()}`,
      html: body,
    },
    {
      idempotencyKey: `booking-update/${booking.id}/${booking.status}/${booking.startAt.getTime()}-${booking.endAt.getTime()}`,
    },
  );
  if (error) console.error(error.message);
  return { sent: !error };
}
