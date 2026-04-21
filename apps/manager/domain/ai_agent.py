import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Charger les variables d'environnement au démarrage du module
load_dotenv()

class DataAgent:
    def __init__(self):
        # Récupération sécurisée de la clé
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key:
            raise ValueError("La clé GROQ_API_KEY est manquante dans le fichier .env")

        self.llm = ChatGroq(
            temperature=0, 
            model_name="llama-3.3-70b-versatile", 
            groq_api_key=api_key
        )
        self.parser = JsonOutputParser()

    def get_instruction(self, user_query, columns):
        """Transforme une demande naturelle en instruction JSON structurée."""
        
        system_prompt = """
        Tu es un moteur d'exécution Pandas expert. Ta mission est de transformer les demandes utilisateurs en instructions JSON précises.

        ACTIONS POSSIBLES :
        1. "replace" : Pour modifier ou remplacer des valeurs (cellules, colonnes ou texte).
        2. "delete" : Pour supprimer des colonnes ou filtrer (enlever) des lignes selon une condition.
        3. "search" : Pour filtrer le dataset et ne garder que les lignes correspondant à un critère.

        RÈGLES STRICTES :
        - Réponds UNIQUEMENT avec un JSON valide. Pas de texte avant, pas d'explication après.
        - Tu dois toujours suggérer 3 actions courtes et interactives basées sur les colonnes fournies.
        - Si la demande ne concerne pas Remplacer, Supprimer ou Rechercher, réponds : {{"error": "Action non supportée", "suggestions": ["Essaye de rechercher...", "Supprime la colonne...", "Remplace..."]}}.
        - Respecte la casse des colonnes : {columns}.

        STRUCTURE DU JSON :
        {{
            "action": "replace" | "delete" | "search",
            "params": {{ ... }},
            "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
        }}

        EXEMPLES :

        User: "Cherche tous ceux qui habitent à Paris"
        Output: {{
            "action": "search",
            "params": {{"column": "ville", "value": "Paris", "operator": "=="}},
            "suggestions": ["Cherche les salaires > 3000", "Supprime la colonne ville", "Remplace Paris par Lyon"]
        }}

        User: "Enlève la colonne téléphone"
        Output: {{
            "action": "delete",
            "params": {{"target": "column", "name": "telephone"}},
            "suggestions": ["Supprime les lignes vides", "Recherche un nom", "Remplace les valeurs"]
        }}

        User: "Change les 'En attente' par 'Validé' dans statut"
        Output: {{
            "action": "replace",
            "params": {{"column": "statut", "old_value": "En attente", "new_value": "Validé"}},
            "suggestions": ["Cherche les statuts Validé", "Supprime les colonnes inutiles", "Calculer la somme"]
        }}

        Maintenant, traite la demande suivante pour les colonnes {columns} :
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{query}")
        ])

        chain = prompt | self.llm | self.parser
        
        try:
            return chain.invoke({
                "query": user_query, 
                "columns": ", ".join(columns)
            })
        except Exception as e:
            raise Exception(f"Erreur de l'agent IA : {str(e)}")