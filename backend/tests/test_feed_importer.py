import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.entities import CatalogProductModel
from app.services.feed_importer import parse_google_merchant_xml, upsert_feed_items


SAMPLE_MERCHANT_XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <item>
      <title>MAC Satin Lipstick Twig</title>
      <g:brand>MAC</g:brand>
      <g:price>890.00 TRY</g:price>
      <g:image_link>https://cdn.example.com/mac-twig-white.jpg</g:image_link>
      <link>https://store.example.com/mac-twig</link>
      <g:gtin>0773602048496</g:gtin>
      <g:product_type>Makeup > Lip > Lipstick</g:product_type>
      <g:availability>in stock</g:availability>
    </item>
  </channel>
</rss>
"""


class FeedImporterTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine)
        self.db = sessionmaker(bind=engine)()

    def tearDown(self):
        self.db.close()

    def test_parse_and_upsert_xml_feed(self):
        items = parse_google_merchant_xml(SAMPLE_MERCHANT_XML, merchant_name="Sephora")
        self.assertEqual(len(items), 1)

        res1 = upsert_feed_items(self.db, items, default_merchant="Sephora")
        self.assertEqual(res1["created"], 1)
        self.assertEqual(res1["updated"], 0)

        row = self.db.query(CatalogProductModel).filter_by(barcode="0773602048496").first()
        self.assertIsNotNone(row)
        self.assertEqual(row.price, 890)
        self.assertEqual(row.finish, "satin")
        self.assertEqual(row.category, "lip")
        self.assertEqual(row.merchant_name, "Sephora")
        self.assertTrue(row.in_stock)

        # Re-importing with a new price updates in place without duplicating
        items[0]["raw_price"] = "849,50 TL"
        res2 = upsert_feed_items(self.db, items, default_merchant="Sephora")
        self.assertEqual(res2["created"], 0)
        self.assertEqual(res2["updated"], 1)
        self.assertEqual(self.db.query(CatalogProductModel).count(), 1)
        self.db.refresh(row)
        self.assertEqual(row.price, 850)


if __name__ == "__main__":
    unittest.main()
