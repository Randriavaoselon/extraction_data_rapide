import io
import pandas as pd

from django.shortcuts import render
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from apps.manager.interfaces.serializers import FileUploadSerializer
from apps.manager.domain.services import FileParserService
from apps.manager.domain.servicesAi import DataProcessorService
from apps.manager.domain.ai_agent import DataAgent

class FileUploadView(APIView):
    """
    Endpoint pour uploader et afficher le contenu d'un fichier.
    """
    def post(self, request, *args, **kwargs):
        serializer = FileUploadSerializer(data=request.data)
        
        if serializer.is_valid():
            file = serializer.validated_data['file']
            data = FileParserService.parse_file(file)
            
            return Response({
                "message": "Fichier lu avec succès",
                "data": data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UploadAndSearchView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        serializer = FileSearchSerializer(data=request.data)
        
        if serializer.is_valid():
            file_obj = serializer.validated_data['file']
            search_term = request.data.get('search_term', '').lower()
            
            try:
                if file_obj.name.endswith('.csv'):
                    df = pd.read_csv(file_obj)
                else:
                    df = pd.read_excel(file_obj)

                df = df.fillna('')

                # Logique de filtrage "Full-Text"
                if search_term:
                    mask = df.apply(lambda row: row.astype(str).str.contains(search_term, case=False).any(), axis=1)
                    df_filtered = df[mask]
                else:
                    df_filtered = df

                data = {
                    "columns": list(df_filtered.columns),
                    "rows": df_filtered.to_dict(orient='records')
                }

                return Response({"data": data}, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({"message": f"Erreur de lecture : {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ExportSelectedDataView(APIView):
    def post(self, request):
        data_to_export = request.data.get('selected_data', [])
        export_format = request.data.get('format', 'xlsx')

        if not data_to_export:
            return Response({"error": "Aucune donnée sélectionnée"}, status=status.HTTP_400_BAD_REQUEST)

        df = pd.DataFrame(data_to_export)

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="export_agents.csv"'
            df.to_csv(path_or_buf=response, index=False, encoding='utf-8')
            return response

        else:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Données Exportées')
            
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="export_agents.xlsx"'
            return response

class AIAgentProcessView(APIView):
    def post(self, request):
        user_query = request.data.get('query')
        file_data = request.data.get('data')
        
        if not user_query or not file_data:
            return Response({"error": "Données manquantes"}, status=400)

        # Charger les données
        df = pd.DataFrame(file_data['rows'])
        
        agent = DataAgent()
        try:
            # Récupérer l'objet JSON complet (action, params, suggestions)
            instruction = agent.get_instruction(user_query, df.columns.tolist())
            
            # 1. Vérifier si l'IA a renvoyé une erreur (demande ambiguë)
            if "error" in instruction:
                return Response({
                    "error": instruction["error"],
                    "suggestions": instruction.get("suggestions", [])
                }, status=200) # 200 car c'est une réponse métier, pas un crash

            # 2. Sécuriser l'accès à 'action' et 'params'
            action = instruction.get('action')
            params = instruction.get('params', {})

            # 3. Appliquer l'action via le service
            processor = DataProcessorService()
            df_updated = processor.apply_changes(df, action, params)

            # 4. Retourner les données + suggestions pour le Frontend
            return Response({
                "message": f"Action exécutée : {action}",
                "suggestions": instruction.get("suggestions", []), # Très important pour l'UX
                "data": {
                    "columns": df_updated.columns.tolist(),
                    "rows": df_updated.to_dict(orient='records')
                }
            })
            
        except Exception as e:
            # Capture les erreurs pour éviter de bloquer le frontend
            return Response({
                "error": "Une erreur technique est survenue",
                "details": str(e)
            }, status=500)

def index_view(request):
    return render(request, 'index.html')

def table_data_view(request):
    return render(request, 'table_view.html')