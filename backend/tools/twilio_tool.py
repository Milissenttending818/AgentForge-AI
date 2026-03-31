import os
from twilio.rest import Client
from crewai.tools import BaseTool
from dotenv import load_dotenv

load_dotenv()

class TwilioWhatsappTool(BaseTool):
    name: str = "send_whatsapp"
    description: str = "Sends a WhatsApp message to the user. Input should be the text body of the message."

    def _run(self, message_body: str) -> str:
        # Use exact logic from working script
        sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth = os.getenv("TWILIO_AUTH_TOKEN")
        raw_number = os.getenv("USER_WHATSAPP_NUMBER")
        
        FROM = 'whatsapp:+14155238886'
        
        # Formatting the Phone Number logic
        if raw_number and not raw_number.startswith("whatsapp:"):
            TO = f"whatsapp:{raw_number}"
        else:
            TO = raw_number

        try:
            client = Client(sid, auth)
            msg = client.messages.create(
                body=message_body,
                from_=FROM,
                to=TO
            )
            return f"Message sent! SID: {msg.sid}"
        except Exception as e:
            return f"Failed to send: {str(e)}"
