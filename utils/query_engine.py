# utils/query_engine.py
"""
Query engine for generating pandas analysis code using Gemini (ChatGoogleGenerativeAI).
Provides:
- generate_code_from_query(query): returns cleaned Python code that sets `result`.
- suggest_questions(df): returns dataset-aware example questions.
"""

import os
import re
import time
from typing import List
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI

# Initialize Gemini model securely using environment variable
_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def _clean_generated_code(raw: str) -> str:
    """Strip markdown fences and stray backticks from model output."""
    if not raw:
        return ""
    cleaned = re.sub(r"```(?:python)?", "", raw, flags=re.IGNORECASE).strip("` \n")
    return cleaned

def generate_code_from_query(query: str, max_retries: int = 2, retry_delay: float = 1.0) -> str:
    """
    Generate Python/pandas code for the given natural-language query.
    The returned code must set a variable named `result` (Series or DataFrame or scalar).
    """
    prompt = f"""
You are an expert Python data analyst. You will be given a pandas DataFrame named `df`.
Generate only Python code (no explanations or comments) that answers the following question:

Question:
{query}

Requirements:
- Use pandas (imported as pd) and numpy if needed.
- Store the final output in a variable named `result`.
- `result` should be either a pandas DataFrame, pandas Series, or a scalar number/string.
- Do NOT perform any filesystem, network, or system operations (no open(), no os, no subprocess).
- Avoid printing. Do not write files.
- Keep code concise and robust to missing values (use .fillna(), .dropna() only if necessary).
- If grouping/aggregation is needed, use groupby + agg and return an aggregated DataFrame or Series.
- If the question is ambiguous, make a reasonable assumption and implement it.

Return only the code block (no surrounding triple backticks).
"""

    attempt = 0
    while attempt <= max_retries:
        try:
            response = _model.invoke(prompt)
            raw_code = getattr(response, "content", "") if response else ""
            code = _clean_generated_code(raw_code)
            if code:
                return code
            else:
                raise ValueError("Empty code returned from model.")
        except Exception as exc:
            attempt += 1
            if attempt > max_retries:
                raise
            time.sleep(retry_delay * attempt)

def suggest_questions(df: pd.DataFrame, max_examples: int = 6) -> List[str]:
    """
    Generate intelligent example questions based on dataframe schema.
    Returns a list of natural language prompts for the UI.
    """
    if df is None or df.shape[1] == 0:
        return ["Show basic statistics of the dataset", "List the top 5 rows"]

    cols = df.columns.tolist()

    # Identify column types
    numeric = df.select_dtypes(include=["number"]).columns.tolist()
    datetime = [c for c in cols if "date" in c.lower() or "year" in c.lower() or pd.api.types.is_datetime64_any_dtype(df[c])]
    categorical = [c for c in cols if c not in numeric and c not in datetime]

    examples = []

    # Aggregation: numeric by categorical
    if numeric and categorical:
        examples.append(f"Show total {numeric[0]} by {categorical[0]}")
        examples.append(f"Average {numeric[0]} by {categorical[0]}")

    # Top performer
    if numeric and categorical:
        examples.append(f"Which {categorical[0]} has the highest {numeric[0]}?")

    # Time trend
    if datetime and numeric:
        examples.append(f"Show trend of {numeric[0]} over {datetime[0]}")

    # Distribution / counts
    if categorical:
        examples.append(f"Count of records by {categorical[0]}")

    # Correlation / summary
    if len(numeric) >= 2:
        examples.append(f"Show correlation between {numeric[0]} and {numeric[1]}")

    # Fallbacks if too few examples
    if not examples:
        examples = [
            "Show basic statistics of the dataset",
            f"Show top 5 rows sorted by {cols[-1]}",
            "Display column data types and missing values"
        ]

    # Deduplicate & limit
    final = []
    for e in examples:
        if e not in final:
            final.append(e)
        if len(final) >= max_examples:
            break

    return final
