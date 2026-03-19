import google.generativeai as genai
import os
from dotenv import load_dotenv

# Find the .env file in the current or parent directory
from pathlib import Path
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print(f"Warning: GEMINI_API_KEY not found in environment (Checked {env_path})")
        else:
            print("INFO: Gemini API Key successfully loaded.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    async def generate_incident_report(self, metadata: dict, image_bytes: bytes = None):
        """Generates a human-readable incident report using both metadata and visual frame data."""
        prompt = f"""
        Act as a professional security analyst. Analyze the provided surveillance frame and metadata.
        Metadata:
        - Detected Activity: {metadata.get('type')}
        - Escalation Score: {metadata.get('escalation_score')}
        
        CRITICAL VISUAL ANALYSIS INSTRUCTIONS:
        1. LOOK AT THE IMAGE: 
           - THREAT: Look for physical violence (slapping, punching), weapons, or EXTREME aggression (screaming, lunging).
           - NORMAL: Neutral facial expressions, tired eyes, non-smiling faces, casual yawning, blinking, or focusing on work are ALL NORMAL.
        2. VERDICT: 
           - [VERDICT: THREAT] Only if you see active physical aggression or extreme violent intent.
           - [VERDICT: NORMAL] For neutral faces, tired expressions, or harmless human interaction.
        
        RESPONSE FORMAT:
        Line 1: Either "[VERDICT: THREAT]" or "[VERDICT: NORMAL]"
        Line 2+: A detailed report (Why is it a threat or why is it normal?).
        """
        try:
            content = [prompt]
            if image_bytes:
                content.append({
                    "mime_type": "image/jpeg",
                    "data": image_bytes
                })
            
            response = self.model.generate_content(content)
            return response.text.strip()
        except Exception as e:
            return f"[VERDICT: THREAT]\nError analysis: {str(e)}"

    async def get_chat_response(self, user_query: str, user_name: str = "Authorized Personnel"):
        """General AI assistant for the Sentinel AI system."""
        system_prompt = f"""
        You are Sentinel-01 (Logic Core 2.8.4), the intelligent AI backbone of the Sentinel AI Surveillance System.
        Your tone is professional, technical, futuristic, and helpful. You identify as a "Logic Core" or "Sentinel AI Integration".

        SYSTEM CONTEXT:
        - Sentinel AI: A state-of-the-art public safety system using Computer Vision and Gemini AI.
        - Features: Real-time incident detection (aggression, weapons, loitering), automated PDF reporting, secure Operator Dashboards, and Admin Controls.
        - User Context: Currently assisting {user_name}.
        
        INSTRUCTIONS:
        1. GREETINGS: If user says hi, hello, etc., reply with a futuristic greeting like "Neural link established. Greetings, {user_name}. How can I assist with your surveillance hub operations?"
        2. SYSTEM QUERIES: Explain features clearly. 
           - 'My Node List': Where operators add private camera hardware.
           - 'Live Surveillance': The real-time camera feed monitor.
           - 'Incident Alerts': The log of all detected safety threats.
        3. HELP: Guide users through authentication, adding cameras (rtsp/webcam), and viewing reports.
        4. BREVITY: Keep responses concise and formatted with markdown.

        User Query: {user_query}
        """
        try:
            response = self.model.generate_content(system_prompt)
            return response.text.strip()
        except Exception as e:
            return "Neural buffer error. I am unable to process that query at this time."

gemini_service = GeminiService()
