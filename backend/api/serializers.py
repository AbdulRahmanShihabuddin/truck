from rest_framework import serializers

from .services.route_estimator import is_supported_location, supported_location_hint


MANIFEST_FIELDS = (
    "driver_name",
    "vehicle_id",
    "trailer_id",
    "co_driver_name",
    "cargo_classification",
)


class TripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=200, trim_whitespace=True)
    pickup_location = serializers.CharField(max_length=200, trim_whitespace=True)
    dropoff_location = serializers.CharField(max_length=200, trim_whitespace=True)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)
    start_at = serializers.DateTimeField(required=False)
    driver_name = serializers.CharField(max_length=120, trim_whitespace=True)
    vehicle_id = serializers.CharField(max_length=80, trim_whitespace=True)
    trailer_id = serializers.CharField(max_length=80, trim_whitespace=True)
    co_driver_name = serializers.CharField(max_length=120, trim_whitespace=True, required=False, allow_blank=True)
    cargo_classification = serializers.CharField(max_length=120, trim_whitespace=True)

    def validate(self, attrs):
        errors = {}
        for field in ("current_location", "pickup_location", "dropoff_location"):
            if not attrs[field].strip():
                errors[field] = "This location cannot be blank."
            elif not is_supported_location(attrs[field]):
                errors[field] = supported_location_hint()

        for field in ("driver_name", "vehicle_id", "trailer_id", "cargo_classification"):
            if not attrs[field].strip():
                errors[field] = "This field is required."

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class ArchiveTripSerializer(serializers.Serializer):
    trip = serializers.JSONField()

    def validate_trip(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Trip payload must be an object.")
        for key in ("trip_id", "input", "summary", "route", "schedule", "daily_logs", "review"):
            if key not in value:
                raise serializers.ValidationError(f"Trip payload is missing {key}.")
        return value


class RemarkSerializer(serializers.Serializer):
    date = serializers.DateField()
    text = serializers.CharField(max_length=1000, trim_whitespace=True)

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError("Remark cannot be blank.")
        return value
