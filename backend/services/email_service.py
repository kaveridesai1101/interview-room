import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

class EmailService:
    @staticmethod
    def send_otp_email(target_email: str, otp: str):
        # Fallback for debug mode if credentials are missing or placeholders
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD or \
           "example@gmail.com" in settings.SMTP_USER or \
           "your-app-password" in settings.SMTP_PASSWORD:
            print(f"\n[DEBUG MODE] OTP for {target_email} is: {otp}\n")
            with open("otp_debug.txt", "w") as f:
                f.write(f"OTP for {target_email}: {otp}")
            return True

        subject = "Sentinel AI Security Code"
        body = f"""
Your verification code is: {otp}

This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.
Do not share this code with anyone.
"""
        
        message = MIMEMultipart()
        message["From"] = settings.SMTP_USER
        message["To"] = target_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(message)
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False

email_service = EmailService()
