from rest_framework import serializers

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        valid_extensions = ['.csv', '.xlsx', '.xls']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in valid_extensions:
            raise serializers.ValidationError("Seuls les fichiers CSV et Excel sont autorisés.")
        return value

class FileSearchSerializer(serializers.Serializer):
    file = serializers.FileField()
    search_term = serializers.CharField(required=False, allow_blank=True)