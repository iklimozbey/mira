import asyncio
import struct
import unittest

from app.services.feed_validator import parse_image_dimensions, validate_feed_items


def _fake_png(width: int, height: int) -> bytes:
    return b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\rIHDR" + struct.pack(">II", width, height) + b"\x08\x02\x00\x00\x00"


class FeedValidatorTests(unittest.TestCase):
    def test_parse_png_dimensions(self):
        self.assertEqual(parse_image_dimensions(_fake_png(800, 800)), (800, 800))
        self.assertEqual(parse_image_dimensions(_fake_png(158, 184)), (158, 184))

    def test_rejects_duplicate_and_missing_images(self):
        items = [
            {"product_name": "Product A", "image_url": "https://cdn.example/a.jpg"},
            {"product_name": "Product B", "image_url": "https://cdn.example/a.jpg"},  # duplicate image
            {"product_name": "Product C", "image_url": ""},  # missing image
        ]
        res = asyncio.run(validate_feed_items(items, check_live=False))
        self.assertEqual(len(res["accepted"]), 1)
        self.assertEqual(len(res["rejected"]), 2)
        self.assertIn("duplicate_image_url", res["rejected"][0]["reasons"])
        self.assertIn("missing_image_url", res["rejected"][1]["reasons"])


if __name__ == "__main__":
    unittest.main()
