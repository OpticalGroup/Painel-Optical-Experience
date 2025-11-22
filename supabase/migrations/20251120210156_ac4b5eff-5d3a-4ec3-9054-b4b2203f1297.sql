-- Seed initial data for courses, cohorts, and enrollments

-- Insert courses
INSERT INTO public.courses (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Optical Experience', 'Curso imersivo de experiência óptica'),
  ('22222222-2222-2222-2222-222222222222', 'Optical Advanced', 'Curso avançado de óptica')
ON CONFLICT (id) DO NOTHING;

-- Insert cohorts (matching the mock data)
INSERT INTO public.cohorts (id, course_id, name, year, start_date, end_date, location, capacity, status) VALUES
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Optical Experience Setembro 2025', 2025, '2025-07-16', '2025-07-19', 'São Paulo, BR', 30, 'open'),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Optical Experience Outubro 2025', 2025, '2025-08-06', '2025-08-09', 'Rio de Janeiro, BR', 30, 'open'),
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Optical Experience Novembro 2025', 2025, '2025-09-10', '2025-09-13', 'São Paulo, BR', 30, 'open'),
  ('c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Optical Experience Dezembro 2025', 2025, '2025-11-19', '2025-11-22', 'Curitiba, BR', 30, 'open'),
  ('c5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Optical Advanced Janeiro 2026', 2026, '2025-11-27', '2025-11-29', 'São Paulo, BR', 22, 'open'),
  ('c6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Optical Experience Internacional - Madrid', 2025, '2025-11-07', '2025-11-09', 'Madrid, Espanha', 30, 'full')
ON CONFLICT (id) DO NOTHING;

-- Insert sample enrollments for cohort 1 (28 students, all paid)
INSERT INTO public.enrollments (cohort_id, student_name, email, cpf, phone, sales_rep, source, financial_status, contract_status, payment_details, payment_amount) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Ana Silva', 'ana.silva@email.com', '123.456.789-01', '(11) 98765-4321', 'João Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Bruno Costa', 'bruno.costa@email.com', '234.567.890-12', '(11) 98765-4322', 'Maria Vendedora', 'Indicação', 'paid', 'signed', 'Parcelado 3x R$ 3.000', 9000),
  ('c1111111-1111-1111-1111-111111111111', 'Carla Mendes', 'carla.mendes@email.com', '345.678.901-23', '(11) 98765-4323', 'João Vendedor', 'Facebook', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Daniel Santos', 'daniel.santos@email.com', '456.789.012-34', '(11) 98765-4324', 'Pedro Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c1111111-1111-1111-1111-111111111111', 'Elaine Oliveira', 'elaine.oliveira@email.com', '567.890.123-45', '(11) 98765-4325', 'Maria Vendedora', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Fernando Lima', 'fernando.lima@email.com', '678.901.234-56', '(11) 98765-4326', 'João Vendedor', 'Direto', 'paid', 'signed', 'Parcelado 6x', 9000),
  ('c1111111-1111-1111-1111-111111111111', 'Gabriela Rocha', 'gabriela.rocha@email.com', '789.012.345-67', '(11) 98765-4327', 'Pedro Vendedor', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Henrique Alves', 'henrique.alves@email.com', '890.123.456-78', '(11) 98765-4328', 'Maria Vendedora', 'Instagram', 'paid', 'pending', 'Parcelado 4x', 8800),
  ('c1111111-1111-1111-1111-111111111111', 'Isabela Ferreira', 'isabela.ferreira@email.com', '901.234.567-89', '(11) 98765-4329', 'João Vendedor', 'Facebook', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'José Pereira', 'jose.pereira@email.com', '012.345.678-90', '(11) 98765-4330', 'Pedro Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c1111111-1111-1111-1111-111111111111', 'Karina Souza', 'karina.souza@email.com', '111.222.333-44', '(11) 98765-4331', 'Maria Vendedora', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Lucas Martins', 'lucas.martins@email.com', '222.333.444-55', '(11) 98765-4332', 'João Vendedor', 'Indicação', 'paid', 'signed', 'Parcelado 5x', 8750),
  ('c1111111-1111-1111-1111-111111111111', 'Mariana Cardoso', 'mariana.cardoso@email.com', '333.444.555-66', '(11) 98765-4333', 'Pedro Vendedor', 'Direto', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Nicolas Ribeiro', 'nicolas.ribeiro@email.com', '444.555.666-77', '(11) 98765-4334', 'Maria Vendedora', 'Facebook', 'paid', 'signed', 'Parcelado 3x', 9000),
  ('c1111111-1111-1111-1111-111111111111', 'Olivia Gomes', 'olivia.gomes@email.com', '555.666.777-88', '(11) 98765-4335', 'João Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Paulo Barbosa', 'paulo.barbosa@email.com', '666.777.888-99', '(11) 98765-4336', 'Pedro Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c1111111-1111-1111-1111-111111111111', 'Quezia Dias', 'quezia.dias@email.com', '777.888.999-00', '(11) 98765-4337', 'Maria Vendedora', 'Indicação', 'paid', 'pending', 'Parcelado 6x', 9000),
  ('c1111111-1111-1111-1111-111111111111', 'Rafael Moreira', 'rafael.moreira@email.com', '888.999.000-11', '(11) 98765-4338', 'João Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Sofia Nunes', 'sofia.nunes@email.com', '999.000.111-22', '(11) 98765-4339', 'Pedro Vendedor', 'Direto', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c1111111-1111-1111-1111-111111111111', 'Thiago Correia', 'thiago.correia@email.com', '000.111.222-33', '(11) 98765-4340', 'Maria Vendedora', 'Facebook', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Ursula Castro', 'ursula.castro@email.com', '111.333.555-77', '(11) 98765-4341', 'João Vendedor', 'Instagram', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c1111111-1111-1111-1111-111111111111', 'Vitor Araújo', 'vitor.araujo@email.com', '222.444.666-88', '(11) 98765-4342', 'Pedro Vendedor', 'Tráfego Pago', 'paid', 'pending', 'Parcelado 5x', 8750),
  ('c1111111-1111-1111-1111-111111111111', 'Wanda Freitas', 'wanda.freitas@email.com', '333.555.777-99', '(11) 98765-4343', 'Maria Vendedora', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Xavier Campos', 'xavier.campos@email.com', '444.666.888-00', '(11) 98765-4344', 'João Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 3x', 9000),
  ('c1111111-1111-1111-1111-111111111111', 'Yara Monteiro', 'yara.monteiro@email.com', '555.777.999-11', '(11) 98765-4345', 'Pedro Vendedor', 'Facebook', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c1111111-1111-1111-1111-111111111111', 'Zacarias Teixeira', 'zacarias.teixeira@email.com', '666.888.000-22', '(11) 98765-4346', 'Maria Vendedora', 'Direto', 'paid', 'signed', 'Parcelado 6x', 9000),
  ('c1111111-1111-1111-1111-111111111111', 'Amanda Cruz', 'amanda.cruz@email.com', '777.999.111-33', '(11) 98765-4347', 'João Vendedor', 'Instagram', 'paid', 'pending', 'Entrada + 10x', 10000),
  ('c1111111-1111-1111-1111-111111111111', 'Bernardo Farias', 'bernardo.farias@email.com', '888.000.222-44', '(11) 98765-4348', 'Pedro Vendedor', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500)
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments for cohort 2 (33 students - overbooked, 25 paid, 8 pending)
INSERT INTO public.enrollments (cohort_id, student_name, email, cpf, phone, sales_rep, source, financial_status, contract_status, payment_details, payment_amount) VALUES
  ('c2222222-2222-2222-2222-222222222222', 'Cecília Moura', 'cecilia.moura@email.com', '100.200.300-40', '(21) 98765-5001', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Diego Borges', 'diego.borges@email.com', '200.300.400-50', '(21) 98765-5002', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c2222222-2222-2222-2222-222222222222', 'Eduarda Pinto', 'eduarda.pinto@email.com', '300.400.500-60', '(21) 98765-5003', 'Ana Vendedora', 'Indicação', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Fabio Ramos', 'fabio.ramos@email.com', '400.500.600-70', '(21) 98765-5004', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c2222222-2222-2222-2222-222222222222', 'Giovanna Batista', 'giovanna.batista@email.com', '500.600.700-80', '(21) 98765-5005', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'Parcelado 5x', 8750),
  ('c2222222-2222-2222-2222-222222222222', 'Heitor Lopes', 'heitor.lopes@email.com', '600.700.800-90', '(21) 98765-5006', 'Carlos Vendedor', 'Direto', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Iris Carvalho', 'iris.carvalho@email.com', '700.800.900-00', '(21) 98765-5007', 'Ana Vendedora', 'Facebook', 'paid', 'pending', 'Parcelado 3x', 9000),
  ('c2222222-2222-2222-2222-222222222222', 'Julio Nascimento', 'julio.nascimento@email.com', '800.900.000-10', '(21) 98765-5008', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c2222222-2222-2222-2222-222222222222', 'Larissa Azevedo', 'larissa.azevedo@email.com', '900.000.100-20', '(21) 98765-5009', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Mateus Vieira', 'mateus.vieira@email.com', '000.100.200-30', '(21) 98765-5010', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 6x', 9000),
  ('c2222222-2222-2222-2222-222222222222', 'Natália Rezende', 'natalia.rezende@email.com', '111.211.311-41', '(21) 98765-5011', 'Ana Vendedora', 'Instagram', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Otávio Cunha', 'otavio.cunha@email.com', '212.312.412-51', '(21) 98765-5012', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c2222222-2222-2222-2222-222222222222', 'Patrícia Fonseca', 'patricia.fonseca@email.com', '313.413.513-61', '(21) 98765-5013', 'Ana Vendedora', 'Direto', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c2222222-2222-2222-2222-222222222222', 'Quirino Guedes', 'quirino.guedes@email.com', '414.514.614-71', '(21) 98765-5014', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 5x', 8750),
  ('c2222222-2222-2222-2222-222222222222', 'Renata Medeiros', 'renata.medeiros@email.com', '515.615.715-81', '(21) 98765-5015', 'Ana Vendedora', 'Indicação', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Sérgio Monteiro', 'sergio.monteiro@email.com', '616.716.816-91', '(21) 98765-5016', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 3x', 9000),
  ('c2222222-2222-2222-2222-222222222222', 'Tânia Rodrigues', 'tania.rodrigues@email.com', '717.817.917-01', '(21) 98765-5017', 'Ana Vendedora', 'Facebook', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c2222222-2222-2222-2222-222222222222', 'Ulisses Barros', 'ulisses.barros@email.com', '818.918.018-11', '(21) 98765-5018', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Valéria Coelho', 'valeria.coelho@email.com', '919.019.119-21', '(21) 98765-5019', 'Ana Vendedora', 'Direto', 'paid', 'pending', 'Parcelado 6x', 9000),
  ('c2222222-2222-2222-2222-222222222222', 'Wagner Macedo', 'wagner.macedo@email.com', '020.120.220-31', '(21) 98765-5020', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c2222222-2222-2222-2222-222222222222', 'Xuxa Menezes', 'xuxa.menezes@email.com', '121.221.321-41', '(21) 98765-5021', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Yvone Paiva', 'yvone.paiva@email.com', '222.322.422-51', '(21) 98765-5022', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c2222222-2222-2222-2222-222222222222', 'Zuleica Maia', 'zuleica.maia@email.com', '323.423.523-61', '(21) 98765-5023', 'Ana Vendedora', 'Tráfego Pago', 'paid', 'pending', 'Parcelado 5x', 8750),
  ('c2222222-2222-2222-2222-222222222222', 'Ademir Viana', 'ademir.viana@email.com', '424.524.624-71', '(21) 98765-5024', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c2222222-2222-2222-2222-222222222222', 'Beatriz Caldas', 'beatriz.caldas@email.com', '525.625.725-81', '(21) 98765-5025', 'Ana Vendedora', 'Facebook', 'paid', 'signed', 'Parcelado 3x', 9000),
  ('c2222222-2222-2222-2222-222222222222', 'Cláudio Soares', 'claudio.soares@email.com', '626.726.826-91', '(21) 98765-5026', 'Carlos Vendedor', 'Direto', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Denise Miranda', 'denise.miranda@email.com', '727.827.927-01', '(21) 98765-5027', 'Ana Vendedora', 'Instagram', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Edmundo Tavares', 'edmundo.tavares@email.com', '828.928.028-11', '(21) 98765-5028', 'Carlos Vendedor', 'Indicação', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Fátima Pessoa', 'fatima.pessoa@email.com', '929.029.129-21', '(21) 98765-5029', 'Ana Vendedora', 'Tráfego Pago', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Gilberto Sampaio', 'gilberto.sampaio@email.com', '030.130.230-31', '(21) 98765-5030', 'Carlos Vendedor', 'Facebook', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Helena Duarte', 'helena.duarte@email.com', '131.231.331-41', '(21) 98765-5031', 'Ana Vendedora', 'Instagram', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Igor Dantas', 'igor.dantas@email.com', '232.332.432-51', '(21) 98765-5032', 'Carlos Vendedor', 'Direto', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c2222222-2222-2222-2222-222222222222', 'Joana Brito', 'joana.brito@email.com', '333.433.533-61', '(21) 98765-5033', 'Ana Vendedora', 'Indicação', 'pending', 'pending', 'Aguardando pagamento', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments for cohort 3 (14 students, 8 paid, 6 reserved)
INSERT INTO public.enrollments (cohort_id, student_name, email, cpf, phone, sales_rep, source, financial_status, contract_status, payment_details, payment_amount) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'Kátia Xavier', 'katia.xavier@email.com', '434.534.634-71', '(11) 98765-6001', 'João Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c3333333-3333-3333-3333-333333333333', 'Leandro Queiroz', 'leandro.queiroz@email.com', '535.635.735-81', '(11) 98765-6002', 'Maria Vendedora', 'Facebook', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c3333333-3333-3333-3333-333333333333', 'Mônica Amaral', 'monica.amaral@email.com', '636.736.836-91', '(11) 98765-6003', 'João Vendedor', 'Indicação', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c3333333-3333-3333-3333-333333333333', 'Norberto Lima', 'norberto.lima@email.com', '737.837.937-01', '(11) 98765-6004', 'Pedro Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c3333333-3333-3333-3333-333333333333', 'Odete Siqueira', 'odete.siqueira@email.com', '838.938.038-11', '(11) 98765-6005', 'Maria Vendedora', 'Instagram', 'paid', 'signed', 'Parcelado 5x', 8750),
  ('c3333333-3333-3333-3333-333333333333', 'Priscila Toledo', 'priscila.toledo@email.com', '939.039.139-21', '(11) 98765-6006', 'João Vendedor', 'Direto', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c3333333-3333-3333-3333-333333333333', 'Quintino Pacheco', 'quintino.pacheco@email.com', '040.140.240-31', '(11) 98765-6007', 'Pedro Vendedor', 'Facebook', 'paid', 'pending', 'Parcelado 3x', 9000),
  ('c3333333-3333-3333-3333-333333333333', 'Rosana Ávila', 'rosana.avila@email.com', '141.241.341-41', '(11) 98765-6008', 'Maria Vendedora', 'Instagram', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c3333333-3333-3333-3333-333333333333', 'Sebastião Valle', 'sebastiao.valle@email.com', '242.342.442-51', '(11) 98765-6009', 'João Vendedor', 'Indicação', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c3333333-3333-3333-3333-333333333333', 'Telma Gusmão', 'telma.gusmao@email.com', '343.443.543-61', '(11) 98765-6010', 'Pedro Vendedor', 'Tráfego Pago', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c3333333-3333-3333-3333-333333333333', 'Ubirajara Chaves', 'ubirajara.chaves@email.com', '444.544.644-71', '(11) 98765-6011', 'Maria Vendedora', 'Instagram', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c3333333-3333-3333-3333-333333333333', 'Vera Nogueira', 'vera.nogueira@email.com', '545.645.745-81', '(11) 98765-6012', 'João Vendedor', 'Facebook', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c3333333-3333-3333-3333-333333333333', 'Waldir Assis', 'waldir.assis@email.com', '646.746.846-91', '(11) 98765-6013', 'Pedro Vendedor', 'Direto', 'pending', 'pending', 'Aguardando pagamento', NULL),
  ('c3333333-3333-3333-3333-333333333333', 'Xênia Goulart', 'xenia.goulart@email.com', '747.847.947-01', '(11) 98765-6014', 'Maria Vendedora', 'Indicação', 'pending', 'pending', 'Aguardando pagamento', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments for cohort 4 (22 students, 21 paid, 1 reserved)
INSERT INTO public.enrollments (cohort_id, student_name, email, cpf, phone, sales_rep, source, financial_status, contract_status, payment_details, payment_amount) VALUES
  ('c4444444-4444-4444-4444-444444444444', 'Yasmin Barreto', 'yasmin.barreto@email.com', '848.948.048-11', '(41) 98765-7001', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Zeferino Neto', 'zeferino.neto@email.com', '949.049.149-21', '(41) 98765-7002', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c4444444-4444-4444-4444-444444444444', 'Adriana Moraes', 'adriana.moraes@email.com', '050.150.250-31', '(41) 98765-7003', 'Ana Vendedora', 'Indicação', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Benedito Franco', 'benedito.franco@email.com', '151.251.351-41', '(41) 98765-7004', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c4444444-4444-4444-4444-444444444444', 'Cristiane Horta', 'cristiane.horta@email.com', '252.352.452-51', '(41) 98765-7005', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'Parcelado 5x', 8750),
  ('c4444444-4444-4444-4444-444444444444', 'Dario Esteves', 'dario.esteves@email.com', '353.453.553-61', '(41) 98765-7006', 'Carlos Vendedor', 'Direto', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Erica Sales', 'erica.sales@email.com', '454.554.654-71', '(41) 98765-7007', 'Ana Vendedora', 'Facebook', 'paid', 'pending', 'Parcelado 3x', 9000),
  ('c4444444-4444-4444-4444-444444444444', 'Fausto Leal', 'fausto.leal@email.com', '555.655.755-81', '(41) 98765-7008', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c4444444-4444-4444-4444-444444444444', 'Gisele Pires', 'gisele.pires@email.com', '656.756.856-91', '(41) 98765-7009', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Humberto Luz', 'humberto.luz@email.com', '757.857.957-01', '(41) 98765-7010', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 6x', 9000),
  ('c4444444-4444-4444-4444-444444444444', 'Ivone Braga', 'ivone.braga@email.com', '858.958.058-11', '(41) 98765-7011', 'Ana Vendedora', 'Instagram', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Jair Cabral', 'jair.cabral@email.com', '959.059.159-21', '(41) 98765-7012', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c4444444-4444-4444-4444-444444444444', 'Katiane Veloso', 'katiane.veloso@email.com', '060.160.260-31', '(41) 98765-7013', 'Ana Vendedora', 'Direto', 'paid', 'signed', 'Entrada + 8x', 9500),
  ('c4444444-4444-4444-4444-444444444444', 'Lauro Brandão', 'lauro.brandao@email.com', '161.261.361-41', '(41) 98765-7014', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 5x', 8750),
  ('c4444444-4444-4444-4444-444444444444', 'Miriam Vasconcelos', 'miriam.vasconcelos@email.com', '262.362.462-51', '(41) 98765-7015', 'Ana Vendedora', 'Indicação', 'paid', 'pending', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Nelson Marques', 'nelson.marques@email.com', '363.463.563-61', '(41) 98765-7016', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 3x', 9000),
  ('c4444444-4444-4444-4444-444444444444', 'Ondina Vargas', 'ondina.vargas@email.com', '464.564.664-71', '(41) 98765-7017', 'Ana Vendedora', 'Facebook', 'paid', 'signed', 'Entrada + 10x', 10000),
  ('c4444444-4444-4444-4444-444444444444', 'Pedro Simões', 'pedro.simoes@email.com', '565.665.765-81', '(41) 98765-7018', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Quitéria Bastos', 'quiteria.bastos@email.com', '666.766.866-91', '(41) 98765-7019', 'Ana Vendedora', 'Direto', 'paid', 'signed', 'Parcelado 6x', 9000),
  ('c4444444-4444-4444-4444-444444444444', 'Ronaldo Peixoto', 'ronaldo.peixoto@email.com', '767.867.967-01', '(41) 98765-7020', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 4x', 8800),
  ('c4444444-4444-4444-4444-444444444444', 'Sônia Figueiredo', 'sonia.figueiredo@email.com', '868.968.068-11', '(41) 98765-7021', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista R$ 8.500', 8500),
  ('c4444444-4444-4444-4444-444444444444', 'Tadeu Reis', 'tadeu.reis@email.com', '969.069.169-21', '(41) 98765-7022', 'Carlos Vendedor', 'Facebook', 'pending', 'pending', 'Aguardando pagamento', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments for cohort 5 (4 students, all paid)
INSERT INTO public.enrollments (cohort_id, student_name, email, cpf, phone, sales_rep, source, financial_status, contract_status, payment_details, payment_amount) VALUES
  ('c5555555-5555-5555-5555-555555555555', 'Ualter Fontes', 'ualter.fontes@email.com', '070.170.270-31', '(11) 98765-8001', 'João Vendedor', 'Instagram', 'paid', 'signed', 'À vista R$ 12.000', 12000),
  ('c5555555-5555-5555-5555-555555555555', 'Viviane Almeida', 'viviane.almeida@email.com', '171.271.371-41', '(11) 98765-8002', 'Maria Vendedora', 'Facebook', 'paid', 'signed', 'Parcelado 4x R$ 3.200', 12800),
  ('c5555555-5555-5555-5555-555555555555', 'Wilson Barros', 'wilson.barros@email.com', '272.372.472-51', '(11) 98765-8003', 'João Vendedor', 'Indicação', 'paid', 'pending', 'À vista R$ 12.000', 12000),
  ('c5555555-5555-5555-5555-555555555555', 'Xuxa Lins', 'xuxa.lins@email.com', '373.473.573-61', '(11) 98765-8004', 'Pedro Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Entrada + 8x R$ 1.600', 12800)
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments for cohort 6 (30 students, all paid - full)
INSERT INTO public.enrollments (cohort_id, student_name, email, cpf, phone, sales_rep, source, financial_status, contract_status, payment_details, payment_amount) VALUES
  ('c6666666-6666-6666-6666-666666666666', 'Yago Cortês', 'yago.cortes@email.com', '474.574.674-71', '+34 912-345-001', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Zilda Arruda', 'zilda.arruda@email.com', '575.675.775-81', '+34 912-345-002', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Alberto Castro', 'alberto.castro@email.com', '676.776.876-91', '+34 912-345-003', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Bárbara Dias', 'barbara.dias@email.com', '777.877.977-01', '+34 912-345-004', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'César Telles', 'cesar.telles@email.com', '878.978.078-11', '+34 912-345-005', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Dalva Ferraz', 'dalva.ferraz@email.com', '979.079.179-21', '+34 912-345-006', 'Carlos Vendedor', 'Direto', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Edson Lira', 'edson.lira@email.com', '080.180.280-31', '+34 912-345-007', 'Ana Vendedora', 'Facebook', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Flora Neves', 'flora.neves@email.com', '181.281.381-41', '+34 912-345-008', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Geraldo Souza', 'geraldo.souza@email.com', '282.382.482-51', '+34 912-345-009', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Heloísa Ramos', 'heloisa.ramos@email.com', '383.483.583-61', '+34 912-345-010', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Inácio Cunha', 'inacio.cunha@email.com', '484.584.684-71', '+34 912-345-011', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Jussara Paiva', 'jussara.paiva@email.com', '585.685.785-81', '+34 912-345-012', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Klaus Mendes', 'klaus.mendes@email.com', '686.786.886-91', '+34 912-345-013', 'Ana Vendedora', 'Direto', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Leda Vieira', 'leda.vieira@email.com', '787.887.987-01', '+34 912-345-014', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Mário Maciel', 'mario.maciel@email.com', '888.988.088-11', '+34 912-345-015', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Nilza Rocha', 'nilza.rocha@email.com', '989.089.189-21', '+34 912-345-016', 'Carlos Vendedor', 'Tráfego Pago', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Osmar Pinto', 'osmar.pinto@email.com', '090.190.290-31', '+34 912-345-017', 'Ana Vendedora', 'Facebook', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Paula Gomes', 'paula.gomes@email.com', '191.291.391-41', '+34 912-345-018', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Raul Barbosa', 'raul.barbosa@email.com', '292.392.492-51', '+34 912-345-019', 'Ana Vendedora', 'Direto', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Silvana Melo', 'silvana.melo@email.com', '393.493.593-61', '+34 912-345-020', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Túlio Nunes', 'tulio.nunes@email.com', '494.594.694-71', '+34 912-345-021', 'Ana Vendedora', 'Indicação', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Urbana Lima', 'urbana.lima@email.com', '595.695.795-81', '+34 912-345-022', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Valter Correia', 'valter.correia@email.com', '696.796.896-91', '+34 912-345-023', 'Ana Vendedora', 'Tráfego Pago', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Wanda Costa', 'wanda.costa@email.com', '797.897.997-01', '+34 912-345-024', 'Carlos Vendedor', 'Instagram', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Xavier Silva', 'xavier.silva@email.com', '898.998.098-11', '+34 912-345-025', 'Ana Vendedora', 'Facebook', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Yara Santos', 'yara.santos@email.com', '999.099.199-21', '+34 912-345-026', 'Carlos Vendedor', 'Direto', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Zenaide Moreira', 'zenaide.moreira@email.com', '000.100.200-30', '+34 912-345-027', 'Ana Vendedora', 'Instagram', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Armando Azevedo', 'armando.azevedo@email.com', '101.201.301-40', '+34 912-345-028', 'Carlos Vendedor', 'Indicação', 'paid', 'signed', 'Parcelado 4x € 900', 3600),
  ('c6666666-6666-6666-6666-666666666666', 'Bruna Carvalho', 'bruna.carvalho@email.com', '202.302.402-50', '+34 912-345-029', 'Ana Vendedora', 'Tráfego Pago', 'paid', 'signed', 'À vista € 3.500', 3500),
  ('c6666666-6666-6666-6666-666666666666', 'Célio Oliveira', 'celio.oliveira@email.com', '303.403.503-60', '+34 912-345-030', 'Carlos Vendedor', 'Facebook', 'paid', 'signed', 'Parcelado 3x € 1.200', 3600)
ON CONFLICT (id) DO NOTHING;