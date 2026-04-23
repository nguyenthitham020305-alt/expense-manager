from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from models import db, Budget, Transaction, SavingsAccount

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
def get_summary():
    now = datetime.now(timezone.utc)
    current_month = now.month
    current_year = now.year

    # All-time totals for balance
    all_txs = Transaction.query.all()
    all_income = sum(t.amount for t in all_txs if t.type == "income")
    all_expense = sum(t.amount for t in all_txs if t.type == "expense")
    total_balance = all_income - all_expense

    # Current month for summary
    pattern = f"{current_year:04d}-{current_month:02d}-%"
    month_txs = [t for t in all_txs if t.date and t.date.startswith(f"{current_year:04d}-{current_month:02d}-")]

    monthly_income = sum(t.amount for t in month_txs if t.type == "income")
    monthly_expense = sum(t.amount for t in month_txs if t.type == "expense")

    total_savings = (
        db.session.query(db.func.coalesce(db.func.sum(SavingsAccount.balance), 0))
        .scalar()
    )

    budgets = Budget.query.filter_by(month=current_month, year=current_year).all()
    budget_alerts = []
    for b in budgets:
        b_dict = b.to_dict()
        spent = b_dict["spentAmount"]
        if spent <= 0:
            continue
        pct = (spent / b.allocated_amount * 100) if b.allocated_amount > 0 else 0
        if pct >= 80:
            budget_alerts.append({
                "budgetId": b.id,
                "budgetName": b.name,
                "allocated": b.allocated_amount,
                "spent": spent,
                "percentage": round(pct, 1),
                "isOverBudget": pct > 100,
            })

    return jsonify({
        "totalBalance": total_balance,
        "monthlyIncome": monthly_income,
        "monthlyExpense": monthly_expense,
        "monthlySavings": monthly_income - monthly_expense,
        "budgetAlerts": budget_alerts,
        "totalSavings": total_savings,
    })


@dashboard_bp.route("/api/dashboard/monthly-summary", methods=["GET"])
def get_monthly_summary():
    months_count = request.args.get("months", 6, type=int)
    now = datetime.now(timezone.utc)

    result = []
    for i in range(months_count - 1, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1

        pattern = f"{y:04d}-{m:02d}-%"
        txs = Transaction.query.filter(Transaction.date.like(pattern)).all()

        income = sum(t.amount for t in txs if t.type == "income")
        expense = sum(t.amount for t in txs if t.type == "expense")

        month_label = datetime(y, m, 1).strftime("%b")
        result.append({"month": month_label, "income": income, "expense": expense})

    return jsonify(result)
