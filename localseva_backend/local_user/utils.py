from django.core.mail import send_mail

def reset_password_mail(mail_to:str,otp:str):
    send_mail(
        from_email=None,
        recipient_list= [mail_to],
        subject= "Reset Password For your account",
        message= f"your reset password otp is {otp}. only valid for 10 minutes. Not you? no worries safely ignore."
    )