from django.http import JsonResponse
from django.core.paginator import Paginator
from registrar.models import DomainRequest
from django.utils.dateformat import format
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.db.models import Q


@login_required
def get_domain_requests_json(request):
    """Given the current request,
    get all domain requests that are associated with the request user and exclude the APPROVED ones"""

    domain_request_ids = get_domain_request_ids_from_request(request)

    objects = DomainRequest.objects.filter(id__in=domain_request_ids)
    unfiltered_total = objects.count()

    objects = apply_search(objects, request)
    objects = apply_sorting(objects, request)

    paginator = Paginator(objects, 10)
    page_number = request.GET.get("page", 1)
    page_obj = paginator.get_page(page_number)

    domain_requests = [
        serialize_domain_request(domain_request, request.user) for domain_request in page_obj.object_list
    ]

    return JsonResponse(
        {
            "domain_requests": domain_requests,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
            "page": page_obj.number,
            "num_pages": paginator.num_pages,
            "total": paginator.count,
            "unfiltered_total": unfiltered_total,
        }
    )


def get_domain_request_ids_from_request(request):
    """Get domain request ids from request.

    If portfolio specified, return domain request ids associated with portfolio.
    Otherwise, return domain request ids associated with request.user.
    """
    portfolio = request.GET.get("portfolio")
    filter_condition = Q(creator=request.user)
    if portfolio:
        if request.user.is_org_user(request) and request.user.has_view_all_requests_portfolio_permission(portfolio):
            filter_condition = Q(portfolio=portfolio)
        else:
            filter_condition = Q(portfolio=portfolio, creator=request.user)
    domain_requests = DomainRequest.objects.filter(filter_condition).exclude(
        status=DomainRequest.DomainRequestStatus.APPROVED
    )
    return domain_requests.values_list("id", flat=True)


def apply_search(queryset, request):
    search_term = request.GET.get("search_term")

    if search_term:
        search_term_lower = search_term.lower()
        new_domain_request_text = "new domain request"

        # Check if the search term is a substring of 'New domain request'
        # If yes, we should return domain requests that do not have a
        # requested_domain (those display as New domain request in the UI)
        if search_term_lower in new_domain_request_text:
            queryset = queryset.filter(
                Q(requested_domain__name__icontains=search_term) | Q(requested_domain__isnull=True)
            )
        else:
            queryset = queryset.filter(Q(requested_domain__name__icontains=search_term))
    return queryset


def apply_sorting(queryset, request):
    sort_by = request.GET.get("sort_by", "id")  # Default to 'id'
    order = request.GET.get("order", "asc")  # Default to 'asc'

    if order == "desc":
        sort_by = f"-{sort_by}"
    return queryset.order_by(sort_by)


def serialize_domain_request(domain_request, user):
    # Determine if the request is deletable
    is_deletable = domain_request.status in [
        DomainRequest.DomainRequestStatus.STARTED,
        DomainRequest.DomainRequestStatus.WITHDRAWN,
    ]

    # Determine action label based on user permissions and request status
    editable_statuses = [
        DomainRequest.DomainRequestStatus.STARTED,
        DomainRequest.DomainRequestStatus.ACTION_NEEDED,
        DomainRequest.DomainRequestStatus.WITHDRAWN,
    ]

    if user.has_edit_request_portfolio_permission and domain_request.creator == user:
        action_label = "Edit" if domain_request.status in editable_statuses else "Manage"
    else:
        action_label = "View"

    # Map the action label to corresponding URLs and icons
    action_url_map = {
        "Edit": reverse("edit-domain-request", kwargs={"id": domain_request.id}),
        "Manage": reverse("domain-request-status", kwargs={"pk": domain_request.id}),
        "View": "#",
    }

    svg_icon_map = {"Edit": "edit", "Manage": "settings", "View": "visibility"}

    return {
        "requested_domain": domain_request.requested_domain.name if domain_request.requested_domain else None,
        "last_submitted_date": domain_request.last_submitted_date,
        "status": domain_request.get_status_display(),
        "created_at": format(domain_request.created_at, "c"),  # Serialize to ISO 8601
        "creator": domain_request.creator.email,
        "id": domain_request.id,
        "is_deletable": is_deletable,
        "action_url": action_url_map.get(action_label),
        "action_label": action_label,
        "svg_icon": svg_icon_map.get(action_label),
    }
