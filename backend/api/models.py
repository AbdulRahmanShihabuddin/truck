from django.db import models


class ArchivedTrip(models.Model):
    trip_id = models.CharField(max_length=80, unique=True)
    payload = models.JSONField()
    archived_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-archived_at"]

    def __str__(self):
        return self.trip_id
