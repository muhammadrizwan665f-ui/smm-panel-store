CREATE POLICY "Admins can upload icons" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update icons" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete icons" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'icons' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read icons" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'icons');