from flask import Blueprint, jsonify, request

from models import db, Category, Budget

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/api/categories", methods=["GET"])
def get_categories():
    rows = Category.query.order_by(Category.name).all()
    return jsonify([r.to_dict() for r in rows])


@categories_bp.route("/api/categories", methods=["POST"])
def create_category():
    data = request.get_json()
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    slug = name.lower().replace(" ", "-")
    existing = Category.query.filter_by(slug=slug).first()
    if existing:
        return jsonify({"error": "Category already exists"}), 409

    category = Category(
        name=name,
        slug=slug,
        icon=data.get("icon"),
        color=data.get("color", "#6366f1"),
    )
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@categories_bp.route("/api/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    category = db.get_or_404(Category, category_id)

    budget_count = Budget.query.filter_by(category_id=category_id).count()
    if budget_count > 0:
        return jsonify({
            "error": f"Category is used by {budget_count} budget(s). Remove them first."
        }), 409

    db.session.delete(category)
    db.session.commit()
    return "", 204
