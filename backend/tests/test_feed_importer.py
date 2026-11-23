import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.entities import CatalogProductModel
from app.services.feed_importer import import_feed_from_file, parse_csv_feed, parse_google_merchant_xml, upsert_feed_items


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

    def test_parse_admitad_yml_and_csv(self):
        yml = """<?xml version="1.0" encoding="UTF-8"?>
        <yml_catalog><shop>
          <categories><category id="10">Cilt Bakımı / Serum</category></categories>
          <offers>
            <offer id="1" available="true">
              <name>The Purest Solutions T-Zone Oil Control Serum</name>
              <vendor>The Purest Solutions</vendor>
              <price>329.90</price>
              <picture>https://cdn.dsmcdn.com/sample-purest.jpg</picture>
              <url>https://ty.gl/affiliate-sample</url>
              <categoryId>10</categoryId>
            </offer>
          </offers>
        </shop></yml_catalog>"""
        items = parse_google_merchant_xml(yml, merchant_name="Trendyol")
        self.assertEqual(len(items), 1)
        res = upsert_feed_items(self.db, items, default_merchant="Trendyol")
        self.assertEqual(res["created"], 1)
        row = self.db.query(CatalogProductModel).filter_by(merchant_name="Trendyol").first()
        self.assertEqual(row.price, 330)
        self.assertEqual(row.category, "serum")
        self.assertEqual(row.merchant_url, "https://ty.gl/affiliate-sample")

        csv_data = "name;brand;price;picture;url;category\nPastel Profashion Matte Lipstick;Pastel;249,00;https://cdn.dsmcdn.com/pastel.jpg;https://ty.gl/pastel;Ruj"
        csv_items = parse_csv_feed(csv_data, merchant_name="Trendyol")
        self.assertEqual(len(csv_items), 1)
        self.assertEqual(csv_items[0]["product_name"], "Pastel Profashion Matte Lipstick")


    def test_import_from_local_csv_file(self):
        import os, tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as f:
            f.write("name,brand,price,picture,url,category\nCeraVe Foaming Cleanser,CeraVe,389,https://img.example/c.jpg,https://shop.example/c,Temizleyici\n")
            path = f.name
        try:
            res = import_feed_from_file(self.db, path, merchant_name="Trendyol")
            self.assertEqual(res["created"], 1)
            row = self.db.query(CatalogProductModel).filter_by(brand="cerave").first()
            self.assertEqual(row.price, 389)
            self.assertEqual(row.merchant_url, "https://shop.example/c")
        finally:
            os.unlink(path)


if __name__ == "__main__":
    unittest.main()
