"""
Insight Generator Service
Generates AI-powered insights from data analysis
"""

from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np
from loguru import logger
import uuid
from datetime import datetime

from app.services.ai_service import AIService
from app.config import settings


class InsightGenerator:
    """
    Generates insights from data using AI and statistical analysis
    """
    
    def __init__(self):
        self.ai_service = AIService()
    
    async def generate(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any],
        use_ai: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate insights from data
        
        Args:
            df: The DataFrame
            profile: Data profile
            use_ai: Whether to use AI for generating insights
            
        Returns:
            List of insights
        """
        
        insights = []
        
        # 1. Statistical insights (always generated)
        stat_insights = self._generate_statistical_insights(df, profile)
        insights.extend(stat_insights)
        
        # 2. Trend insights
        trend_insights = self._generate_trend_insights(df, profile)
        insights.extend(trend_insights)
        
        # 3. Anomaly detection
        anomaly_insights = self._detect_anomalies(df, profile)
        insights.extend(anomaly_insights)
        
        # 4. Correlation insights
        correlation_insights = self._generate_correlation_insights(df, profile)
        insights.extend(correlation_insights)
        
        # 5. AI-generated insights (if enabled)
        if use_ai and (settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY):
            try:
                ai_insights = await self._generate_ai_insights(df, profile)
                insights.extend(ai_insights)
            except Exception as e:
                logger.warning(f"AI insight generation failed: {e}")
        
        # Sort by importance
        importance_order = {"high": 0, "medium": 1, "low": 2}
        insights.sort(key=lambda x: importance_order.get(x.get("importance", "low"), 2))
        
        # Limit total insights
        return insights[:10]
    
    def _generate_statistical_insights(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate basic statistical insights
        """
        
        insights = []
        
        # Summary insight
        insights.append({
            "id": str(uuid.uuid4()),
            "type": "summary",
            "title": "Dataset Overview",
            "description": f"Your dataset contains {profile['row_count']:,} records across {profile['column_count']} columns. "
                          f"The data includes {len([c for c in profile['columns'] if c['type'] in ['integer', 'float']])} numeric "
                          f"and {len([c for c in profile['columns'] if c['type'] in ['string', 'category']])} categorical fields.",
            "importance": "medium",
            "related_columns": [],
        })
        
        # Find top performing category
        for col_info in profile["columns"]:
            if col_info["type"] in ["category", "string"] and col_info["unique"] < 20:
                col_name = col_info["name"]
                
                # Find a numeric column to aggregate
                numeric_cols = [c["name"] for c in profile["columns"] if c["type"] in ["integer", "float"]]
                if numeric_cols:
                    num_col = numeric_cols[0]
                    try:
                        top = df.groupby(col_name)[num_col].sum().idxmax()
                        value = df.groupby(col_name)[num_col].sum().max()
                        total = df[num_col].sum()
                        pct = (value / total * 100) if total > 0 else 0
                        
                        insights.append({
                            "id": str(uuid.uuid4()),
                            "type": "distribution",
                            "title": f"Top {self._format_name(col_name)}: {top}",
                            "description": f'"{top}" leads in {self._format_name(num_col).lower()} with '
                                          f'{pct:.1f}% of the total ({value:,.0f}).',
                            "importance": "high",
                            "related_columns": [col_name, num_col],
                            "value": str(top),
                            "change": round(pct, 1),
                        })
                        break
                    except Exception as e:
                        logger.debug(f"Could not generate top category insight: {e}")
        
        # Missing data insight
        total_missing = sum(c["missing"] for c in profile["columns"])
        if total_missing > 0:
            total_cells = profile["row_count"] * profile["column_count"]
            missing_pct = (total_missing / total_cells * 100) if total_cells > 0 else 0
            
            most_missing = max(profile["columns"], key=lambda x: x["missing"])
            
            if missing_pct > 5:
                insights.append({
                    "id": str(uuid.uuid4()),
                    "type": "anomaly",
                    "title": "Missing Data Detected",
                    "description": f'{missing_pct:.1f}% of data cells are empty. The column "{most_missing["name"]}" '
                                  f'has the most missing values ({most_missing["missing"]:,} rows).',
                    "importance": "medium" if missing_pct < 20 else "high",
                    "related_columns": [most_missing["name"]],
                })
        
        return insights
    
    def _generate_trend_insights(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate trend-related insights
        """
        
        insights = []
        
        # Find time columns
        time_cols = [c["name"] for c in profile["columns"] if c["type"] == "datetime"]
        numeric_cols = [c["name"] for c in profile["columns"] if c["type"] in ["integer", "float"]]
        
        if not time_cols or not numeric_cols:
            return insights
        
        time_col = time_cols[0]
        
        for num_col in numeric_cols[:2]:  # Analyze top 2 numeric columns
            try:
                # Convert to datetime and sort
                temp_df = df[[time_col, num_col]].dropna()
                temp_df[time_col] = pd.to_datetime(temp_df[time_col], errors="coerce")
                temp_df = temp_df.dropna().sort_values(time_col)
                
                if len(temp_df) < 10:
                    continue
                
                # Calculate trend (simple linear regression slope)
                x = np.arange(len(temp_df))
                y = temp_df[num_col].values
                
                slope = np.polyfit(x, y, 1)[0]
                mean_val = np.mean(y)
                pct_change = (slope * len(x) / mean_val * 100) if mean_val != 0 else 0
                
                trend_direction = "increasing" if slope > 0 else "decreasing"
                
                if abs(pct_change) > 10:  # Only report significant trends
                    insights.append({
                        "id": str(uuid.uuid4()),
                        "type": "trend",
                        "title": f"{self._format_name(num_col)} is {trend_direction.title()}",
                        "description": f'{self._format_name(num_col)} shows a {trend_direction} trend '
                                      f'with approximately {abs(pct_change):.1f}% change over the time period.',
                        "importance": "high" if abs(pct_change) > 25 else "medium",
                        "related_columns": [time_col, num_col],
                        "change": round(pct_change, 1),
                    })
                    
            except Exception as e:
                logger.debug(f"Trend analysis failed for {num_col}: {e}")
        
        return insights
    
    def _detect_anomalies(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalies in the data
        """
        
        insights = []
        numeric_cols = [c["name"] for c in profile["columns"] if c["type"] in ["integer", "float"]]
        
        for col_name in numeric_cols[:3]:
            try:
                series = df[col_name].dropna()
                
                if len(series) < 20:
                    continue
                
                mean = series.mean()
                std = series.std()
                
                if std == 0:
                    continue
                
                # Find outliers (beyond 3 standard deviations)
                outliers = series[(series < mean - 3*std) | (series > mean + 3*std)]
                
                if len(outliers) > 0:
                    outlier_pct = len(outliers) / len(series) * 100
                    max_outlier = outliers.max()
                    
                    if outlier_pct > 0.5:  # More than 0.5% outliers
                        insights.append({
                            "id": str(uuid.uuid4()),
                            "type": "anomaly",
                            "title": f"Outliers in {self._format_name(col_name)}",
                            "description": f'Found {len(outliers)} outlier values ({outlier_pct:.1f}% of data). '
                                          f'Maximum outlier value: {max_outlier:,.2f}.',
                            "importance": "medium",
                            "related_columns": [col_name],
                        })
                        
            except Exception as e:
                logger.debug(f"Anomaly detection failed for {col_name}: {e}")
        
        return insights
    
    def _generate_correlation_insights(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate insights about correlations
        """
        
        insights = []
        
        if not profile.get("correlations"):
            return insights
        
        for corr in profile["correlations"][:3]:  # Top 3 correlations
            corr_val = corr["correlation"]
            col1, col2 = corr["column1"], corr["column2"]
            
            if abs(corr_val) > 0.7:  # Strong correlation
                strength = "strong" if abs(corr_val) > 0.85 else "moderate"
                direction = "positive" if corr_val > 0 else "negative"
                
                insights.append({
                    "id": str(uuid.uuid4()),
                    "type": "correlation",
                    "title": f"{strength.title()} {direction.title()} Correlation Found",
                    "description": f'{self._format_name(col1)} and {self._format_name(col2)} have a '
                                  f'{strength} {direction} correlation ({corr_val:.2f}). '
                                  f'{"As one increases, the other tends to increase." if direction == "positive" else "As one increases, the other tends to decrease."}',
                    "importance": "high" if abs(corr_val) > 0.85 else "medium",
                    "related_columns": [col1, col2],
                    "value": str(corr_val),
                })
        
        return insights
    
    async def _generate_ai_insights(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate insights using AI
        """
        
        # Prepare data summary for AI
        summary = self._create_data_summary(df, profile)
        
        prompt = f"""Analyze this dataset and provide 2-3 actionable business insights.

Dataset Summary:
{summary}

Provide insights in this JSON format:
[
  {{
    "title": "Short insight title",
    "description": "Detailed explanation with specific numbers",
    "importance": "high/medium/low",
    "type": "recommendation"
  }}
]

Focus on actionable recommendations based on the data patterns."""

        try:
            response = await self.ai_service.chat([
                {"role": "user", "content": prompt}
            ])
            
            # Parse AI response
            import json
            # Extract JSON from response
            start = response.find("[")
            end = response.rfind("]") + 1
            if start != -1 and end > start:
                ai_insights = json.loads(response[start:end])
                
                # Format insights
                formatted = []
                for insight in ai_insights:
                    formatted.append({
                        "id": str(uuid.uuid4()),
                        "type": insight.get("type", "recommendation"),
                        "title": insight.get("title", "AI Insight"),
                        "description": insight.get("description", ""),
                        "importance": insight.get("importance", "medium"),
                        "related_columns": [],
                    })
                
                return formatted
                
        except Exception as e:
            logger.warning(f"AI insight parsing failed: {e}")
        
        return []
    
    def _create_data_summary(
        self, 
        df: pd.DataFrame, 
        profile: Dict[str, Any]
    ) -> str:
        """
        Create a text summary of the data for AI
        """
        
        summary = f"Rows: {profile['row_count']:,}, Columns: {profile['column_count']}\n\n"
        summary += "Columns:\n"
        
        for col in profile["columns"][:10]:
            summary += f"- {col['name']} ({col['type']}): {col['unique']} unique values"
            if col.get("stats"):
                if "mean" in col["stats"]:
                    summary += f", mean={col['stats']['mean']}"
                if "mode" in col["stats"]:
                    summary += f", most common={col['stats']['mode']}"
            summary += "\n"
        
        return summary
    
    def _format_name(self, name: str) -> str:
        """Format column name for display"""
        formatted = name.replace("_", " ").replace("-", " ")
        return " ".join(word.capitalize() for word in formatted.split())