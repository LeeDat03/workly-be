import nodemailer from "nodemailer";
import { config } from "../config";

export const sendEmail = async (to: string, subject: string, html: string) => {
	try {
		const transporter = nodemailer.createTransport({
			host: config.mail.host,
			port: Number(config.mail.port),
			secure: false,
			auth: {
				user: config.mail.user,
				pass: config.mail.pass,
			},
		});

		const mailOptions = {
			from: `"${config.mail.fromName}" <${config.mail.fromEmail}>`,
			to,
			subject,
			html,
		};

		const info = await transporter.sendMail(mailOptions);
		return info;
	} catch (error) {
		throw error;
	}
};
