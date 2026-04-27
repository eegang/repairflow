import unittest

from fastapi import HTTPException

from app.domain.models import RepairRequest, Role, User
from app.services.services import count_statuses, ensure_request_access, validate_status_transition


class ServicesTestCase(unittest.TestCase):
    def test_validate_status_transition_allows_valid_transition(self):
        validate_status_transition("new", "in_progress")

    def test_validate_status_transition_rejects_invalid_transition(self):
        with self.assertRaises(HTTPException) as context:
            validate_status_transition("new", "done")

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail, "Invalid status transition")

    def test_validate_status_transition_requires_comment_for_pause(self):
        with self.assertRaises(HTTPException) as context:
            validate_status_transition("in_progress", "paused")

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail, "Pause comment is required")

    def test_ensure_request_access_denies_foreign_client(self):
        current_user = User(
            id="client-1",
            email="client1@test.com",
            full_name="Client One",
            password="hashed",
            role=Role.client,
            is_active=True,
        )
        request = RepairRequest(
            id="request-1",
            client_id="client-2",
            machine_name="Lathe",
            machine_type="CNC",
            description="Broken spindle",
            contact_person="Operator",
        )

        with self.assertRaises(HTTPException) as context:
            ensure_request_access(current_user, request)

        self.assertEqual(context.exception.status_code, 403)
        self.assertEqual(context.exception.detail, "Access denied")

    def test_count_statuses_fills_missing_statuses_with_zero(self):
        result = count_statuses([("new", 2), ("done", 1)])

        self.assertEqual(
            result,
            {
                "new": 2,
                "in_progress": 0,
                "paused": 0,
                "done": 1,
            },
        )


if __name__ == "__main__":
    unittest.main()
