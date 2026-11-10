from rest_framework import serializers
from .models import EducationCategory, EducationResource

class EducationCategorySerializer(serializers.ModelSerializer):
    resource_count = serializers.IntegerField(source='resources.count', read_only=True)

    class Meta:
        model = EducationCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'resource_count']

class EducationResourceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    audience_display = serializers.CharField(source='get_audience_display', read_only=True)

    class Meta:
        model = EducationResource
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 
            'audience', 'audience_display', 'summary', 'content',
            'related_protocols', 'related_procedures',
            'is_published', 'created_at', 'updated_at'
        ]
