from django.urls import path

from .views import (
    HealthView,
    TripArchiveCollectionView,
    TripArchiveDetailView,
    TripPlanningView,
    TripRemarkView,
)


urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("trips/plan/", TripPlanningView.as_view(), name="trip-plan"),
    path("trips/", TripArchiveCollectionView.as_view(), name="trip-archive-list"),
    path("trips/<str:trip_id>/", TripArchiveDetailView.as_view(), name="trip-archive-detail"),
    path("trips/<str:trip_id>/remarks/", TripRemarkView.as_view(), name="trip-remark"),
]
