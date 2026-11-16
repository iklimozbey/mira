import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine


class MiraBackendTestSuite(unittest.TestCase):
    """End-to-end integration test suite for MIRA Backend API."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.email = "unittest@mira.app"
        cls.password = "securepass123"
        cls.token = None

    def test_01_health_check(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_02_register_and_login(self):
        reg = self.client.post(
            "/api/v1/auth/register",
            json={"email": self.email, "password": self.password}
        )
        self.assertEqual(reg.status_code, 201)

        login = self.client.post(
            "/api/v1/auth/login",
            data={"username": self.email, "password": self.password}
        )
        self.assertEqual(login.status_code, 200)
        MiraBackendTestSuite.token = login.json()["access_token"]
        self.assertIsNotNone(self.token)

    def test_03_profile_update(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        res = self.client.put(
            "/api/v1/profile/me",
            headers=headers,
            json={
                "skin_type": "oily",
                "skin_undertone": "cool",
                "skin_concerns": ["pores", "shine"],
                "budget_level": "medium"
            }
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["skin_type"], "oily")

    def test_04_inventory_and_reality_check(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        shelf_res = self.client.post(
            "/api/v1/inventory/",
            headers=headers,
            json={
                "product_name": "Maybelline Fit Me Matte + Poreless",
                "brand": "Maybelline",
                "rating": 4,
                "experience_notes": "Good oil control for 5 hours"
            }
        )
        self.assertEqual(shelf_res.status_code, 201)

        analyze_res = self.client.post(
            "/api/v1/research/analyze",
            headers=headers,
            json={"query_or_url": "Fenty Beauty Pro Filt'r Soft Matte Foundation"}
        )
        self.assertEqual(analyze_res.status_code, 200)
        report = analyze_res.json()
        self.assertIn("reality_check_verdict", report)
        self.assertEqual(report["reality_check_verdict"], "CONSIDER")

    def test_05_quota_and_kvkk_export_delete(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        quota_res = self.client.get("/api/v1/research/quota", headers=headers)
        self.assertEqual(quota_res.status_code, 200)
        self.assertEqual(quota_res.json()["used_today"], 1)
        self.assertEqual(quota_res.json()["remaining_today"], 4)

        export_res = self.client.get("/api/v1/auth/export-data", headers=headers)
        self.assertEqual(export_res.status_code, 200)
        self.assertEqual(export_res.json()["inventory_count"], 1)

        del_res = self.client.delete("/api/v1/auth/delete-account", headers=headers)
        self.assertEqual(del_res.status_code, 204)


if __name__ == "__main__":
    unittest.main()
