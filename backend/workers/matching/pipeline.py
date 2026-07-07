"""Hybrid embedding + Gemini matching pipeline for package components."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from ai.embedder import EmbeddingService
from ai.matcher import ItineraryMatcher
from app.models.component_match import ComponentMatch
from app.services.candidate_retrieval import get_candidates

logger = logging.getLogger(__name__)

THRESHOLD = 0.75
_k_default = 8
_embedding_service = EmbeddingService()
_itinerary_matcher = ItineraryMatcher()


async def match_component(
    db: AsyncSession,
    component,
    source_market_id: int,
    k: int = _k_default,
) -> dict:
    """Match a package component against OTA listings using embeddings plus Gemini reranking."""
    try:
        component_embedding = _embedding_service.embed_one(component.name)
    except Exception as e:
        logger.warning("Failed to embed component '%s': %s", component.name, e)
        return {"matched_hotel": None, "confidence": 0.0, "match_method": "embedding_gemini_hybrid"}

    candidates = await get_candidates(
        db=db,
        component_embedding=component_embedding,
        source_market_id=source_market_id,
        component_type=component.component_type,
        k=k,
    )

    if not candidates:
        return {"matched_hotel": None, "confidence": 0.0, "match_method": "no_candidates"}

    shortlist_names = [candidate.raw_name for candidate in candidates]
    gemini_result = _itinerary_matcher.match_hotels(component.name, shortlist_names)

    matched_hotel = gemini_result.get("matched_hotel")
    confidence = float(gemini_result.get("confidence") or 0.0)
    match_method = "embedding_gemini_hybrid"

    matched_candidate = next((candidate for candidate in candidates if candidate.raw_name == matched_hotel), None)

    if confidence == 0.0 and candidates[0].similarity > THRESHOLD:
        matched_candidate = candidates[0]
        matched_hotel = matched_candidate.raw_name
        confidence = round(matched_candidate.similarity * 100, 2)
        match_method = "embedding_fallback"

    if not matched_candidate or not matched_hotel:
        return {"matched_hotel": None, "confidence": 0.0, "match_method": "embedding_gemini_hybrid"}

    match_record = ComponentMatch(
        package_component_id=component.id,
        ota_listing_id=matched_candidate.id,
        confidence=confidence,
        match_method=match_method,
        reviewed=False,
    )
    db.add(match_record)
    await db.flush()

    return {
        "matched_hotel": matched_hotel,
        "confidence": confidence,
        "match_method": match_method,
        "ota_listing_id": matched_candidate.id,
        "similarity": matched_candidate.similarity,
    }
