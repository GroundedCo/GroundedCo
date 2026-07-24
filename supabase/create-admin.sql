-- ============================================================
-- GROUNDED - Create or reset an admin user
-- Run in: Supabase Studio -> SQL Editor -> New query
--
-- Change admin_email, admin_password, and admin_name below before
-- executing. Running the script again resets that user's password
-- and keeps the related profile configured as an admin.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $admin$
DECLARE
  admin_email    TEXT := lower('admin@grounded.in');
  admin_password TEXT := 'CHANGE-ME-TO-A-STRONG-PASSWORD';
  admin_name     TEXT := 'Grounded Admin';
  admin_user_id  UUID;
BEGIN
  IF admin_password = 'CHANGE-ME-TO-A-STRONG-PASSWORD' THEN
    RAISE EXCEPTION 'Replace admin_password before running this script';
  END IF;

  SELECT id
    INTO admin_user_id
    FROM auth.users
   WHERE lower(email) = admin_email
   ORDER BY created_at
   LIMIT 1;

  IF admin_user_id IS NULL THEN
    admin_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('full_name', admin_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(admin_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           raw_app_meta_data = jsonb_build_object(
             'provider', 'email',
             'providers', ARRAY['email']
           ),
           raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
             || jsonb_build_object('full_name', admin_name),
           updated_at = now()
     WHERE id = admin_user_id;
  END IF;

  -- Email/password login requires an email identity as well as auth.users.
  IF NOT EXISTS (
    SELECT 1
      FROM auth.identities
     WHERE user_id = admin_user_id
       AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      admin_user_id::TEXT,
      admin_user_id,
      jsonb_build_object(
        'sub', admin_user_id::TEXT,
        'email', admin_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  -- This also repairs the profile if the signup trigger is missing or failed.
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_user_id, admin_email, admin_name, 'admin')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin';

  RAISE NOTICE 'Admin user % is ready (user id: %)', admin_email, admin_user_id;
END
$admin$;

-- Verify the result. Password hashes are intentionally not displayed.
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users AS u
JOIN public.profiles AS p ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY u.created_at;
