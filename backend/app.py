import os

from flask import Flask
from flask_cors import CORS

from models import db
from seed import seed_categories


def create_app():
    app = Flask(__name__)

    db_path = os.path.join(os.path.dirname(__file__), "moneykeeper.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app)
    db.init_app(app)

    from routes.categories import categories_bp
    from routes.budgets import budgets_bp
    from routes.transactions import transactions_bp
    from routes.savings import savings_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(categories_bp)
    app.register_blueprint(budgets_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(savings_bp)
    app.register_blueprint(dashboard_bp)

    with app.app_context():
        db.create_all()
        seed_categories()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
