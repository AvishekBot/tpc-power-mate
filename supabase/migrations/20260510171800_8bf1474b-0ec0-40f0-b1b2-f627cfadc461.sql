
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'technician');
CREATE TYPE public.staff_status AS ENUM ('active', 'on_leave', 'inactive');
CREATE TYPE public.payment_method AS ENUM ('cash', 'digital', 'credit');
CREATE TYPE public.sale_status AS ENUM ('completed', 'void');
CREATE TYPE public.movement_type AS ENUM ('purchase', 'sale', 'return', 'damage', 'adjustment');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  address TEXT,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  basic_salary NUMERIC(12,2) DEFAULT 0,
  profile_photo_url TEXT,
  status staff_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ has_role function (security definer to avoid recursion) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY
    CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'cashier' THEN 3 WHEN 'technician' THEN 4 END
  LIMIT 1;
$$;

-- ============ Auto-create profile + first-user-is-admin trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cashier');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Profiles RLS ============
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert profiles" ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ user_roles RLS ============
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'package',
  color TEXT DEFAULT '#00d4ff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.categories (name, icon, color) VALUES
  ('UPS Systems', 'battery-charging', '#00d4ff'),
  ('Inverter Batteries', 'battery', '#ffe600'),
  ('Solar Solutions', 'sun', '#ffa500'),
  ('Voltage Stabilizers', 'zap', '#00ff88'),
  ('Transformers', 'plug', '#ff6b6b'),
  ('VFD Drives', 'cpu', '#a855f7'),
  ('AC Drives', 'wind', '#06b6d4'),
  ('Welding Machines', 'flame', '#f97316'),
  ('Battery Chargers', 'plug-zap', '#22c55e'),
  ('Panel Boards', 'layout-grid', '#64748b'),
  ('Home Inverters', 'home', '#3b82f6'),
  ('LED Lights', 'lightbulb', '#facc15'),
  ('Cables', 'cable', '#94a3b8'),
  ('Switchgear', 'toggle-right', '#ec4899'),
  ('Generators', 'fuel', '#dc2626'),
  ('Other', 'box', '#6b7280');

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  description TEXT,
  buying_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  min_stock_threshold INT NOT NULL DEFAULT 5,
  barcode TEXT UNIQUE,
  warranty_months INT DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_low_stock ON public.products(stock_quantity, min_stock_threshold);

CREATE POLICY "Authed read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manager insert products" ON public.products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin manager update products" ON public.products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin delete products" ON public.products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ SALES ============
CREATE SEQUENCE public.invoice_seq START 1;

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 5, '0')),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  payment_method payment_method NOT NULL,
  cash_received NUMERIC(12,2),
  change_given NUMERIC(12,2),
  digital_reference TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  status sale_status NOT NULL DEFAULT 'completed',
  void_reason TEXT,
  void_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_date ON public.sales(sale_date DESC);
CREATE INDEX idx_sales_staff ON public.sales(staff_id);

CREATE POLICY "Staff read sales" ON public.sales FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR auth.uid() = staff_id
  );
CREATE POLICY "Authed insert sales" ON public.sales FOR INSERT
  WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Admin update sales" ON public.sales FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ SALE ITEMS ============
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);

CREATE POLICY "Read sale items via sale" ON public.sale_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR s.staff_id = auth.uid())));
CREATE POLICY "Insert sale items via own sale" ON public.sale_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND s.staff_id = auth.uid()));

-- ============ STOCK MOVEMENTS ============
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity_change INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  reason TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stock_mov_product ON public.stock_movements(product_id, created_at DESC);

CREATE POLICY "Authed read stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manager insert stock movements" ON public.stock_movements FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'cashier'));

-- ============ Auto-decrement stock + log on sale items insert ============
CREATE OR REPLACE FUNCTION public.handle_sale_item_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prev_stock INT;
  new_stock INT;
BEGIN
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;
  SELECT stock_quantity INTO prev_stock FROM public.products WHERE id = NEW.product_id FOR UPDATE;
  new_stock := prev_stock - NEW.quantity;
  UPDATE public.products SET stock_quantity = new_stock WHERE id = NEW.product_id;
  INSERT INTO public.stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference_id, reference_type, reason, recorded_by)
  VALUES (NEW.product_id, 'sale', -NEW.quantity, prev_stock, new_stock, NEW.sale_id, 'sale', 'Auto: sale item', auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER sale_item_stock_trigger
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale_item_insert();

-- ============ EXPENSES (placeholder for finance phase) ============
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  payment_method TEXT,
  receipt_photo_url TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manager all expenses" ON public.expenses FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
