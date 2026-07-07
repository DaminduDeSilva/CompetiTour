"""Candidate retrieval for embedding-first OTA matching."""

from dataclasses import dataclass
import logging

from pgvector.sqlalchemy import Vector
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class CandidateListing:
    id: int
    raw_name: str
    price_usd: float | None
    similarity: float


async def get_candidates(
    db: AsyncSession,
    component_embedding: list[float],
    source_market_id: int,
    component_type: str,
    k: int = 8,
) -> list[CandidateListing]:
    """Return the k nearest OTA listings by cosine distance."""
    if not component_embedding:
        return []

    query = text(
        """
        SELECT
            id,
            raw_name,
            price_usd,
            1 - (embedding <=> :component_embedding) AS similarity
        FROM ota_listings
        WHERE source_market_id = :source_market_id
          AND component_type = :component_type
          AND embedding IS NOT NULL
        ORDER BY embedding <=> :component_embedding
        LIMIT :k
        """
    ).bindparams(
        bindparam("component_embedding", type_=Vector(1024)),
    )

    try:
        result = await db.execute(
            query,
            {
                "component_embedding": component_embedding,
                "source_market_id": source_market_id,
                "component_type": component_type,
                "k": k,
            },
        )
        rows = result.mappings().all()
    except Exception as e:
        logger.exception("Failed to retrieve embedding candidates: %s", e)
        return []

    candidates: list[CandidateListing] = []
    for row in rows:
        similarity = row.get("similarity")
        candidates.append(
            CandidateListing(
                id=row["id"],
                raw_name=row["raw_name"],
                price_usd=float(row["price_usd"]) if row.get("price_usd") is not None else None,
                similarity=float(similarity) if similarity is not None else 0.0,
            )
        )
    return candidates
