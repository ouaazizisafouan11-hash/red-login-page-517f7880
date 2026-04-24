-- Attach the existing handle_new_user function to auth.users so every new signup gets a profile row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profile rows for any existing users that don't have one yet
INSERT INTO public.profiles (user_id, description)
SELECT u.id, 'Bonjour ! Cliquez sur Modifier pour personnaliser vos informations.'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Trigger to keep updated_at fresh on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();