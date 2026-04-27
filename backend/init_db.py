import asyncio

from sqlalchemy import select

from app.core.auth_utils import hash_password
from app.db.database import async_session, engine
from app.domain.models import Base, User


DEMO_USERS = [
    {
        "email": "client@test.com",
        "full_name": "Петров Алексей",
        "company_name": 'ООО "ПромТех"',
        "password": "password123",
        "role": "client",
    },
    {
        "email": "manager@test.com",
        "full_name": "Сидорова Елена",
        "password": "password123",
        "role": "manager",
    },
    {
        "email": "tech1@test.com",
        "full_name": "Иванов Игорь",
        "password": "password123",
        "role": "technician",
    },
    {
        "email": "tech2@test.com",
        "full_name": "Козлов Дмитрий",
        "password": "password123",
        "role": "technician",
    },
]


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already initialized")
            return

        for user_data in DEMO_USERS:
            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                company_name=user_data.get("company_name"),
                password=hash_password(user_data["password"]),
                role=user_data["role"],
            )
            session.add(user)

        await session.commit()
        print("Database initialized with test users")


if __name__ == "__main__":
    asyncio.run(init_db())

