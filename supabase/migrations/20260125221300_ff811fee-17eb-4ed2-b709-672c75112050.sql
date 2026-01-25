-- Add admin users to permit_admins table
INSERT INTO permit_admins (user_id, role) VALUES 
  ('bbac3ae7-6e57-4f17-9c38-3224e071464b', 'admin'),
  ('aa098c70-765f-470d-9ff9-d4c67a96aa1a', 'admin')
ON CONFLICT DO NOTHING;

-- Enable realtime for permit_packet_training table
ALTER PUBLICATION supabase_realtime ADD TABLE permit_packet_training;