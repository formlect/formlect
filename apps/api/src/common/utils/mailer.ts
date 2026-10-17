import { Resend } from "resend";
import { env } from "@/common/utils/envConfig";
import { logger } from "@/server";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const layout = (title: string, body: string, cta?: { label: string; url: string }) => `<!doctype html>
<html><body style="margin:0;background:#faf8f6;font-family:Arial,Helvetica,sans-serif;color:#1b1724">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="480" style="max-width:480px;background:#fff;border:1px solid #e6e1dc;border-radius:16px;padding:32px">
<tr><td style="font-size:18px;font-weight:700;color:#4b2bd1;padding-bottom:20px">formlect</td></tr>
<tr><td style="font-size:22px;font-weight:700;padding-bottom:12px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.55;color:#57525e;padding-bottom:24px">${body}</td></tr>
${cta ? `<tr><td style="padding-bottom:24px"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#4b2bd1;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:10px">${cta.label}</a></td></tr>` : ""}
</table></td></tr></table></body></html>`;

// Per-recipient cap so the auth endpoints can't be used to flood one inbox. Dropped silently (no enumeration signal).
// ponytail: in-memory per instance; move to a shared store if the API runs on several instances
const EMAIL_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_MAX_PER_WINDOW = 5;
const sentAt = new Map<string, number[]>();

function allowEmail(to: string) {
	const now = Date.now();
	const key = to.toLowerCase();
	const recent = (sentAt.get(key) ?? []).filter((t) => now - t < EMAIL_WINDOW_MS);
	if (recent.length >= EMAIL_MAX_PER_WINDOW) {
		sentAt.set(key, recent);
		return false;
	}
	sentAt.set(key, [...recent, now]);
	return true;
}

async function send(to: string, subject: string, html: string, devText: string) {
	if (!allowEmail(to)) {
		logger.warn("Email throttled for recipient");
		return;
	}
	if (!resend) {
		// Only reachable outside production (envConfig requires the key there)
		logger.warn(`RESEND_API_KEY not set; email to ${to} not sent. ${devText}`);
		return;
	}
	const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
	if (error) logger.error(error, `Failed to send "${subject}" email`);
}

export const sendVerificationEmail = (to: string, url: string) =>
	send(
		to,
		"Verify your email for Formlect",
		layout(
			"Confirm your email",
			"Click the button below to verify your email address and finish setting up your Formlect account. The link expires in 1 hour.",
			{ label: "Verify email", url },
		),
		`Verification link: ${url}`,
	);

// Also the "set a password" flow for Google/GitHub-only accounts: Better Auth creates the credential account on reset
export const sendResetPasswordEmail = (to: string, url: string) =>
	send(
		to,
		"Reset your Formlect password",
		layout(
			"Reset your password",
			"Click the button below to reset the password for your Formlect account. The link expires in 1 hour. If you didn't request this, ignore this email.",
			{ label: "Reset password", url },
		),
		`Password reset link: ${url}`,
	);

export const sendExistingAccountEmail = (to: string) =>
	send(
		to,
		"Someone tried to sign up with your email",
		layout(
			"You already have an account",
			`Someone just tried to create a Formlect account with this email address. If it was you, sign in at <a href="${escapeHtml(env.WEB_URL)}/sign-in" style="color:#4b2bd1">${escapeHtml(env.WEB_URL)}/sign-in</a>. If not, you can ignore this message.`,
		),
		"Existing account notice",
	);
