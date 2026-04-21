import pandas as pd
from rest_framework.exceptions import ValidationError

class FileParserService:
    """
    Service responsable de la lecture et du formatage des données 
    provenant de fichiers Excel et CSV.
    """

    @staticmethod
    def parse_file(file_obj):
        extension = file_obj.name.split('.')[-1].lower()
        
        try:
            if extension == 'csv':
                df = pd.read_csv(file_obj)
            elif extension in ['xlsx', 'xls']:
                df = pd.read_excel(file_obj)
            else:
                raise ValidationError("Format de fichier non supporté.")
        except Exception as e:
            raise ValidationError(f"Erreur lors de la lecture du fichier : {str(e)}")

        return FileParserService._format_data(df)

    @staticmethod
    def _format_data(df):
        """
        Organise les données : liste de colonnes et liste de lignes (dictionnaires).
        """
        # Remplacer les NaN par None pour la compatibilité JSON
        df = df.where(pd.notnull(df), None)
        
        return {
            "columns": list(df.columns),
            "rows": df.to_dict(orient='records')
        }