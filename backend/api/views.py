from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ArchivedTrip
from .serializers import ArchiveTripSerializer, RemarkSerializer, TripInputSerializer
from .services.trip_planner import TripPlanningError, plan_trip


def trip_summary(record):
    payload = record.payload
    input_data = payload.get("input", {})
    manifest = input_data.get("manifest", {})
    summary = payload.get("summary", {})
    return {
        "trip_id": record.trip_id,
        "archived_at": record.archived_at.isoformat(),
        "updated_at": record.updated_at.isoformat(),
        "current_location": input_data.get("current_location", ""),
        "pickup_location": input_data.get("pickup_location", ""),
        "dropoff_location": input_data.get("dropoff_location", ""),
        "driver_name": manifest.get("driver_name", ""),
        "vehicle_id": manifest.get("vehicle_id", ""),
        "total_distance_miles": summary.get("total_distance_miles", 0),
        "day_count": summary.get("day_count", 0),
        "compliance_status": summary.get("compliance_status", "Unknown"),
    }


def ensure_trip_remarks(payload):
    payload.setdefault("remarks", [])
    for log in payload.get("daily_logs", []):
        log.setdefault("remarks", [])
    return payload


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class TripPlanningView(APIView):
    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = dict(serializer.validated_data)
        payload.setdefault("start_at", timezone.now())
        try:
            return Response(plan_trip(payload), status=status.HTTP_200_OK)
        except TripPlanningError as exc:
            return Response(exc.errors, status=status.HTTP_400_BAD_REQUEST)


class TripArchiveCollectionView(APIView):
    def get(self, request):
        return Response([trip_summary(record) for record in ArchivedTrip.objects.all()])

    def post(self, request):
        serializer = ArchiveTripSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = ensure_trip_remarks(serializer.validated_data["trip"])
        record, _ = ArchivedTrip.objects.update_or_create(
            trip_id=payload["trip_id"],
            defaults={"payload": payload},
        )
        return Response({"summary": trip_summary(record), "trip": record.payload}, status=status.HTTP_201_CREATED)


class TripArchiveDetailView(APIView):
    def get(self, request, trip_id):
        record = get_object_or_404(ArchivedTrip, trip_id=trip_id)
        return Response(record.payload)

    def delete(self, request, trip_id):
        record = get_object_or_404(ArchivedTrip, trip_id=trip_id)
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TripRemarkView(APIView):
    def post(self, request, trip_id):
        record = get_object_or_404(ArchivedTrip, trip_id=trip_id)
        serializer = RemarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = ensure_trip_remarks(record.payload)
        date = serializer.validated_data["date"].isoformat()
        remark = {
            "id": f"remark_{timezone.now().strftime('%Y%m%d%H%M%S%f')}",
            "date": date,
            "text": serializer.validated_data["text"],
            "created_at": timezone.now().isoformat(),
        }

        payload["remarks"].append(remark)
        matched = False
        for log in payload.get("daily_logs", []):
            if log.get("date") == date:
                log.setdefault("remarks", []).append(remark)
                matched = True
                break
        if not matched:
            return Response({"date": "No daily log exists for this date."}, status=status.HTTP_400_BAD_REQUEST)

        record.payload = payload
        record.save(update_fields=["payload", "updated_at"])
        return Response({"remark": remark, "trip": record.payload}, status=status.HTTP_201_CREATED)
