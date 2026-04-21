from django.urls import path
from apps.manager.interfaces.views import FileUploadView, UploadAndSearchView, ExportSelectedDataView, AIAgentProcessView, index_view, table_data_view

urlpatterns = [
    path('', index_view, name='home'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('upload/', UploadAndSearchView.as_view(), name='file-upload-search'),
    path('export/', ExportSelectedDataView.as_view(), name='export-data'),
    path('read-data/', table_data_view, name='page_tableau'),
    path('ai-process/', AIAgentProcessView.as_view(), name='ai_process'),
]