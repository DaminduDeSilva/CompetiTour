from google import genai
from google.genai import types
from scrapers.core.proxy_manager import get_settings
import json
import logging

logger = logging.getLogger(__name__)

class ItineraryMatcher:
    """Uses Gemini to perform fuzzy matching of travel itineraries across different platforms."""
    
    def __init__(self):
        self.settings = get_settings()
        if self.settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=self.settings.GEMINI_API_KEY)
            self.model = "gemini-2.5-flash"
        else:
            self.client = None
            logger.warning("Gemini API key not configured!")
            
    def _fallback_match(self, dmc_hotel: str, ota_hotels: list[str]) -> dict:
        """Fallback match using string token overlap when Gemini is unavailable."""
        dmc_clean = "".join(c for c in dmc_hotel.lower() if c.isalnum() or c.isspace()).split()
        dmc_words = set(dmc_clean)
        if not dmc_words:
            return {"matched_hotel": None, "confidence": 0.0}
        
        import difflib
        best_match = None
        best_score = 0.0
        
        for ota in ota_hotels:
            ota_clean = "".join(c for c in ota.lower() if c.isalnum() or c.isspace()).split()
            ota_words = set(ota_clean)
            if not ota_words:
                continue
            
            # Jaccard similarity
            intersection = dmc_words.intersection(ota_words)
            union = dmc_words.union(ota_words)
            jaccard = len(intersection) / len(union) if union else 0.0
            
            # Substring boost
            dmc_str = " ".join(dmc_clean)
            ota_str = " ".join(ota_clean)
            substring_boost = 0.0
            if dmc_str in ota_str or ota_str in dmc_str:
                substring_boost = 0.6
                
            # Sequence Matcher
            seq_match = difflib.SequenceMatcher(None, dmc_str, ota_str).ratio()
                
            score = max(jaccard, substring_boost, seq_match)
            if score > best_score:
                best_score = score
                best_match = ota
                
        if best_score >= 0.4:
            confidence = round(best_score * 100, 1)
            return {"matched_hotel": best_match, "confidence": confidence}
        return {"matched_hotel": None, "confidence": 0.0}

    def match_hotels(self, dmc_hotel: str, ota_hotels: list[str]) -> dict:
        """Determines if the DMC hotel exists in the list of OTA hotels using semantic AI reasoning."""
        if not self.client:
            logger.info("Gemini client not configured. Running fallback match.")
            return self._fallback_match(dmc_hotel, ota_hotels)
            
        prompt = f"""
        You are an expert travel agent. I will give you a hotel name from a Destination Management Company (DMC) and a list of hotels scraped from an Online Travel Agency (OTA).
        Determine if any hotel in the OTA list is the EXACT same property as the DMC hotel, even if the spelling, localization, or naming convention is slightly different.
        
        DMC Hotel: {dmc_hotel}
        OTA Hotels: {json.dumps(ota_hotels)}
        
        Return ONLY a valid JSON object with the following exact schema:
        {{"matched_hotel": "name of hotel from OTA list or null if no match", "confidence": 100}}
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini AI Matching failed: {e}. Running fallback match.")
            return self._fallback_match(dmc_hotel, ota_hotels)


