from django.test import Client, TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from .common import MockEppLib  # type: ignore


from registrar.models import (
    DomainApplication,
    DomainInformation,
    DraftDomain,
    Contact,
    User,
)
from .common import less_console_noise
import logging

logger = logging.getLogger(__name__)


class TestViews(TestCase):
    def setUp(self):
        self.client = Client()

    def test_health_check_endpoint(self):
        response = self.client.get("/health/")
        self.assertContains(response, "OK", status_code=200)

    def test_home_page(self):
        """Home page should NOT be available without a login."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)

    def test_application_form_not_logged_in(self):
        """Application form not accessible without a logged-in user."""
        response = self.client.get("/request/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login?next=/request/", response.headers["Location"])


class TestWithUser(MockEppLib):
    def setUp(self):
        super().setUp()
        username = "test_user"
        first_name = "First"
        last_name = "Last"
        email = "info@example.com"
        self.user = get_user_model().objects.create(
            username=username, first_name=first_name, last_name=last_name, email=email
        )

    def tearDown(self):
        # delete any applications too
        super().tearDown()
        DomainApplication.objects.all().delete()
        DomainInformation.objects.all().delete()
        self.user.delete()


class LoggedInTests(TestWithUser):
    def setUp(self):
        super().setUp()
        self.client.force_login(self.user)

    def tearDown(self):
        super().tearDown()
        Contact.objects.all().delete()

    def test_home_lists_domain_applications(self):
        response = self.client.get("/")
        self.assertNotContains(response, "igorville.gov")
        site = DraftDomain.objects.create(name="igorville.gov")
        application = DomainApplication.objects.create(creator=self.user, requested_domain=site)
        response = self.client.get("/")

        # count = 7 because of screenreader content
        self.assertContains(response, "igorville.gov", count=7)

        # clean up
        application.delete()

    def test_home_deletes_withdrawn_domain_application(self):
        """Tests if the user can delete a DomainApplication in the 'withdrawn' status"""

        site = DraftDomain.objects.create(name="igorville.gov")
        application = DomainApplication.objects.create(
            creator=self.user, requested_domain=site, status=DomainApplication.ApplicationStatus.WITHDRAWN
        )

        # Ensure that igorville.gov exists on the page
        home_page = self.client.get("/")
        self.assertContains(home_page, "igorville.gov")

        # Check if the delete button exists. We can do this by checking for its id and text content.
        self.assertContains(home_page, "Delete")
        self.assertContains(home_page, "button-toggle-delete-domain-alert-1")

        # Trigger the delete logic
        response = self.client.post(reverse("application-delete", kwargs={"pk": application.pk}), follow=True)

        self.assertNotContains(response, "igorville.gov")

        # clean up
        application.delete()

    def test_home_deletes_started_domain_application(self):
        """Tests if the user can delete a DomainApplication in the 'started' status"""

        site = DraftDomain.objects.create(name="igorville.gov")
        application = DomainApplication.objects.create(
            creator=self.user, requested_domain=site, status=DomainApplication.ApplicationStatus.STARTED
        )

        # Ensure that igorville.gov exists on the page
        home_page = self.client.get("/")
        self.assertContains(home_page, "igorville.gov")

        # Check if the delete button exists. We can do this by checking for its id and text content.
        self.assertContains(home_page, "Delete")
        self.assertContains(home_page, "button-toggle-delete-domain-alert-1")

        # Trigger the delete logic
        response = self.client.post(reverse("application-delete", kwargs={"pk": application.pk}), follow=True)

        self.assertNotContains(response, "igorville.gov")

        # clean up
        application.delete()

    def test_home_doesnt_delete_other_domain_applications(self):
        """Tests to ensure the user can't delete Applications not in the status of STARTED or WITHDRAWN"""

        # Given that we are including a subset of items that can be deleted while excluding the rest,
        # subTest is appropriate here as otherwise we would need many duplicate tests for the same reason.
        with less_console_noise():
            draft_domain = DraftDomain.objects.create(name="igorville.gov")
            for status in DomainApplication.ApplicationStatus:
                if status not in [
                    DomainApplication.ApplicationStatus.STARTED,
                    DomainApplication.ApplicationStatus.WITHDRAWN,
                ]:
                    with self.subTest(status=status):
                        application = DomainApplication.objects.create(
                            creator=self.user, requested_domain=draft_domain, status=status
                        )

                        # Trigger the delete logic
                        response = self.client.post(
                            reverse("application-delete", kwargs={"pk": application.pk}), follow=True
                        )

                        # Check for a 403 error - the end user should not be allowed to do this
                        self.assertEqual(response.status_code, 403)

                        desired_application = DomainApplication.objects.filter(requested_domain=draft_domain)

                        # Make sure the DomainApplication wasn't deleted
                        self.assertEqual(desired_application.count(), 1)

                        # clean up
                        application.delete()

    def test_home_deletes_domain_application_and_orphans(self):
        """Tests if delete for DomainApplication deletes orphaned Contact objects"""

        # Create the site and contacts to delete (orphaned)
        contact = Contact.objects.create(
            first_name="Henry",
            last_name="Mcfakerson",
        )
        contact_shared = Contact.objects.create(
            first_name="Relative",
            last_name="Aether",
        )

        # Create two non-orphaned contacts
        contact_2 = Contact.objects.create(
            first_name="Saturn",
            last_name="Mars",
        )

        # Attach a user object to a contact (should not be deleted)
        contact_user, _ = Contact.objects.get_or_create(user=self.user)

        site = DraftDomain.objects.create(name="igorville.gov")
        application = DomainApplication.objects.create(
            creator=self.user,
            requested_domain=site,
            status=DomainApplication.ApplicationStatus.WITHDRAWN,
            authorizing_official=contact,
            submitter=contact_user,
        )
        application.other_contacts.set([contact_2])

        # Create a second application to attach contacts to
        site_2 = DraftDomain.objects.create(name="teaville.gov")
        application_2 = DomainApplication.objects.create(
            creator=self.user,
            requested_domain=site_2,
            status=DomainApplication.ApplicationStatus.STARTED,
            authorizing_official=contact_2,
            submitter=contact_shared,
        )
        application_2.other_contacts.set([contact_shared])

        # Ensure that igorville.gov exists on the page
        home_page = self.client.get("/")
        self.assertContains(home_page, "igorville.gov")

        # Trigger the delete logic
        response = self.client.post(reverse("application-delete", kwargs={"pk": application.pk}), follow=True)

        # igorville is now deleted
        self.assertNotContains(response, "igorville.gov")

        # Check if the orphaned contact was deleted
        orphan = Contact.objects.filter(id=contact.id)
        self.assertFalse(orphan.exists())

        # All non-orphan contacts should still exist and are unaltered
        try:
            current_user = Contact.objects.filter(id=contact_user.id).get()
        except Contact.DoesNotExist:
            self.fail("contact_user (a non-orphaned contact) was deleted")

        self.assertEqual(current_user, contact_user)
        try:
            edge_case = Contact.objects.filter(id=contact_2.id).get()
        except Contact.DoesNotExist:
            self.fail("contact_2 (a non-orphaned contact) was deleted")

        self.assertEqual(edge_case, contact_2)

    def test_home_deletes_domain_application_and_shared_orphans(self):
        """Test the edge case for an object that will become orphaned after a delete
        (but is not an orphan at the time of deletion)"""

        # Create the site and contacts to delete (orphaned)
        contact = Contact.objects.create(
            first_name="Henry",
            last_name="Mcfakerson",
        )
        contact_shared = Contact.objects.create(
            first_name="Relative",
            last_name="Aether",
        )

        # Create two non-orphaned contacts
        contact_2 = Contact.objects.create(
            first_name="Saturn",
            last_name="Mars",
        )

        # Attach a user object to a contact (should not be deleted)
        contact_user, _ = Contact.objects.get_or_create(user=self.user)

        site = DraftDomain.objects.create(name="igorville.gov")
        application = DomainApplication.objects.create(
            creator=self.user,
            requested_domain=site,
            status=DomainApplication.ApplicationStatus.WITHDRAWN,
            authorizing_official=contact,
            submitter=contact_user,
        )
        application.other_contacts.set([contact_2])

        # Create a second application to attach contacts to
        site_2 = DraftDomain.objects.create(name="teaville.gov")
        application_2 = DomainApplication.objects.create(
            creator=self.user,
            requested_domain=site_2,
            status=DomainApplication.ApplicationStatus.STARTED,
            authorizing_official=contact_2,
            submitter=contact_shared,
        )
        application_2.other_contacts.set([contact_shared])

        home_page = self.client.get("/")
        self.assertContains(home_page, "teaville.gov")

        # Trigger the delete logic
        response = self.client.post(reverse("application-delete", kwargs={"pk": application_2.pk}), follow=True)

        self.assertNotContains(response, "teaville.gov")

        # Check if the orphaned contact was deleted
        orphan = Contact.objects.filter(id=contact_shared.id)
        self.assertFalse(orphan.exists())

    def test_application_form_view(self):
        response = self.client.get("/request/", follow=True)
        self.assertContains(
            response,
            "You’re about to start your .gov domain request.",
        )

    def test_domain_application_form_with_ineligible_user(self):
        """Application form not accessible for an ineligible user.
        This test should be solid enough since all application wizard
        views share the same permissions class"""
        self.user.status = User.RESTRICTED
        self.user.save()

        with less_console_noise():
            response = self.client.get("/request/", follow=True)
            self.assertEqual(response.status_code, 403)
