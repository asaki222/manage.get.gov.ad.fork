from registrar.models import DomainRequest
from django.urls import reverse
from .test_views import TestWithUser
from django_webtest import WebTest  # type: ignore
from django.utils.dateparse import parse_datetime


class GetRequestsJsonTest(TestWithUser, WebTest):
    def setUp(self):
        super().setUp()
        self.app.set_user(self.user.username)

        # Create domain requests for the user
        self.domain_requests = [
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-01-01",
                status=DomainRequest.DomainRequestStatus.STARTED,
                created_at="2024-01-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-02-01",
                status=DomainRequest.DomainRequestStatus.WITHDRAWN,
                created_at="2024-02-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-03-01",
                status=DomainRequest.DomainRequestStatus.REJECTED,
                created_at="2024-03-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-04-01",
                status=DomainRequest.DomainRequestStatus.STARTED,
                created_at="2024-04-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-05-01",
                status=DomainRequest.DomainRequestStatus.STARTED,
                created_at="2024-05-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-06-01",
                status=DomainRequest.DomainRequestStatus.WITHDRAWN,
                created_at="2024-06-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-07-01",
                status=DomainRequest.DomainRequestStatus.REJECTED,
                created_at="2024-07-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-08-01",
                status=DomainRequest.DomainRequestStatus.STARTED,
                created_at="2024-08-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-09-01",
                status=DomainRequest.DomainRequestStatus.STARTED,
                created_at="2024-09-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-10-01",
                status=DomainRequest.DomainRequestStatus.WITHDRAWN,
                created_at="2024-10-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-11-01",
                status=DomainRequest.DomainRequestStatus.REJECTED,
                created_at="2024-11-01",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-11-02",
                status=DomainRequest.DomainRequestStatus.WITHDRAWN,
                created_at="2024-11-02",
            ),
            DomainRequest.objects.create(
                creator=self.user,
                requested_domain=None,
                submission_date="2024-12-01",
                status=DomainRequest.DomainRequestStatus.APPROVED,
                created_at="2024-12-01",
            ),
        ]

    def tearDown(self):
        super().tearDown()
        DomainRequest.objects.all().delete()

    def test_get_domain_requests_json_authenticated(self):
        """Test that domain requests are returned properly for an authenticated user."""
        response = self.app.get(reverse("get_domain_requests_json"))
        self.assertEqual(response.status_code, 200)
        data = response.json

        # Check pagination info
        self.assertEqual(data["page"], 1)
        self.assertTrue(data["has_next"])
        self.assertFalse(data["has_previous"])
        self.assertEqual(data["num_pages"], 2)

        # Check the number of domain requests
        self.assertEqual(len(data["domain_requests"]), 10)

        # Extract fields from response
        requested_domains = [request["requested_domain"] for request in data["domain_requests"]]
        submission_dates = [request["submission_date"] for request in data["domain_requests"]]
        statuses = [request["status"] for request in data["domain_requests"]]
        created_ats = [request["created_at"] for request in data["domain_requests"]]
        ids = [request["id"] for request in data["domain_requests"]]
        is_deletables = [request["is_deletable"] for request in data["domain_requests"]]
        action_urls = [request["action_url"] for request in data["domain_requests"]]
        action_labels = [request["action_label"] for request in data["domain_requests"]]
        svg_icons = [request["svg_icon"] for request in data["domain_requests"]]

        # Check fields for each domain request
        for i in range(10):
            self.assertNotEqual(data["domain_requests"][i]["status"], "Approved")
            self.assertEqual(
                self.domain_requests[i].requested_domain.name if self.domain_requests[i].requested_domain else None,
                requested_domains[i],
            )
            self.assertEqual(self.domain_requests[i].submission_date, submission_dates[i])
            self.assertEqual(self.domain_requests[i].get_status_display(), statuses[i])
            self.assertEqual(
                parse_datetime(self.domain_requests[i].created_at.isoformat()), parse_datetime(created_ats[i])
            )
            self.assertEqual(self.domain_requests[i].id, ids[i])

            # Check is_deletable
            is_deletable_expected = self.domain_requests[i].status in [
                DomainRequest.DomainRequestStatus.STARTED,
                DomainRequest.DomainRequestStatus.WITHDRAWN,
            ]
            self.assertEqual(is_deletable_expected, is_deletables[i])

            # Check action_url
            action_url_expected = (
                reverse("edit-domain-request", kwargs={"id": self.domain_requests[i].id})
                if self.domain_requests[i].status
                in [
                    DomainRequest.DomainRequestStatus.STARTED,
                    DomainRequest.DomainRequestStatus.ACTION_NEEDED,
                    DomainRequest.DomainRequestStatus.WITHDRAWN,
                ]
                else reverse("domain-request-status", kwargs={"pk": self.domain_requests[i].id})
            )
            self.assertEqual(action_url_expected, action_urls[i])

            # Check action_label
            action_label_expected = (
                "Edit"
                if self.domain_requests[i].status
                in [
                    DomainRequest.DomainRequestStatus.STARTED,
                    DomainRequest.DomainRequestStatus.ACTION_NEEDED,
                    DomainRequest.DomainRequestStatus.WITHDRAWN,
                ]
                else "Manage"
            )
            self.assertEqual(action_label_expected, action_labels[i])

            # Check svg_icon
            svg_icon_expected = (
                "edit"
                if self.domain_requests[i].status
                in [
                    DomainRequest.DomainRequestStatus.STARTED,
                    DomainRequest.DomainRequestStatus.ACTION_NEEDED,
                    DomainRequest.DomainRequestStatus.WITHDRAWN,
                ]
                else "settings"
            )
            self.assertEqual(svg_icon_expected, svg_icons[i])

    def test_pagination(self):
        """Test that pagination works properly. There are 11 total non-approved requests and
        a page size of 10"""
        response = self.app.get(reverse("get_domain_requests_json"), {"page": 1})
        self.assertEqual(response.status_code, 200)
        data = response.json

        # Check pagination info
        self.assertEqual(data["page"], 1)
        self.assertTrue(data["has_next"])
        self.assertFalse(data["has_previous"])
        self.assertEqual(data["num_pages"], 2)

        response = self.app.get(reverse("get_domain_requests_json"), {"page": 2})
        self.assertEqual(response.status_code, 200)
        data = response.json

        # Check pagination info
        self.assertEqual(data["page"], 2)
        self.assertFalse(data["has_next"])
        self.assertTrue(data["has_previous"])
        self.assertEqual(data["num_pages"], 2)

    def test_sorting(self):
        """test that sorting works properly on the result set"""
        response = self.app.get(reverse("get_domain_requests_json"), {"sort_by": "submission_date", "order": "desc"})
        self.assertEqual(response.status_code, 200)
        data = response.json

        # Check if sorted by submission_date in descending order
        submission_dates = [req["submission_date"] for req in data["domain_requests"]]
        self.assertEqual(submission_dates, sorted(submission_dates, reverse=True))

        response = self.app.get(reverse("get_domain_requests_json"), {"sort_by": "submission_date", "order": "asc"})
        self.assertEqual(response.status_code, 200)
        data = response.json

        # Check if sorted by submission_date in ascending order
        submission_dates = [req["submission_date"] for req in data["domain_requests"]]
        self.assertEqual(submission_dates, sorted(submission_dates))

    def test_filter_approved_excluded(self):
        """test that approved requests are excluded from result set."""
        # sort in reverse chronological order of submission date, since most recent request is approved
        response = self.app.get(reverse("get_domain_requests_json"), {"sort_by": "submission_date", "order": "desc"})
        self.assertEqual(response.status_code, 200)
        data = response.json

        # Ensure no approved requests are included
        for domain_request in data["domain_requests"]:
            self.assertNotEqual(domain_request["status"], DomainRequest.DomainRequestStatus.APPROVED)
