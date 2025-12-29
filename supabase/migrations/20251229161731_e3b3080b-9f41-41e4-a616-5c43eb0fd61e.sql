-- Change date_of_birth column from DATE to TEXT to store encrypted data
ALTER TABLE public.sensitive_user_data 
ALTER COLUMN date_of_birth TYPE TEXT;