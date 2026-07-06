"""add pgvector embeddings to package_components and ota_listings

Revision ID: 08aa94e6f76f
Revises: 4af4521e5147
Create Date: 2026-07-06 22:56:23.261105

"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers
revision: str = '08aa94e6f76f'
down_revision: Union[str, None] = '4af4521e5147'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.add_column(
        "package_components",
        sa.Column("embedding", Vector(1024), nullable=True),
    )
    op.add_column(
        "ota_listings",
        sa.Column("embedding", Vector(1024), nullable=True),
    )

    # HNSW index for fast cosine similarity search
    op.execute(
        "CREATE INDEX ota_listings_embedding_idx "
        "ON ota_listings USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ota_listings_embedding_idx")
    op.drop_column("ota_listings", "embedding")
    op.drop_column("package_components", "embedding")
    # Not dropping the extension on downgrade — other tables/migrations may depend on it