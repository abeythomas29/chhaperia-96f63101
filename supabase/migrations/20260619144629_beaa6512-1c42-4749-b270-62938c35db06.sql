
ALTER TABLE public.stock_issues ADD COLUMN IF NOT EXISTS recipient_type text NOT NULL DEFAULT 'client';
ALTER TABLE public.stock_issues ADD COLUMN IF NOT EXISTS recipient_user_id uuid NULL REFERENCES public.profiles(user_id);
ALTER TABLE public.stock_issues ALTER COLUMN client_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_stock_issue_recipient()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.recipient_type NOT IN ('client','production_manager') THEN
    RAISE EXCEPTION 'recipient_type must be client or production_manager';
  END IF;
  IF NEW.recipient_type = 'client' THEN
    IF NEW.client_id IS NULL THEN
      RAISE EXCEPTION 'client_id required when recipient_type=client';
    END IF;
    NEW.recipient_user_id := NULL;
  ELSE
    IF NEW.recipient_user_id IS NULL THEN
      RAISE EXCEPTION 'recipient_user_id required when recipient_type=production_manager';
    END IF;
    NEW.client_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_stock_issue_recipient_trg ON public.stock_issues;
CREATE TRIGGER validate_stock_issue_recipient_trg
BEFORE INSERT OR UPDATE ON public.stock_issues
FOR EACH ROW EXECUTE FUNCTION public.validate_stock_issue_recipient();
