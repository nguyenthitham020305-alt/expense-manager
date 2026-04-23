from models import db, Category, Budget, Transaction, SavingsAccount

DEFAULT_CATEGORIES = [
    {"name": "Ăn uống", "slug": "food", "icon": "🍔", "color": "#ef4444"},
    {"name": "Nhà ở", "slug": "housing", "icon": "🏠", "color": "#3b82f6"},
    {"name": "Di chuyển", "slug": "transport", "icon": "🚗", "color": "#f59e0b"},
    {"name": "Giải trí", "slug": "entertainment", "icon": "🎬", "color": "#10b981"},
    {"name": "Mua sắm", "slug": "shopping", "icon": "🛒", "color": "#8b5cf6"},
    {"name": "Sức khỏe", "slug": "health", "icon": "💊", "color": "#ec4899"},
    {"name": "Giáo dục", "slug": "education", "icon": "📚", "color": "#06b6d4"},
    {"name": "Tiện ích", "slug": "utilities", "icon": "💡", "color": "#f97316"},
    {"name": "Nghỉ ngơi", "slug": "leisure", "icon": "🎮", "color": "#14b8a6"},
    {"name": "Khác", "slug": "other", "icon": "📦", "color": "#6366f1"},
]


def truncate_all():
    """Delete all rows from every table, respecting FK order."""
    Transaction.query.delete()
    Budget.query.delete()
    SavingsAccount.query.delete()
    Category.query.delete()
    db.session.commit()


def seed_categories():
    truncate_all()

    for cat in DEFAULT_CATEGORIES:
        db.session.add(Category(**cat))

    db.session.commit()
