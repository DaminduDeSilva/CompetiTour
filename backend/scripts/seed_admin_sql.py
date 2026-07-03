import asyncio
import os
import uuid
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Copy .env.example to .env and fill in the values.")

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"statement_cache_size": 0}
)

async def seed():
    async with engine.begin() as conn:
        admin_email = "admin@competitour.app"
        # Generate a standard v4 UUID
        admin_id = str(uuid.uuid4())
        
        # Generate a proper bcrypt hash for GoTrue (Supabase Auth)
        # GoTrue expects standard bcrypt
        pwd = b"admin123"
        salt = bcrypt.gensalt(rounds=10)
        hash_val = bcrypt.hashpw(pwd, salt).decode('utf-8')
        
        # First clean everything up in a single transaction safely
        await conn.execute(text("DELETE FROM auth.identities WHERE email = CAST(:email AS TEXT)"), {"email": admin_email})
        await conn.execute(text("DELETE FROM auth.users WHERE email = CAST(:email AS TEXT)"), {"email": admin_email})
        await conn.execute(text("DELETE FROM public.users WHERE email = CAST(:email AS TEXT)"), {"email": admin_email})

        print("Injecting admin into auth.users with ID", admin_id, "...")
        
        # Insert into auth.users using the generated UUID and bcrypt hash
        insert_auth_sql = text("""
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
                confirmation_token, recovery_token, email_change_token_new, email_change
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', CAST(:id AS UUID), 'authenticated', 'authenticated', CAST(:email AS TEXT), 
                CAST(:hash AS TEXT), now(),
                '{"provider":"email","providers":["email"]}', '{"full_name":"Platform Administrator"}', now(), now(),
                '', '', '', ''
            )
        """)
        await conn.execute(insert_auth_sql, {"id": admin_id, "email": admin_email, "hash": hash_val})
        
        # Insert identity so they can log in
        insert_identity_sql = text("""
            INSERT INTO auth.identities (
                provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
            ) VALUES (
                CAST(:id AS TEXT), CAST(:id AS UUID), CAST(:id AS UUID), json_build_object('sub', CAST(:id AS TEXT), 'email', CAST(:email AS TEXT)), 'email', now(), now(), now()
            )
        """)
        await conn.execute(insert_identity_sql, {"id": admin_id, "email": admin_email})
        print("Successfully injected into auth.users and auth.identities.")
        
        # Now create the profile in public.users and make them superuser
        print("Elevating privileges in public.users...")
        
        # Try to insert into public.users. If it fails, maybe there's a trigger that already created it. 
        # But let's check first.
        check_public = await conn.execute(text("SELECT id FROM public.users WHERE email = CAST(:email AS TEXT)"), {"email": admin_email})
        pub_exists = check_public.fetchone()
        
        if pub_exists:
            print("public.users entry already exists (probably via trigger). Updating instead...")
            update_public_sql = text("""
                UPDATE public.users SET is_superuser = true, is_active = true WHERE email = CAST(:email AS TEXT)
            """)
            await conn.execute(update_public_sql, {"email": admin_email})
        else:
            insert_public_sql = text("""
                INSERT INTO public.users (
                    id, email, full_name, is_superuser, is_active
                ) VALUES (
                    CAST(:id AS UUID), CAST(:email AS TEXT), 'Platform Administrator', true, true
                )
            """)
            await conn.execute(insert_public_sql, {"id": admin_id, "email": admin_email})

        print("Elevation complete.")

if __name__ == "__main__":
    asyncio.run(seed())
