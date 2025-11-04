-- Fix foreign key constraint to allow deleting codes with cascade
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_code_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_code_id_fkey 
FOREIGN KEY (code_id) 
REFERENCES subscription_codes(id) 
ON DELETE CASCADE;