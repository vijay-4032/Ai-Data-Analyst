"""
Chart Recommender Service
Automatically suggests appropriate visualizations based on data
"""

from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np
from loguru import logger
import uuid


class ChartRecommender:
    """
    Recommends chart types based on data structure and content
    """
    
    # Chart type definitions
    CHART_TYPES = {
        "line": {
            "name": "Line Chart",
            "best_for": "Trends over time",
            "requires": ["time_column", "numeric_column"],
        },
        "area": {
            "name": "Area Chart",
            "best_for": "Trends with volume emphasis",
            "requires": ["time_column", "numeric_column"],
        },
        "bar": {
            "name": "Bar Chart",
            "best_for": "Comparing categories",
            "requires": ["category_column", "numeric_column"],
        },
        "pie": {
            "name": "Pie Chart",
            "best_for": "Parts of a whole",
            "requires": ["category_column", "numeric_column"],
            "max_categories": 8,
        },
        "scatter": {
            "name": "Scatter Plot",
            "best_for": "Correlation between variables",
            "requires": ["numeric_column", "numeric_column"],
        },
        "heatmap": {
            "name": "Heatmap",
            "best_for": "Patterns in matrix data",
            "requires": ["multiple_numeric"],
        },
    }
    
    # Color palette
    COLORS = [
        "#4265FF",  # Primary blue
        "#7C3AED",  # Purple
        "#06B6D4",  # Cyan
        "#10B981",  # Green
        "#F59E0B",  # Amber
        "#EF4444",  # Red
        "#EC4899",  # Pink
        "#8B5CF6",  # Violet
    ]
    
    def __init__(self):
        pass
    
    def recommend(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any],
        max_charts: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Recommend charts based on data profile
        
        Args:
            df: The DataFrame
            profile: Data profile from DataProfiler
            max_charts: Maximum number of charts to recommend
            
        Returns:
            List of chart configurations
        """
        
        logger.info(f"Recommending charts for {len(df.columns)} columns")
        
        charts = []
        
        # Categorize columns
        columns = self._categorize_columns(df, profile)
        
        # 1. Time series charts (if time column exists)
        if columns["time"] and columns["numeric"]:
            chart = self._create_time_series_chart(df, columns)
            if chart:
                charts.append(chart)
        
        # 2. Category comparison (bar chart)
        if columns["category"] and columns["numeric"]:
            chart = self._create_category_chart(df, columns)
            if chart:
                charts.append(chart)
        
        # 3. Distribution (pie/donut chart)
        if columns["category"] and columns["numeric"]:
            chart = self._create_distribution_chart(df, columns)
            if chart:
                charts.append(chart)
        
        # 4. Correlation (scatter plot)
        if len(columns["numeric"]) >= 2:
            chart = self._create_scatter_chart(df, columns)
            if chart:
                charts.append(chart)
        
        # 5. Top N comparison
        if columns["category"] and columns["numeric"]:
            chart = self._create_top_n_chart(df, columns)
            if chart:
                charts.append(chart)
        
        # 6. Trend comparison (multiple lines)
        if columns["time"] and len(columns["numeric"]) >= 2:
            chart = self._create_multi_line_chart(df, columns)
            if chart:
                charts.append(chart)
        
        # Limit charts
        charts = charts[:max_charts]
        
        logger.info(f"Recommended {len(charts)} charts")
        
        return charts
    
    def _categorize_columns(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> Dict[str, List[str]]:
        """
        Categorize columns by type
        """
        
        columns = {
            "time": [],
            "numeric": [],
            "category": [],
            "text": [],
        }
        
        for col_info in profile["columns"]:
            name = col_info["name"]
            col_type = col_info["type"]
            
            if col_type == "datetime":
                columns["time"].append(name)
            elif col_type in ["integer", "float"]:
                columns["numeric"].append(name)
            elif col_type == "category" or (col_type == "string" and col_info["unique"] < 20):
                columns["category"].append(name)
            else:
                columns["text"].append(name)
        
        # Try to detect time columns from names
        time_keywords = ["date", "time", "year", "month", "day", "period", "week"]
        for col in df.columns:
            if col not in columns["time"]:
                if any(kw in col.lower() for kw in time_keywords):
                    try:
                        pd.to_datetime(df[col].head(100), errors="raise")
                        columns["time"].append(col)
                    except:
                        pass
        
        return columns
    
    def _create_time_series_chart(
        self, 
        df: pd.DataFrame, 
        columns: Dict[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """
        Create a time series line/area chart
        """
        
        time_col = columns["time"][0]
        value_col = columns["numeric"][0]
        
        try:
            # Prepare data
            chart_df = df[[time_col, value_col]].dropna()
            chart_df = chart_df.sort_values(time_col)
            
            # Aggregate if too many points
            if len(chart_df) > 100:
                chart_df[time_col] = pd.to_datetime(chart_df[time_col])
                chart_df = chart_df.groupby(pd.Grouper(key=time_col, freq="M"))[value_col].sum().reset_index()
            
            # Limit data points
            chart_df = chart_df.tail(50)
            
            # Format data
            data = []
            for _, row in chart_df.iterrows():
                data.append({
                    "date": str(row[time_col])[:10],
                    "value": round(float(row[value_col]), 2) if pd.notna(row[value_col]) else 0,
                })
            
            return {
                "id": str(uuid.uuid4()),
                "type": "area",
                "title": f"{self._format_name(value_col)} Over Time",
                "description": f"Trend of {self._format_name(value_col).lower()} across {self._format_name(time_col).lower()}",
                "x_axis": {"field": "date", "label": self._format_name(time_col), "type": "time"},
                "y_axis": {"field": "value", "label": self._format_name(value_col), "type": "value"},
                "data": data,
                "colors": [self.COLORS[0]],
            }
            
        except Exception as e:
            logger.warning(f"Failed to create time series chart: {e}")
            return None
    
    def _create_category_chart(
        self, 
        df: pd.DataFrame, 
        columns: Dict[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """
        Create a bar chart comparing categories
        """
        
        cat_col = columns["category"][0]
        value_col = columns["numeric"][0]
        
        try:
            # Aggregate by category
            chart_df = df.groupby(cat_col)[value_col].sum().reset_index()
            chart_df = chart_df.sort_values(value_col, ascending=False).head(10)
            
            data = []
            for _, row in chart_df.iterrows():
                data.append({
                    "category": str(row[cat_col])[:20],
                    "value": round(float(row[value_col]), 2),
                })
            
            return {
                "id": str(uuid.uuid4()),
                "type": "bar",
                "title": f"{self._format_name(value_col)} by {self._format_name(cat_col)}",
                "description": f"Comparison of {self._format_name(value_col).lower()} across {self._format_name(cat_col).lower()}",
                "x_axis": {"field": "category", "label": self._format_name(cat_col), "type": "category"},
                "y_axis": {"field": "value", "label": self._format_name(value_col), "type": "value"},
                "data": data,
                "colors": [self.COLORS[0]],
            }
            
        except Exception as e:
            logger.warning(f"Failed to create category chart: {e}")
            return None
    
    def _create_distribution_chart(
        self, 
        df: pd.DataFrame, 
        columns: Dict[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """
        Create a pie/donut chart showing distribution
        """
        
        cat_col = columns["category"][0] if columns["category"] else None
        value_col = columns["numeric"][0] if columns["numeric"] else None
        
        if not cat_col:
            return None
        
        try:
            if value_col:
                # Sum by category
                chart_df = df.groupby(cat_col)[value_col].sum().reset_index()
            else:
                # Count by category
                chart_df = df[cat_col].value_counts().reset_index()
                chart_df.columns = [cat_col, "count"]
                value_col = "count"
            
            # Limit to top categories
            chart_df = chart_df.nlargest(6, value_col)
            total = chart_df[value_col].sum()
            
            data = []
            for i, (_, row) in enumerate(chart_df.iterrows()):
                pct = round(float(row[value_col]) / total * 100, 1) if total > 0 else 0
                data.append({
                    "name": str(row[cat_col])[:15],
                    "value": pct,
                    "color": self.COLORS[i % len(self.COLORS)],
                })
            
            return {
                "id": str(uuid.uuid4()),
                "type": "pie",
                "title": f"{self._format_name(cat_col)} Distribution",
                "description": f"Breakdown by {self._format_name(cat_col).lower()}",
                "data": data,
                "colors": self.COLORS[:len(data)],
            }
            
        except Exception as e:
            logger.warning(f"Failed to create distribution chart: {e}")
            return None
    
    def _create_scatter_chart(
        self, 
        df: pd.DataFrame, 
        columns: Dict[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """
        Create a scatter plot showing correlation
        """
        
        if len(columns["numeric"]) < 2:
            return None
        
        x_col = columns["numeric"][0]
        y_col = columns["numeric"][1]
        
        try:
            chart_df = df[[x_col, y_col]].dropna().head(200)
            
            data = []
            for _, row in chart_df.iterrows():
                data.append({
                    "x": round(float(row[x_col]), 2),
                    "y": round(float(row[y_col]), 2),
                })
            
            return {
                "id": str(uuid.uuid4()),
                "type": "scatter",
                "title": f"{self._format_name(x_col)} vs {self._format_name(y_col)}",
                "description": f"Correlation between {self._format_name(x_col).lower()} and {self._format_name(y_col).lower()}",
                "x_axis": {"field": "x", "label": self._format_name(x_col), "type": "value"},
                "y_axis": {"field": "y", "label": self._format_name(y_col), "type": "value"},
                "data": data,
                "colors": [self.COLORS[2]],
            }
            
        except Exception as e:
            logger.warning(f"Failed to create scatter chart: {e}")
            return None
    
    def _create_top_n_chart(
        self, 
        df: pd.DataFrame, 
        columns: Dict[str, List[str]],
        n: int = 5
    ) -> Optional[Dict[str, Any]]:
        """
        Create a horizontal bar chart showing top N
        """
        
        if len(columns["category"]) < 1 or len(columns["numeric"]) < 1:
            return None
        
        # Use second category or first if only one
        cat_col = columns["category"][1] if len(columns["category"]) > 1 else columns["category"][0]
        value_col = columns["numeric"][0]
        
        try:
            chart_df = df.groupby(cat_col)[value_col].sum().nlargest(n).reset_index()
            
            data = []
            for i, (_, row) in enumerate(chart_df.iterrows()):
                data.append({
                    "name": str(row[cat_col])[:25],
                    "value": round(float(row[value_col]), 2),
                })
            
            return {
                "id": str(uuid.uuid4()),
                "type": "bar",
                "title": f"Top {n} {self._format_name(cat_col)}",
                "description": f"Highest {self._format_name(value_col).lower()} by {self._format_name(cat_col).lower()}",
                "x_axis": {"field": "name", "label": self._format_name(cat_col), "type": "category"},
                "y_axis": {"field": "value", "label": self._format_name(value_col), "type": "value"},
                "data": data,
                "colors": self.COLORS[:n],
            }
            
        except Exception as e:
            logger.warning(f"Failed to create top N chart: {e}")
            return None
    
    def _create_multi_line_chart(
        self, 
        df: pd.DataFrame, 
        columns: Dict[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """
        Create a multi-line comparison chart
        """
        
        time_col = columns["time"][0]
        value_cols = columns["numeric"][:3]  # Max 3 lines
        
        if len(value_cols) < 2:
            return None
        
        try:
            chart_df = df[[time_col] + value_cols].dropna()
            chart_df = chart_df.sort_values(time_col).tail(30)
            
            data = []
            for _, row in chart_df.iterrows():
                point = {"date": str(row[time_col])[:10]}
                for col in value_cols:
                    point[col] = round(float(row[col]), 2) if pd.notna(row[col]) else 0
                data.append(point)
            
            return {
                "id": str(uuid.uuid4()),
                "type": "line",
                "title": "Metric Comparison Over Time",
                "description": f"Comparing {', '.join([self._format_name(c) for c in value_cols])}",
                "x_axis": {"field": "date", "label": self._format_name(time_col), "type": "time"},
                "y_axis": {"field": value_cols[0], "label": "Value", "type": "value"},
                "data": data,
                "colors": self.COLORS[:len(value_cols)],
            }
            
        except Exception as e:
            logger.warning(f"Failed to create multi-line chart: {e}")
            return None
    
    def _format_name(self, name: str) -> str:
        """
        Format column name for display
        """
        formatted = name.replace("_", " ").replace("-", " ")
        return " ".join(word.capitalize() for word in formatted.split())