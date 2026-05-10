export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          payment_method: string | null
          receipt_photo_url: string | null
          recorded_by: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          receipt_photo_url?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          receipt_photo_url?: string | null
          recorded_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          buying_price: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          min_stock_threshold: number
          model: string | null
          name: string
          selling_price: number
          status: string
          stock_quantity: number
          updated_at: string
          warranty_months: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          buying_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          min_stock_threshold?: number
          model?: string | null
          name: string
          selling_price?: number
          status?: string
          stock_quantity?: number
          updated_at?: string
          warranty_months?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          buying_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          min_stock_threshold?: number
          model?: string | null
          name?: string
          selling_price?: number
          status?: string
          stock_quantity?: number
          updated_at?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          basic_salary: number | null
          created_at: string
          full_name: string
          id: string
          join_date: string
          phone: string | null
          profile_photo_url: string | null
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          basic_salary?: number | null
          created_at?: string
          full_name?: string
          id?: string
          join_date?: string
          phone?: string | null
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          basic_salary?: number | null
          created_at?: string
          full_name?: string
          id?: string
          join_date?: string
          phone?: string | null
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          id: string
          line_total: number
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_received: number | null
          change_given: number | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          digital_reference: string | null
          discount_amount: number
          id: string
          invoice_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_date: string
          staff_id: string
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total_amount: number
          vat_amount: number
          void_by: string | null
          void_reason: string | null
        }
        Insert: {
          cash_received?: number | null
          change_given?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          digital_reference?: string | null
          discount_amount?: number
          id?: string
          invoice_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          sale_date?: string
          staff_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total_amount: number
          vat_amount?: number
          void_by?: string | null
          void_reason?: string | null
        }
        Update: {
          cash_received?: number | null
          change_given?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          digital_reference?: string | null
          discount_amount?: number
          id?: string
          invoice_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          sale_date?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total_amount?: number
          vat_amount?: number
          void_by?: string | null
          void_reason?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          new_stock: number
          previous_stock: number
          product_id: string
          quantity_change: number
          reason: string | null
          recorded_by: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          new_stock: number
          previous_stock: number
          product_id: string
          quantity_change: number
          reason?: string | null
          recorded_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          new_stock?: number
          previous_stock?: number
          product_id?: string
          quantity_change?: number
          reason?: string | null
          recorded_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "technician"
      movement_type: "purchase" | "sale" | "return" | "damage" | "adjustment"
      payment_method: "cash" | "digital" | "credit"
      sale_status: "completed" | "void"
      staff_status: "active" | "on_leave" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "cashier", "technician"],
      movement_type: ["purchase", "sale", "return", "damage", "adjustment"],
      payment_method: ["cash", "digital", "credit"],
      sale_status: ["completed", "void"],
      staff_status: ["active", "on_leave", "inactive"],
    },
  },
} as const
