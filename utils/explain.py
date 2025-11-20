# utils/explain.py
"""
Explain the generated code and/or result using Gemini.
Generates a concise, user-friendly summary describing:
- What the code did (high level)
- Key insights from the result (top rows, trends, anomalies)
- Suggested follow-ups (next questions)
"""

import os
import pandas as pd
import textwrap
from typing import Any
from langchain_google_genai import ChatGoogleGenerativeAI

_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def _result_snapshot(result: Any, max_rows: int = 5) -> str:
    """Return a concise markdown snapshot of the result for the prompt."""
    try:
        if isinstance(result, pd.DataFrame):
            return result.head(max_rows).to_markdown()
        if isinstance(result, pd.Series):
            return result.head(max_rows).to_markdown()
        return str(result)
    except Exception:
        return str(result)

def explain_result(query: str, result: Any) -> str:
    """
    Ask Gemini to explain in plain analytical language:
      - what the generated code did
      - what the key insights are
      - highlight anomalies or top contributors
      - propose 2–3 follow-up questions
    """
    snapshot = _result_snapshot(result)

    # Truncate snapshot if too long
    if len(snapshot) > 1500:
        snapshot = snapshot[:1500] + "\n\n...(truncated)"

    prompt = f"""
You are a concise BI analyst. The user asked: "{query}"

We have the result of code execution (snapshot below). Provide:
1) One-sentence summary of what the code computed.
2) 3 short bullet insights about the result (top/bottom performers, trends, anomalies).
3) 2 recommended follow-up questions the user can ask to dig deeper.

Result snapshot (markdown or text):
{snapshot}

Keep the explanation short, clear, and actionable. Use plain English. Use bullet points for insights.
"""
    try:
        response = _model.invoke(prompt)
        text = getattr(response, "content", "") if response else ""
        return text.strip()
    except Exception as exc:
        # On failure, return a safe fallback explanation
        fallback = textwrap.dedent(f"""
        Could not fetch AI explanation (error). Basic snapshot:
        {snapshot}
        """)
        return fallback
