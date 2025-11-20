# app.py
import os
import uuid
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, flash
from werkzeug.utils import secure_filename
import plotly.io as pio
import numpy as np

# Import your upgraded utils
from utils.query_engine import suggest_questions, generate_code_from_query
from utils.visualise import create_visualisation
from utils.explain import explain_result

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"csv"}

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = os.getenv("FLASK_SECRET", "change-me")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def df_kpis(df: pd.DataFrame):
    """Return a dict of KPI cards: total numeric sums, averages, row count, unique counts."""
    kpis = {}
    try:
        numeric = df.select_dtypes(include=["number"])
        if not numeric.empty:
            # pick top 2 numeric columns by variance as suggested KPIs
            variances = numeric.var().sort_values(ascending=False)
            top_cols = variances.index[:2].tolist()
            for c in top_cols:
                kpis[f"Total {c}"] = f"{numeric[c].sum():,.2f}"
                kpis[f"Avg {c}"] = f"{numeric[c].mean():,.2f}"
        kpis["Rows"] = f"{df.shape[0]:,}"
        kpis["Columns"] = f"{df.shape[1]:,}"
    except Exception:
        kpis = {"Rows": f"{df.shape[0]:,}", "Columns": f"{df.shape[1]:,}"}
    return kpis


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # handle CSV upload
        if "file" not in request.files:
            flash("No file part", "error")
            return redirect(request.url)
        file = request.files["file"]
        if file.filename == "":
            flash("No selected file", "error")
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            uid = uuid.uuid4().hex[:8]
            saved_name = f"{uid}_{filename}"
            path = os.path.join(app.config["UPLOAD_FOLDER"], saved_name)
            file.save(path)

            # Read CSV into DataFrame
            try:
                df = pd.read_csv(path)
            except Exception as e:
                flash(f"Error reading CSV: {e}", "error")
                return redirect(request.url)

            # Save small dataset snapshot in session-like store (simple)
            # We'll pass everything to template for immediate rendering
            questions = suggest_questions(df)
            kpis = df_kpis(df)

            # Create default visualizations:
            # 1. Bar chart (if possible)
            default_figs = []
            # Try to get a bar/line/donut using visualise.create_visualisation
            fig = create_visualisation(df)  # tries to visualize the df itself
            if fig is not None:
                default_figs.append(pio.to_html(fig, include_plotlyjs="cdn", full_html=False))

            # Additionally create aggregated bar: numeric by categorical if possible
            numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
            categorical_cols = [c for c in df.columns if c not in numeric_cols]
            if numeric_cols and categorical_cols:
                # aggregate first numeric by first category
                agg = df.groupby(categorical_cols[0])[numeric_cols[0]].sum().sort_values(ascending=False).reset_index()
                fig2 = create_visualisation(agg)
                if fig2 is not None:
                    default_figs.append(pio.to_html(fig2, include_plotlyjs=False, full_html=False))

            # Create donut/pie from top category distribution if possible
            if categorical_cols and numeric_cols:
                topcat = df.groupby(categorical_cols[0])[numeric_cols[0]].sum().sort_values(ascending=False).head(6)
                fig3 = create_visualisation(topcat)  # visualise handles Series -> pie/bar
                if fig3 is not None:
                    default_figs.append(pio.to_html(fig3, include_plotlyjs=False, full_html=False))

            # store minimal state via passing objects to template (not persistent)
            return render_template(
                "dashboard.html",
                filename=saved_name,
                columns=df.columns.tolist(),
                preview=df.head(6).to_html(classes="table table-sm", index=False),
                questions=questions,
                kpis=kpis,
                charts=default_figs,
            )
        else:
            flash("Invalid file type. Please upload a CSV.", "error")
            return redirect(request.url)
    # GET
    return render_template("dashboard.html", questions=[], charts=[], kpis={})


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Endpoint to analyze using a user query. Expects:
    - hidden input 'uploaded' (filename)
    - 'query' (text)
    """
    uploaded = request.form.get("uploaded")
    query = request.form.get("query")
    if not uploaded or not query:
        return {"error": "Missing uploaded file or query"}, 400

    path = os.path.join(app.config["UPLOAD_FOLDER"], uploaded)
    if not os.path.exists(path):
        return {"error": "Uploaded file not found"}, 404

    # load df
    df = pd.read_csv(path)

    # Generate code via Gemini (LLM)
    code = generate_code_from_query(query)

    # Execute generated code (with limited globals)
    local_vars = {"df": df, "pd": pd, "np": np}
    try:
        exec(code, {}, local_vars)
    except Exception as e:
        return {"error": f"Error executing derived code: {e}", "code": code}, 500

    result = local_vars.get("result", None)

    # Build response: HTML snippets for charts + plain text for scalar results + explanation
    response = {"query": query, "code": code, "explanation": "", "charts": [], "kpis": {}, "result_preview": ""}

    # Explanation (use explain_result)
    try:
        explanation = explain_result(query, result)
        response["explanation"] = explanation
    except Exception:
        response["explanation"] = "Could not generate AI explanation."

    # Result handling: DataFrame/Series -> chart(s), scalar -> KPI
    if isinstance(result, (pd.DataFrame, pd.Series)):
        # data preview
        try:
            response["result_preview"] = result.head(10).to_html(classes="table table-sm", index=False)
        except Exception:
            try:
                response["result_preview"] = str(result)
            except Exception:
                response["result_preview"] = ""

        # create plotly fig(s)
        try:
            fig = create_visualisation(result)
            if fig is not None:
                html = pio.to_html(fig, include_plotlyjs="cdn", full_html=False)
                response["charts"].append(html)
        except Exception:
            pass

        # create KPIs based on result (if numeric aggregated)
        try:
            if isinstance(result, pd.DataFrame):
                numeric = result.select_dtypes(include=["number"]).columns.tolist()
                if numeric:
                    # create simple KPIs for numeric columns
                    kpis = {}
                    for c in numeric[:2]:
                        kpis[f"Sum {c}"] = f"{result[c].sum():,.2f}"
                        kpis[f"Avg {c}"] = f"{result[c].mean():,.2f}"
                    response["kpis"] = kpis
            if isinstance(result, pd.Series) and pd.api.types.is_numeric_dtype(result.dtype):
                response["kpis"] = {"Sum": f"{result.sum():,.2f}", "Mean": f"{result.mean():,.2f}"}
        except Exception:
            pass

    elif isinstance(result, (int, float, np.integer, np.floating)):
        response["kpis"] = {"Result": f"{result:,.2f}"}
    elif isinstance(result, str):
        response["result_preview"] = result
    else:
        try:
            response["result_preview"] = str(result)
        except Exception:
            response["result_preview"] = ""

    return response


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
