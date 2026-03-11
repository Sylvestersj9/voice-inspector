-- Grant full premium access to janvesylvester@gmail.com
-- This user gets free full access without Stripe subscription
INSERT INTO public.subscriptions (user_id, status, stripe_customer_id, stripe_subscription_id, created_at, updated_at)
SELECT id, 'active', 'admin-granted-access', 'admin-granted-access', now(), now()
FROM auth.users
WHERE email = 'janvesylvester@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET status = 'active', updated_at = now();
