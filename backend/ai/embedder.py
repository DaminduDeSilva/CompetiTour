from sentence_transformers import SentenceTransformer
import logging
import threading

logger = logging.getLogger(__name__)

_model = None
_lock = threading.Lock()

def _get_model():
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                logger.info("Loading BAAI/bge-m3 model...")
                _model = SentenceTransformer("BAAI/bge-m3")
    return _model


class EmbeddingService:
    """Generates normalized dense embeddings using BGE-M3 for cross-lingual
    semantic matching of travel components (hotels, transfers, excursions)."""

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = _get_model()
        vectors = model.encode(
            texts,
            normalize_embeddings=True,  # so cosine similarity == dot product
            batch_size=32,
            show_progress_bar=False,
        )
        return vectors.tolist()

    def embed_one(self, text: str) -> list[float]:
        return self.embed([text])[0]