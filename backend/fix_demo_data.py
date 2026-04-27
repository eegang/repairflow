import asyncio

from sqlalchemy import select

from app.db.database import async_session
from app.domain.models import RepairRequest, User


UPDATES = {
    "client@test.com": {
        "full_name": "\u041f\u0435\u0442\u0440\u043e\u0432 \u0410\u043b\u0435\u043a\u0441\u0435\u0439",
        "company_name": "\u041e\u041e\u041e \u041f\u0440\u043e\u043c\u0422\u0435\u0445",
    },
    "manager@test.com": {
        "full_name": "\u0421\u0438\u0434\u043e\u0440\u043e\u0432\u0430 \u0415\u043b\u0435\u043d\u0430",
    },
    "tech1@test.com": {
        "full_name": "\u0418\u0432\u0430\u043d\u043e\u0432 \u0418\u0433\u043e\u0440\u044c",
    },
    "tech2@test.com": {
        "full_name": "\u041a\u043e\u0437\u043b\u043e\u0432 \u0414\u043c\u0438\u0442\u0440\u0438\u0439",
    },
}


async def main() -> None:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email.in_(list(UPDATES.keys()))))
        users = result.scalars().all()
        users_by_id = {}

        for user in users:
            for key, value in UPDATES[user.email].items():
                setattr(user, key, value)
            users_by_id[user.id] = user

        requests_result = await session.execute(select(RepairRequest))
        requests = requests_result.scalars().all()
        for request in requests:
            owner = users_by_id.get(request.client_id)
            technician = users_by_id.get(request.assigned_to) if request.assigned_to else None
            if owner:
                request.client_name = owner.full_name
            if technician:
                request.assigned_technician_name = technician.full_name

        await session.commit()

        for user in users:
            company_name = user.company_name or "-"
            print(f"{user.email}: {user.full_name} | {company_name}")


if __name__ == "__main__":
    asyncio.run(main())

