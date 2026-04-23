from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    slug = db.Column(db.Text, nullable=False, unique=True)
    icon = db.Column(db.Text)
    color = db.Column(db.Text, nullable=False, default="#6366f1")
    created_at = db.Column(db.Text, nullable=False, default=lambda: _now_iso())

    budgets = db.relationship("Budget", back_populates="category")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "icon": self.icon,
            "color": self.color,
            "createdAt": self.created_at,
        }


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(
        db.Integer, db.ForeignKey("categories.id"), nullable=False
    )
    name = db.Column(db.Text, nullable=False)
    allocated_amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.Text, nullable=False, default=lambda: _now_iso())

    category = db.relationship("Category", back_populates="budgets")
    transactions = db.relationship("Transaction", back_populates="budget")

    def to_dict(self):
        spent = sum(
            t.amount for t in self.transactions if t.type == "expense"
        ) - sum(t.amount for t in self.transactions if t.type == "income")
        spent = max(spent, 0)
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category.name if self.category else None,
            "allocatedAmount": self.allocated_amount,
            "spentAmount": spent,
            "remainingAmount": self.allocated_amount - spent,
            "color": self.category.color if self.category else "#6366f1",
            "month": self.month,
            "year": self.year,
            "createdAt": self.created_at,
        }


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    budget_id = db.Column(db.Integer, db.ForeignKey("budgets.id"), nullable=True)
    income_category = db.Column(db.Text, nullable=True)
    type = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    date = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.Text, nullable=False, default=lambda: _now_iso())

    budget = db.relationship("Budget", back_populates="transactions")

    def to_dict(self):
        category_name = None
        if self.budget and self.budget.category:
            category_name = self.budget.category.name
        elif self.income_category:
            category_name = self.income_category

        return {
            "id": self.id,
            "budgetId": self.budget_id,
            "budgetName": self.budget.name if self.budget else None,
            "categoryName": category_name,
            "incomeCategory": self.income_category,
            "type": self.type,
            "amount": self.amount,
            "description": self.description,
            "date": self.date,
            "createdAt": self.created_at,
        }


class SavingsAccount(db.Model):
    __tablename__ = "savings_accounts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False)
    balance = db.Column(db.Float, nullable=False, default=0)
    target_amount = db.Column(db.Float, nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.Text, nullable=False, default=lambda: _now_iso())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "balance": self.balance,
            "targetAmount": self.target_amount,
            "description": self.description,
            "createdAt": self.created_at,
        }


def _now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
