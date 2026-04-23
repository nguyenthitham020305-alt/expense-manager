from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from models import db, SavingsAccount, Transaction

savings_bp = Blueprint("savings", __name__)


@savings_bp.route("/api/savings", methods=["GET"])
def get_savings():
    rows = SavingsAccount.query.all()
    return jsonify([r.to_dict() for r in rows])


@savings_bp.route("/api/savings", methods=["POST"])
def create_savings():
    data = request.get_json()
    account = SavingsAccount(
        name=data["name"],
        balance=data.get("balance", 0),
        target_amount=data.get("targetAmount"),
        description=data.get("description"),
    )
    db.session.add(account)
    db.session.commit()
    return jsonify(account.to_dict()), 201


@savings_bp.route("/api/savings/<int:account_id>", methods=["PUT"])
def update_savings(account_id):
    account = db.get_or_404(SavingsAccount, account_id)
    data = request.get_json()

    if "name" in data:
        account.name = data["name"]
    if "balance" in data:
        account.balance = data["balance"]
    if "targetAmount" in data:
        account.target_amount = data["targetAmount"]
    if "description" in data:
        account.description = data["description"]

    db.session.commit()
    return jsonify(account.to_dict())


@savings_bp.route("/api/savings/<int:account_id>/transfer", methods=["POST"])
def transfer_to_savings(account_id):
    account = db.get_or_404(SavingsAccount, account_id)
    data = request.get_json()
    amount = data.get("amount", 0)

    if not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    account.balance += amount

    tx = Transaction(
        type="expense",
        amount=amount,
        description=f"Chuyển sang tài khoản tiết kiệm - {account.name}",
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        "savingsAccount": account.to_dict(),
        "transaction": tx.to_dict(),
    }), 201


@savings_bp.route("/api/savings/<int:account_id>/withdraw", methods=["POST"])
def withdraw_from_savings(account_id):
    account = db.get_or_404(SavingsAccount, account_id)
    data = request.get_json()
    amount = data.get("amount", 0)

    if not isinstance(amount, (int, float)) or amount <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    if amount > account.balance:
        return jsonify({"error": "Insufficient savings balance"}), 400

    account.balance -= amount

    tx = Transaction(
        type="income",
        amount=amount,
        description=f"Rút từ tài khoản tiết kiệm - {account.name}",
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        "savingsAccount": account.to_dict(),
        "transaction": tx.to_dict(),
    }), 201


@savings_bp.route("/api/savings/<int:account_id>", methods=["DELETE"])
def delete_savings(account_id):
    account = db.get_or_404(SavingsAccount, account_id)
    db.session.delete(account)
    db.session.commit()
    return "", 204
