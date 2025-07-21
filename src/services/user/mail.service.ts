import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('MAIL_SERVICE'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }


  async sendVerificationEmail(userEmail: string, verificationLink: string) {
    await this.transporter.sendMail({
      from: 'bojan.crnovcic4@gmail.com',
      to: userEmail,
      subject: 'Verifikacija naloga',
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #b23a48; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #b23a48;">Dobrodošli!</h2>
          <p>Hvala što ste se registrovali. Da biste aktivirali svoj nalog, kliknite na dugme ispod:</p>
          <a href="${verificationLink}" target="_blank" style="display: inline-block; background-color: #b23a48; color: white; padding: 10px 20px; margin-top: 15px; text-decoration: none; border-radius: 5px;">
            Verifikujte Email
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: gray;">Ako niste kreirali nalog, slobodno ignorišite ovu poruku.</p>
        </div>
      </div>
    `,
    });
  }
  
}
