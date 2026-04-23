from flask import Blueprint, jsonify, request

from models import db, Budget, Category

budgets_bp = Blueprint("budgets", __name__)


@budgets_bp.route("/api/budgets", methods=["GET"])
def get_budgets():
    budgets = Budget.query.all()
    return jsonify([b.to_dict() for b in budgets])


@budgets_bp.route("/api/budgets/<int:budget_id>", methods=["GET"])
def get_budget(budget_id):
    budget = db.get_or_404(Budget, budget_id)
    return jsonify(budget.to_dict())


@budgets_bp.route("/api/budgets", methods=["POST"])
def create_budget():
    data = request.get_json()

    category = _resolve_category(data.get("category"))

    budget = Budget(
        category_id=category.id,
        name=data["name"],
        allocated_amount=data["allocatedAmount"],
        month=data["month"],
        year=data["year"],
    )
    db.session.add(budget)
    db.session.commit()
    return jsonify(budget.to_dict()), 201


@budgets_bp.route("/api/budgets/<int:budget_id>", methods=["PUT"])
def update_budget(budget_id):
    budget = db.get_or_404(Budget, budget_id)
    data = request.get_json()

    if "name" in data:
        budget.name = data["name"]
    if "allocatedAmount" in data:
        budget.allocated_amount = data["allocatedAmount"]
    if "category" in data:
        category = _resolve_category(data["category"])
        budget.category_id = category.id

    db.session.commit()
    return jsonify(budget.to_dict())


@budgets_bp.route("/api/budgets/<int:budget_id>", methods=["DELETE"])
def delete_budget(budget_id):
    budget = db.get_or_404(Budget, budget_id)
    db.session.delete(budget)
    db.session.commit()
    return "", 204


def _resolve_category(category_name):
    """Find category by name, or create a generic one."""
    if not category_name:
        category_name = "Other"

    category = Category.query.filter_by(name=category_name).first()
    if not category:
        slug = category_name.lower().replace(" ", "-")
        category = Category(name=category_name, slug=slug)
        db.session.add(category)
        db.session.flush()
    return category
