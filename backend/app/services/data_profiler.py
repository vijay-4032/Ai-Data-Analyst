"""
Data Profiler Service
Analyzes data structure, types, and statistics
"""

from typing import Any, Dict, List, Optional, Union
import pandas as pd
import numpy as np
from loguru import logger
from datetime import datetime
import uuid

from app.config import settings


class DataProfiler:
    """
    Profiles datasets to understand structure and content
    """
    
    # Type mapping
    DTYPE_MAP = {
        "int64": "integer",
        "int32": "integer",
        "float64": "float",
        "float32": "float",
        "object": "string",
        "bool": "boolean",
        "datetime64[ns]": "datetime",
        "category": "category",
    }
    
    def __init__(self, sample_size: int = 5):
        """
        Initialize profiler
        
        Args:
            sample_size: Number of sample values to collect
        """
        self.sample_size = sample_size
    
    def profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Profile a DataFrame
        
        Returns:
            Dict containing profile information
        """
        
        logger.info(f"Profiling dataset: {len(df)} rows, {len(df.columns)} columns")
        
        # Basic stats
        profile = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "memory_usage": df.memory_usage(deep=True).sum(),
            "columns": [],
            "correlations": None,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Profile each column
        for col in df.columns:
            col_profile = self._profile_column(df[col], col)
            profile["columns"].append(col_profile)
        
        # Calculate correlations for numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) >= 2:
            try:
                corr_matrix = df[numeric_cols].corr()
                profile["correlations"] = self._get_top_correlations(corr_matrix)
            except Exception as e:
                logger.warning(f"Correlation calculation failed: {e}")
        
        return profile
    
    def _profile_column(self, series: pd.Series, name: str) -> Dict[str, Any]:
        """
        Profile a single column
        """
        
        # Basic info
        col_profile = {
            "name": name,
            "type": self._detect_type(series),
            "dtype": str(series.dtype),
            "nullable": series.isna().any(),
            "unique": series.nunique(),
            "missing": int(series.isna().sum()),
            "missing_pct": round(series.isna().sum() / len(series) * 100, 2),
            "sample": self._get_sample(series),
        }
        
        # Type-specific stats
        if col_profile["type"] in ["integer", "float"]:
            col_profile["stats"] = self._numeric_stats(series)
        elif col_profile["type"] == "datetime":
            col_profile["stats"] = self._datetime_stats(series)
        elif col_profile["type"] in ["string", "category"]:
            col_profile["stats"] = self._categorical_stats(series)
        
        return col_profile
    
    def _detect_type(self, series: pd.Series) -> str:
        """
        Detect the semantic type of a column
        """
        
        dtype = str(series.dtype)
        
        # Check dtype mapping
        if dtype in self.DTYPE_MAP:
            return self.DTYPE_MAP[dtype]
        
        # For object types, try to infer
        if dtype == "object":
            # Sample non-null values
            sample = series.dropna().head(100)
            
            if len(sample) == 0:
                return "string"
            
            # Try to detect dates
            try:
                pd.to_datetime(sample, errors="raise")
                return "datetime"
            except:
                pass
            
            # Try to detect numbers
            try:
                pd.to_numeric(sample, errors="raise")
                return "number"
            except:
                pass
            
            # Check if categorical (low cardinality)
            if series.nunique() < len(series) * 0.5 and series.nunique() < 50:
                return "category"
            
            return "string"
        
        return "string"
    
    def _get_sample(self, series: pd.Series) -> List[Any]:
        """
        Get sample values from a column
        """
        
        # Get non-null values
        non_null = series.dropna()
        
        if len(non_null) == 0:
            return []
        
        # Get unique sample
        sample = non_null.drop_duplicates().head(self.sample_size).tolist()
        
        # Convert numpy types to Python types
        return [self._to_python_type(v) for v in sample]
    
    def _to_python_type(self, value: Any) -> Any:
        """
        Convert numpy types to Python types
        """
        
        if pd.isna(value):
            return None
        if isinstance(value, (np.integer, np.int64)):
            return int(value)
        if isinstance(value, (np.floating, np.float64)):
            return float(value)
        if isinstance(value, np.bool_):
            return bool(value)
        if isinstance(value, (np.datetime64, pd.Timestamp)):
            return str(value)
        return str(value)
    
    def _numeric_stats(self, series: pd.Series) -> Dict[str, Any]:
        """
        Calculate statistics for numeric columns
        """
        
        clean = series.dropna()
        
        if len(clean) == 0:
            return {}
        
        return {
            "min": self._to_python_type(clean.min()),
            "max": self._to_python_type(clean.max()),
            "mean": round(float(clean.mean()), 2),
            "median": round(float(clean.median()), 2),
            "std": round(float(clean.std()), 2) if len(clean) > 1 else 0,
            "sum": self._to_python_type(clean.sum()),
            "zeros": int((clean == 0).sum()),
            "negative": int((clean < 0).sum()),
        }
    
    def _datetime_stats(self, series: pd.Series) -> Dict[str, Any]:
        """
        Calculate statistics for datetime columns
        """
        
        try:
            dt_series = pd.to_datetime(series, errors="coerce")
            clean = dt_series.dropna()
            
            if len(clean) == 0:
                return {}
            
            return {
                "min": str(clean.min()),
                "max": str(clean.max()),
                "range_days": (clean.max() - clean.min()).days,
            }
        except Exception as e:
            logger.warning(f"Datetime stats failed: {e}")
            return {}
    
    def _categorical_stats(self, series: pd.Series) -> Dict[str, Any]:
        """
        Calculate statistics for categorical columns
        """
        
        value_counts = series.value_counts().head(10)
        
        return {
            "mode": str(series.mode().iloc[0]) if len(series.mode()) > 0 else None,
            "top_values": [
                {"value": str(k), "count": int(v)}
                for k, v in value_counts.items()
            ],
        }
    
    def _get_top_correlations(
        self, 
        corr_matrix: pd.DataFrame, 
        n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get top correlations from correlation matrix
        """
        
        # Get upper triangle indices
        correlations = []
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                col1 = corr_matrix.columns[i]
                col2 = corr_matrix.columns[j]
                corr = corr_matrix.iloc[i, j]
                
                if not np.isnan(corr):
                    correlations.append({
                        "column1": col1,
                        "column2": col2,
                        "correlation": round(float(corr), 3),
                    })
        
        # Sort by absolute correlation
        correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        
        return correlations[:n]
    
    def generate_kpis(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Generate KPI metrics from the data
        """
        
        kpis = []
        
        # Find numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for i, col in enumerate(numeric_cols[:4]):  # Max 4 KPIs
            series = df[col].dropna()
            
            if len(series) == 0:
                continue
            
            kpi = {
                "id": str(uuid.uuid4()),
                "label": self._format_column_name(col),
                "value": round(float(series.sum()), 2),
                "format": "number",
                "change": round(np.random.uniform(-20, 30), 1),  # Simulated
                "trend": "up" if np.random.random() > 0.3 else "down",
            }
            
            # Detect if currency-like
            if any(word in col.lower() for word in ["price", "cost", "revenue", "sales", "amount"]):
                kpi["format"] = "currency"
            elif any(word in col.lower() for word in ["percent", "rate", "pct", "%"]):
                kpi["format"] = "percent"
                kpi["value"] = round(float(series.mean()), 1)
            
            kpis.append(kpi)
        
        return kpis
    
    def _format_column_name(self, name: str) -> str:
        """
        Format column name for display
        """
        
        # Replace underscores and camelCase
        formatted = name.replace("_", " ")
        
        # Add spaces before capital letters
        result = ""
        for i, char in enumerate(formatted):
            if char.isupper() and i > 0 and formatted[i-1].islower():
                result += " "
            result += char
        
        return result.title()