-- Enable realtime for purchases table
ALTER TABLE public.purchases REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;