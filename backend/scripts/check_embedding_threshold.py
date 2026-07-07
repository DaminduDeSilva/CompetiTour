"""Quick calibration script for the embedding similarity threshold."""

from __future__ import annotations

import argparse
import csv
import logging
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ai.embedder import EmbeddingService

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ExamplePair:
    dmc_name: str
    ota_name: str
    is_match: bool


EXAMPLES: list[ExamplePair] = [
    ExamplePair("Cinnamon Wild Yala", "Cinnamon Wild Yala by Browns", True),
    ExamplePair("Jetwing Blue", "Jetwing Blue Hotel", True),
    ExamplePair("Heritance Ahungalla", "Heritance Ahungalla Resort", True),
    ExamplePair("Anantara Peace Haven Tangalle", "Anantara Peace Haven Tangalle Resort", True),
    ExamplePair("Kandalama Hotel", "Heritance Kandalama", True),
    ExamplePair("Shangri-La Colombo", "Shangri-La Colombo", True),
    ExamplePair("Tea Plantation Tour", "Tea Factory Visit and Tasting", False),
    ExamplePair("Airport Transfer", "Private City Tour with Lunch", False),
    ExamplePair("Beach Dinner", "Whale Watching Excursion", False),
    ExamplePair("Yala Safari", "Udawalawe Safari", False),
    ExamplePair("Bentota River Cruise", "Bentota Boat Ride", True),
    ExamplePair("Ella Rock Hike", "Little Adam's Peak Trek", False),
    ExamplePair("Galle Fort Walk", "Galle Fort Heritage Walk", True),
    ExamplePair("Kandy Temple Visit", "Temple of the Tooth Sacred City Tour", True),
    ExamplePair("Sigiriya Climb", "Sigiriya Rock Fortress Visit", True),
    ExamplePair("Minneriya Jeep Safari", "Minneriya National Park Safari", True),
    ExamplePair("Waterfall Stop", "Spa Treatment and Massage", False),
]


def _load_examples_from_csv(path: Path) -> list[ExamplePair]:
    examples: list[ExamplePair] = []
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            is_match_value = str(row.get("is_match", "")).strip().lower()
            is_match = is_match_value in {"1", "true", "yes", "y"}
            examples.append(
                ExamplePair(
                    dmc_name=str(row.get("dmc_name", "")).strip(),
                    ota_name=str(row.get("ota_name", "")).strip(),
                    is_match=is_match,
                )
            )
    return examples


def _dot_product(left: Iterable[float], right: Iterable[float]) -> float:
    return float(sum(l * r for l, r in zip(left, right)))


def _print_table(rows: list[tuple[str, str, float, bool]]) -> None:
    dmc_width = max(10, max(len(row[0]) for row in rows))
    ota_width = max(10, max(len(row[1]) for row in rows))
    print(f"{'dmc_name':<{dmc_width}} | {'ota_name':<{ota_width}} | similarity | is_match")
    print(f"{'-' * dmc_width}-+-{'-' * ota_width}-+-----------+---------")
    for dmc_name, ota_name, similarity, is_match in rows:
        print(f"{dmc_name:<{dmc_width}} | {ota_name:<{ota_width}} | {similarity:9.4f} | {str(is_match):>7}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrate the embedding threshold for OTA matching.")
    parser.add_argument("--csv", type=Path, help="Optional CSV with dmc_name,ota_name,is_match columns.")
    args = parser.parse_args()

    examples = _load_examples_from_csv(args.csv) if args.csv else EXAMPLES
    if not examples:
        raise SystemExit("No examples provided.")

    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    embedder = EmbeddingService()

    texts: list[str] = []
    for example in examples:
        texts.append(example.dmc_name)
        texts.append(example.ota_name)

    vectors = embedder.embed(texts)

    rows: list[tuple[str, str, float, bool]] = []
    similarities: list[float] = []
    for index, example in enumerate(examples):
        left = vectors[index * 2]
        right = vectors[index * 2 + 1]
        similarity = _dot_product(left, right)
        similarities.append(similarity)
        rows.append((example.dmc_name, example.ota_name, similarity, example.is_match))

    _print_table(rows)

    match_scores = [score for score, example in zip(similarities, examples) if example.is_match]
    non_match_scores = [score for score, example in zip(similarities, examples) if not example.is_match]

    if not match_scores or not non_match_scores:
        print("\nNeed both match and non-match examples to estimate a threshold.")
        return

    lowest_true_match = min(match_scores)
    highest_true_non_match = max(non_match_scores)
    threshold = (lowest_true_match + highest_true_non_match) / 2

    print()
    print(f"Lowest true-match similarity: {lowest_true_match:.4f}")
    print(f"Highest true-non-match similarity: {highest_true_non_match:.4f}")
    print(f"Suggested threshold: {threshold:.4f}")

    if highest_true_non_match >= lowest_true_match:
        print("Note: the observed classes overlap, so this threshold is only a starting point.")


if __name__ == "__main__":
    main()
