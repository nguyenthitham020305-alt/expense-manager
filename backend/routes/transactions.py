from flask import Blueprint, jsonify, request

from models import db, Transaction

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/api/transactions", methods=["GET"])
def get_transactions():
    query = Transaction.query

    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    budget_id = request.args.get("budgetId", type=int)
    tx_type = request.args.get("type")

    if month and year:
        pattern = f"{year:04d}-{month:02d}-%"
        query = query.filter(Transaction.date.like(pattern))
    if budget_id:
        query = query.filter_by(budget_id=budget_id)
    if tx_type:
        query = query.filter_by(type=tx_type)

    rows = query.order_by(Transaction.id.desc()).all()
    return jsonify([t.to_dict() for t in rows])


@transactions_bp.route("/api/transactions/<int:tx_id>", methods=["GET"])
def get_transaction(tx_id):
    tx = db.get_or_404(Transaction, tx_id)
    return jsonify(tx.to_dict())


@transactions_bp.route("/api/transactions", methods=["POST"])
def create_transaction():
    data = request.get_json()

    tx = Transaction(
        budget_id=data.get("budgetId"),
        income_category=data.get("incomeCategory"),
        type=data["type"],
        amount=data["amount"],
        description=data.get("description", ""),
        date=data["date"],
    )
    db.session.add(tx)
    db.session.commit()
    return jsonify(tx.to_dict()), 201


@transactions_bp.route("/api/transactions/<int:tx_id>", methods=["DELETE"])
def delete_transaction(tx_id):
    tx = db.get_or_404(Transaction, tx_id)
    db.session.delete(tx)
    db.session.commit()
    return "", 204
