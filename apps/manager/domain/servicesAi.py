import pandas as pd

class DataProcessorService:
    @staticmethod
    def apply_changes(df, action, params):
        df = df.copy()
        
        # Action : REPLACER (Valeurs)
        if action == "replace":
            col = params.get("column")
            old_val = params.get("old_value")
            new_val = params.get("new_value")
            if col in df.columns:
                df[col] = df[col].replace(old_val, new_val)

        # Action : SUPPRIMER (Colonnes ou Lignes)
        elif action == "delete":
            target = params.get("target") # 'column' ou 'row'
            if target == "column":
                col_name = params.get("name")
                df = df.drop(columns=[col_name], errors='ignore')
            elif target == "row":
                col = params.get("column")
                val = params.get("value")
                if col in df.columns:
                    df = df[df[col].astype(str) != str(val)]

        # Action : RECHERCHER / FILTRER
        elif action == "search":
            col = params.get("column")
            val = params.get("value")
            op = params.get("operator", "==")
            
            if col in df.columns:
                try:
                    if op == "==":
                        df = df[df[col].astype(str).str.contains(str(val), case=False, na=False)]
                    elif op == ">":
                        df = df[pd.to_numeric(df[col]) > float(val)]
                    elif op == "<":
                        df = df[pd.to_numeric(df[col]) < float(val)]
                except:
                    pass # Évite de planter si la conversion numérique échoue

        return df