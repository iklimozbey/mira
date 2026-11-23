import unittest

from app.services.report_i18n import localize_report, localize_text


class ReportI18nTests(unittest.TestCase):
    def test_turkish_to_english_static(self):
        self.assertEqual(
            localize_text("Kolay sürülen homojen ve hafif doku", "en"),
            "Light, even texture that is easy to apply",
        )

    def test_developer_markers_removed(self):
        text = localize_text("🌹 ROSACEA FLARE-UP ALERT: Detected vascular triggers.", "en")
        self.assertNotIn("🌹", text)
        self.assertFalse(text.startswith("ROSACEA"))

    def test_english_to_turkish_dynamic(self):
        self.assertEqual(
            localize_text("Texture and formulation are well-suited for dry skin routines.", "tr"),
            "Doku ve formül kuru cilt rutinleri için uygundur.",
        )

    def test_report_lists_are_localized(self):
        report = localize_report({"pros": ["Cildi boğmayan nefes alan hafif yapı"], "cons": [], "clinical_warnings": []}, "en")
        self.assertEqual(report["pros"], ["Breathable, lightweight feel"])


if __name__ == "__main__":
    unittest.main()
