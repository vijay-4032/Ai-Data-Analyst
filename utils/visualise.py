# utils/visualise.py
"""
High-quality visualisation helper using Plotly.
- create_visualisation(result): accept Series/DataFrame or return None.
"""

import math
from typing import Optional
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

def _series_to_df(s: pd.Series) -> pd.DataFrame:
    df = s.reset_index()
    df.columns = ["category", "value"]
    return df

def create_visualisation(result) -> Optional[go.Figure]:
    """
    Create a Plotly Figure from result (pd.Series or pd.DataFrame).
    Returns a Plotly figure or None if not suitable for charting.
    """
    if result is None:
        return None

    # Convert Series -> DataFrame
    if isinstance(result, pd.Series):
        df = _series_to_df(result)
    elif isinstance(result, pd.DataFrame):
        df = result.copy()
    else:
        # Scalars/other types: no plot
        return None

    if df.empty:
        return None

    # Standardize column names for convenience
    cols = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=["number"]).columns.tolist()

    # If single numeric + single categorical -> bar chart
    if len(numeric_cols) == 1 and len(categorical_cols) >= 1:
        x = categorical_cols[0]
        y = numeric_cols[0]
        fig = px.bar(
            df,
            x=x,
            y=y,
            text_auto=True,
            title=f"{y} by {x}",
            template="plotly_white",
        )
        fig.update_traces(marker_line_width=0.5)
        fig.update_layout(margin=dict(l=20, r=20, t=50, b=20))
        return fig

    # If multiple numeric columns (wide) -> line chart (trends)
    if len(numeric_cols) >= 2:
        x = categorical_cols[0] if categorical_cols else df.index
        fig = px.line(df, x=x, y=numeric_cols, markers=True, title="Trends", template="plotly_white")
        fig.update_layout(margin=dict(l=20, r=20, t=50, b=20))
        return fig

    # If small dataset and one numeric column -> pie chart by category (if categories available)
    if len(numeric_cols) == 1 and len(df) <= 12 and categorical_cols:
        fig = px.pie(df, names=categorical_cols[0], values=numeric_cols[0], title=f"Distribution of {numeric_cols[0]}", template="plotly_white")
        fig.update_layout(margin=dict(l=20, r=20, t=50, b=20))
        return fig

    # If two numeric columns -> scatter with trendline
    if len(numeric_cols) == 2:
        fig = px.scatter(
            df,
            x=numeric_cols[0],
            y=numeric_cols[1],
            trendline="ols",
            title=f"Scatter: {numeric_cols[0]} vs {numeric_cols[1]}",
            template="plotly_white",
        )
        fig.update_layout(margin=dict(l=20, r=20, t=50, b=20))
        return fig

    # If none of the above, attempt a heatmap of numeric correlations
    if df.select_dtypes(include=["number"]).shape[1] >= 2:
        corr = df.select_dtypes(include=["number"]).corr()
        fig = px.imshow(corr, text_auto=True, title="Numeric Correlation Matrix", template="plotly_white")
        fig.update_layout(margin=dict(l=20, r=20, t=50, b=20))
        return fig

    # Last resort: return a table visualization
    fig = go.Figure(data=[go.Table(header=dict(values=list(df.columns)), cells=dict(values=[df[c] for c in df.columns]))])
    fig.update_layout(title="Result Table", template="plotly_white", margin=dict(l=20, r=20, t=50, b=20))
    return fig
