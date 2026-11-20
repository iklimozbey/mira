import unittest
from app.services.laya_engine import ClinicalGuardrailsLayer, LayaDecisionEngine


class TestLayaDecisionEngine(unittest.TestCase):
    def test_guardrail_pregnancy_veto(self):
        user_profile = {
            "skin_type": "dry",
            "skin_concerns": ["pregnancy", "anti-aging"],
            "allergies_sensitivities": []
        }
        res = ClinicalGuardrailsLayer.evaluate(
            product_name="The Ordinary Retinol 0.5% in Squalane",
            category="serum",
            user_profile=user_profile
        )
        self.assertFalse(res.passed)
        self.assertTrue(res.hard_veto)
        self.assertTrue(any("Hamilelik" in v for v in res.violations))

    def test_guardrail_allergy_veto(self):
        user_profile = {
            "skin_type": "sensitive",
            "skin_concerns": [],
            "allergies_sensitivities": ["fragrance"]
        }
        res = ClinicalGuardrailsLayer.evaluate(
            product_name="Perfumed Floral Moisture Cream",
            category="moisturizer",
            user_profile=user_profile,
            evidence_text="Contains synthetic fragrance and parfum."
        )
        self.assertFalse(res.passed)
        self.assertTrue(res.hard_veto)
        self.assertTrue(any("Alerji" in v for v in res.violations))

    def test_laya_forward_pass_primitives(self):
        user_profile = {
            "skin_type": "oily",
            "skin_concerns": ["acne"],
            "allergies_sensitivities": []
        }
        output = LayaDecisionEngine.evaluate(
            product_name="Estee Lauder Double Wear Stay-in-Place",
            traits={"category": "foundation", "finish": "matte"},
            user_profile=user_profile,
            shelf_notes=[]
        )
        self.assertTrue(output.guardrails_passed)
        self.assertEqual(output.verdict_choice, "BUY")
        self.assertGreaterEqual(output.calibrated_score, 80)
        self.assertLess(output.latency_ms, 50.0)  # sub-50ms CPU execution
        self.assertIn("Laya", output.engine)

    def test_laya_shelf_redundancy_choice(self):
        user_profile = {"skin_type": "combination"}
        shelf_notes = ["Maybelline Fit Me Matte Foundation: Owned (Rating: 5/5)"]
        output = LayaDecisionEngine.evaluate(
            product_name="L'Oreal Infallible Foundation",
            traits={"category": "foundation", "finish": "matte"},
            user_profile=user_profile,
            shelf_notes=shelf_notes
        )
        self.assertTrue(output.is_shelf_duplicate_bool)
        self.assertEqual(output.verdict_choice, "REDUNDANT")


if __name__ == "__main__":
    unittest.main()
